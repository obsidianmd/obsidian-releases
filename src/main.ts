import { Plugin, TFolder, TAbstractFile, Platform } from "obsidian";
import { exec } from "child_process";
import * as path from "path";

const SECTION_ID = "opencmd-ps";

function getDirectory(vaultBasePath: string, file: TAbstractFile): string {
	if (file instanceof TFolder) {
		return path.join(vaultBasePath, file.path);
	}
	return path.join(vaultBasePath, file.parent?.path ?? "");
}

function openInDefaultTerminal(directory: string): void {
	if (Platform.isWin) {
		exec(`start cmd /k "cd /d "${directory}""`, { cwd: directory });
	} else if (Platform.isMacOS) {
		exec(`open -a Terminal "${directory}"`);
	} else {
		exec(`x-terminal-emulator --working-directory="${directory}"`, (err) => {
			if (err) {
				exec(`xdg-open "${directory}"`);
			}
		});
	}
}

function openInPowerShell(directory: string): void {
	exec(`start powershell -NoExit -Command "Set-Location -LiteralPath '${directory}'"`, {
		cwd: directory,
	});
}

function openInCmd(directory: string): void {
	exec(`start cmd /k "cd /d "${directory}""`, { cwd: directory });
}

export default class OpenCmdPsPlugin extends Plugin {
	async onload(): Promise<void> {
		const adapter = this.app.vault.adapter as any;

		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				const basePath: string = adapter.getBasePath?.() ?? "";
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
