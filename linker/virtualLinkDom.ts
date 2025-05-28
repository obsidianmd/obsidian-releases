import IntervalTree from '@flatten-js/interval-tree';
import { LinkerPluginSettings } from 'main';
import { TFile, getLinkpath } from 'obsidian';
import { MatchType } from './linkerCache';

export class VirtualMatch {
    constructor(
        public id: number,
        public originText: string,
        public from: number,
        public to: number,
        public files: TFile[],
        public type: MatchType,
        public isSubWord: boolean,
        public settings: LinkerPluginSettings,
        public headerId?: string,
        public isBoldContext: boolean = false,
        public isItalicContext: boolean = false,
        public isHighlightContext: boolean = false,
        public isTripleStarContext: boolean = false
    ) {}

    get isAlias(): boolean {
        return this.type === MatchType.Alias;
    }

    /////////////////////////////////////////////////
    // DOM methods
    /////////////////////////////////////////////////

    getCompleteLinkElement() {
        const span = this.getLinkRootSpan();
        const firstPath = this.files.length > 0 ? getLinkpath(this.files[0].path) : "";
        span.appendChild(this.getLinkAnchorElement(this.originText, firstPath));
        if (this.files.length > 1) {
            if (!this.isSubWord) {
                span.appendChild(this.getMultipleReferencesIndicatorSpan());
            }
            span.appendChild(this.getMultipleReferencesSpan());
        }

        if (!this.isSubWord || !this.settings.suppressSuffixForSubWords) {
            const icon = this.getIconSpan();
            if (icon) span.appendChild(icon);
        }
        return span;
    }

    getLinkAnchorElement(linkText: string, href: string) {
        const link = document.createElement('a');
        
        // Handle all possible headerId cases
        if (this.headerId) {
            link.href = `${href}#${this.headerId}`;
            link.setAttribute('data-heading-id', this.headerId);
        } else {
            link.href = href;
        }
        link.textContent = linkText;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('from', this.from.toString());
        link.setAttribute('to', this.to.toString());
        link.setAttribute('origin-text', this.originText);
        link.classList.add('internal-link', 'virtual-link-a');
        return link;
    }

    getLinkRootSpan() {
        const span = document.createElement('span');
        span.classList.add('glossary-entry', 'virtual-link', 'virtual-link-span');
        
        if (this.settings.applyDefaultLinkStyling) {
            span.classList.add('virtual-link-default');
        }

        // Add context-specific classes
        if (this.isBoldContext) {
            span.classList.add('virtual-link-in-bold');
        }
        if (this.isItalicContext) {
            span.classList.add('virtual-link-in-italic');
        }
        if (this.isHighlightContext) {
            span.classList.add('virtual-link-in-highlight');
        }
        if (this.isTripleStarContext) {
            span.classList.add('virtual-link-in-triple-star');
        }
        
        return span;
    }

    getMultipleReferencesSpan(files?: TFile[]) {
        const spanReferences = document.createElement('span');
        if (!this.settings.alwaysShowMultipleReferences) {
            spanReferences.classList.add('multiple-files-references');
        }

        files = files ?? this.files;

        files.forEach((file, index) => {
            if (index === 0) {
                const bracket = document.createElement('span');
                bracket.textContent = '[';  // 移除前置空格，统一使用紧凑格式
                spanReferences.appendChild(bracket);
            }

            let linkText = ` ${index + 1} `;
            if (index < files!.length - 1) {
                linkText += '|';
            }

            let linkHref = file.path;
            const link = this.getLinkAnchorElement(linkText, linkHref);
            spanReferences.appendChild(link);

            if (index == files!.length - 1) {
                const bracket = document.createElement('span');
                bracket.textContent = ']';
                spanReferences.appendChild(bracket);
            }
        });

        return spanReferences;
    }

    getMultipleReferencesIndicatorSpan() {
        const spanIndicator = document.createElement('span');
        spanIndicator.textContent = ' [...]';
        spanIndicator.classList.add('multiple-files-indicator');
        return spanIndicator;
    }

    getIconSpan() {
        const suffix = this.isAlias ? this.settings.virtualLinkAliasSuffix : this.settings.virtualLinkSuffix;
        if ((suffix?.length ?? 0) > 0) {
            let icon = document.createElement('sup');
            icon.textContent = suffix;
            icon.classList.add('linker-suffix-icon');
            return icon;
        }
        return null;
    }

    /////////////////////////////////////////////////
    // Filter and sort methods
    /////////////////////////////////////////////////

    static compare(a: VirtualMatch, b: VirtualMatch): number {
        if (a.from === b.from) {
            if (b.to == a.to) {
                return b.files.length - a.files.length;
            }
            return b.to - a.to;
        }
        return a.from - b.from;
    }

    static sort(matches: VirtualMatch[]): VirtualMatch[] {
        return Array.from(matches).sort(VirtualMatch.compare);
    }

    static filterAlreadyLinked(matches: VirtualMatch[], linkedFiles: Set<TFile>, mode: 'some' | 'every' = 'every'): VirtualMatch[] {
        return matches.filter((match) => {
            if (mode === 'every') {
                return !match.files.every((file) => linkedFiles.has(file));
            } else {
                return !match.files.some((file) => linkedFiles.has(file));
            }
        });
    }

    static filterOverlapping(matches: VirtualMatch[], onlyLinkOnce: boolean = true, excludedIntervalTree?: IntervalTree): VirtualMatch[] {
        const matchesToDelete: Map<number, boolean> = new Map();

        // Delete additions that overlap
        // Additions are sorted by from position and after that by length, we want to keep longer additions
        for (let i = 0; i < matches.length; i++) {
            const addition = matches[i];
            if (matchesToDelete.has(addition.id)) {
                continue;
            }

            // Check if the addition is inside an excluded block
            if (excludedIntervalTree) {
                const overlaps = excludedIntervalTree.search([addition.from, addition.to]);
                if (overlaps.length > 0) {
                    matchesToDelete.set(addition.id, true);
                    continue;
                }
            }

            // Set all overlapping additions to be deleted
            for (let j = i + 1; j < matches.length; j++) {
                const otherAddition = matches[j];
                if (otherAddition.from >= addition.to) {
                    break;
                }
                matchesToDelete.set(otherAddition.id, true);
            }

            // Set all additions that link to the same file to be deleted
            if (onlyLinkOnce) {
                for (let j = i + 1; j < matches.length; j++) {
                    const otherAddition = matches[j];
                    if (matchesToDelete.has(otherAddition.id)) {
                        continue;
                    }

                    if (otherAddition.files.every((f) => addition.files.contains(f))) {
                        matchesToDelete.set(otherAddition.id, true);
                    }
                }
            }
        }
        return matches.filter((match) => !matchesToDelete.has(match.id));
    }
}