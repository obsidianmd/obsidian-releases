import IntervalTree from '@flatten-js/interval-tree';
import { LinkerPluginSettings } from 'main';
import { TFile, getLinkpath } from 'obsidian';
import { MatchType } from './linkerCache';

export class VirtualMatch {
    // 添加一个新的属性，用于存储文件到标题ID的映射
    private fileHeaderIds: Map<string, string> = new Map();
    
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
    ) {
        // 初始化第一个文件的标题ID（如果有）
        if (files.length > 0 && headerId) {
            this.fileHeaderIds.set(files[0].path, headerId);
        }
    }
    
    // 添加方法，用于设置文件的标题ID
    setFileHeaderId(file: TFile, headerId: string) {
        this.fileHeaderIds.set(file.path, headerId);
    }
    
    // 添加方法，用于获取文件的标题ID
    getFileHeaderId(file: TFile): string | undefined {
        return this.fileHeaderIds.get(file.path);
    }

    get isAlias(): boolean {
        return this.type === MatchType.Alias;
    }

    /////////////////////////////////////////////////
    // DOM methods
    /////////////////////////////////////////////////

    getCompleteLinkElement(inTableCellEditor = false) {
        const span = this.getLinkRootSpan(inTableCellEditor);
        const firstFile = this.files.length > 0 ? this.files[0] : undefined;
        const firstPath = firstFile ? getLinkpath(firstFile.path) : "";
        span.appendChild(this.getLinkAnchorElement(this.originText, firstPath, firstFile));
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

    getLinkAnchorElement(linkText: string, href: string, file?: TFile) {
        const link = document.createElement('a');
        
        // 使用文件特定的标题ID（如果提供了file参数）
        let headerIdToUse = undefined;
        if (file) {
            headerIdToUse = this.getFileHeaderId(file);
        } else if (this.files.length > 0) {
            // 如果没有提供file参数，但有files，使用第一个文件的标题ID
            headerIdToUse = this.getFileHeaderId(this.files[0]) || this.headerId;
        } else {
            // 兼容旧代码
            headerIdToUse = this.headerId;
        }
        
        if (headerIdToUse) {
            link.href = `${href}#${headerIdToUse}`;
            link.setAttribute('data-heading-id', headerIdToUse);
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

    getLinkRootSpan(inTableCellEditor = false) {
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

        // 根据表格单元格上下文设置右键菜单
        if (inTableCellEditor === true) {
            span.classList.add('no-context-menu');
            
            // 确保在表格单元格中禁用默认右键菜单
            span.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                e.stopPropagation();
                return false;
            }, true);
            
            // 添加额外的鼠标右键事件监听器，确保捕获所有可能的右键事件
            span.addEventListener('mouseup', (e) => {
                if (e.button === 2) { // 右键
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }, true);
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
            // 传递file参数，以便使用文件特定的标题ID
            const link = this.getLinkAnchorElement(linkText, linkHref, file);
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