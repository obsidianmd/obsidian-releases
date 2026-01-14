import { App, EditorPosition, MarkdownView, Menu, Plugin, PluginSettingTab, Setting, TAbstractFile, TFile, TFolder } from 'obsidian';

import { GlossaryLinker } from './linker/readModeLinker';
import { liveLinkerPlugin } from './linker/liveLinker';
import { ExternalUpdateManager, LinkerCache } from 'linker/linkerCache';
import { LinkerMetaInfoFetcher } from 'linker/linkerInfo';

import * as path from 'path';

export interface LinkerPluginSettings {
    app?: App; // 添加 app 实例引用
    autoToggleByMode: boolean;
    advancedSettings: boolean;
    linkerActivated: boolean;
    suppressSuffixForSubWords: boolean;
    excludedExtensions: string[];
    matchAnyPartsOfWords: boolean;
    matchEndOfWords: boolean;
    matchBeginningOfWords: boolean;
    includeAllFiles: boolean;
    linkerDirectories: string[];
    excludedDirectories: string[];
    excludedDirectoriesForLinking: string[];
    virtualLinkSuffix: string;
    virtualLinkAliasSuffix: string;
    useDefaultLinkStyleForConversion: boolean;
    defaultUseMarkdownLinks: boolean; // Otherwise wiki links
    defaultLinkFormat: 'shortest' | 'relative' | 'absolute';
    useMarkdownLinks: boolean;
    linkFormat: 'shortest' | 'relative' | 'absolute';
    applyDefaultLinkStyling: boolean;
    includeHeaders: boolean;
    headerMatchOnlyBetweenSymbols: boolean;
    headerMatchStartSymbol: string;
    headerMatchEndSymbol: string;
    matchCaseSensitive: boolean;
    capitalLetterProportionForAutomaticMatchCase: number;
    tagToIgnoreCase: string;
    tagToMatchCase: string;
    propertyNameToMatchCase: string;
    propertyNameToIgnoreCase: string;
    tagToExcludeFile: string;
    tagToIncludeFile: string;
    excludeLinksToOwnNote: boolean;
    fixIMEProblem: boolean;
    excludeLinksInCurrentLine: boolean;
    onlyLinkOnce: boolean;
    excludeLinksToRealLinkedFiles: boolean;
    includeAliases: boolean;
    alwaysShowMultipleReferences: boolean;
    excludedKeywords: string[]; // Keywords to exclude from virtual linking
    // wordBoundaryRegex: string;
    // conversionFormat
}

const DEFAULT_SETTINGS: LinkerPluginSettings = {
    autoToggleByMode: false,
    advancedSettings: false,
    linkerActivated: true,
    matchAnyPartsOfWords: false,
    matchEndOfWords: true,
    matchBeginningOfWords: true,
    suppressSuffixForSubWords: false,
    includeAllFiles: true,
    linkerDirectories: ['Glossary'],
    excludedDirectories: [],
    excludedDirectoriesForLinking: [],
    virtualLinkSuffix: '🔗',
    virtualLinkAliasSuffix: '🔗',
    excludedExtensions: ['.mp4'],
    useMarkdownLinks: false,
    linkFormat: 'shortest',
    defaultUseMarkdownLinks: false,
    defaultLinkFormat: 'shortest',
    useDefaultLinkStyleForConversion: true,
    applyDefaultLinkStyling: true,
    includeHeaders: true,
    headerMatchOnlyBetweenSymbols: false,
    headerMatchStartSymbol: '',
    headerMatchEndSymbol: '',
    matchCaseSensitive: false,
    capitalLetterProportionForAutomaticMatchCase: 0.75,
    tagToIgnoreCase: 'linker-ignore-case',
    tagToMatchCase: 'linker-match-case',
    propertyNameToMatchCase: 'linker-match-case',
    propertyNameToIgnoreCase: 'linker-ignore-case',
    tagToExcludeFile: 'linker-exclude',
    tagToIncludeFile: 'linker-include',
    excludeLinksToOwnNote: true,
    fixIMEProblem: false,
    excludeLinksInCurrentLine: false,
    onlyLinkOnce: true,
    excludeLinksToRealLinkedFiles: true,
    includeAliases: true,
    alwaysShowMultipleReferences: false,
    excludedKeywords: [],
    // wordBoundaryRegex: '/[\t- !-/:-@\[-`{-~\p{Emoji_Presentation}\p{Extended_Pictographic}]/u',
};

export default class LinkerPlugin extends Plugin {
    // 检查是否在Canvas视图中
    private isInCanvas(): boolean {
        // 只检查当前活动视图是否为Canvas
        const activeLeaf = this.app.workspace.activeLeaf;
        if (activeLeaf && activeLeaf.view && activeLeaf.view.getViewType() === 'canvas') {
            return true;
        }
        
        return false;
    }

    public async handleLayoutChange() {
        if (!this.settings.autoToggleByMode) return;
        
        // 检查是否在Canvas视图中
        if (this.isInCanvas()) {
            // 在Canvas视图中，如果插件未激活，则激活
            if (!this.settings.linkerActivated) {
                await this.updateSettings({ linkerActivated: true });
            }
            return;
        }
        
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!activeView) return;
        
        const isPreviewMode = activeView.getMode() === 'preview';
        const isEditorMode = activeView.getMode() === 'source';
        
        // 在阅读模式且插件激活 -> 停用
        if (isPreviewMode && this.settings.linkerActivated) {
            await this.updateSettings({ linkerActivated: false });
        }
        // 在编辑模式且插件未激活 -> 激活
        else if (isEditorMode && !this.settings.linkerActivated) {
            await this.updateSettings({ linkerActivated: true });
        }
    }

    settings: LinkerPluginSettings;
    updateManager = new ExternalUpdateManager();

    async onload() {
        await this.loadSettings();

        // 监听视图变化
        this.registerEvent(this.app.workspace.on('layout-change', this.handleLayoutChange.bind(this)));
        this.registerEvent(this.app.workspace.on('active-leaf-change', this.handleLayoutChange.bind(this)));

        // Set callback to update the cache when the settings are changed
        this.updateManager.registerCallback(() => {
            LinkerCache.getInstance(this.app, this.settings).clearCache();
        });

        // Register the glossary linker for the read mode
        this.registerMarkdownPostProcessor((element, context) => {
            context.addChild(new GlossaryLinker(this.app, this.settings, context, element, this));
        });

        // Register the live linker for the live edit mode
        this.registerEditorExtension(liveLinkerPlugin(this.app, this.settings, this.updateManager, this));

        // This adds a settings tab so the user can configure various aspects of the plugin
        this.addSettingTab(new LinkerSettingTab(this.app, this));

        // Context menu item to convert virtual links to real links
        this.registerEvent(this.app.workspace.on('file-menu', (menu, file, source) => this.addContextMenuItem(menu, file, source)));

        this.addCommand({
            id: 'toggle-virtual-linker',
            name: 'Toggle Virtual Linker',
            callback: () => {
                this.updateSettings({ linkerActivated: !this.settings.linkerActivated });
                this.updateManager.update();
                console.log(`Virtual Linker ${this.settings.linkerActivated ? 'activated' : 'deactivated'}`);
            }
        });

        this.addCommand({
            id: 'convert-selected-virtual-links',
            name: 'Convert All Virtual Links in Selection to Real Links',
            checkCallback: (checking: boolean) => {
                const view = this.app.workspace.getActiveViewOfType(MarkdownView);
                const editor = view?.editor;

                if (!editor || !editor.somethingSelected()) {
                    return false;
                }

                if (checking) return true;

                // Get the selected text range
                const from = editor.getCursor('from');
                const to = editor.getCursor('to');

                // Get the DOM element containing the selection
                const cmEditor = (editor as any).cm;
                if (!cmEditor) return false;

                const selectionRange = cmEditor.dom.querySelector('.cm-content');
                if (!selectionRange) return false;

                // Find all virtual links in the selection
                // Find all virtual link elements in the selection
                const virtualLinkElements = Array.from(selectionRange.querySelectorAll('a'));
                
                const virtualLinks = virtualLinkElements
                    .filter((link): link is HTMLElement => {
                        if (!(link instanceof HTMLElement)) return false;
                        return link.classList.contains('virtual-linker-link') || 
                               link.classList.contains('virtual-link-a');
                    })
                    .map(link => ({
                        element: link,
                        from: parseInt(link.getAttribute('from') || '-1'),
                        to: parseInt(link.getAttribute('to') || '-1'),
                        text: link.getAttribute('origin-text') || '',
                        href: link.getAttribute('href') || '',
                        headerId: link.getAttribute('data-heading-id') || ''
                    }))
                    .filter(link => {
                        const linkFrom = editor.offsetToPos(link.from);
                        const linkTo = editor.offsetToPos(link.to);
                        return this.isPosWithinRange(linkFrom, linkTo, from, to);
                    })
                    .sort((a, b) => a.from - b.from);

                if (virtualLinks.length === 0) return;

                // Process all links in a single operation
                const replacements: {from: number, to: number, text: string}[] = [];

                for (const link of virtualLinks) {
                    // Extract path without anchor
                    const hrefWithoutAnchor = link.href.split('#')[0];
                    const targetFile = this.app.vault.getAbstractFileByPath(hrefWithoutAnchor);
                    if (!(targetFile instanceof TFile)) {
                        continue;
                    }

                    const activeFile = this.app.workspace.getActiveFile();
                    const activeFilePath = activeFile?.path ?? '';

                    let absolutePath = targetFile.path;
                    let relativePath = path.relative(
                        path.dirname(activeFilePath),
                        path.dirname(absolutePath)
                    ) + '/' + path.basename(absolutePath);
                    relativePath = relativePath.replace(/\\/g, '/');

                    const replacementPath = this.app.metadataCache.fileToLinktext(targetFile, activeFilePath);
                    const lastPart = replacementPath.split('/').pop()!;
                    const shortestFile = this.app.metadataCache.getFirstLinkpathDest(lastPart!, '');
                    let shortestPath = shortestFile?.path === targetFile.path ? lastPart : absolutePath;

                    // Get headerId from virtual link element
                    const headerId = link.element.getAttribute('data-heading-id');
                    const pathSuffix = headerId ? `#${headerId}` : '';

                    // Remove .md extension if needed and add headerId
                    if (!replacementPath.endsWith('.md')) {
                        if (absolutePath.endsWith('.md')) absolutePath = absolutePath.slice(0, -3);
                        if (shortestPath.endsWith('.md')) shortestPath = shortestPath.slice(0, -3);
                        if (relativePath.endsWith('.md')) relativePath = relativePath.slice(0, -3);
                        
                        // Add headerId to all paths
                        absolutePath += pathSuffix;
                        shortestPath += pathSuffix;
                        relativePath += pathSuffix;
                    }

                    const useMarkdownLinks = this.settings.useDefaultLinkStyleForConversion
                        ? this.settings.defaultUseMarkdownLinks
                        : this.settings.useMarkdownLinks;

                    const linkFormat = this.settings.useDefaultLinkStyleForConversion
                        ? this.settings.defaultLinkFormat
                        : this.settings.linkFormat;

                    let replacement = '';
                    if (replacementPath === link.text && linkFormat === 'shortest') {
                        replacement = `[[${replacementPath}]]`;
                    } else {
                        const path = linkFormat === 'shortest' ? shortestPath :
                                   linkFormat === 'relative' ? relativePath :
                                   absolutePath;

                        replacement = useMarkdownLinks ?
                            `[${link.text}](${path})` :
                            `[[${path}|${link.text}]]`;
                    }
                    replacements.push({
                        from: link.from,
                        to: link.to,
                        text: replacement
                    });
                }

                // Apply all replacements in reverse order to maintain correct positions
                for (const replacement of replacements.reverse()) {
                    const fromPos = editor.offsetToPos(replacement.from);
                    const toPos = editor.offsetToPos(replacement.to);
                    editor.replaceRange(replacement.text, fromPos, toPos);
                }
            }
        });

    }

    private isPosWithinRange(
        linkFrom: EditorPosition,
        linkTo: EditorPosition,
        selectionFrom: EditorPosition,
        selectionTo: EditorPosition
    ): boolean {
        return (
            (linkFrom.line > selectionFrom.line ||
             (linkFrom.line === selectionFrom.line && linkFrom.ch >= selectionFrom.ch)) &&
            (linkTo.line < selectionTo.line ||
             (linkTo.line === selectionTo.line && linkTo.ch <= selectionTo.ch))
        );
    }

    addContextMenuItem(menu: Menu, file: TAbstractFile, source: string) {
        // addContextMenuItem(a: any, b: any, c: any) {
        // Capture the MouseEvent when the context menu is triggered   // Define a named function to capture the MouseEvent

        if (!file) {
            return;
        }

        // console.log('Context menu', menu, file, source);

        const that = this;
        const app: App = this.app;
        const updateManager = this.updateManager;
        const settings = this.settings;

        const fetcher = new LinkerMetaInfoFetcher(app, settings);
        // Check, if the file has the linker-included tag

        const isDirectory = app.vault.getAbstractFileByPath(file.path) instanceof TFolder;

        if (!isDirectory) {
            const metaInfo = fetcher.getMetaInfo(file);

            function contextMenuHandler(event: MouseEvent) {
                // Access the element that triggered the context menu
                const targetElement = event.target;

                if (!targetElement || !(targetElement instanceof HTMLElement)) {
                    console.error('No target element');
                    return;
                }

                // 检查是否点击了多引用指示器
                const isMultipleReferences = targetElement.classList.contains('multiple-files-references') || 
                                            targetElement.closest('.multiple-files-references') !== null;
                
                // 如果点击了多引用指示器，找到包含它的虚拟链接元素
                if (isMultipleReferences) {
                    const virtualLinkSpan = targetElement.closest('.virtual-link-span') || 
                                           targetElement.closest('.virtual-link');
                    
                    if (virtualLinkSpan) {
                        // 添加临时锁定类，防止折叠
                        virtualLinkSpan.classList.add('virtual-link-hover-lock');
                        
                        // 设置定时器移除锁定类
                        setTimeout(() => {
                            virtualLinkSpan.classList.remove('virtual-link-hover-lock');
                        }, 3000); // 3秒后移除，平衡操作时间和UI响应性
                    }
                }

                // Check, if we are clicking on a virtual link inside a note or a note in the file explorer
                const isVirtualLink = targetElement.classList.contains('virtual-link-a');
                const isInTableCell = targetElement.closest('td, th') !== null;

                const from = parseInt(targetElement.getAttribute('from') || '-1');
                const to = parseInt(targetElement.getAttribute('to') || '-1');

                if (from === -1 || to === -1) {
                    menu.addItem((item) => {
                        // Item to convert a virtual link to a real link
                        item.setTitle(
                            '[Virtual Linker] Converting link is not here.'
                        ).setIcon('link');
                    });
                }
                // Check, if the element has the "virtual-link" class
                else if (isVirtualLink) {
                    // Always show "Add to excluded keywords" option for virtual links
                    menu.addItem((item) => {
                        // Item to add virtual link text to excluded keywords
                        item.setTitle('[Virtual Linker] Add to excluded keywords')
                            .setIcon('ban')
                            .onClick(async () => {
                                const text = targetElement.getAttribute('origin-text') || '';
                                if (text) {
                                    const newExcludedKeywords = [...new Set([...settings.excludedKeywords, text])];
                                    await that.updateSettings({ excludedKeywords: newExcludedKeywords });
                                    updateManager.update();
                                }
                            });
                    });

                    // Only show "Convert to real link" option when not in a table cell
                    if (!isInTableCell) {
                        menu.addItem((item) => {
                            // Item to convert a virtual link to a real link
                            item.setTitle('[Virtual Linker] Convert to real link')
                                .setIcon('link')
                                .onClick(() => {
                                    // Get from and to position from the element
                                    const from = parseInt(targetElement.getAttribute('from') || '-1');
                                    const to = parseInt(targetElement.getAttribute('to') || '-1');

                                    if (from === -1 || to === -1) {
                                        console.error('No from or to position');
                                        return;
                                    }

                                    // Get the shown text
                                    const text = targetElement.getAttribute('origin-text') || '';
                                    const target = file;
                                    const activeFile = app.workspace.getActiveFile();
                                    const activeFilePath = activeFile?.path ?? '';

                                    if (!activeFile) {
                                        console.error('No active file');
                                        return;
                                    }

                                    let absolutePath = target.path;
                                    let relativePath =
                                        path.relative(path.dirname(activeFile.path), path.dirname(absolutePath)) +
                                        '/' +
                                        path.basename(absolutePath);
                                    relativePath = relativePath.replace(/\\/g, '/'); // Replace backslashes with forward slashes

                                    // Problem: we cannot just take the fileToLinktext result, as it depends on the app settings
                                    const replacementPath = app.metadataCache.fileToLinktext(target as TFile, activeFilePath);

                                    // Get headerId from virtual link if exists
                                    const headerId = targetElement.getAttribute('data-heading-id');

                                    // The last part of the replacement path is the real shortest file name
                                    // We have to check, if it leads to the correct file
                                    const lastPart = replacementPath.split('/').pop()!;
                                    const shortestFile = app.metadataCache.getFirstLinkpathDest(lastPart!, '');
                                    let shortestPath = shortestFile?.path == target.path ? lastPart : absolutePath;

                                    // Remove superfluous .md extension and add headerId if exists
                                    const pathSuffix = headerId ? `#${headerId}` : '';
                                    if (!replacementPath.endsWith('.md')) {
                                        if (absolutePath.endsWith('.md')) {
                                            absolutePath = absolutePath.slice(0, -3);
                                        }
                                        if (shortestPath.endsWith('.md')) {
                                            shortestPath = shortestPath.slice(0, -3);
                                        }
                                        if (relativePath.endsWith('.md')) {
                                            relativePath = relativePath.slice(0, -3);
                                        }
                                        // Add headerId to all paths
                                        absolutePath += pathSuffix;
                                        shortestPath += pathSuffix;
                                        relativePath += pathSuffix;
                                    }

                                    const useMarkdownLinks = settings.useDefaultLinkStyleForConversion
                                        ? settings.defaultUseMarkdownLinks
                                        : settings.useMarkdownLinks;

                                    const linkFormat = settings.useDefaultLinkStyleForConversion
                                        ? settings.defaultLinkFormat
                                        : settings.linkFormat;

                                    const createLink = (replacementPath: string, text: string, markdownStyle: boolean) => {
                                        if (markdownStyle) {
                                            return `[${text}](${replacementPath})`;
                                        } else {
                                            return `[[${replacementPath}|${text}]]`;
                                        }
                                    };

                                    // Create the replacement
                                    let replacement = '';

                                    // If the file is the same as the shown text, and we can use short links, we use them
                                    if (replacementPath === text && linkFormat === 'shortest') {
                                        replacement = `[[${replacementPath}]]`;
                                    }
                                    // Otherwise create a specific link, using the shown text
                                    else {
                                        if (linkFormat === 'shortest') {
                                            replacement = createLink(shortestPath, text, useMarkdownLinks);
                                        } else if (linkFormat === 'relative') {
                                            replacement = createLink(relativePath, text, useMarkdownLinks);
                                        } else if (linkFormat === 'absolute') {
                                            replacement = createLink(absolutePath, text, useMarkdownLinks);
                                        }
                                    }

                                    // Replace the text
                                    const editor = app.workspace.getActiveViewOfType(MarkdownView)?.editor;
                                    const fromEditorPos = editor?.offsetToPos(from);
                                    const toEditorPos = editor?.offsetToPos(to);

                                    if (!fromEditorPos || !toEditorPos) {
                                        console.warn('No editor positions');
                                        return;
                                    }

                                    editor?.replaceRange(replacement, fromEditorPos, toEditorPos);
                                });
                        });
                    }
                }

                // Remove the listener to prevent multiple triggers
                document.removeEventListener('contextmenu', contextMenuHandler);
            }

            if (!metaInfo.excludeFile && (metaInfo.includeAllFiles || metaInfo.includeFile || metaInfo.isInIncludedDir)) {
                // Item to exclude a virtual link from the linker
                // This action adds the settings.tagToExcludeFile to the file
                menu.addItem((item) => {
                    item.setTitle('[Virtual Linker] Exclude this file')
                        .setIcon('trash')
                        .onClick(async () => {
                            // Get the shown text
                            const target = file;

                            // Get the file
                            const targetFile = app.vault.getFileByPath(target.path);

                            if (!targetFile) {
                                console.error('No target file');
                                return;
                            }

                            // Add the tag to the file
                            const fileCache = app.metadataCache.getFileCache(targetFile);
                            const frontmatter = fileCache?.frontmatter || {};

                            const tag = settings.tagToExcludeFile;
                            let tags = frontmatter['tags'];

                            if (typeof tags === 'string') {
                                tags = [tags];
                            }

                            if (!Array.isArray(tags)) {
                                tags = [];
                            }

                            if (!tags.includes(tag)) {
                                await app.fileManager.processFrontMatter(targetFile, (frontMatter) => {
                                    if (!frontMatter.tags) {
                                        frontMatter.tags = new Set();
                                    }
                                    const currentTags = [...frontMatter.tags];

                                    frontMatter.tags = new Set([...currentTags, tag]);

                                    // Remove include tag if it exists
                                    const includeTag = settings.tagToIncludeFile;
                                    if (frontMatter.tags.has(includeTag)) {
                                        frontMatter.tags.delete(includeTag);
                                    }
                                });

                                updateManager.update();
                            }
                        });
                });
            } else if (!metaInfo.includeFile && (!metaInfo.includeAllFiles || metaInfo.excludeFile || metaInfo.isInExcludedDir)) {
                //Item to include a virtual link from the linker
                // This action adds the settings.tagToIncludeFile to the file
                menu.addItem((item) => {
                    item.setTitle('[Virtual Linker] Include this file')
                        .setIcon('plus')
                        .onClick(async () => {
                            // Get the shown text
                            const target = file;

                            // Get the file
                            const targetFile = app.vault.getFileByPath(target.path);

                            if (!targetFile) {
                                console.error('No target file');
                                return;
                            }

                            // Add the tag to the file
                            const fileCache = app.metadataCache.getFileCache(targetFile);
                            const frontmatter = fileCache?.frontmatter || {};

                            const tag = settings.tagToIncludeFile;
                            let tags = frontmatter['tags'];

                            if (typeof tags === 'string') {
                                tags = [tags];
                            }

                            if (!Array.isArray(tags)) {
                                tags = [];
                            }

                            if (!tags.includes(tag)) {
                                await app.fileManager.processFrontMatter(targetFile, (frontMatter) => {
                                    if (!frontMatter.tags) {
                                        frontMatter.tags = new Set();
                                    }
                                    const currentTags = [...frontMatter.tags];

                                    frontMatter.tags = new Set([...currentTags, tag]);

                                    // Remove exclude tag if it exists
                                    const excludeTag = settings.tagToExcludeFile;
                                    if (frontMatter.tags.has(excludeTag)) {
                                        frontMatter.tags.delete(excludeTag);
                                    }
                                });

                                updateManager.update();
                            }
                        });
                });
            }

            // Capture the MouseEvent when the context menu is triggered
            document.addEventListener('contextmenu', contextMenuHandler, { once: true });
        } else {
            // Check if the directory is in the linker directories
            const path = file.path + '/';
            const isInIncludedDir = fetcher.includeDirPattern.test(path);
            const isInExcludedDir = fetcher.excludeDirPattern.test(path);

            // If the directory is in the linker directories, add the option to exclude it
            if ((fetcher.includeAllFiles && !isInExcludedDir) || isInIncludedDir) {
                menu.addItem((item) => {
                    item.setTitle('[Virtual Linker] Exclude this directory')
                        .setIcon('trash')
                        .onClick(async () => {
                            // Get the shown text
                            const target = file;

                            // Get the file
                            const targetFolder = app.vault.getAbstractFileByPath(target.path) as TFolder;

                            if (!targetFolder) {
                                console.error('No target folder');
                                return;
                            }

                            const newExcludedDirs = Array.from(new Set([...settings.excludedDirectories, targetFolder.name]));
                            const newIncludedDirs = settings.linkerDirectories.filter((dir) => dir !== targetFolder.name);
                            await this.updateSettings({ linkerDirectories: newIncludedDirs, excludedDirectories: newExcludedDirs });

                            updateManager.update();
                        });
                });
            } else if ((!fetcher.includeAllFiles && !isInIncludedDir) || isInExcludedDir) {
                // If the directory is in the excluded directories, add the option to include it
                menu.addItem((item) => {
                    item.setTitle('[Virtual Linker] Include this directory')
                        .setIcon('plus')
                        .onClick(async () => {
                            // Get the shown text
                            const target = file;

                            // Get the file
                            const targetFolder = app.vault.getAbstractFileByPath(target.path) as TFolder;

                            if (!targetFolder) {
                                console.error('No target folder');
                                return;
                            }

                            const newExcludedDirs = settings.excludedDirectories.filter((dir) => dir !== targetFolder.name);
                            const newIncludedDirs = Array.from(new Set([...settings.linkerDirectories, targetFolder.name]));
                            await this.updateSettings({ linkerDirectories: newIncludedDirs, excludedDirectories: newExcludedDirs });

                            updateManager.update();
                        });
                });
            }
        }
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
        
        // 将 app 实例作为临时引用，而不是存储在设置对象中
        // 这样可以避免循环引用问题
        this.app = this.app; // 使用临时变量或类属性存储 app 引用
        
        // Load markdown links from obsidian settings
        // At the moment obsidian does not provide a clean way to get the settings through an API
        // So we read the app.json settings file directly
        // We also Cannot use the vault API because it only reads the vault files not the .obsidian folder
        try {
            const fileContent = await this.app.vault.adapter.read(this.app.vault.configDir + '/app.json');
            const appSettings = JSON.parse(fileContent);
            this.settings.defaultUseMarkdownLinks = appSettings.useMarkdownLinks;
            this.settings.defaultLinkFormat = appSettings.newLinkFormat ?? 'shortest';
        } catch (error) {
            console.error("Failed to load app settings:", error);
            // 设置默认值
            this.settings.defaultUseMarkdownLinks = false;
            this.settings.defaultLinkFormat = 'shortest';
        }
    }

    /** Update plugin settings. */
    async updateSettings(settings: Partial<LinkerPluginSettings> = <Partial<LinkerPluginSettings>>{}) {
        Object.assign(this.settings, settings);
        
        // 创建一个不包含循环引用的设置对象副本
        const settingsToSave = {...this.settings};
        // 移除不应该被序列化的属性
        delete settingsToSave.app;
        // delete settingsToSave.appMenuBarManager;
        
        try {
            await this.saveData(settingsToSave);
            console.log("Settings saved successfully to:", this.app.vault.configDir + "/plugins/fakelink/data.json");
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
        
        this.updateManager.update();
        
        // 强制刷新所有视图以确保设置变更立即生效
        this.app.workspace.getLeavesOfType('markdown').forEach(leaf => {
            const view = leaf.view as MarkdownView;
            if (view.previewMode) {
                view.previewMode.rerender(true);
            }
        });
    }
}

class LinkerSettingTab extends PluginSettingTab {
    constructor(app: App, public plugin: LinkerPlugin) {
        super(app, plugin);
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        // 添加自动模式切换设置项
        new Setting(containerEl)
            .setName('根据模式自动切换激活状态')
            .setDesc('开启后，在编辑模式如果插件未激活会自动激活，在阅读模式如果插件激活了会自动停用')
            .addToggle(toggle => 
                toggle
                    .setValue(this.plugin.settings.autoToggleByMode)
                    .onChange(async value => {
                        await this.plugin.updateSettings({ autoToggleByMode: value });
                        // 立即应用设置变更
                        this.plugin.handleLayoutChange();
                    })
            );

        // Toggle to activate or deactivate the linker
        new Setting(containerEl).setName('Activate Virtual Linker').addToggle((toggle) =>
            toggle.setValue(this.plugin.settings.linkerActivated).onChange(async (value) => {
                // console.log("Linker activated: " + value);
                await this.plugin.updateSettings({ linkerActivated: value });
            })
        );

        // Toggle to show advanced settings
        new Setting(containerEl).setName('Show advanced settings').addToggle((toggle) =>
            toggle.setValue(this.plugin.settings.advancedSettings).onChange(async (value) => {
                // console.log("Advanced settings: " + value);
                await this.plugin.updateSettings({ advancedSettings: value });
                this.display();
            })
        );

        new Setting(containerEl).setName('Matching behavior').setHeading();

        // Toggle to include aliases
        new Setting(containerEl)
            .setName('Include aliases')
            .setDesc('If enabled, the virtual linker will also match file aliases.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeAliases).onChange(async (value) => {
                    // console.log("Include aliases: " + value);
                    await this.plugin.updateSettings({ includeAliases: value });
                })
            );

        if (this.plugin.settings.advancedSettings) {
            // Toggle to only link once
            new Setting(containerEl)
                .setName('Only link once')
                .setDesc('When enabled, identical terms in the same note will only be linked once (Wikipedia-style linking).')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.onlyLinkOnce).onChange(async (value) => {
                        // console.log("Only link once: " + value);
                        await this.plugin.updateSettings({ onlyLinkOnce: value });
                    })
                );

            // Toggle to exclude links to real linked files
            new Setting(containerEl)
                .setName('Exclude links to real linked files')
                .setDesc('When enabled, terms that are already manually linked in the note will not be auto-linked.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.excludeLinksToRealLinkedFiles).onChange(async (value) => {
                        // console.log("Exclude links to real linked files: " + value);
                        await this.plugin.updateSettings({ excludeLinksToRealLinkedFiles: value });
                    })
                );
        }

        // If headers should be matched or not
        new Setting(containerEl)
            .setName('Include headers')
            .setDesc('When enabled, Markdown headings (lines starting with #) will also be included for virtual linking.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.includeHeaders).onChange(async (value) => {
                    // console.log("Include headers: " + value);
                    await this.plugin.updateSettings({ includeHeaders: value });
                })
            );

        // Only match headers between symbols
        new Setting(containerEl)
            .setName('Only match headers between symbols')
            .setDesc('When enabled, only headers containing both start and end symbols will be matched, and only the text between symbols will be used as keyword.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.headerMatchOnlyBetweenSymbols).onChange(async (value) => {
                    await this.plugin.updateSettings({ headerMatchOnlyBetweenSymbols: value });
                })
            );

        new Setting(containerEl)
            .setName('Start symbol')
            .setDesc('Symbol marking the start of the keyword in headers (can be empty, emoji allowed).')
            .addText((text) =>
                text.setValue(this.plugin.settings.headerMatchStartSymbol).onChange(async (value) => {
                    await this.plugin.updateSettings({ headerMatchStartSymbol: value });
                })
            );

        new Setting(containerEl)
            .setName('End symbol')
            .setDesc('Symbol marking the end of the keyword in headers (can be empty, emoji allowed).')
            .addText((text) =>
                text.setValue(this.plugin.settings.headerMatchEndSymbol).onChange(async (value) => {
                    await this.plugin.updateSettings({ headerMatchEndSymbol: value });
                })
            );

        // Toggle setting to match only whole words or any part of the word
        new Setting(containerEl)
            .setName('Match any part of a word')
            .setDesc('When disabled, only complete word matches are linked. When enabled, any substring match will be linked.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.matchAnyPartsOfWords).onChange(async (value) => {
                    // console.log("Match only whole words: " + value);
                    await this.plugin.updateSettings({ matchAnyPartsOfWords: value });
                    this.display();
                })
            );

        if (!this.plugin.settings.matchAnyPartsOfWords) {
            // Toggle setting to match only beginning of words
            new Setting(containerEl)
                .setName('Match the beginning of words')
                .setDesc('When enabled, word prefixes will be linked even without complete word matches.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.matchBeginningOfWords).onChange(async (value) => {
                        // console.log("Match only beginning of words: " + value);
                        await this.plugin.updateSettings({ matchBeginningOfWords: value });
                        this.display();
                    })
                );

            // Toggle setting to match only end of words
            new Setting(containerEl)
                .setName('Match the end of words')
                .setDesc('When enabled, word suffixes will be linked even without complete word matches.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.matchEndOfWords).onChange(async (value) => {
                        // console.log("Match only end of words: " + value);
                        await this.plugin.updateSettings({ matchEndOfWords: value });
                        this.display();
                    })
                );
        }

        // Toggle setting to suppress suffix for sub words
        if (this.plugin.settings.matchAnyPartsOfWords || this.plugin.settings.matchBeginningOfWords) {
            new Setting(containerEl)
                .setName('Suppress suffix for sub words')
                .setDesc('When enabled, the link suffix will only be shown for complete word matches, not partial matches.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.suppressSuffixForSubWords).onChange(async (value) => {
                        // console.log("Suppress suffix for sub words: " + value);
                        await this.plugin.updateSettings({ suppressSuffixForSubWords: value });
                    })
                );
        }

        if (this.plugin.settings.advancedSettings) {
            // Toggle setting to exclude links in the current line start for fixing IME
            new Setting(containerEl)
                .setName('Fix IME problem')
                .setDesc(
                    'Recommended when using IME (Input Method Editor) for typing non-Latin scripts (like Chinese/Japanese/Korean). Prevents virtual linking from interfering with IME composition at the start of lines.'
                )
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.fixIMEProblem).onChange(async (value) => {
                        // console.log("Exclude links in current line: " + value);
                        await this.plugin.updateSettings({ fixIMEProblem: value });
                    })
                );
        }

        if (this.plugin.settings.advancedSettings) {
            // Toggle setting to exclude links in the current line
            new Setting(containerEl)
                .setName('Avoid linking in current line')
                .setDesc('If activated, there will be no links in the current line.')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.excludeLinksInCurrentLine).onChange(async (value) => {
                        // console.log("Exclude links in current line: " + value);
                        await this.plugin.updateSettings({ excludeLinksInCurrentLine: value });
                    })
                );

            // Input for setting the word boundary regex
            // new Setting(containerEl)
            // 	.setName('Word boundary regex')
            // 	.setDesc('The regex for the word boundary. This regex is used to find the beginning and end of a word. It is used to find the boundaries of the words to match. Defaults to /[\t- !-/:-@\[-`{-~\p{Emoji_Presentation}\p{Extended_Pictographic}]/u to catch most word boundaries.')
            // 	.addText((text) =>
            // 		text
            // 			.setValue(this.plugin.settings.wordBoundaryRegex)
            // 			.onChange(async (value) => {
            // 				try {
            // 					await this.plugin.updateSettings({ wordBoundaryRegex: value });
            // 				} catch (e) {
            // 					console.error('Invalid regex', e);
            // 				}
            // 			})
            // 	);
        }

        new Setting(containerEl).setName('Case sensitivity').setHeading();

        // Toggle setting for case sensitivity
        new Setting(containerEl)
            .setName('Case sensitive')
            .setDesc('If activated, the matching is case sensitive.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.matchCaseSensitive).onChange(async (value) => {
                    // console.log("Case sensitive: " + value);
                    await this.plugin.updateSettings({ matchCaseSensitive: value });
                    this.display();
                })
            );

        if (this.plugin.settings.advancedSettings) {
            // Number input setting for capital letter proportion for automatic match case
            new Setting(containerEl)
                .setName('Capital letter percentage for automatic match case')
                .setDesc(
                    'The percentage (0 - 100) of capital letters in a file name or alias to be automatically considered as case sensitive.'
                )
                .addText((text) =>
                    text
                        .setValue((this.plugin.settings.capitalLetterProportionForAutomaticMatchCase * 100).toFixed(1))
                        .onChange(async (value) => {
                            let newValue = parseFloat(value);
                            if (isNaN(newValue)) {
                                newValue = 75;
                            } else if (newValue < 0) {
                                newValue = 0;
                            } else if (newValue > 100) {
                                newValue = 100;
                            }
                            newValue /= 100;

                            // console.log("New capital letter proportion for automatic match case: " + newValue);
                            await this.plugin.updateSettings({ capitalLetterProportionForAutomaticMatchCase: newValue });
                        })
                );

            if (this.plugin.settings.matchCaseSensitive) {
                // Text setting for tag to ignore case
                new Setting(containerEl)
                    .setName('Tag to ignore case')
                    .setDesc('By adding this tag to a file, the linker will ignore the case for the file.')
                    .addText((text) =>
                        text.setValue(this.plugin.settings.tagToIgnoreCase).onChange(async (value) => {
                            // console.log("New tag to ignore case: " + value);
                            await this.plugin.updateSettings({ tagToIgnoreCase: value });
                        })
                    );
            } else {
                // Text setting for tag to match case
                new Setting(containerEl)
                    .setName('Tag to match case')
                    .setDesc('By adding this tag to a file, the linker will match the case for the file.')
                    .addText((text) =>
                        text.setValue(this.plugin.settings.tagToMatchCase).onChange(async (value) => {
                            // console.log("New tag to match case: " + value);
                            await this.plugin.updateSettings({ tagToMatchCase: value });
                        })
                    );
            }

            // Text setting for property name to ignore case
            new Setting(containerEl)
                .setName('Property name to ignore case')
                .setDesc(
                    'By adding this property to a note, containing a list of names, the linker will ignore the case for the specified names / aliases. This way you can decide, which alias should be insensitive.'
                )
                .addText((text) =>
                    text.setValue(this.plugin.settings.propertyNameToIgnoreCase).onChange(async (value) => {
                        // console.log("New property name to ignore case: " + value);
                        await this.plugin.updateSettings({ propertyNameToIgnoreCase: value });
                    })
                );

            // Text setting for property name to match case
            new Setting(containerEl)
                .setName('Property name to match case')
                .setDesc(
                    'By adding this property to a note, containing a list of names, the linker will match the case for the specified names / aliases. This way you can decide, which alias should be case sensitive.'
                )
                .addText((text) =>
                    text.setValue(this.plugin.settings.propertyNameToMatchCase).onChange(async (value) => {
                        // console.log("New property name to match case: " + value);
                        await this.plugin.updateSettings({ propertyNameToMatchCase: value });
                    })
                );
        }

        new Setting(containerEl).setName('Matched files').setHeading();

        new Setting(containerEl)
            .setName('Include all files')
            .setDesc('Include all files for the virtual linker.')
            .addToggle((toggle) =>
                toggle
                    // .setValue(true)
                    .setValue(this.plugin.settings.includeAllFiles)
                    .onChange(async (value) => {
                        // console.log("Include all files: " + value);
                        await this.plugin.updateSettings({ includeAllFiles: value });
                        this.display();
                    })
            );

        if (!this.plugin.settings.includeAllFiles) {
            new Setting(containerEl)
                .setName('Glossary linker directories')
                .setDesc('Directories to include for the virtual linker (separated by new lines).')
                .addTextArea((text) => {
                    let setValue = '';
                    try {
                        setValue = this.plugin.settings.linkerDirectories.join('\n');
                    } catch (e) {
                        console.warn(e);
                    }

                    text.setPlaceholder('List of directory names (separated by new line)')
                        .setValue(setValue)
                        .onChange(async (value) => {
                            this.plugin.settings.linkerDirectories = value
                                .split('\n')
                                .map((x) => x.trim())
                                .filter((x) => x.length > 0);
                            // console.log("New folder name: " + value, this.plugin.settings.linkerDirectories);
                            await this.plugin.updateSettings();
                        });

                    // Set default size
                    text.inputEl.addClass('linker-settings-text-box');
                });
        } else {
            if (this.plugin.settings.advancedSettings) {
                new Setting(containerEl)
                    .setName('Excluded directories')
                    .setDesc(
                        'Directories from which files are to be excluded for the virtual linker (separated by new lines). Files in these directories will not create any virtual links in other files.'
                    )
                    .addTextArea((text) => {
                        let setValue = '';
                        try {
                            setValue = this.plugin.settings.excludedDirectories.join('\n');
                        } catch (e) {
                            console.warn(e);
                        }

                        text.setPlaceholder('List of directory names (separated by new line)')
                            .setValue(setValue)
                            .onChange(async (value) => {
                                this.plugin.settings.excludedDirectories = value
                                    .split('\n')
                                    .map((x) => x.trim())
                                    .filter((x) => x.length > 0);
                                // console.log("New folder name: " + value, this.plugin.settings.excludedDirectories);
                                await this.plugin.updateSettings();
                            });

                        // Set default size
                        text.inputEl.addClass('linker-settings-text-box');
                    });
            }
        }

        if (this.plugin.settings.advancedSettings) {
            // Text setting for tag to include file
            new Setting(containerEl)
                .setName('Tag to include file')
                .setDesc('Tag to explicitly include the file for the linker.')
                .addText((text) =>
                    text.setValue(this.plugin.settings.tagToIncludeFile).onChange(async (value) => {
                        // console.log("New tag to include file: " + value);
                        await this.plugin.updateSettings({ tagToIncludeFile: value });
                    })
                );

            // Text setting for tag to ignore file
            new Setting(containerEl)
                .setName('Tag to ignore file')
                .setDesc('Tag to ignore the file for the linker.')
                .addText((text) =>
                    text.setValue(this.plugin.settings.tagToExcludeFile).onChange(async (value) => {
                        // console.log("New tag to ignore file: " + value);
                        await this.plugin.updateSettings({ tagToExcludeFile: value });
                    })
                );

            // Toggle setting to exclude links to the active file
            new Setting(containerEl)
                .setName('Exclude self-links to the current note')
                .setDesc('If toggled, links to the note itself are excluded from the linker. (This might not work in preview windows.)')
                .addToggle((toggle) =>
                    toggle.setValue(this.plugin.settings.excludeLinksToOwnNote).onChange(async (value) => {
                        // console.log("Exclude links to active file: " + value);
                        await this.plugin.updateSettings({ excludeLinksToOwnNote: value });
                    })
                );

            // Setting to exclude directories from the linker to be executed
            new Setting(containerEl)
                .setName('Excluded directories for generating virtual links')
                .setDesc('Directories in which the plugin will not create virtual links (separated by new lines).')
                .addTextArea((text) => {
                    let setValue = '';
                    try {
                        setValue = this.plugin.settings.excludedDirectoriesForLinking.join('\n');
                    } catch (e) {
                        console.warn(e);
                    }

                    text.setPlaceholder('List of directory names (separated by new line)')
                        .setValue(setValue)
                        .onChange(async (value) => {
                            this.plugin.settings.excludedDirectoriesForLinking = value
                                .split('\n')
                                .map((x) => x.trim())
                                .filter((x) => x.length > 0);
                            // console.log("New folder name: " + value, this.plugin.settings.excludedDirectoriesForLinking);
                            await this.plugin.updateSettings();
                        });

                    // Set default size
                    text.inputEl.addClass('linker-settings-text-box');
                });

            // Add setting for excluded keywords
            new Setting(containerEl)
                .setName('Excluded keywords')
                .setDesc('Keywords to exclude from virtual linking (comma separated). Files/aliases or headings matching these keywords will not be linked.')
                .addTextArea(text => {
                    text.setValue(this.plugin.settings.excludedKeywords.join(','))
                        .onChange(async value => {
                            const keywords = value.split(',')
                                .map(x => x.trim())
                                .filter(x => x.length > 0);
                            await this.plugin.updateSettings({ excludedKeywords: keywords });
                        });
                    text.inputEl.addClass('linker-settings-text-box');
                });

            // Add setting for excluded file extensions
            new Setting(containerEl)
                .setName('Excluded file extensions')
                .setDesc('File extensions to exclude from virtual linking (one per line or comma separated)')
                .addTextArea(text => {
                    text.setValue(this.plugin.settings.excludedExtensions.join('\n'))
                        .onChange(async value => {
                            const extensions = value.split(/[\n,]/)
                                .map(x => x.trim())
                                .filter(x => x.length > 0)
                                .map(x => x.startsWith('.') ? x : `.${x}`);
                            await this.plugin.updateSettings({ excludedExtensions: extensions });
                        });
                    text.inputEl.addClass('linker-settings-text-box');
                });
        }

        new Setting(containerEl).setName('Link style').setHeading();

        new Setting(containerEl)
            .setName('Always show multiple references')
            .setDesc('If toggled, if there are multiple matching notes, all references are shown behind the match. If not toggled, the references are only shown if hovering over the match.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.alwaysShowMultipleReferences).onChange(async (value) => {
                    // console.log("Always show multiple references: " + value);
                    await this.plugin.updateSettings({ alwaysShowMultipleReferences: value });
                })
            );

        new Setting(containerEl)
            .setName('Virtual link suffix')
            .setDesc('The suffix to add to auto generated virtual links.')
            .addText((text) =>
                text.setValue(this.plugin.settings.virtualLinkSuffix).onChange(async (value) => {
                    // console.log("New glossary suffix: " + value);
                    await this.plugin.updateSettings({ virtualLinkSuffix: value });
                })
            );
        new Setting(containerEl)
            .setName('Virtual link suffix for aliases')
            .setDesc('The suffix to add to auto generated virtual links for aliases.')
            .addText((text) =>
                text.setValue(this.plugin.settings.virtualLinkAliasSuffix).onChange(async (value) => {
                    // console.log("New glossary suffix: " + value);
                    await this.plugin.updateSettings({ virtualLinkAliasSuffix: value });
                })
            );

        // Toggle setting to apply default link styling
        new Setting(containerEl)
            .setName('Apply default link styling')
            .setDesc(
                'If toggled, the default link styling will be applied to virtual links. Furthermore, you can style the links yourself with a CSS-snippet affecting the class `virtual-link`. (Find the CSS snippet directory at Appearance -> CSS Snippets -> Open snippets folder)'
            )
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.applyDefaultLinkStyling).onChange(async (value) => {
                    // console.log("Apply default link styling: " + value);
                    await this.plugin.updateSettings({ applyDefaultLinkStyling: value });
                })
            );

        // Toggle setting to use default link style for conversion
        new Setting(containerEl)
            .setName('Use default link style for conversion')
            .setDesc('If toggled, the default link style will be used for the conversion of virtual links to real links.')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useDefaultLinkStyleForConversion).onChange(async (value) => {
                    // console.log("Use default link style for conversion: " + value);
                    await this.plugin.updateSettings({ useDefaultLinkStyleForConversion: value });
                    this.display();
                })
            );

        if (!this.plugin.settings.useDefaultLinkStyleForConversion) {
            // Toggle setting to use markdown links
            new Setting(containerEl)
                .setName('Use [[Wiki-links]]')
                .setDesc('If toggled, the virtual links will be created as wiki-links instead of markdown links.')
                .addToggle((toggle) =>
                    toggle.setValue(!this.plugin.settings.useMarkdownLinks).onChange(async (value) => {
                        // console.log("Use markdown links: " + value);
                        await this.plugin.updateSettings({ useMarkdownLinks: !value });
                    })
                );

            // Dropdown setting for link format
            new Setting(containerEl)
                .setName('Link format')
                .setDesc('The format of the generated links.')
                .addDropdown((dropdown) =>
                    dropdown
                        .addOption('shortest', 'Shortest')
                        .addOption('relative', 'Relative')
                        .addOption('absolute', 'Absolute')
                        .setValue(this.plugin.settings.linkFormat)
                        .onChange(async (value) => {
                            // console.log("New link format: " + value);
                            await this.plugin.updateSettings({ linkFormat: value as 'shortest' | 'relative' | 'absolute' });
                        })
                );
        }
    }
}