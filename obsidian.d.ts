import * as CodeMirror from 'codemirror';

declare global {
    interface ObjectConstructor {
        isEmpty(object: Record<string, any>): boolean;
        each<T>(object: {
            [key: string]: T;
        }, callback: (value: T, key?: string) => boolean | void, context?: any): boolean;
        assign(target: any, ...sources: any): any;
        entries(obj: any): any[];
    }
}
declare global {
    interface Array<T> {
        first(): T;
        last(): T;
        contains(target: T): boolean;
        remove(target: T): void;
    }
}
declare global {
    interface Math {
        clamp(value: number, min: number, max: number): number;
        square(value: number): number;
    }
}
declare global {
    interface StringConstructor {
        isString(obj: any): obj is string;
    }
    interface String {
        contains(target: string): boolean;
        startsWith(searchString: string, position?: number): boolean;
        endsWith(target: string, length?: number): boolean;
        format(...args: string[]): string;
    }
}
declare global {
    interface NumberConstructor {
        isNumber(obj: any): obj is number;
    }
}
declare global {
    interface Window {
        isBoolean(obj: any): obj is boolean;
    }
    function isBoolean(obj: any): obj is boolean;
}
declare global {
    interface Element {
        getText(): string;
        setText(val: string): void;
    }
}
declare global {
    interface Element {
        addClass(...classes: string[]): void;
        addClasses(classes: string[]): void;
        removeClass(...classes: string[]): void;
        removeClasses(classes: string[]): void;
        toggleClass(classes: string | string[], value: boolean): void;
        hasClass(cls: string): boolean;
    }
}
declare global {
    interface Node {
        detach(): void;
        empty(): void;
        insertAfter(other: Node): void;
        indexOf(other: Node): number;
        setChildrenInPlace(children: Node[]): void;
        appendText(val: string): void;
    }
}
declare global {
    interface Element extends Node {
        setAttr(qualifiedName: string, value: string | number | boolean): void;
        setAttrs(obj: {
            [key: string]: string | number | boolean;
        }): void;
        getAttr(qualifiedName: string): string;
        matchParent(selector: string, lastParent?: Element): Element | null;
    }
}
declare global {
    interface HTMLElement extends Element {
        show(): void;
        hide(): void;
        toggle(show: boolean): void;
    }
}
declare global {
    function fish(selector: string): HTMLElement;
    function fishAll(selector: string): HTMLElement[];
    interface Window extends EventTarget, AnimationFrameProvider, GlobalEventHandlers, WindowEventHandlers, WindowLocalStorage, WindowOrWorkerGlobalScope, WindowSessionStorage {
        fish(selector: string): HTMLElement;
        fishAll(selector: string): HTMLElement[];
        ElementList: any;
    }
    interface Element extends Node {
        find(selector: string): Element;
        findAll(selector: string): HTMLElement[];
        findAllSelf(selector: string): HTMLElement[];
    }
    interface HTMLElement extends Element {
        find(selector: string): HTMLElement;
        findAll(selector: string): HTMLElement[];
        findAllSelf(selector: string): HTMLElement[];
    }
}
declare global {
    interface DomElementInfo {
        /**
         * The class to be assigned. Can be a space-separated string or an array of strings.
         */
        cls?: string | string[];
        /**
         * The textContent to be assigned.
         */
        text?: string;
        /**
         * HTML attributes to be added.
         */
        attr?: {
            [key: string]: string | number | boolean;
        };
        /**
         * HTML title (for hover tooltip).
         */
        title?: string;
        /**
         * The parent element to be assigned to.
         */
        parent?: Node;
        value?: string;
        type?: string;
        prepend?: boolean;
        href?: string;
    }
    interface Node {
        /**
         * Create an element and append it to this node.
         */
        createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: DomElementInfo, callback?: (el: HTMLElementTagNameMap[K]) => void): HTMLElementTagNameMap[K];
    }
    function createEl<K extends keyof HTMLElementTagNameMap>(tag: K, o?: DomElementInfo, callback?: (el: HTMLElementTagNameMap[K]) => void): HTMLElementTagNameMap[K];
}
interface EventListenerInfo {
    selector: string;
    listener: Function;
    options?: boolean | AddEventListenerOptions;
    callback: Function;
}
declare global {
    interface HTMLElement extends Element {
        _EVENTS?: {
            [K in keyof HTMLElementEventMap]?: EventListenerInfo[];
        };
        on<K extends keyof HTMLElementEventMap>(this: HTMLElement, type: K, selector: string, listener: (this: HTMLElement, ev: HTMLElementEventMap[K], delegateTarget: HTMLElement) => any, options?: boolean | AddEventListenerOptions): void;
        off<K extends keyof HTMLElementEventMap>(this: HTMLElement, type: K, selector: string, listener: (this: HTMLElement, ev: HTMLElementEventMap[K], delegateTarget: HTMLElement) => any, options?: boolean | AddEventListenerOptions): void;
        onClickEvent(this: HTMLElement, listener: (this: HTMLElement, ev: MouseEvent) => any, options?: boolean | AddEventListenerOptions): void;
        trigger(eventType: string): void;
    }
    interface Document {
        _EVENTS?: {
            [K in keyof HTMLElementEventMap]?: EventListenerInfo[];
        };
        on<K extends keyof HTMLElementEventMap>(this: Document, type: K, selector: string, listener: (this: Document, ev: HTMLElementEventMap[K], delegateTarget: HTMLElement) => any, options?: boolean | AddEventListenerOptions): void;
        off<K extends keyof HTMLElementEventMap>(this: Document, type: K, selector: string, listener: (this: Document, ev: HTMLElementEventMap[K], delegateTarget: HTMLElement) => any, options?: boolean | AddEventListenerOptions): void;
    }
}
export interface AjaxOptions {
    method?: 'GET' | 'POST';
    url: string;
    success?: (response: any, req: XMLHttpRequest) => any;
    error?: (error: any, req: XMLHttpRequest) => any;
    data?: object | string | ArrayBuffer;
    headers?: Record<string, string>;
    withCredentials?: boolean;
}
declare global {
    function ajax(options: AjaxOptions): void;
    function ajaxPromise(options: AjaxOptions): Promise<any>;
    function ready(fn: () => any): void;
}
//# sourceMappingURL=enhance.d.ts.map
/**
 * @public
 */
export class AbstractTextComponent<T extends HTMLInputElement | HTMLTextAreaElement> extends ValueComponent<string> {
    /**
     * @public
     */
    inputEl: T;
    
    /**
     * @public
     */
    constructor(setting: Setting, inputEl: T);
    /**
     * @public
     */
    getValue(): string;
    /**
     * @public
     */
    setValue(value: string): this;
    /**
     * @public
     */
    setPlaceholder(placeholder: string): this;
    /**
     * @public
     */
    onChanged(): void;
    /**
     * @public
     */
    onChange(callback: (value: string) => any): this;
}

/**
 * @public
 */
export class App extends Events {

    /**
     * @public
     */
    workspace: Workspace;

    /**
     * @public
     */
    vault: Vault;
    /**
     * @public
     */
    metadataCache: MetadataCache;

    /**
     * @public
     */
    on(name: 'codemirror', callback: (cm: CodeMirror.Editor) => any, ctx?: any): EventRef;
}

/**
 * @public
 */
export abstract class BaseComponent {
    /**
     * @public
     */
    setting: Setting;
    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * Facilitates chaining
     * @public
     */
    then(cb: (component: this) => any): this;
}

/**
 * @public
 */
export interface BlockCache {

}

/**
 * @public
 */
export class ButtonComponent extends BaseComponent {
    /**
     * @public
     */
    buttonEl: HTMLButtonElement;
    
    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * @public
     */
    setCta(): this;
    /**
     * @public
     */
    setButtonText(name: string): this;
    /**
     * @public
     */
    setIcon(icon: string): this;
    /**
     * @public
     */
    setClass(cls: string): this;
    /**
     * @public
     */
    onClick(callback: () => any): this;
}

/**
 * @public
 */
export interface CachedMetadata {

}

/**
 * @public
 */
export interface Command {
    /**
     * Globally unique ID to identify this command.
     * @public
     */
    id: string;
    /**
     * Human friendly name for searching.
     * @public
     */
    name: string;
    /**
     * Simple callback, triggered globally.
     * @public
     */
    callback?: () => any;
    /**
     * Complex callback, overrides the simple callback.
     * If checking is true, then this should not perform any action.
     * If checking is false, then it should check and perform the action.
     * Must return whether this command can be executed at the moment.
     * @public
     */
    checkCallback?: (checking: boolean) => boolean;
    /**
     * Sets the default hotkey
     * @public
     */
    hotkeys?: Hotkey[];
}

/**
 * @public
 */
export class Component {

    /**
     * @public
     */
    load(): void;
    /**
     * @public
     * @virtual
     */
    onload(): void;
    /**
     * @public
     */
    unload(): void;
    /**
     * @public
     * @virtual
     */
    onunload(): void;

}

/**
 * @public
 */
export abstract class CustomPlugin extends Component {
    /**
     * @public
     */
    app: App;
    /**
     * @public
     */
    manifest: PluginManifest;
    /**
     * @public
     */
    constructor(app: App, manifest: PluginManifest);
    /**
     * @public
     * @virtual
     */
    onInit(): void;
    /**
     * @public
     */
    addRibbonIcon(icon: string, title: string, callback: (evt: MouseEvent) => any): HTMLElement;
    /**
     * @public
     */
    addStatusBarItem(): HTMLElement;
    /**
     * Register a command globally. The command id and name will be automatically prefixed with this plugin's id and name.
     * @public
     */
    addCommand(command: Command): Command;
    /**
     * @public
     */
    addSettingTab(settingTab: PluginSettingTab): void;
    /**
     * @public
     */
    registerView(type: string, viewCreator: ViewCreator): void;
    /**
     * @public
     */
    registerExtensions(extensions: string[], viewType: string): void;
    /**
     * @public
     */
    loadData(): Promise<any>;
    /**
     * @public
     */
    saveData(data: any): Promise<void>;
    
}

/**
 * @public
 */
export class DropdownComponent extends ValueComponent<string> {
    /**
     * @public
     */
    selectEl: HTMLSelectElement;
    
    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * @public
     */
    addOption(value: string, display: string): this;
    /**
     * @public
     */
    addOptions(options: Record<string, string>): this;
    /**
     * @public
     */
    getValue(): string;
    /**
     * @public
     */
    setValue(value: string): this;
    /**
     * @public
     */
    onChange(callback: (value: string) => any): this;
}

/**
 * @public
 */
export interface EmbedCache extends ReferenceCache {
}

/**
 * @public
 */
export interface EventRef {

}

/**
 * @public
 */
export class Events {

    /**
     * @public
     */
    on(name: string, callback: (...data: any) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    off(name: string, callback: (...data: any) => any): void;
    /**
     * @public
     */
    offref(ref: EventRef): void;
    /**
     * @public
     */
    trigger(name: string, ...data: any[]): void;
    /**
     * @public
     */
    tryTrigger(evt: EventRef, args: any[]): void;
}

/**
 * @public
 */
export class ExtraButtonComponent extends BaseComponent {
    /**
     * @public
     */
    extraSettingsEl: HTMLElement;
    
    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * @public
     */
    onClick(callback: () => any): this;
}

/**
 * @public
 */
export interface FileStats {

}

/**
 * @public
 */
export interface HeadingCache {

}

/**
 * @public
 */
export interface Hotkey {

}

/**
 * @public
 */
export interface LinkCache extends ReferenceCache {
}

/**
 * @public
 */
export interface Loc {

}

/**
 * @public
 */
export interface MarkdownPostProcessor {
    
}

/**
 * @public
 */
export interface MarkdownPostProcessorContext {

}

/**
 * @public
 */
export class MarkdownPreviewRenderer {

    /**
     * @public
     */
    static registerPostProcessor(postProcessor: MarkdownPostProcessor): void;
    /**
     * @public
     */
    static unregisterPostProcessor(postProcessor: MarkdownPostProcessor): void;

}

/**
 * @public
 */
export class MenuGroupDom {

    /**
     * @public
     */
    constructor();
    /**
     * @public
     */
    addItem(name: string, callback?: (evt: MouseEvent) => any, icon?: string): MenuItemDom;
}

/**
 * @public
 */
export class MenuItemDom {

    /**
     * @public
     */
    constructor(name: string, callback?: (evt: MouseEvent) => any, icon?: string);
    /**
     * @public
     */
    setDisabled(disabled: boolean): void;
    /**
     * @public
     */
    setActive(active: boolean): void;
}

/**
 * @public
 */
export class MetadataCache extends Events {

    /**
     * @public
     */
    getFileCache(file: TFile): CachedMetadata;
    /**
     * @public
     */
    getCache(path: string): CachedMetadata;

}

/**
 * @public
 */
export class Modal {
    /**
     * @public
     */
    app: App;
    
    /**
     * @public
     */
    containerEl: HTMLElement;

    /**
     * @public
     */
    contentEl: HTMLElement;
    /**
     * @public
     */
    constructor(app: App);
    /**
     * @public
     */
    open(): void;
    /**
     * @public
     */
    close(): void;
    /**
     * @public
     */
    onOpen(): void;
    /**
     * @public
     */
    onClose(): void;
}

/**
 * @public
 */
export class MomentFormatComponent extends TextComponent {
    /**
     * @public
     */
    sampleEl: HTMLElement;
    
    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * Sets the default format when input is cleared. Also used for placeholder.
     * @public
     */
    setDefaultFormat(defaultFormat: string): this;
    /**
     * @public
     */
    setSampleEl(sampleEl: HTMLElement): this;
    /**
     * @public
     */
    setValue(value: string): this;
    /**
     * @public
     */
    onChanged(): void;
    /**
     * @public
     */
    updateSample(): void;
}

/**
 * @public
 */
export class Notice {
    
    /**
     * @public
     */
    constructor(message: string);
}

/**
 * @public
 */
export interface OpenViewState {

}

/**
 * @public
 */
export interface PluginManifest {

}

/**
 * @public
 */
export abstract class PluginSettingTab extends SettingTab {
    
    /**
     * @public
     */
    constructor(app: App, plugin: CustomPlugin);
    /**
     * @public
     */
    load(): void;
}

/**
 * @public
 */
export interface Pos {

}

/**
 * @public
 */
export interface ReferenceCache {

}

/**
 * @public
 */
export class Scope {

}

/**
 * @public
 */
export class Setting {
    /**
     * @public
     */
    settingEl: HTMLElement;
    /**
     * @public
     */
    infoEl: HTMLElement;
    /**
     * @public
     */
    nameEl: HTMLElement;
    /**
     * @public
     */
    descEl: HTMLElement;
    /**
     * @public
     */
    controlEl: HTMLElement;
    /**
     * @public
     */
    constructor(containerEl: HTMLElement);
    /**
     * @public
     */
    setName(name: string): this;
    /**
     * @public
     */
    setDesc(desc: string | DocumentFragment): this;
    /**
     * @public
     */
    setClass(cls: string): this;
    /**
     * @public
     */
    setTooltip(tooltip: string): this;
    /**
     * @public
     */
    addButton(cb: (component: ButtonComponent) => any): this;
    /**
     * @public
     */
    addExtraSetting(cb: (component: ExtraButtonComponent) => any): this;
    /**
     * @public
     */
    addToggle(cb: (component: ToggleComponent) => any): this;
    /**
     * @public
     */
    addText(cb: (component: TextComponent) => any): this;
    /**
     * @public
     */
    addTextArea(cb: (component: TextAreaComponent) => any): this;
    /**
     * @public
     */
    addMomentFormat(cb: (component: MomentFormatComponent) => any): this;
    /**
     * @public
     */
    addDropdown(cb: (component: DropdownComponent) => any): this;
    /**
     * @public
     */
    addSlider(cb: (component: SliderComponent) => any): this;
}

/**
 * @public
 */
export abstract class SettingTab {

    /**
     * @public
     */
    app: App;
    
    /**
     * @public
     */
    containerEl: HTMLElement;

    /**
     * @public
     */
    load(): void;
    /**
     * @public
     */
    unload(): void;
    /**
     * @public
     */
    open(): void;
    /**
     * @public
     */
    close(): void;
    /**
     * @public
     */
    abstract display(): void;
}

/**
 * @public
 */
export class SliderComponent extends ValueComponent<number> {
    /**
     * @public
     */
    sliderEl: HTMLInputElement;

    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * @public
     */
    setLimits(min: number, max: number, step: number | 'any'): this;
    /**
     * @public
     */
    getValue(): number;
    /**
     * @public
     */
    setValue(value: number): this;
    /**
     * @public
     */
    getValuePretty(): string;
    /**
     * @public
     */
    setDynamicTooltip(): this;
    /**
     * @public
     */
    showTooltip(): void;
    /**
     * @public
     */
    onChange(callback: (value: number) => any): this;
}

/**
 * @public
 */
export type SplitDirection = 'vertical' | 'horizontal';

/**
 * @public
 */
export abstract class TAbstractFile {
    /**
     * @public
     */
    vault: Vault;
    /**
     * @public
     */
    path: string;
    /**
     * @public
     */
    name: string;
    /**
     * @public
     */
    parent: TFolder;

}

/**
 * @public
 */
export interface TagCache {

}

/**
 * @public
 */
export class TextAreaComponent extends AbstractTextComponent<HTMLTextAreaElement> {
    /**
     * @public
     */
    constructor(setting: Setting);
}

/**
 * @public
 */
export class TextComponent extends AbstractTextComponent<HTMLInputElement> {
    /**
     * @public
     */
    constructor(setting: Setting);
}

/**
 * @public
 */
export class TFile extends TAbstractFile {
    /**
     * @public
     */
    stat: FileStats;
    /**
     * @public
     */
    basename: string;
    /**
     * @public
     */
    extension: string;

}

/**
 * @public
 */
export class TFolder extends TAbstractFile {
    /**
     * @public
     */
    children: TAbstractFile[];
    
    /**
     * @public
     */
    isRoot(): boolean;
    
}

/**
 * @public
 */
export class ToggleComponent extends ValueComponent<boolean> {
    /**
     * @public
     */
    toggleEl: HTMLElement;

    /**
     * @public
     */
    constructor(setting: Setting);
    /**
     * @public
     */
    getValue(): boolean;
    /**
     * @public
     */
    setValue(on: boolean): this;
    /**
     * @public
     */
    onClick(): void;
    /**
     * @public
     */
    onChange(callback: (value: boolean) => any): this;
}

/**
 * @public
 */
export abstract class ValueComponent<T> extends BaseComponent {
    /**
     * @public
     */
    registerOptionListener(listeners: Record<string, (value?: T) => T>, key: string): this;
    /**
     * @public
     */
    abstract getValue(): T;
    /**
     * @public
     */
    abstract setValue(value: T): this;
}

/**
 * @public
 */
export class Vault extends Events {

    /**
     * @public
     */
    getAbstractFileByPath(path: string): TAbstractFile;
    
    /**
     * @public
     */
    getRoot(): TFolder;

    /**
     * @public
     */
    create(normalizedPath: string, data: string): Promise<TFile>;
    /**
     * @public
     */
    createBinary(normalizedPath: string, data: ArrayBuffer): Promise<TFile>;
    /**
     * @public
     */
    createFolder(normalizedPath: string): Promise<void>;
    /**
     * @public
     */
    read(file: TFile): Promise<string>;
    /**
     * @public
     */
    cachedRead(file: TFile): Promise<string>;
    /**
     * @public
     */
    readBinary(file: TFile): Promise<ArrayBuffer>;
    
    /**
     * @public
     */
    getResourcePath(file: TFile): string;
    /**
     * @param file
     * @param force Should attempt to delete folder even if it has hidden children
     * @public
     */
    delete(file: TAbstractFile, force?: boolean): Promise<void>;
    /**
     * Tries to move to system trash. If that isn't successful/allowed, use local trash
     * @param file
     * @param system
     * @public
     */
    trash(file: TAbstractFile, system: boolean): Promise<void>;
    /**
     * @public
     */
    rename(file: TAbstractFile, normalizedNewPath: string): Promise<void>;
    /**
     * @public
     */
    modify(file: TFile, data: string): Promise<void>;
    /**
     * @public
     */
    modifyBinary(file: TFile, data: ArrayBuffer): Promise<void>;
    
    /**
     * @public
     */
    copy(file: TFile, normalizedNewPath: string): Promise<TFile>;

    /**
     * @public
     */
    getAllLoadedFiles(): TAbstractFile[];

    /**
     * @public
     */
    static recurseChildren(root: TFolder, cb: (file: TAbstractFile) => any): void;
    /**
     * @public
     */
    getMarkdownFiles(): TFile[];
    /**
     * @public
     */
    getFiles(): TFile[];

    /**
     * @public
     */
    on(name: 'create', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'modify', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'delete', callback: (file: TAbstractFile) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'rename', callback: (file: TAbstractFile, oldPath: string) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'closed', callback: () => any, ctx?: any): EventRef;
}

/**
 * @public
 */
export abstract class View extends Component {
    /**
     * @public
     */
    app: App;
    /**
     * @public
     */
    icon: string;
    /**
     * @public
     */
    navigation: boolean;
    /**
     * @public
     */
    leaf: WorkspaceLeaf;
    /**
     * @public
     */
    containerEl: HTMLElement;
    /**
     * @public
     */
    constructor(leaf: WorkspaceLeaf);
    /**
     * @public
     */
    open(containerEl: HTMLElement): Promise<void>;
    /**
     * @public
     */
    close(): Promise<void>;
    /**
     * @public
     */
    protected onOpen(): Promise<void>;
    /**
     * @public
     */
    protected onClose(): Promise<void>;
    /**
     * @public
     */
    abstract getViewType(): string;
    /**
     * @public
     */
    getState(): any;
    /**
     * @public
     */
    setState(state: any, result: ViewStateResult): Promise<void>;
    /**
     * @public
     */
    getEphemeralState(): any;
    /**
     * @public
     */
    setEphemeralState(state: any): void;
    /**
     * @public
     */
    getIcon(): string;
    /**
     * @public
     */
    onResize(): void;
    /**
     * @public
     */
    abstract getDisplayText(): string;
    /**
     * @public
     */
    onHeaderMenu(menuGroup: MenuGroupDom): void;
}

/**
 * @public
 */
export type ViewCreator = (leaf: WorkspaceLeaf) => View;

/**
 * @public
 */
export interface ViewStateResult {

}

/**
 * @public
 */
export class Workspace extends Events {

    /**
     * @public
     */
    activeLeaf: WorkspaceLeaf;

    /**
     * @public
     */
    requestSaveLayout: () => void;
    /**
     * @public
     */
    requestSaveHistory: () => void;

    /**
     * @public
     */
    changeLayout(workspace: any): Promise<void>;
    
    /**
     * @public
     */
    getLayout(): any;

    /**
     * @public
     */
    splitLeaf(source: WorkspaceItem, newLeaf: WorkspaceItem, direction?: SplitDirection, before?: boolean): void;
    /**
     * @public
     */
    createLeafBySplit(leaf: WorkspaceLeaf, direction?: SplitDirection, before?: boolean): WorkspaceLeaf;
    /**
     * @public
     */
    splitActiveLeaf(direction?: SplitDirection): WorkspaceLeaf;
    /**
     * @public
     */
    splitLeafOrActive(leaf?: WorkspaceLeaf, direction?: SplitDirection): WorkspaceLeaf;
    /**
     * @public
     */
    duplicateLeaf(leaf: WorkspaceLeaf, direction?: SplitDirection): Promise<void>;
    /**
     * @public
     */
    getUnpinnedLeaf(type?: string): WorkspaceLeaf;
    /**
     * @public
     */
    getLeaf(newLeaf?: boolean): WorkspaceLeaf;
    /**
     * @public
     */
    openLinkText(linktext: string, sourcePath: string, newLeaf?: boolean, openViewState?: OpenViewState): Promise<void>;

    /**
     * @public
     */
    getLeafById(id: string): WorkspaceLeaf;
    /**
     * @public
     */
    getGroupLeaves(group: string): WorkspaceLeaf[];
    /**
     * @public
     */
    getMostRecentLeaf(): WorkspaceLeaf;
    /**
     * @public
     */
    getLeftLeaf(shouldSplit: boolean): WorkspaceLeaf;
    /**
     * @public
     */
    getRightLeaf(shouldSplit: boolean): WorkspaceLeaf;

    /**
     * @public
     */
    iterateRootLeaves(callback: (leaf: WorkspaceLeaf) => any): void;
    /**
     * @public
     */
    iterateAllLeaves(callback: (leaf: WorkspaceLeaf) => any): void;
    /**
     * @public
     */
    getLeavesOfType(viewType: string): WorkspaceLeaf[];
    /**
     * @public
     */
    detachLeavesOfType(viewType: string): void;
    
    /**
     * @public
     */
    revealLeaf(leaf: WorkspaceLeaf): void;
    /**
     * @public
     */
    getLastOpenFiles(): string[];

    /**
     * @public
     */
    on(name: 'quick-preview', callback: (file: TFile, data: string) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'resize', callback: () => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'click', callback: () => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'file-open', callback: (file: TFile) => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'layout-ready', callback: () => any, ctx?: any): EventRef;
    /**
     * @public
     */
    on(name: 'css-change', callback: () => any, ctx?: any): EventRef;
}

/**
 * @public
 */
export abstract class WorkspaceItem extends Events {

}

/**
 * @public
 */
export class WorkspaceLeaf extends WorkspaceItem {

}

/**
 * @public
 */
export abstract class WorkspaceParent extends WorkspaceItem {

}

/**
 * @public
 */
export class WorkspaceSidedock extends WorkspaceSplit {

}

/**
 * @public
 */
export class WorkspaceSplit extends WorkspaceParent {

}

export { }
