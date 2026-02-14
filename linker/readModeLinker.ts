import { App, getLinkpath, MarkdownPostProcessorContext, MarkdownRenderChild, TFile } from 'obsidian';

import { LinkerPluginSettings } from '../main';
import { LinkerCache, MatchType, PrefixTree } from './linkerCache';
import { VirtualMatch } from './virtualLinkDom';

export class GlossaryLinker extends MarkdownRenderChild {
    ctx: MarkdownPostProcessorContext;
    app: App;
    settings: LinkerPluginSettings;
    linkerCache: LinkerCache;

    private clearExistingLinks() {
        // Restore virtual links to original text
        const virtualLinks = this.containerEl.querySelectorAll('.virtual-link');
        virtualLinks.forEach(link => {
            // Get original text: first try origin-text attribute, otherwise use link's text content
            const anchor = link.querySelector('.virtual-link-a');
            const originalText = anchor?.getAttribute('origin-text') || anchor?.textContent || '';
            if (originalText) {
                // Replace virtual link element with text node
                const textNode = document.createTextNode(originalText);
                link.replaceWith(textNode);
            } else {
                // If no text found, directly delete
                link.remove();
            }
        });
    }

    constructor(app: App, settings: LinkerPluginSettings, context: MarkdownPostProcessorContext, containerEl: HTMLElement, public plugin: any) {
        super(containerEl);
        this.settings = settings;
        this.app = app;
        this.ctx = context;

        this.linkerCache = LinkerCache.getInstance(app, settings);

        this.load();
    }

    getClosestLinkPath(glossaryName: string): TFile | null {
        const destName = this.ctx.sourcePath.replace(/(.*).md/, '$1');
        let currentDestName = destName;

        let currentPath = this.app.metadataCache.getFirstLinkpathDest(getLinkpath(glossaryName), currentDestName);

        if (currentPath == null) return null;

        while (currentDestName.includes('/')) {
            currentDestName = currentDestName.replace(/\/[^\/]*?$/, '');

            const newPath = this.app.metadataCache.getFirstLinkpathDest(getLinkpath(glossaryName), currentDestName);

            if ((newPath?.path?.length || 0) > currentPath?.path?.length) {
                currentPath = newPath;
                break;
            }
        }

        return currentPath;
    }

    onload() {
        if (!this.settings.linkerActivated) {
            this.clearExistingLinks();
            return;
        }

        const tags = ['p', 'li', 'td', 'th', 'span', 'em', 'strong', 'mark', 'del', 's'];

        // TODO: Onload is called on the divs separately, so these sets are not stored between divs.
        // Since divs can be rendered in arbitrary order, storing information about already linked files is not easy.
        const linkedFiles = new Set<TFile>();
        const explicitlyLinkedFiles = new Set<TFile>();

        for (const tag of tags) {
            // console.log("Tag: ", tag);
            const nodeList = this.containerEl.getElementsByTagName(tag);
            const children = this.containerEl.children;
            // if (nodeList.length === 0) continue;
            // if (nodeList.length != 0) console.log(tag, nodeList.length);
            for (let index = 0; index <= nodeList.length; index++) {
                const item = index == nodeList.length ? this.containerEl : nodeList.item(index)!;

                for (let childNodeIndex = 0; childNodeIndex < item.childNodes.length; childNodeIndex++) {
                    const childNode = item.childNodes[childNodeIndex];

                    if (childNode.nodeType === Node.TEXT_NODE) {
                        let text = childNode.textContent || '';
                        if (text.length === 0) continue;

                        this.linkerCache.reset();
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
                                const currentNodes = this.linkerCache.cache.getCurrentMatchNodes(i);
                                if (currentNodes.length > 0) {
                                    currentNodes.forEach((node) => {
                                        // Check if we want to include this note based on the settings
                                        if (!this.settings.matchAnyPartsOfWords) {
                                            if (
                                                this.settings.matchBeginningOfWords &&
                                                !node.startsAtWordBoundary &&
                                                this.settings.matchEndOfWords &&
                                                !isWordBoundary
                                            ) {
                                                return;
                                            }
                                        }

                                        const nFrom = node.start;
                                        const nTo = node.end;
                                        const name = text.slice(nFrom, nTo);

                                        // TODO: Handle multiple files

                                        // Ensure headerId is correctly passed when matching headings
                                        const headerId = node.type === MatchType.Header 
                                            ? node.headerId
                                            : undefined;
                                            const match = new VirtualMatch(
                                                id++,
                                                name,
                                                nFrom,
                                                nTo,
                                                Array.from(node.files),
                                                node.type,
                                                !isWordBoundary,
                                                this.settings,
                                                this.plugin, // Add plugin parameter
                                                headerId
                                            );

                                            // Add multi-file heading ID handling logic
                                            // When multiple files match the same keyword, get corresponding heading ID for each file
                                            if (node.files.size > 1) {
                                                node.files.forEach(file => {
                                                    const fileNodes = this.linkerCache.cache.getCurrentMatchNodes(
                                                        i,
                                                        null, // Do not exclude any files
                                                        file  // Only get nodes for specific file
                                                    );
                                                    if (fileNodes.length > 0 && fileNodes[0].headerId) {
                                                        match.setFileHeaderId(file, fileNodes[0].headerId);
                                                    }
                                                });
                                            }
                                        
                                            // Check parent elements for format context
                                            const parentEl = childNode.parentElement;
                                            if (parentEl) {
                                                match.isBoldContext = parentEl.matches('strong') || 
                                                    parentEl.closest('strong') !== null;
                                                match.isItalicContext = parentEl.matches('em') || 
                                                    parentEl.closest('em') !== null;
                                                match.isHighlightContext = parentEl.matches('mark') || 
                                                    parentEl.closest('mark') !== null;
                                                match.isStrikethroughContext = parentEl.matches('del') || 
                                                    parentEl.matches('s') || 
                                                    parentEl.closest('del') !== null || 
                                                    parentEl.closest('s') !== null;
                                                match.isTripleStarContext = match.isBoldContext && 
                                                    match.isItalicContext;
                                            }
                                        
                                            matches.push(match);
                                        });
                                    }
                                }

                                // Push the char to get the next nodes in the prefix tree
                                this.linkerCache.cache.pushChar(char);
                                i += char.length;
                            }

                            // Sort additions by from position
                            matches = VirtualMatch.sort(matches);

                            // Delete additions that links to already linked files
                            if (this.settings.excludeLinksToRealLinkedFiles) {
                                matches = VirtualMatch.filterAlreadyLinked(matches, explicitlyLinkedFiles);
                            }

                            // Delete additions that links to already linked files
                            if (this.settings.onlyLinkOnce) {
                                matches = VirtualMatch.filterAlreadyLinked(matches, linkedFiles);
                            }
                            // Delete additions that overlap
                            // Additions are sorted by from position and after that by length, we want to keep longer additions
                            matches = VirtualMatch.filterOverlapping(matches, this.settings.onlyLinkOnce);

                            const parent = childNode.parentElement;
                            let lastTo = 0;
                            // console.log("Parent: ", parent);


                            matches.forEach((match) => {
                                match.files.forEach((f) => linkedFiles.add(f));

                                const span = match.getCompleteLinkElement();

                                if (match.from > 0) {
                                    parent?.insertBefore(document.createTextNode(text.slice(lastTo, match.from)), childNode);
                                }

                                parent?.insertBefore(span, childNode);

                                // Check if span is under <mark>, if so add highlight class
                                let markParent = span.parentElement;
                                while (markParent) {
                                    if (markParent.tagName === 'MARK') {
                                        span.classList.add('virtual-link-in-highlight');
                                        span.style.setProperty('display', 'inline', 'important');
                                        span.style.setProperty('z-index', '1', 'important');
                                        break;
                                    }
                                    markParent = markParent.parentElement;
                                }

                                lastTo = match.to;
                            });

                            const textLength = text.length;
                            if (lastTo < textLength) {
                                parent?.insertBefore(document.createTextNode(text.slice(lastTo)), childNode);
                            }
                            parent?.removeChild(childNode);
                            childNodeIndex += 1;
                        }
                    }
                }
            }
        }
}