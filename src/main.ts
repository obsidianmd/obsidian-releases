import { Plugin, TFolder, TAbstractFile, Platform } from "obsidian";
import { execFile } from "child_process";
import * as path from "path";

const SECTION_ID = "opencmd-ps";

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

function openInDefaultTerminal(directory: string): void {
	if (Platform.isWin) {
		execFile("cmd.exe", ["/c", "start", "cmd", "/k", `cd /d "${directory}"`]);
	} else if (Platform.isMacOS) {
		execFile("open", ["-a", "Terminal", directory]);
	} else {
		execFile("x-terminal-emulator", [`--working-directory=${directory}`], (err) => {
			if (err) {
				execFile("xdg-open", [directory]);
			}
		});
	}
}

function openInPowerShell(directory: string): void {
	execFile("cmd.exe", ["/c", "start", "powershell", "-NoExit", "-Command",
		`Set-Location -LiteralPath '${directory.replace(/'/g, "''")}'`]);
}

function openInCmd(directory: string): void {
	execFile("cmd.exe", ["/c", "start", "cmd", "/k", `cd /d "${directory}"`]);
}

export default class OpenCmdPsPlugin extends Plugin {
	async onload(): Promise<void> {
		const adapter = this.app.vault.adapter;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				const basePath = hasBasePath(adapter) ? adapter.getBasePath() : "";
				const directory = getDirectory(basePath, file);

				menu.addItem((item) => {
					item.setTitle("Open in default app")
						.setIcon("terminal")
						.setSection(SECTION_ID)
						.onClick(() => openInDefaultTerminal(directory));
				});

				if (Platform.isWin) {
					menu.addItem((item) => {
						item.setTitle("Open in PowerShell")
							.setIcon("terminal")
							.setSection(SECTION_ID)
							.onClick(() => openInPowerShell(directory));
					});

					menu.addItem((item) => {
						item.setTitle("Open in CMD")
							.setIcon("terminal")
							.setSection(SECTION_ID)
							.onClick(() => openInCmd(directory));
					});
				}
			})
		);
	}

	onunload(): void {}
}
