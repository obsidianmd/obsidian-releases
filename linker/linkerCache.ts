import { App, getAllTags, parseFrontMatterAliases, TFile, Vault } from 'obsidian';

import { LinkerPluginSettings } from 'main';
import { LinkerMetaInfoFetcher } from './linkerInfo';

export class ExternalUpdateManager {
    private static readonly UPDATE_DELAY_MS = 50;
    registeredCallbacks: Set<Function> = new Set();

    constructor() {}

    registerCallback(callback: Function) {
        this.registeredCallbacks.add(callback);
    }

    update() {
        // Timeout to make sure the cache is updated
        setTimeout(() => {
            for (const callback of this.registeredCallbacks) {
                callback();
            }
        }, ExternalUpdateManager.UPDATE_DELAY_MS);
    }
}

export class PrefixNode {
    parent: PrefixNode | undefined;
    children: Map<string, PrefixNode> = new Map();
    files: Set<TFile> = new Set();
    charValue: string = '';
    value: string = '';
    requiresCaseMatch: boolean = false;
}

export class VisitedPrefixNode {
    node: PrefixNode;
    caseIsMatched: boolean;
    startedAtWordBeginning: boolean;
    formattingDelta: number = 0;
    constructor(node: PrefixNode, caseIsMatched: boolean = true, startedAtWordBeginning: boolean = false) {
        this.node = node;
        this.caseIsMatched = caseIsMatched;
        this.startedAtWordBeginning = startedAtWordBeginning;
    }
}

export enum MatchType {
    Note,    // Points to note name
    Alias,   // Points to alias
    Header   // Points to heading
}

export class MatchNode {
    start: number = 0;
    length: number = 0;
    files: Set<TFile> = new Set();
    value: string = '';
    type: MatchType = MatchType.Note;
    caseIsMatched: boolean = true;
    startsAtWordBoundary: boolean = false;
    requiresCaseMatch: boolean = false;
    headerId?: string;  // Only used for Header type

    get end(): number {
        return this.start + this.length;
    }

    get isAlias(): boolean {
        return this.type === MatchType.Alias;
    }
}

export class PrefixTree {
    root: PrefixNode = new PrefixNode();
    fetcher: LinkerMetaInfoFetcher;

    _currentNodes: VisitedPrefixNode[] = [];

    setIndexedFilePaths: Set<string> = new Set();
    mapIndexedFilePathsToUpdateTime: Map<string, number> = new Map();
    mapFilePathToLeaveNodes: Map<string, PrefixNode[]> = new Map();

    private static readonly SUPPORTED_EXTENSIONS = [
        'md', 'png', 'jpg', 'jpeg', 'gif', 'svg',
        'pdf', 'doc', 'docx', 'xls', 'xlsx',
        'mp3', 'wav', 'ogg',
        'mp4', 'mov', 'avi', 'webm'
    ];

    constructor(public app: App, public settings: LinkerPluginSettings) {
        this.fetcher = new LinkerMetaInfoFetcher(this.app, this.settings);
        this.updateTree();
    }

    clear() {
        this.root = new PrefixNode();
        this._currentNodes = [];
        this.setIndexedFilePaths.clear();
        this.mapIndexedFilePathsToUpdateTime.clear();
        this.mapFilePathToLeaveNodes.clear();
    }

    private isExcluded(value: string): boolean {
        const valueLower = value.toLowerCase();
        return this.settings.excludedKeywords.some(kw => kw.toLowerCase() === valueLower);
    }

    getCurrentMatchNodes(index: number, excludedNote?: TFile | null, specificFile?: TFile): MatchNode[] {
        const matchNodes: MatchNode[] = [];

        if (excludedNote === undefined && this.settings.excludeLinksToOwnNote) {
            excludedNote = this.app.workspace.getActiveFile();
        }

        for (const node of this._currentNodes) {
            if (node.node.files.size === 0 || this.isExcluded(node.node.value)) {
                continue;
            }
            const matchNode = new MatchNode();
            matchNode.length = node.node.value.length + node.formattingDelta;
            matchNode.start = index - matchNode.length;
            // If a specific file is specified, only include that file
            if (specificFile) {
                matchNode.files = new Set(Array.from(node.node.files).filter((file) => file.path === specificFile.path));
            } else {
                matchNode.files = new Set(Array.from(node.node.files).filter((file) => !excludedNote || file.path !== excludedNote.path));
            }
            matchNode.value = node.node.value;
            matchNode.requiresCaseMatch = node.node.requiresCaseMatch;

            // Determine match type
            const fileNames = Array.from(matchNode.files).map((file) => file.basename);
            const nodeValue = node.node.value;
            
            if (fileNames.map((n) => n.toLowerCase()).includes(nodeValue.toLowerCase())) {
                matchNode.type = MatchType.Note;  // Matches note name
            } else {
                // Check if it's a heading match
                const file = Array.from(matchNode.files)[0];
                if (file) {
                    const metadata = this.app.metadataCache.getFileCache(file);
                    // First check for heading match
                    let headingMatch = null;
                    if (metadata?.headings) {
                        if (this.settings.headerMatchOnlyBetweenSymbols && this.settings.headerMatchStartSymbol && this.settings.headerMatchEndSymbol && this.settings.headerMatchStartSymbol !== this.settings.headerMatchEndSymbol) {
                            // Special handling for header match with symbols
                            for (const h of metadata.headings) {
                                const headingText = h.heading;
                                const startSymbol = this.settings.headerMatchStartSymbol;
                                const endSymbol = this.settings.headerMatchEndSymbol;
                                let searchStartIndex = 0;
                                
                                // Find all occurrences of start-end symbol pairs
                                while (searchStartIndex < headingText.length) {
                                    const startIndex = headingText.indexOf(startSymbol, searchStartIndex);
                                    if (startIndex === -1) break;
                                    
                                    const endIndex = headingText.indexOf(endSymbol, startIndex + startSymbol.length);
                                    if (endIndex === -1) break;
                                    
                                    if (startIndex < endIndex) {
                                        const keyword = headingText.substring(startIndex + startSymbol.length, endIndex).trim();
                                        if (keyword.toLowerCase() === nodeValue.toLowerCase()) {
                                            headingMatch = h;
                                            break;
                                        }
                                        // Move search position after this end symbol
                                        searchStartIndex = endIndex + endSymbol.length;
                                    } else {
                                        // Invalid ordering, move past this start symbol
                                        searchStartIndex = startIndex + startSymbol.length;
                                    }
                                }
                                if (headingMatch) break;
                            }
                        } else {
                            headingMatch = metadata.headings.find(h => 
                                h.heading.toLowerCase() === nodeValue.toLowerCase()
                            );
                        }
                    }
                    
                    if (headingMatch) {
                        matchNode.type = MatchType.Header;
                        // Only perform trim, preserve original case and all special characters
                        // This is consistent with Obsidian behavior
                        matchNode.headerId = headingMatch.heading.trim();
                    }
                    // Then check for note name match
                    else if (fileNames.map((n) => n.toLowerCase()).includes(nodeValue.toLowerCase())) {
                        matchNode.type = MatchType.Note;
                    } 
                    // Default to alias match
                    else {
                        matchNode.type = MatchType.Alias;
                    }
                    } else {
                        matchNode.type = MatchType.Alias;  // Matches alias
                    }
                }

            // Check if the case is matched
            let currentNode: PrefixNode | undefined = node.node;
            while (currentNode) {
                if (!node.caseIsMatched) {
                    matchNode.caseIsMatched = false;
                    break;
                }
                currentNode = currentNode.parent;
            }

            // Check if the match starts at a word boundary
            matchNode.startsAtWordBoundary = node.startedAtWordBeginning;

            if (matchNode.requiresCaseMatch && !matchNode.caseIsMatched) {
                continue;
            }

            if (matchNode.files.size > 0) {
                matchNodes.push(matchNode);
            }
        }

        // Sort nodes by length
        matchNodes.sort((a, b) => b.length - a.length);

        return matchNodes;
    }

    private addFileWithName(name: string, file: TFile, matchCase: boolean) {
        let node = this.root;

        // For each character in the name, add a node to the trie
        for (let char of name) {
            // char = char.toLowerCase();
            let child = node.children.get(char);
            if (!child) {
                child = new PrefixNode();
                child.parent = node;
                child.charValue = char;
                child.value = node.value + char;
                node.children.set(char, child);
            }
            node = child;
        }

        // The last node is a leaf node, add the file to the node
        node.files.add(file);
        node.requiresCaseMatch = matchCase;

        // Store the leaf node for the file to be able to remove it later
        const path = file.path;
        this.mapFilePathToLeaveNodes.set(path, [node, ...(this.mapFilePathToLeaveNodes.get(path) ?? [])]);
        // console.log("Adding file", file, name);
    }

    private static isNoneEmptyString(value: string | null | undefined): value is string {
        return value !== null && value !== undefined && typeof value === 'string' && value.trim().length > 0;
    }

    private static isUpperCaseString(value: string | null | undefined, upperCasePart = 0.75) {
        if (!PrefixTree.isNoneEmptyString(value)) {
            return false;
        }

        const length = value.length;
        const upperCaseChars = value.split('').filter((char) => char === char.toUpperCase()).length;

        return upperCaseChars / length >= upperCasePart;
    }

    private addFileToTree(file: TFile) {
        const path = file.path;

        if (!file || !path) {
            return;
        }

        // Remove the old nodes of the file
        this.removeFileFromTree(file);

        // Add the file to the set of indexed files
        this.setIndexedFilePaths.add(path);
        this.mapIndexedFilePathsToUpdateTime.set(path, file.stat.mtime);

        // Get the virtual linker related metadata of the file
        const metaInfo = this.fetcher.getMetaInfo(file);

        // Get the tags of the file
        // and normalize them by removing the # in front of tags
        const tags = (getAllTags(this.app.metadataCache.getFileCache(file)!!) ?? [])
            .filter(PrefixTree.isNoneEmptyString)
            .map((tag) => (tag.startsWith('#') ? tag.slice(1) : tag));

        const includeFile = metaInfo.includeFile;
        const excludeFile = metaInfo.excludeFile;

        const isInIncludedDir = metaInfo.isInIncludedDir;
        const isInExcludedDir = metaInfo.isInExcludedDir;

        if (excludeFile || (isInExcludedDir && !includeFile)) {
            return;
        }

        // Skip files that are not in the linker directories
        if (!includeFile && !isInIncludedDir && !metaInfo.includeAllFiles) {
            return;
        }

        const metadata = this.app.metadataCache.getFileCache(file);
        let aliases: string[] = metadata?.frontmatter?.aliases ?? [];
        
        // Get headers from metadata cache
        let headers: string[] = [];
        if (this.settings.includeHeaders && metadata?.headings) {
            if (this.settings.headerMatchOnlyBetweenSymbols && this.settings.headerMatchStartSymbol && this.settings.headerMatchEndSymbol && this.settings.headerMatchStartSymbol !== this.settings.headerMatchEndSymbol) {
                for (const h of metadata.headings) {
                    const headingText = h.heading;
                    const startSymbol = this.settings.headerMatchStartSymbol;
                    const endSymbol = this.settings.headerMatchEndSymbol;
                    let searchStartIndex = 0;
                    
                    // Find all occurrences of start-end symbol pairs
                    while (searchStartIndex < headingText.length) {
                        const startIndex = headingText.indexOf(startSymbol, searchStartIndex);
                        if (startIndex === -1) break;
                        
                        const endIndex = headingText.indexOf(endSymbol, startIndex + startSymbol.length);
                        if (endIndex === -1) break;
                        
                        if (startIndex < endIndex) {
                            const keyword = headingText.substring(startIndex + startSymbol.length, endIndex).trim();
                            if (keyword) {
                                headers.push(keyword);
                            }
                            // Move search position after this end symbol
                            searchStartIndex = endIndex + endSymbol.length;
                        } else {
                            // Invalid ordering, move past this start symbol
                            searchStartIndex = startIndex + startSymbol.length;
                        }
                    }
                }
            } else {
                headers = metadata.headings.map(h => h.heading);
            }
        }

        let aliasesWithMatchCase: Set<string> = new Set(metadata?.frontmatter?.[this.settings.propertyNameToMatchCase] ?? []);
        let aliasesWithIgnoreCase: Set<string> = new Set(metadata?.frontmatter?.[this.settings.propertyNameToIgnoreCase] ?? []);

        // If aliases is not an array, convert it to an array
        if (!Array.isArray(aliases)) {
            aliases = [aliases];
        }

        // Filter out empty aliases
        try {
            aliases = aliases.filter(PrefixTree.isNoneEmptyString);
        } catch (e) {
            console.error('[VL LC] Error filtering aliases', aliases, e);
        }

        let names = [file.basename];
        if (aliases && this.settings.includeAliases) {
            names.push(...aliases);
        }
        if (headers && this.settings.includeHeaders) {
            names.push(...headers);
        }

        names = names.filter(PrefixTree.isNoneEmptyString);

        let namesWithCaseIgnore = new Array<string>();
        let namesWithCaseMatch = new Array<string>();

        // Check if the file should match case sensitive
        if (this.settings.matchCaseSensitive) {
            let lowerCaseNames = new Array<string>();
            if (tags.includes(this.settings.tagToIgnoreCase)) {
                namesWithCaseIgnore = [...names];
            } else {
                namesWithCaseMatch = [...names];
            }
            lowerCaseNames = lowerCaseNames.map((name) => name.toLowerCase());
            names.push(...lowerCaseNames);
        } else {
            let lowerCaseNames = new Array<string>();
            if (tags.includes(this.settings.tagToMatchCase)) {
                namesWithCaseMatch = [...names];
                lowerCaseNames = names.filter((name) => aliasesWithIgnoreCase.has(name));
            } else {
                const prop = this.settings.capitalLetterProportionForAutomaticMatchCase;
                namesWithCaseMatch = [...names].filter(
                    (name) => PrefixTree.isUpperCaseString(name, prop) && !aliasesWithIgnoreCase.has(name)
                );
                namesWithCaseIgnore = [...names].filter((name) => !namesWithCaseMatch.includes(name));
            }
        }

        const namesToMoveFromIgnoreToMatch = namesWithCaseIgnore.filter((name) => aliasesWithMatchCase.has(name));
        const namesToMoveFromMatchToIgnore = namesWithCaseMatch.filter((name) => aliasesWithIgnoreCase.has(name));

        namesWithCaseIgnore = namesWithCaseIgnore.filter((name) => !namesToMoveFromIgnoreToMatch.includes(name));
        namesWithCaseMatch = namesWithCaseMatch.filter((name) => !namesToMoveFromMatchToIgnore.includes(name));
        namesWithCaseIgnore.push(...namesToMoveFromMatchToIgnore);
        namesWithCaseMatch.push(...namesToMoveFromIgnoreToMatch);

        namesWithCaseIgnore.push(...namesWithCaseIgnore.map((name) => name.toLowerCase()));

        // Filter out excluded keywords before adding to tree
        namesWithCaseIgnore = namesWithCaseIgnore.filter(name => !this.isExcluded(name));
        namesWithCaseMatch = namesWithCaseMatch.filter(name => !this.isExcluded(name));

        namesWithCaseIgnore.forEach((name) => {
            this.addFileWithName(name, file, false);
        });

        namesWithCaseMatch.forEach((name) => {
            this.addFileWithName(name, file, true);
        });
    }

    private removeFileFromTree(file: TFile | string) {
        const path = typeof file === 'string' ? file : file.path;

        // Get the leaf nodes of the file
        const nodes = this.mapFilePathToLeaveNodes.get(path) ?? [];
        for (const node of nodes) {
            // Remove the file from the node
            node.files = new Set([...node.files].filter((f) => f.path !== path));
        }

        // If the nodes have no files or children, remove them from the tree
        for (let i = nodes.length - 1; i >= 0; i--) {
            const node = nodes[i];
            let currentNode = node;
            while (currentNode.files.size === 0 && currentNode.children.size === 0) {
                const parent = currentNode.parent;
                if (!parent || parent === this.root) {
                    break;
                }
                parent.children.delete(currentNode.charValue);
                currentNode = parent;
            }
        }

        // Remove the file from the set of indexed files
        this.setIndexedFilePaths.delete(path);
        this.mapFilePathToLeaveNodes.delete(path);

        // Remove the update time of the file
        this.mapIndexedFilePathsToUpdateTime.delete(path);
    }

    private fileIsUpToDate(file: TFile) {
        const mtime = file.stat.mtime;
        const path = file.path;
        return this.mapIndexedFilePathsToUpdateTime.has(path) && this.mapIndexedFilePathsToUpdateTime.get(path) === mtime;
    }

    updateTree(updateFiles?: (string | undefined)[]) {
        this.fetcher.refreshSettings();

        const currentVaultFiles = new Set<string>();
        let files = new Array<TFile>();

        // Get all files and filter for supported types
        const allFiles = this.app.vault.getFiles().filter(file => {
            const ext = file.extension.toLowerCase();
            return PrefixTree.SUPPORTED_EXTENSIONS.includes(ext);
        }) as TFile[];

        allFiles.forEach((f) => currentVaultFiles.add(f.path));

        // If the number of files has changed, update all files
        if (allFiles.length !== this.setIndexedFilePaths.size || !updateFiles?.length) {
            files = allFiles;
        } else {
            // If files are provided, only update the provided files
            files = updateFiles
                .map((f) => f ? this.app.vault.getAbstractFileByPath(f) : null)
                .filter((f): f is TFile => f instanceof TFile);
        }

        for (const file of files) {
            // Get the update time of the file
            const mtime = file.stat.mtime;

            // Check if the file has been updated
            if (this.fileIsUpToDate(file)) {
                continue;
            }

            // Otherwise, add the file to the tree
            try {
                this.addFileToTree(file);
            } catch (e) {
                console.error('[VL LC] Error adding file to tree', file, e);
            }
        }

        // Remove files that are no longer in the vault
        const filesToRemove = [...this.setIndexedFilePaths].filter((f) => !currentVaultFiles.has(f));
        filesToRemove.forEach((f) => this.removeFileFromTree(f));
    }

    findFiles(prefix: string): Set<TFile> {
        let node: PrefixNode | undefined = this.root;
        for (const char of prefix) {
            node = node.children.get(char.toLowerCase());
            if (!node) {
                return new Set();
            }
        }
        return node.files;
    }

    resetSearch() {
        // this._current = this.root;
        this._currentNodes = [new VisitedPrefixNode(this.root)];
    }

    pushChar(char: string) {
        const newNodes: VisitedPrefixNode[] = [];
        const chars = [char, char.toLowerCase()];

        chars.forEach((c) => {
            const isBoundary = PrefixTree.checkWordBoundary(c);
            if (this.settings.matchAnyPartsOfWords || isBoundary || this.settings.matchEndOfWords) {
                newNodes.push(new VisitedPrefixNode(this.root, true, isBoundary));
            }

            for (const node of this._currentNodes) {
                const child = node.node.children.get(c);
                const startedAtBoundary = node.startedAtWordBeginning;
                if (child) {
                    const newPrefixNodes = newNodes.map((n) => n.node);
                    if (!newPrefixNodes.includes(child)) {
                        const newVisited = new VisitedPrefixNode(child, char == c, startedAtBoundary);
                        newVisited.formattingDelta = node.formattingDelta;
                        newNodes.push(newVisited);
                    }
                }
            }
        });
        this._currentNodes = newNodes;
    }

    static checkWordBoundary(char: string): boolean {
        // \p{L}: Any kind of letter from any language.
        let pattern = /[^\p{L}]/u;
        return pattern.test(char);
    }

    static isFormattingChar(char: string): boolean {
        const pattern = /[^\p{L}\p{N}]/u;
        return pattern.test(char);
    }
}

export class CachedFile {
    constructor(public mtime: number, public file: TFile, public aliases: string[], public tags: string[]) {}
}

export class LinkerCache {
    static instance: LinkerCache;

    activeFilePath?: string;
    // files: Map<string, CachedFile> = new Map();
    // linkEntries: Map<string, CachedFile[]> = new Map();
    vault: Vault;
    cache: PrefixTree;

    constructor(public app: App, public settings: LinkerPluginSettings) {
        const { vault } = app;
        this.vault = vault;
        this.cache = new PrefixTree(app, settings);
        this.updateCache(true);
    }

    static getInstance(app: App, settings: LinkerPluginSettings) {
        if (!LinkerCache.instance) {
            LinkerCache.instance = new LinkerCache(app, settings);
        }
        return LinkerCache.instance;
    }

    clearCache() {
        this.cache.clear();
    }

    reset() {
        this.cache.resetSearch();
    }

    updateCache(force = false) {
        // Skip update if plugin is not activated
        if (!this.settings.linkerActivated) return;

        if (!this.app?.workspace?.getActiveFile()) {
            return;
        }

        // We only need to update cache if the active file has changed
        const activeFile = this.app.workspace.getActiveFile()?.path;
        if (activeFile === this.activeFilePath && !force) {
            return;
        }

        this.cache.updateTree(force ? undefined : [activeFile, this.activeFilePath]);

        this.activeFilePath = activeFile;
    }
}