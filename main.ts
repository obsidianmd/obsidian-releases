import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
//bafeec42da6b4eaaab93b8950abc6eee44c3a30e

let rolling_dice: number = 0;
let index_processed: number = 0;
let index_all: number = 0;
let intput_question: string = "";
let output_answer: string = "";
let output_docu: string = "";


let index_info: string = "";
let question: string="";
let document_info: string="";



let password: string = "";
let username: string = "";
let topicid: string="";

let lastres: string = "";
let lastleft: number = 0;
let lastright: number = 0;


let index_array: Array<string> = [];
let this_index: Array<string> = [];
let left: number = 0;
let right: number = 0;
let current_state: number = 0;

let ask_times: number=0;
let query_type: number=0;

interface MyPluginSettings {
	usertoken: string;
	serveraddress:string
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	usertoken: 'bafeec42da6b4eaaab93b8950abc6eee44c3a30e',
	serveraddress: 'localhost:5000'
};

export default class HelloworldPlugin extends Plugin {
	settings: MyPluginSettings;
	output_suggestions: HTMLTextAreaElement;

	async onload() {
		await this.loadSettings();

		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		this.addRibbonIcon('pencil', 'Auto Document Generator', async () => {
			this.showCustomModalInOutline();
			
		});
		
		this.addSettingTab(new SampleSettingTab(this.app, this));
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '//styles.css'; 
		document.head.appendChild(link);
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	};
	showCustomModalInOutline() {
		const modal = new TextModal(this.app, this.settings.usertoken, this.settings.serveraddress);	
		modal.open();;
	}
	onunload() {

	}
	addTextEditor() {
		let input = document.createElement('input');
		input.type = 'text';
		input.placeholder = '请输入您的文本';
		input.addEventListener('input', () => {
			this.displayText(input.value);
		});

		document.body.appendChild(input);
	}
	displayText(text: string) {
		let displayDiv = document.createElement('div');
		displayDiv.textContent = text;

		let existingDisplay = document.getElementById('text-display');
		if (existingDisplay) {
			existingDisplay.remove();
		}

		displayDiv.id = 'text-display';
		document.body.appendChild(displayDiv);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TextModal extends Modal {
	
	
	input_username: HTMLInputElement;
	input_password: HTMLInputElement;
	input_topicid: HTMLInputElement;
	textarea: HTMLTextAreaElement;
	output_suggestions: HTMLTextAreaElement;
	output_ducument: HTMLTextAreaElement;
	
	token: string = "";
	serveradd: string = "";


	requirement:HTMLTextAreaElement;
	revise: HTMLTextAreaElement;
	
	thisapp: App;
	
	
	socket: WebSocket;
	constructor(app: App,t:string,sa:string) {
		
		super(app);
		this.thisapp = app;
		this.token = t;
		this.serveradd = sa;
	}
	
	setupWebSocket1() {
		this.socket = new WebSocket("ws://" + this.serveradd+"/getIndex");

		this.socket.onopen = () => {
			console.log("WebSocket connection established");
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username.value,
				input_password: this.input_password.value,
				ask_times: ask_times,
				query_type: query_type,
				rolling_dice: rolling_dice,
				topicid: this.input_topicid.value
			});
			lastres = this.output_suggestions.value;
			this.output_suggestions.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);

		};
		
		this.socket.onmessage = (event) => {
			try {

				const data = JSON.parse(event.data);

				if (data && typeof data === 'object') {

					const content = data.content || '';
					if (data.error) {
						new Notice(data.error + " 请点击重新生成此目录 ")
					}

					if (this.output_suggestions.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
						this.output_suggestions.value = "";
					}
					this.output_suggestions.value += content;
					index_info = this.output_suggestions.value;
					output_answer = this.output_suggestions.value;
					this.output_suggestions.scrollTop = this.output_suggestions.scrollHeight;

					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) {
						const fp = activeFile.path;

						this.thisapp.vault.adapter.write(fp, this.output_suggestions.value);
					}
				} else {
					console.warn('Received data is not a valid JSON object:', event.data);
				}
			} catch (error) {
				console.error('Error parsing JSON data:', error, event.data);
			};

		};

		this.socket.onclose = (event) => {
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');

			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;

			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
			new Notice(' 目录生成完毕 ')
		};

		this.socket.onerror = (error) => {
			console.error(`[WebSocket Error] ${error}`);
			new Notice('[WebSocket Error] ${error}');
		};
	}

	setupWebSocket2() {
		this.socket = new WebSocket("ws://" + this.serveradd + "/getDocument");
		
		if (index_processed == 0 && index_all == 0 ) {
			if (index_array.length == 0) {
				new Notice('空目录！');
				return;
			}
			left = 0;
			right = index_array[0].length;
		}
		this.socket.onopen = () => {
			console.log("WebSocket connection established");
			new Notice('WebSocket connection established');
			
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username.value,
				input_password: this.input_password.value,
				index: index_info,
				ask_times:ask_times,
				query_type: query_type,
				rolling_dice: rolling_dice,
				topicid: this.input_topicid.value,
				index_processed: index_processed,
				output_suggestions: output_answer,
				index_all: index_all
			});
			lastres = output_answer;
			lastleft = left;
			lastright = right;
			right += index_array[index_processed + 1].length + 2;
			if (index_processed == 0 && index_all==0)
				this.output_ducument.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);
		};
			this.socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data && typeof data === 'object') {
						const content = data.content || '';
						if (data.index_processed && data.index_all) { 
							index_processed = parseInt(data.index_processed, 10) ;
							index_all = parseInt(data.index_all, 10);
						if (index_processed >= index_all) {
							new Notice("全部文档生成完成");
						}
						}
						if (data.error) {
							new Notice(data.error+" 请点击重新生成此小结 ")
						}
						if (this.output_ducument.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
							this.output_ducument.value = "";
						}
						this.output_ducument.value += content;
						this.output_suggestions.value = this.output_suggestions.value.slice(0, left) + content + index_info.slice(right, index_info.length);
						left += content.length;
						document_info = this.output_ducument.value;
						output_answer = this.output_suggestions.value;
						output_docu = this.output_ducument.value;
						this.output_ducument.scrollTop = this.output_ducument.scrollHeight;

						const activeFile = this.app.workspace.getActiveFile();
						if (activeFile) {
							const fp = activeFile.path;

							this.thisapp.vault.adapter.write(fp, output_answer);
						}
					} else {
						console.warn('Received data is not a valid JSON object:', event.data);
					}
				} catch (error) {
					console.error('Error parsing JSON data:', error, event.data);
				};
			
			
		};

		this.socket.onclose = (event) => {
			new Notice(' 已生成 ' + index_processed + ' 段,一共 ' + index_all + ' 段 ');
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
		};

		this.socket.onerror = (error) => {
			console.error(`[WebSocket Error] ${error}`);
			new Notice('[WebSocket Error] ${error}');
		};
	}
	async loadcontent_index() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const filePath = activeFile.path;
			try {
				index_info = await this.app.vault.adapter.read(filePath);
				console.log('Current file content:',index_info);
			} catch (error) {
				console.error('Failed to read file:', error);
			}
		}
	}
	async loadcontent_output_suggestions() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const filePath = activeFile.path;
			try {
				let tmp = this.output_suggestions.value.length;
				this.output_suggestions.value = await this.app.vault.adapter.read(filePath);
				output_answer = this.output_suggestions.value;
				left = left - tmp + output_answer.length;
				console.log('Current file content:', this.output_suggestions.value);
			} catch (error) {
				console.error('Failed to read file:', error);
			}
		} else {
			this.output_suggestions.value = '';
			console.log('No active file.');
		}
	}
	preventClose(evt: { stopPropagation: () => void; }) {
		evt.stopPropagation();
	}
	onOpen() {
		let { contentEl } = this;
		this.contentEl.addEventListener('mousedown', (evt) => {
			evt.stopPropagation();
		});
		contentEl.createEl('h1', { text: 'Input your requirements:' });
		contentEl.style.width = '300px'; 
		contentEl.style.height = '300px'; 
		contentEl.style.zIndex = '9999';
		contentEl.style.position = 'fixed'; 
		contentEl.style.top = localStorage.getItem('lastPositionTop') || '50%'; 
		contentEl.style.left = localStorage.getItem('lastPositionLeft') || '50%'; 
		contentEl.style.backgroundColor = 'white';
		contentEl.style.border = '1px solid #ccc';
		contentEl.style.borderRadius = '10px'; 

		const inputDiv = contentEl.createEl('div');
		inputDiv.style.marginBottom = '5px';
		inputDiv.style.display = 'flex';

		inputDiv.style.justifyContent = 'center';
		inputDiv.style.alignItems = 'center';

		this.textarea = inputDiv.createEl('textarea');
		this.textarea.placeholder = 'Enter your text here';
		this.textarea.style.height = '80px';
		this.textarea.style.width = '250px';
		this.textarea.focus();
		this.textarea.value = intput_question;
		this.textarea.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.textarea.value = inputt.value;
			intput_question = this.textarea.value;
		});

		const outputDiv = contentEl.createEl('div');
		outputDiv.style.marginBottom = '5px';
		outputDiv.style.display = 'flex';
		outputDiv.style.flexDirection = 'column';
		outputDiv.style.justifyContent = 'center';
		outputDiv.style.alignItems = 'center';

		this.output_suggestions = outputDiv.createEl('textarea');
		this.output_suggestions.placeholder = 'output_suggestions are as follows:';
		this.output_suggestions.style.height = '0px';
		this.output_suggestions.style.width = '0px';
		this.output_suggestions.focus();
		this.output_suggestions.style.display = 'none';

		this.output_ducument = outputDiv.createEl('textarea');
		this.output_ducument.placeholder = 'output_ducument are as follows:';
		this.output_ducument.style.height = '0px';
		this.output_ducument.style.width = '0px';
		this.output_ducument.focus();
		this.output_ducument.style.display = 'none';
		this.output_ducument.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.output_ducument.value = inputt.value;
			output_docu = this.output_ducument.value;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				this.thisapp.vault.adapter.write(fp, this.output_ducument.value);
			}
		});

		this.output_suggestions.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			
			
			this.output_suggestions.value = inputt.value;
			if (current_state != 2) {
				index_info = this.output_suggestions.value;
			}
			output_answer = this.output_suggestions.value;
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');

			let parts = tempStr.split(/##(?!#)/);

			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
			
		});

		if (query_type == 1)
			this.output_suggestions.value = index_info;
		if (query_type == 2)
			this.output_suggestions.value = document_info;
		this.output_suggestions.value = output_answer;
		this.output_ducument.value = output_docu;
		
		const inputInfoDiv = contentEl.createEl('div');
		inputInfoDiv.style.marginBottom = '5px';
		inputInfoDiv.style.display = 'flex';
		inputInfoDiv.style.justifyContent = 'center';
		inputInfoDiv.style.alignItems = 'center';
		

		this.input_username = inputInfoDiv.createEl('input');
		this.input_username.type = 'text';
		this.input_username.style.width = '45%';
		this.input_username.placeholder = 'Docchain username';
		this.input_username.style.flexWrap = 'wrap'; 
		this.input_username.focus();

		this.input_password = inputInfoDiv.createEl('input');
		this.input_password.type = 'text';
		this.input_password.style.width = '45%';
		this.input_password.placeholder = 'Docchain password';
		this.input_password.style.flexWrap = 'wrap'; 
		this.input_password.focus();
		

		this.input_topicid = inputInfoDiv.createEl('input');
		this.input_topicid.type = 'text';
		this.input_topicid.style.width = '45%';
		this.input_topicid.placeholder = 'Docchain topicid';
		this.input_topicid.style.flexWrap = 'wrap'; 
		this.input_topicid.focus();

		const buttonDiv = contentEl.createEl('div');
		buttonDiv.style.marginBottom = '5px';
		buttonDiv.style.display = 'flex';
		buttonDiv.style.flexWrap = 'wrap'; 
		buttonDiv.style.alignItems = 'center';
		buttonDiv.style.width = '100%'; 

		let resetButton = buttonDiv.createEl('button', { text: 'Reset to generate new document' });
		resetButton.style.fontSize = '12px'; 
		resetButton.style.padding = '5px'; 
		resetButton.style.width = 'auto'; 
		resetButton.style.display = 'inline-block'; 

		let indexButton = buttonDiv.createEl('button', { text: 'Index' });
		indexButton.style.fontSize = '12px';
		indexButton.style.padding = '5px'; 
		indexButton.style.width = 'auto';
		indexButton.style.display = 'inline-block'; 

		let documentButton = buttonDiv.createEl('button', { text: 'Document' });
		documentButton.style.fontSize = '12px';
		documentButton.style.padding = '5px'; 
		documentButton.style.width = 'auto'; 
		documentButton.style.display = 'inline-block'; 

		let safButton = buttonDiv.createEl('button', { text: 'Save to another file' });
		safButton.style.fontSize = '12px';
		safButton.style.padding = '5px'; 
		safButton.style.width = 'auto'; 
		safButton.style.display = 'inline-block';

		let rgButton = buttonDiv.createEl('button', { text: 'Regenerate this graph' });
		rgButton.style.fontSize = '12px'; 
		rgButton.style.padding = '5px'; 
		rgButton.style.width = 'auto';
		rgButton.style.display = 'inline-block'; 

		safButton.addEventListener('click', () => {

			const currentTime = new Date();
			const years = currentTime.getFullYear();
			const months = currentTime.getMonth();
			const days = currentTime.getDay();
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();
			const seconds = currentTime.getSeconds();
			const newFileName = "tmp_" + years + "_" + months + "_" + days + "_" + hours + "_" + minutes + "_" + seconds + ".md";
			this.loadcontent_output_suggestions();
			this.thisapp.vault.create(newFileName, output_answer);

		});
		
		rgButton.addEventListener('click', () => {
			new Notice('重新生成本段文档，生成文档期间请不要修改文件内容');
			query_type = 2;
			current_state = 2;
			if (question != this.textarea.value) {
				ask_times = 1;

			}
			else {
				ask_times++;
			}
			if (index_processed <= 0) {
				new Notice("未生成文档！无法重新生成");
				return;
			}
			index_processed--;
			if (index_processed >= index_all && index_all > 0) {
				index_all = 0;
				index_processed = 0;
				new Notice('根据目录重新生成文档', 15000);
				this.output_ducument.value = '';
				this.output_suggestions.value = index_info;
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const fp = activeFile.path;
					// 将更新后的内容写入文件
					this.thisapp.vault.adapter.write(fp, index_info);
				}
			}
			output_answer = lastres;
			this.output_suggestions.value = output_answer;
			left = lastleft;
			right = lastright;
			this.setupWebSocket2();
			question = this.textarea.value;
			intput_question = this.textarea.value;

		});



		this.input_topicid.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_topicid.value = inputt.value;
			topicid = this.input_topicid.value;
		});
		this.input_password.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_password.value = inputt.value;
			password = this.input_password.value;
		});
		this.input_username.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_username.value = inputt.value;
			username = this.input_username.value;
		});
		
		this.input_username.value = username;
		this.input_password.value = password;
		this.input_topicid.value = topicid;
		resetButton.addEventListener('click', () => {
			index_all = 0;
			index_processed = 0;
			this.output_ducument.value = '';
			this.output_suggestions.value = index_info;
			output_answer = index_info;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				this.thisapp.vault.adapter.write(fp, output_answer);
			}
		});
		indexButton.addEventListener('click', () => {
			query_type = 1;
			current_state = 1;
			index_all = 0;
			index_processed = 0;
			if (question != this.textarea.value) {
				ask_times = 1;

			}
			else {
				ask_times++;
			}
			this.loadcontent_index();
			this.setupWebSocket1();
			question = this.textarea.value;
			intput_question = this.textarea.value;
			
			
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);

			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
		});
		
		documentButton.addEventListener('click', () => {
			new Notice('已确认根据目录生成文档，生成文档期间请不要修改文件内容');
			query_type = 2;
			current_state = 2;
			if (question != this.textarea.value) {
				ask_times = 1;

			}
			else {
				ask_times++;
			}
			if (index_processed == 0 && index_all == 0) {
				this.loadcontent_index();
			} else {
				this.loadcontent_output_suggestions();
			}
			if (index_processed >= index_all && index_all > 0) {
				index_all = 0;
				index_processed = 0;
				new Notice('根据目录重新生成文档',15000);
				this.output_ducument.value = '';
				this.output_suggestions.value = index_info;
				output_answer = index_info;
				const activeFile = this.app.workspace.getActiveFile();
				if (activeFile) {
					const fp = activeFile.path;
					// 将更新后的内容写入文件
					this.thisapp.vault.adapter.write(fp, output_answer);
				}
			}
			
			this.setupWebSocket2();
			question = this.textarea.value;
			intput_question = this.textarea.value;
			
		});
		
		let isDragging = false;
		let offsetX: number;
		let offsetY: number;

		contentEl.addEventListener('mousedown', (e) => {
			if (e.target === contentEl) {
				isDragging = true;
				offsetX = e.clientX - contentEl.getBoundingClientRect().left;
				offsetY = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.cursor = 'move'; 
			}
		});

		document.addEventListener('mousemove', (e) => {
			if (isDragging) {
				contentEl.style.left = `${e.clientX - offsetX}px`;
				contentEl.style.top = `${e.clientY - offsetY}px`;
				contentEl.style.position = 'fixed'; 
			}
		});

		document.addEventListener('mouseup', () => {
			isDragging = false;
			contentEl.style.cursor = 'default'; 
		});

		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'resize-handle';
		resizeHandle.style.width = '10px';
		resizeHandle.style.height = '10px';
		resizeHandle.style.background = 'gray';
		resizeHandle.style.position = 'absolute';
		resizeHandle.style.right = '0';
		resizeHandle.style.bottom = '0';
		resizeHandle.style.cursor = 'nwse-resize';
		contentEl.appendChild(resizeHandle);

		let isResizing = false;

		resizeHandle.addEventListener('mousedown', (e) => {
			isResizing = true;
			e.stopPropagation();
		});

		document.addEventListener('mousemove', (e) => {
			if (isResizing) {
				const newWidth = e.clientX - contentEl.getBoundingClientRect().left;
				const newHeight = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.width = `${newWidth}px`;
				contentEl.style.height = `${newHeight}px`;
			}
		});

		document.addEventListener('mouseup', () => {
			isResizing = false;
		});

		const closeButton = document.createElement('button');
		closeButton.textContent = '关闭';
		closeButton.style.position = 'absolute';
		closeButton.style.top = '10px';
		closeButton.style.right = '10px';
		contentEl.appendChild(closeButton);

		closeButton.addEventListener('click', (e) => {
			e.stopPropagation(); 
			localStorage.setItem('lastPositionTop', contentEl.style.top);
			localStorage.setItem('lastPositionLeft', contentEl.style.left);
			contentEl.remove();
		});
	}
	
}
	

class SampleSettingTab extends PluginSettingTab {
	plugin: HelloworldPlugin;

	constructor(app: App, plugin: HelloworldPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('Server Address')
			.setDesc('Input your server address.')
			.addText(text => text
				.setPlaceholder('Enter server address')
				.setValue(this.plugin.settings.serveraddress)
				.onChange(async (value) => {		
					this.plugin.settings.serveraddress = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('GPT token')
			.setDesc('You can get your GPT token in the WhaleCloud website.')
			.addText(text => text
				.setPlaceholder('Enter GPT token')
				.setValue(this.plugin.settings.usertoken)
				.onChange(async (value) => {
					this.plugin.settings.usertoken = value;
					await this.plugin.saveSettings();
				}));
	}
}

