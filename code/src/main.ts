import { Plugin, PluginSettingTab, Setting, TFolder, TAbstractFile, Platform, App } from "obsidian";
import { execFile } from "child_process";
import * as path from "path";

const SECTION_ID = "openterm";

interface OpenTermSettings {
	showDefaultTerminal: boolean;
	showPowerShell: boolean;
	showCmd: boolean;
	windowsDefaultExe: string;
	powershellExe: string;
	cmdExe: string;
	macTerminalApp: string;
	linuxTerminalExe: string;
}

const DEFAULT_SETTINGS: OpenTermSettings = {
	showDefaultTerminal: true,
	showPowerShell: true,
	showCmd: true,
	windowsDefaultExe: "cmd.exe",
	powershellExe: "pwsh",
	cmdExe: "cmd.exe",
	macTerminalApp: "Terminal",
	linuxTerminalExe: "x-terminal-emulator",
};

interface VaultAdapterWithBasePath {
	getBasePath(): string;
}

function hasBasePath(adapter: unknown): adapter is VaultAdapterWithBasePath {
	return typeof (adapter as VaultAdapterWithBasePath).getBasePath === "function";
}

function getDirectory(vaultBasePath: string, file: TAbstractFile): string {
	if (file instanceof TFolder) {
		return path.join(vaultBasePath, file.path);
	}
	return path.join(vaultBasePath, file.parent?.path ?? "");
}

function openInDefaultTerminal(directory: string, settings: OpenTermSettings): void {
	if (Platform.isWin) {
		const exe = settings.windowsDefaultExe || "cmd.exe";
		execFile("cmd.exe", ["/c", "start", "/D", directory, exe]);
	} else if (Platform.isMacOS) {
		const app = settings.macTerminalApp || "Terminal";
		execFile("open", ["-a", app, directory]);
	} else {
		const exe = settings.linuxTerminalExe || "x-terminal-emulator";
		execFile(exe, [`--working-directory=${directory}`], (err) => {
			if (err) {
				execFile("xdg-open", [directory]);
			}
		});
	}
}

function openInPowerShell(directory: string, settings: OpenTermSettings): void {
	const exe = settings.powershellExe || "pwsh";
	const psArgs = ["-NoExit", "-Command",
		`Set-Location -LiteralPath '${directory.replace(/'/g, "''")}'`];

	if (Platform.isWin) {
		execFile("cmd.exe", ["/c", "start", exe, ...psArgs], (err) => {
			const isNotFound = err && (err as NodeJS.ErrnoException).code === "ENOENT";
			if (isNotFound && exe !== "powershell") {
				execFile("cmd.exe", ["/c", "start", "powershell", ...psArgs]);
			}
		});
	} else {
		execFile(exe, psArgs);
	}
}

function openInCmd(directory: string, settings: OpenTermSettings): void {
	const exe = settings.cmdExe || "cmd.exe";
	execFile("cmd.exe", ["/c", "start", "/D", directory, exe]);
}

export default class OpenTermPlugin extends Plugin {
	settings: OpenTermSettings;

	async onload(): Promise<void> {
		await this.loadSettings();
		this.addSettingTab(new OpenTermSettingTab(this.app, this));

		const adapter = this.app.vault.adapter;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				const basePath = hasBasePath(adapter) ? adapter.getBasePath() : "";
				const directory = getDirectory(basePath, file);

				if (this.settings.showDefaultTerminal) {
					menu.addItem((item) => {
						item.setTitle("Open in terminal")
							.setIcon("terminal")
							.setSection(SECTION_ID)
							.onClick(() => openInDefaultTerminal(directory, this.settings));
					});
				}

				if (this.settings.showPowerShell) {
					menu.addItem((item) => {
						item.setTitle("Open in PowerShell")
							.setIcon("terminal")
							.setSection(SECTION_ID)
							.onClick(() => openInPowerShell(directory, this.settings));
					});
				}

				if (Platform.isWin && this.settings.showCmd) {
					menu.addItem((item) => {
						item.setTitle("Open in CMD")
							.setIcon("terminal")
							.setSection(SECTION_ID)
							.onClick(() => openInCmd(directory, this.settings));
					});
				}
			})
		);
	}

	onunload(): void {}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}
}

class OpenTermSettingTab extends PluginSettingTab {
	plugin: OpenTermPlugin;

	constructor(app: App, plugin: OpenTermPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl).setName("Context menu items").setHeading();

		new Setting(containerEl)
			.setName("Show default terminal")
			.setDesc("Show the 'Open in terminal' option in the context menu.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showDefaultTerminal).onChange(async (value) => {
					this.plugin.settings.showDefaultTerminal = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Show PowerShell")
			.setDesc("Show the 'Open in PowerShell' option in the context menu.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showPowerShell).onChange(async (value) => {
					this.plugin.settings.showPowerShell = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl)
			.setName("Show CMD (Windows only)")
			.setDesc("Show the 'Open in CMD' option in the context menu.")
			.addToggle((toggle) =>
				toggle.setValue(this.plugin.settings.showCmd).onChange(async (value) => {
					this.plugin.settings.showCmd = value;
					await this.plugin.saveSettings();
				})
			);

		new Setting(containerEl).setName("Executables").setHeading();

		new Setting(containerEl)
			.setName("PowerShell executable")
			.setDesc("Executable for PowerShell. Uses 'pwsh' (PowerShell 7+) by default, falling back to 'powershell' on Windows if not found.")
			.addText((text) =>
				text
					.setPlaceholder("pwsh")
					.setValue(this.plugin.settings.powershellExe)
					.onChange(async (value) => {
						this.plugin.settings.powershellExe = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("CMD executable (Windows)")
			.setDesc("Executable for Command Prompt on Windows.")
			.addText((text) =>
				text
					.setPlaceholder("cmd.exe")
					.setValue(this.plugin.settings.cmdExe)
					.onChange(async (value) => {
						this.plugin.settings.cmdExe = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Default terminal executable (Windows)")
			.setDesc("Executable used for the default terminal option on Windows.")
			.addText((text) =>
				text
					.setPlaceholder("cmd.exe")
					.setValue(this.plugin.settings.windowsDefaultExe)
					.onChange(async (value) => {
						this.plugin.settings.windowsDefaultExe = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Terminal app (macOS)")
			.setDesc("Application used for the default terminal option on macOS.")
			.addText((text) =>
				text
					.setPlaceholder("Terminal")
					.setValue(this.plugin.settings.macTerminalApp)
					.onChange(async (value) => {
						this.plugin.settings.macTerminalApp = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Terminal executable (Linux)")
			.setDesc("Executable used for the default terminal option on Linux.")
			.addText((text) =>
				text
					.setPlaceholder("x-terminal-emulator")
					.setValue(this.plugin.settings.linuxTerminalExe)
					.onChange(async (value) => {
						this.plugin.settings.linuxTerminalExe = value.trim();
						await this.plugin.saveSettings();
					})
			);
	}
}
