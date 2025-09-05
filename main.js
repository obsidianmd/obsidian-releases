const { Plugin, PluginSettingTab, Setting } = require('obsidian');

module.exports = class TimeoutCommand extends Plugin {
    inactivityTimer = null;
    settings = {
        inactivityMinutes: 1, // 默认1分钟
        commandId: "remotely-save:start-sync" //默认命令为remotely-save插件的同步命令
    };
    
    async onload() {
        // 加载设置
        await this.loadSettings();
        
        // 添加设置选项卡
        this.addSettingTab(new TimeoutCommandSettingTab(this.app, this));
        
        this.resetInactivityTimer();
        
        // 监听编辑器变化
        this.registerEvent(
            this.app.workspace.on('editor-change', () => {
                this.resetInactivityTimer();
            })
        );
    }
    
    onunload() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
    }
    
    async loadSettings() {
        // 从本地存储加载设置
        this.settings = Object.assign({}, this.settings, await this.loadData());
    }
    
    async saveSettings() {
        // 保存设置到本地存储
        await this.saveData(this.settings);
    }
    
    resetInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
        }
        
        // 使用配置的时间（分钟转换为毫秒）
        const delay = this.settings.inactivityMinutes * 60 * 1000;
        
        this.inactivityTimer = setTimeout(() => {
            this.triggerSync();
        }, delay);
    }
    
    async triggerSync() {
        // 尝试执行配置的命令
        // @ts-ignore
        if (this.app.commands.commands[this.settings.commandId]) {
            // @ts-ignore
            this.app.commands.executeCommandById(this.settings.commandId);
        } else {
            console.error('未找到配置的命令: ' + this.settings.commandId + ' 请在命令面板中查找正确的命令ID并更新插件设置');
        }
    }
}

// 设置选项卡类
class TimeoutCommandSettingTab extends PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
    }
    
    display() {
        const {containerEl} = this;
        
        containerEl.empty();
                
        new Setting(containerEl)
            .setName('不活动时间(分钟)')
            .setDesc('在停止输入多少分钟后触发同步(默认为1)')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.inactivityMinutes.toString())
                .setValue(this.plugin.settings.inactivityMinutes.toString())
                .onChange(async (value) => {
                    // 验证输入是否为有效数字
                    const numValue = Number(value);
                    if (!isNaN(numValue) && numValue > 0) {
                        this.plugin.settings.inactivityMinutes = numValue;
                        await this.plugin.saveSettings();                        
                        // 重置计时器以应用新设置
                        this.plugin.resetInactivityTimer();
                    }
                }));
        
        new Setting(containerEl)
            .setName('命令ID')
            .setDesc('要执行的命令ID(可在命令面板中查看，默认为remotely-save:start-sync)')
            .addText(text => text
                .setPlaceholder(this.plugin.settings.commandId)
                .setValue(this.plugin.settings.commandId)
                .onChange(async (value) => {
                    this.plugin.settings.commandId = value;
                    await this.plugin.saveSettings();
                }));
    }
}