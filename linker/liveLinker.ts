import { syntaxTree } from '@codemirror/language';
import { RangeSetBuilder } from '@codemirror/state';
import { Decoration, DecorationSet, EditorView, PluginSpec, PluginValue, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';
import { App, MarkdownView, TFile, Vault } from 'obsidian';

import IntervalTree from '@flatten-js/interval-tree';
import { LinkerPluginSettings } from 'main';
import { ExternalUpdateManager, LinkerCache, MatchType, PrefixTree } from './linkerCache';
import { VirtualMatch } from './virtualLinkDom';

function isDescendant(parent: HTMLElement, child: HTMLElement, maxDepth: number = 10) {
    let node = child.parentNode;
    let depth = 0;
    while (node != null && depth < maxDepth) {
        if (node === parent) {
            return true;
        }
        node = node.parentNode;
        depth++;
    }
    return false;
}

export class VirtualLinkWidget extends WidgetType {
    constructor(public match: VirtualMatch) {
        super();
    }
    
    toDOM(view: EditorView): HTMLElement {
        // Improved table cell detection logic
        const cmTableWidget = view.dom.closest('.cm-table-widget');
        const tableWrapper = view.dom.closest('.table-cell-wrapper');
        const inTableCellEditor = !!(cmTableWidget && tableWrapper);
        
        // Create link element
        const element = this.match.getCompleteLinkElement(inTableCellEditor);
        
        // Check current format context with precise range checking
        let inBoldContext = false;
        let inItalicContext = false;
        let inHighlightContext = false;
        let inStrikethroughContext = false;
        
        // Get the exact text range of the virtual link
        const linkRange = { from: this.match.from, to: this.match.to };
        
        syntaxTree(view.state).iterate({
            from: this.match.from,
            to: this.match.to,
            enter(node) {
                const type = node.type.name;
                const nodeRange = { from: node.from, to: node.to };
                
                // Only set context if virtual link is fully contained within the format node
                if (linkRange.from >= nodeRange.from && linkRange.to <= nodeRange.to) {
                    if (type.includes('strong')) {
                        inBoldContext = true;
                    }
                    if (type.includes('em')) {
                        inItalicContext = true;
                    }
                    if (type.includes('highlight')) {
                        inHighlightContext = true;
                    }
                    if (type.includes('strikethrough')) {
                        inStrikethroughContext = true;
                    }
                }
            }
        });
        
        // Set context flags on the match
        this.match.isBoldContext = inBoldContext || this.match.isBoldContext;
        this.match.isItalicContext = inItalicContext;
        this.match.isHighlightContext = inHighlightContext;
        this.match.isStrikethroughContext = inStrikethroughContext;
        this.match.isTripleStarContext = inBoldContext && inItalicContext;
        
        // Add corresponding CSS classes
        if (this.match.isBoldContext) {
            element.classList.add('cm-strong');
        }
        if (this.match.isItalicContext) {
            element.classList.add('cm-em');
        }
        if (this.match.isHighlightContext) {
            element.classList.add('cm-highlight');
        }
        if (this.match.isStrikethroughContext) {
            element.classList.add('cm-strikethrough');
        }
        if (this.match.isTripleStarContext) {
            element.classList.add('cm-strong', 'cm-em');
        }
        
        return element;
    }
    
    // Set higher decoration priority
    get estimatedHeight(): number {
        return -1;
    }
}

class AutoLinkerPlugin implements PluginValue {
    decorations: DecorationSet;
    app: App;
    vault: Vault;
    linkerCache: LinkerCache;

    settings: LinkerPluginSettings;
    plugin: any;

    private lastCursorPos: number = 0;
    private lastActiveFile: string = '';
    private lastViewUpdate: ViewUpdate | null = null;

    viewUpdateDomToFileMap: Map<HTMLElement, TFile | undefined | null> = new Map();

    constructor(view: EditorView, app: App, settings: LinkerPluginSettings, updateManager: ExternalUpdateManager, plugin: any) {
        this.app = app;
        this.plugin = plugin; // Store plugin reference
        this.settings = settings;

        const { vault } = this.app;
        this.vault = vault;

        this.linkerCache = LinkerCache.getInstance(app, this.settings);

        this.decorations = this.buildDecorations(view);

        updateManager.registerCallback(() => {
            if (this.lastViewUpdate) {
                this.update(this.lastViewUpdate, true);
            }
        });
    }

    update(update: ViewUpdate, force: boolean = false) {
        const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

        // Pre-detect table environment for active view checking
        const cmTableWidget = update.view.dom.closest('.cm-table-widget');
        const tableWrapper = update.view.dom.closest('.table-cell-wrapper');
        const inTableCellEditor = !!(cmTableWidget && tableWrapper);

        // Check if the update is on the active view. We only need to check this, if one of the following settings is enabled
        // - fixIMEProblem
        // - excludeLinksToOwnNote
        // - excludeLinksInCurrentLine
        let updateIsOnActiveView = false;
        if (this.settings.fixIMEProblem || this.settings.excludeLinksInCurrentLine || this.settings.excludeLinksToOwnNote) {
            const domFromUpdate = update.view.dom;
            const domFromWorkspace = activeView?.contentEl;
            updateIsOnActiveView = domFromWorkspace ? isDescendant(domFromWorkspace, domFromUpdate, 3) : false;
            
            // Additional check for table environments - pragmatic approach
            if (!updateIsOnActiveView && inTableCellEditor) {
                // If we're in a table cell editor, assume it's the active view
                // This solves the complex DOM hierarchy detection issue
                updateIsOnActiveView = true;
            }
            


            // We store this information to be able to map the view updates to a obsidian file
            if (updateIsOnActiveView) {
                this.viewUpdateDomToFileMap.set(domFromUpdate, activeView?.file);
            }
        }

        const cursorPos = update.view.state.selection.main.from;
        const activeFile = this.app.workspace.getActiveFile()?.path;
        const fileChanged = activeFile != this.lastActiveFile;

        if (force || this.lastCursorPos != cursorPos || update.docChanged || fileChanged || update.viewportChanged) {
            this.lastCursorPos = cursorPos;
            this.linkerCache.updateCache(force);
            this.decorations = this.buildDecorations(update.view, updateIsOnActiveView);
            this.lastActiveFile = activeFile ?? '';
        }

        this.lastViewUpdate = update;
    }

    destroy() {}

    /**
     * Get information about parent elements for debugging
     */
    getParentElementInfo(element: Element, maxDepth: number = 5): Array<{tag: string, classes: string}> {
        const parents: Array<{tag: string, classes: string}> = [];
        let current = element.parentElement;
        let depth = 0;
        
        while (current && depth < maxDepth) {
            parents.push({
                tag: current.tagName,
                classes: Array.from(current.classList).join(' ')
            });
            current = current.parentElement;
            depth++;
        }
        
        return parents;
    }

    /**
     * Find the boundary of the current line within a table cell
     * @param view The editor view
     * @param cursorPos Current cursor position
     * @param findStart Whether to find the start boundary (true) or end boundary (false)
     * @returns The position of the line boundary
     */
    findTableCellLineBoundary(view: EditorView, cursorPos: number, findStart: boolean): number {
        const doc = view.state.doc;
        

        
        // Additional debugging

        
        if (findStart) {
            // Look backwards for newline or start of document
            for (let pos = cursorPos; pos >= 0; pos--) {
                if (pos === 0) {

                    return 0;
                }
                const char = doc.sliceString(pos - 1, pos);
                if (char === '\n') {

                    return pos;
                }
            }

            return 0;
        } else {
            // Look forwards for newline or end of document
            for (let pos = cursorPos; pos <= doc.length; pos++) {
                if (pos === doc.length) {

                    return doc.length;
                }
                const char = doc.sliceString(pos, pos + 1);
                if (char === '\n') {

                    return pos;
                }
            }

            return doc.length;
        }
    }

    buildDecorations(view: EditorView, viewIsActive: boolean = true): DecorationSet {
        const builder = new RangeSetBuilder<Decoration>();

        if (!this.settings.linkerActivated) {
            return builder.finish();
        }

        const dom = view.dom;
        const mappedFile = this.viewUpdateDomToFileMap.get(dom);

        // Check if the file is inside excluded folders
        const excludedFolders = this.settings.excludedDirectoriesForLinking;
        if (excludedFolders.length > 0) {
            const path = mappedFile?.parent?.path ?? this.app.workspace.getActiveFile()?.parent?.path;
            if (excludedFolders.includes(path ?? '')) return builder.finish();
        }

        // Set to exclude files that are explicitly linked
        const explicitlyLinkedFiles = new Set<TFile>();

        // Set to exclude files that are already linked by a virtual link
        const alreadyLinkedFiles = new Set<TFile>();

        for (let { from, to } of view.visibleRanges) {
            this.linkerCache.reset();
            const text = view.state.doc.sliceString(from, to);

            // For every glossary file and its aliases we now search the text for occurrences
            // const additions: { id: number; files: TFile[]; from: number; to: number; widget: WidgetType }[] = [];
            let matches: VirtualMatch[] = [];
            let id = 0;
            // Iterate over every char in the text
            for (let i = 0; i <= text.length; i) {
                // Do this to get unicode characters as whole chars and not only half of them
                const codePoint = text.codePointAt(i)!;
                const char = i < text.length ? String.fromCodePoint(codePoint) : '\n';

                // If we are at a word boundary, get the current fitting files
                const isWordBoundary = PrefixTree.checkWordBoundary(char); // , this.settings.wordBoundaryRegex
                if (this.settings.matchAnyPartsOfWords || this.settings.matchBeginningOfWords || isWordBoundary) {
                    const currentNodes = this.linkerCache.cache.getCurrentMatchNodes(
                        i,
                        this.settings.excludeLinksToOwnNote ? mappedFile : null
                    );

                    if (currentNodes.length > 0) {
                        // console.log('NODES', currentNodes);
                        for (const node of currentNodes) {
                            // Check if we want to include this note based on the settings
                            if (!this.settings.matchAnyPartsOfWords) {
                                if (
                                    (this.settings.matchBeginningOfWords && !node.startsAtWordBoundary) &&
                                    (this.settings.matchEndOfWords && !isWordBoundary)
                                ) {
                                    continue;
                                }
                            }

                            const nFrom = node.start;
                            const nTo = node.end;
                            const name = text.slice(nFrom, nTo);
                            const isAlias = node.isAlias;

                            const aFrom = from + nFrom;
                            const aTo = from + nTo;

                            // console.log("MATCH", name, aFrom, aTo, node.caseIsMatched, node.requiresCaseMatch)

                            // Filter out files with excluded extensions
                            const filteredFiles = Array.from(node.files).filter(file => {
                                return !this.settings.excludedExtensions.some(ext => 
                                    file.path.toLowerCase().endsWith(ext.toLowerCase())
                                );
                            });
                            
                            // Skip if name is in excluded keywords
                            const nameToCheck = this.settings.matchCaseSensitive ? name : name.toLowerCase();
                            const excludedKeywords = this.settings.matchCaseSensitive 
                                ? this.settings.excludedKeywords 
                                : this.settings.excludedKeywords.map(k => k.toLowerCase());
                            
                            if (filteredFiles.length > 0 && !excludedKeywords.includes(nameToCheck)) {
                                const virtualMatch = new VirtualMatch(
                                    id++,
                                    name,
                                    aFrom,
                                    aTo,
                                    filteredFiles,
                                    isAlias ? MatchType.Alias : MatchType.Note,
                                    !isWordBoundary,
                                    this.settings,
                                    this.plugin, // Add plugin parameter
                                    node.headerId
                                );

                                // If there are multiple files, get corresponding heading ID for each file
                                if (filteredFiles.length > 1) {
                                    filteredFiles.forEach((file, index) => {
                                        if (index === 0) return;

                                        const fileNodes = this.linkerCache.cache.getCurrentMatchNodes(
                                            i,
                                            null,
                                            file
                                        );
                                        if (fileNodes && fileNodes.length > 0 && fileNodes[0].headerId) {
                                            virtualMatch.setFileHeaderId(file, fileNodes[0].headerId);
                                        }
                                    });
                                }

                                matches.push(virtualMatch);
                            }
                        }
                    }
                }

                // Push the char to get the next nodes in the prefix tree
                this.linkerCache.cache.pushChar(char);

                i += char.length;
            }

            // Sort additions by position and files length
            matches = VirtualMatch.sort(matches);

            // We want to exclude some syntax nodes from being decorated,
            // such as code blocks and manually added links
            const excludedIntervalTree = new IntervalTree();
            let excludedTypes = ['codeblock', 'code-block', 'inline-code', 'internal-link', 'link', 'url', 'hashtag', 'header-'];

            // We also want to exclude links to files that are already linked by a real link
            const app = this.app;
            syntaxTree(view.state).iterate({
                from,
                to,
                enter(node) {
                    const type = node.type.name;
                    const types = type.split('_');
                    // const text = view.state.doc.sliceString(node.from, node.to);
                    // console.log(text, node.type.name, types, node.from, node.to)

                    for (const excludedType of excludedTypes) {
                        if (type.contains(excludedType)) {
                            excludedIntervalTree.insert([node.from, node.to]);

                            // Types can be combined, e.g. internal-link_link-has-alias
                            // These combined types are separated by underscores
                            const isLinkIfHavingTypes = [['string', 'url'], 'hmd-internal-link', 'internal-link'];

                            isLinkIfHavingTypes.forEach((t) => {
                                const tList = Array.isArray(t) ? t : [t];

                                if (tList.every((tt) => types.includes(tt))) {
                                    const text = view.state.doc.sliceString(node.from, node.to);
                                    const linkedFile = app.metadataCache.getFirstLinkpathDest(text, mappedFile?.path ?? '');
                                    if (linkedFile) {
                                        explicitlyLinkedFiles.add(linkedFile);
                                    }
                                }
                            });
                        }
                    }
                },
            });

            // Delete additions that links to already linked files
            if (this.settings.excludeLinksToRealLinkedFiles) {
                matches = VirtualMatch.filterAlreadyLinked(matches, explicitlyLinkedFiles);
            }

            // Delete additions that links to already linked files
            if (this.settings.onlyLinkOnce) {
                matches = VirtualMatch.filterAlreadyLinked(matches, alreadyLinkedFiles);
            }

            // Delete additions that overlap
            // Additions are sorted by from position and after that by length, we want to keep longer additions
            matches = VirtualMatch.filterOverlapping(matches, this.settings.onlyLinkOnce, excludedIntervalTree);

            // Store the files that are linked by a virtual link
            matches.forEach((addition) => addition.files.forEach((f) => alreadyLinkedFiles.add(f)));

            // Get the cursor position
            const cursorPos = view.state.selection.main.from;

            // Settings if we want to adapt links in the current line / fix IME problem
            const excludeLine = viewIsActive && this.settings.excludeLinksInCurrentLine;
            const fixIMEProblem = viewIsActive && this.settings.fixIMEProblem;
            let needImeFix = false;
            


            // Check if we're in a table environment - improved detection logic
            // Look for any table-related indicators in the DOM hierarchy
            let inTableCellEditor = false;
            let tableDetectionMethod = '';
            
            // Check various table indicators
            const tableIndicators = [
                '.cm-table-widget',
                '.table-cell-wrapper', 
                '.cm-table',
                '.cm-table-cell',
                '[class*="table"]', // Any class containing "table"
                '[class*="cell"]',   // Any class containing "cell"
                '.markdown-table',
                '.markdown-table-cell'
            ];
            
            // Check if any table indicator exists in the DOM path
            for (const indicator of tableIndicators) {
                if (view.dom.closest(indicator)) {
                    inTableCellEditor = true;
                    tableDetectionMethod = indicator;
                    break;
                }
            }
            
            // Special case: if we're in a contentEditable element within a table structure
            if (!inTableCellEditor) {
                let parent = view.dom.parentElement;
                while (parent && parent !== document.body) {
                    const parentClasses = Array.from(parent.classList);
                    if (parentClasses.some(cls => cls.includes('table') || cls.includes('cell'))) {
                        inTableCellEditor = true;
                        tableDetectionMethod = 'parent-class-check';
                        break;
                    }
                    parent = parent.parentElement;
                }
            }
            
            // Debug logging


            // Get the line start and end positions
            let lineStart: number, lineEnd: number;
            
            if (inTableCellEditor) {
                // In table cell: find the boundaries of the current line within the cell

                lineStart = this.findTableCellLineBoundary(view, cursorPos, true);
                lineEnd = this.findTableCellLineBoundary(view, cursorPos, false);
            } else {
                // Regular text: use standard line detection

                const line = view.state.doc.lineAt(cursorPos);
                lineStart = line.from;
                lineEnd = line.to;
            }
            


            matches.forEach((addition) => {
                const [from, to] = [addition.from, addition.to];
                const cursorNearby = cursorPos >= from - 0 && cursorPos <= to + 0;

                const additionIsInCurrentLine = from >= lineStart && to <= lineEnd;
                


                if (fixIMEProblem) {
                    needImeFix = true;
                    if (additionIsInCurrentLine && cursorPos > to) {
                        let gapString = view.state.sliceDoc(to, cursorPos);
                        let strBeforeAdd = view.state.sliceDoc(lineStart, from);

                        // Regex to check if a part of a word is at the line start, because IME problem only occurs at line start
                        // Regex matches parts that:
                        // - are completely empty or contain only whitespace.
                        // - start with a hyphen followed by one or more spaces.
                        // - start with 1 to 6 hash symbols followed by a space.
                        // - start with one or more greater-than signs followed by optional whitespace.
                        // - start with a hyphen followed by one or more spaces, then 1 to 6 hash symbols, and then one or more spaces.
                        // - start with a greater-than sign followed by a space, an exclamation mark within square brackets containing word characters or hyphens, an optional plus or minus sign, and one or more spaces.
                        const regAddInLineStart =
                            /(^\s*$)|(^\s*- +$)|(^\s*#{1,6} $)|(^\s*>+ *$)|(^\s*- +#{1,6} +$)|(^\s*> \[![\w-]+\][+-]? +$)/;

                        // check add is at line start
                        if (!regAddInLineStart.test(strBeforeAdd)) {
                            needImeFix = false;
                        }
                        // check the string between addition and cursorPos, check if it might be IME on.
                        else {
                            const regStrMayIMEon = /^[a-zA-Z]+[a-zA-Z' ]*[a-zA-Z]$|^[a-zA-Z]$/;
                            if (!regStrMayIMEon.test(gapString) || /[' ]{2}/.test(gapString)) {
                                needImeFix = false;
                            }
                        }
                    } else {
                        needImeFix = false;
                    }
                }



                if (!cursorNearby && !needImeFix && !(excludeLine && additionIsInCurrentLine)) {
                    builder.add(
                        from,
                        to,
                        Decoration.replace({
                            // widget: addition.widget,
                            widget: new VirtualLinkWidget(addition),
                        })
                    );
                }
            });
        }

        return builder.finish();
    }
}

const pluginSpec: PluginSpec<AutoLinkerPlugin> = {
    decorations: (value: AutoLinkerPlugin) => value.decorations,
};

export const liveLinkerPlugin = (app: App, settings: LinkerPluginSettings, updateManager: ExternalUpdateManager, plugin: any) => {
    return ViewPlugin.define((editorView: EditorView) => {
        return new AutoLinkerPlugin(editorView, app, settings, updateManager, plugin);
    }, pluginSpec);
};