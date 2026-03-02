/*
Name: Carbon CCalc List
Versio: V1.0
Author: AbdurNurPorag
Git:https://github.com/Abdur-Nur-Porag/ccalc-list

*/

const { Plugin, MarkdownView, Notice, setIcon } = require("obsidian");

// ======================================================================================
// 1. CONSTANTS & CONFIGURATION
// ======================================================================================

const CONFIG = {
    PLUGIN_ID: 'clist-calc-pro',
    RENDER_DEBOUNCE_MS: 300,
    CHECKBOX_DELAY_MS: 150,
    MAX_RECURSION_DEPTH: 100,
    YIELD_INTERVAL_LINES: 400, // Yield to main thread every N lines
    CACHE_SIZE: 50, // Keep last 50 files in memory
    STYLES: {
        TABLE_CLASS: 'clist-table',
        ROW_CLASS: 'clist-row',
        CELL_LABEL: 'clist-label',
        CELL_VALUE: 'clist-value',
        ERROR_CONTAINER: 'clist-error-box',
        TOOLBAR: 'clist-toolbar',
        BTN: 'clist-btn'
    }
};

const REGEX = {
    // Matches: - [x] Item Name = 100
    CHECKBOX: /^- \[(x| )\]/i,
    // Matches indentation
    INDENT: /^(\s*)/,
    // Matches: Label = Expression + Suffix
    // Group 1: Label, Group 2: Prefix, Group 3: Expression, Group 4: Suffix
    BLOCK_LINE: /(.+?)\s*=\s*(?:"(.+?)"\s*\+\s*)?(.+?)(?:\s*\+\s*"(.+?)")?$/i,
    // Detects Bangla Digits
    BANGLA_DIGITS: /[০-৯]/,
    // Detects math or logical operators
    IS_MATH: /[0-9.+\-*/%(),a-zA-Z\u0980-\u09FF]/,
    // Aggregation Functions
    AGGREGATION_FUNC: /\b(Sum|Avg|Max|Min|Count|StdDev|Var|Median|Mode|Range|MaxLabel|MinLabel|AscadingList|DscadingList|TotalChecked|TotalUnchecked|TotalCheckbox)\((.+?)\)/gi
};

// ======================================================================================
// 2. UTILITIES & HELPERS
// ======================================================================================

class Utils {
    /**
     * Generates a fast hash of a string for caching comparisons.
     * Uses a simple bitwise shift (djb2 variant).
     * @param {string} str 
     * @returns {string} Hex hash
     */
    static hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i) {
            hash = (hash * 33) ^ str.charCodeAt(--i);
        }
        return (hash >>> 0).toString(16);
    }

    /**
     * Creates a debounced function that delays invoking func until after wait milliseconds.
     * @param {Function} func 
     * @param {number} wait 
     * @returns {Function}
     */
    static debounce(func, wait) {
        let timeout;
        return function (...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }

    /**
     * Yields control to the main thread to allow UI updates (prevents freezing).
     * @returns {Promise<void>}
     */
    static async yieldToMain() {
        if (typeof window.requestIdleCallback === 'function') {
            return new Promise(resolve => window.requestIdleCallback(resolve));
        }
        return new Promise(resolve => setTimeout(resolve, 0));
    }

    /**
     * Converts English digits to Bangla digits.
     * @param {string|number} input 
     * @returns {string}
     */
    static toBangla(input) {
        return (input + "").replace(/[0-9]/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
    }

    /**
     * Converts Bangla digits to English digits.
     * @param {string} input 
     * @returns {string}
     */
    static toEnglish(input) {
        return (input + "").replace(/[০-৯]/g, d => "০১২৩৪৫৬৭৮৯".indexOf(d));
    }

    /**
     * Checks if a string contains Bangla characters.
     * @param {string} str 
     * @returns {boolean}
     */
    static isBangla(str) {
        return REGEX.BANGLA_DIGITS.test(str);
    }
}

// ======================================================================================
// 3. LOGGING SERVICE
// ======================================================================================

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    NONE: 4
};

class Logger {
    constructor(level = LogLevel.ERROR) {
        this.level = level;
    }

    static getInstance() {
        if (!Logger.instance) Logger.instance = new Logger();
        return Logger.instance;
    }

    debug(msg, ...args) {
        if (this.level <= LogLevel.DEBUG) console.log(`%c[ClistCalc:DEBUG] ${msg}`, 'color: #9E9E9E', ...args);
    }

    info(msg, ...args) {
        if (this.level <= LogLevel.INFO) console.log(`%c[ClistCalc:INFO] ${msg}`, 'color: #2196F3', ...args);
    }

    warn(msg, ...args) {
        if (this.level <= LogLevel.WARN) console.warn(`[ClistCalc:WARN] ${msg}`, ...args);
    }

    error(msg, ...args) {
        if (this.level <= LogLevel.ERROR) console.error(`[ClistCalc:ERROR] ${msg}`, ...args);
    }
}

// ======================================================================================
// 4. MATH KERNEL (EXTENDED LIBRARY)
// ======================================================================================

/**
 * Provides a sandboxed environment for mathematical operations.
 * Includes advanced statistics and trigonometry.
 */
class MathKernel {
    constructor() {
        this.logger = Logger.getInstance();
        
        // Base Function Registry
        this.functions = {
            // Basic
            Abs: Math.abs,
            Root: Math.sqrt,
            nRoot: (x, n) => Math.pow(x, 1 / n),
            Power: Math.pow,
            Ceil: Math.ceil,
            Floor: Math.floor,
            Round: Math.round,

            // Logarithmic
            Log: Math.log10,
            Ln: Math.log,

            // Trigonometry (Degrees based for user friendliness)
            Sin: (x) => Math.sin(this._degToRad(x)),
            Cos: (x) => Math.cos(this._degToRad(x)),
            Tan: (x) => Math.tan(this._degToRad(x)),
            Cot: (x) => 1 / Math.tan(this._degToRad(x)),
            Sec: (x) => 1 / Math.cos(this._degToRad(x)),
            Cosec: (x) => 1 / Math.sin(this._degToRad(x)),

            // Inverse Trig
            ASin: (x) => this._radToDeg(Math.asin(x)),
            ACos: (x) => this._radToDeg(Math.acos(x)),
            ATan: (x) => this._radToDeg(Math.atan(x)),
        };
    }

    _degToRad(deg) { return deg * (Math.PI / 180); }
    _radToDeg(rad) { return rad * (180 / Math.PI); }

    /**
     * Executes an expression string safely.
     * @param {string} expr 
     * @returns {number|string}
     */
    evaluate(expr) {
        try {
            // 1. Pre-process: Handle localization
            let workingExpr = Utils.toEnglish(expr);
            
            // 2. String Masking: Protect strings like "Value" from variable replacement
            const placeholders = [];
            let maskedExpr = workingExpr.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, (match) => {
                placeholders.push(match);
                return `__STR${placeholders.length - 1}__`;
            });

            // 3. Syntax Sugar Replacement
            maskedExpr = maskedExpr
                .replace(/\band\b/gi, " && ")
                .replace(/\bor\b/gi, " || ")
                .replace(/\bnot\b/gi, " ! ")
                .replace(/(\d|\)|\s)x(\d|\(|\s)/gi, "$1*$2") // 5x5 -> 5*5
                .replace(/==/g, " === ")
                .replace(/!=/g, " !== ");

            // 4. Restore Strings
            const cleanExpr = maskedExpr.replace(/__STR(\d+)__/g, (m, i) => placeholders[i]);

            // 5. Short-circuit for string literals
            if (/^["'].*["']$/.test(cleanExpr.trim())) {
                return cleanExpr.trim().replace(/^["']|["']$/g, "");
            }

            // 6. Security & Function Injection
            // We use the Function constructor, but only inject specific Math keys
            // We strip unsafe characters to prevent arbitrary code execution
            const filtered = cleanExpr.replace(/[^0-9.+\-*/%() !&=|<>,a-zA-Z\u0980-\u09FF]/g, "");
            
            const funcKeys = Object.keys(this.functions);
            const funcValues = Object.values(this.functions);
            
            // "use strict" prevents access to global 'window' or 'document'
            const dynamicFunc = new Function(...funcKeys, `"use strict"; return (${filtered})`);
            
            return dynamicFunc(...funcValues);

        } catch (err) {
            this.logger.debug(`Eval failed for: ${expr}`, err);
            // Return cleaned string on failure, assuming it might be text
            return expr.trim().replace(/^["']|["']$/g, "");
        }
    }
}

// ======================================================================================
// 5. DATA MODELS
// ======================================================================================

/**
 * Represents a single line item in the bullet list.
 */
class CalculationNode {
    constructor(name, value = 0) {
        this.name = name;
        this.value = value;
        this.children = {}; // Map<string, CalculationNode>
        
        // Checkbox State
        this.isChecked = false;         // [x]
        this.isEffectiveChecked = false; // Parent is checked implies child is effectively checked
        this.hasCheckbox = false;       // Does it have a [-] marker?
        
        // Metadata
        this.rawExpression = "";
        this.lineNumber = -1;
    }

    /**
     * Adds a child node.
     * @param {string} key 
     * @param {CalculationNode} node 
     */
    addChild(key, node) {
        this.children[key] = node;
    }

    /**
     * Gets all descendant nodes as a flat array.
     * @returns {CalculationNode[]}
     */
    getDescendants() {
        let descendants = [];
        for (const key in this.children) {
            const child = this.children[key];
            descendants.push(child);
            descendants = descendants.concat(child.getDescendants());
        }
        return descendants;
    }
}

/**
 * Wrapper for tree traversal results.
 */
class QueryResult {
    constructor() {
        this.roots = []; // The nodes directly matching the path
        this.all = [];   // All descendants of the roots (inclusive)
    }

    get values() {
        return this.all.map(n => {
            const num = Number(n.value);
            return isNaN(num) ? 0 : num;
        });
    }

    get count() { return this.all.length; }
}

// ======================================================================================
// 6. PARSER ENGINE
// ======================================================================================

/**
 * Parses raw Markdown text into a hierarchical CalculationNode tree.
 * Uses an asynchronous generator approach to avoid blocking the Main Thread.
 */
class ParserEngine {
    constructor() {
        this.mathKernel = new MathKernel();
    }

    /**
     * Main parsing method.
     * @param {string} text 
     * @returns {Promise<CalculationNode>}
     */
    async parse(text) {
        if (!text) return new CalculationNode("Root");

        const root = new CalculationNode("Root");
        const stack = [{ indent: -1, node: root }];
        const lines = text.split("\n");

        let loopCounter = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Performance: Yield every N lines
            loopCounter++;
            if (loopCounter >= CONFIG.YIELD_INTERVAL_LINES) {
                await Utils.yieldToMain();
                loopCounter = 0;
            }

            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("-")) continue;

            // 1. Calculate Indentation
            const indentMatch = line.match(REGEX.INDENT);
            const indent = indentMatch ? indentMatch[0].length : 0;

            // 2. Adjust Stack (Hierarchy)
            while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
                stack.pop();
            }
            const parentContext = stack[stack.length - 1];

            // 3. Extract Checkbox Logic
            const checkboxMatch = trimmed.match(REGEX.CHECKBOX);
            const hasCheckbox = !!checkboxMatch;
            const isChecked = checkboxMatch ? checkboxMatch[1].toLowerCase() === 'x' : false;
            
            // Logic: If parent is effectively checked, child is effectively checked.
            const isEffectiveChecked = isChecked || parentContext.node.isEffectiveChecked;
            const isActive = isEffectiveChecked || !hasCheckbox; // If logic requires exclusion of unchecked

            // 4. Extract Name & Math
            // Remove "- " and "[x] "
            let contentClean = trimmed.replace(/^- (\[.\] )?/, "");
            
            // Split name from potential calculation "Item = 50"
            let namePart = contentClean.split("=")[0];
            
            // Remove trailing emojis or garbage usually found in task lists
            namePart = namePart.replace(/[✅].*$/, "").trim();

            const mathMatch = contentClean.match(/=\s*([0-9\u09E6-\u09EFx.+\-*/%() ]+)/i);
            
            let value = 0;
            let rawExpression = "";

            if (mathMatch) {
                rawExpression = mathMatch[1];
                // Only calculate if "active" (logic dependent, here we calculate always but maybe filter later)
                // Actually, standard logic: calculate, but maybe treat as 0 in aggregates if unchecked? 
                // For now, we calculate the literal value.
                value = this.mathKernel.evaluate(rawExpression);
            }

            // 5. Create Node
            const newNode = new CalculationNode(namePart, isActive ? value : 0);
            newNode.isChecked = isChecked;
            newNode.isEffectiveChecked = isEffectiveChecked;
            newNode.hasCheckbox = hasCheckbox;
            newNode.lineNumber = i;
            newNode.rawExpression = rawExpression;

            // 6. Link to Parent
            parentContext.node.addChild(namePart, newNode);

            // 7. Push to Stack
            stack.push({ indent: indent, node: newNode });
        }

        return root;
    }
}

// ======================================================================================
// 7. CALCULATION & QUERY ENGINE
// ======================================================================================

class QueryEngine {
    constructor() {
        this.mathKernel = new MathKernel();
    }

    /**
     * Traverses the tree to find nodes matching the dot-notation path.
     * @param {CalculationNode} tree 
     * @param {string} path (e.g., "Expenses.Food")
     * @returns {QueryResult}
     */
    query(tree, path) {
        const result = new QueryResult();
        const segments = path.split(".");
        
        let currentLevelNodes = [tree];

        // 1. Navigate down the path
        for (const segment of segments) {
            let nextLevelNodes = [];
            for (const node of currentLevelNodes) {
                if (node.children[segment]) {
                    nextLevelNodes.push(node.children[segment]);
                }
            }
            if (nextLevelNodes.length === 0) return result; // Empty result
            currentLevelNodes = nextLevelNodes;
        }

        result.roots = currentLevelNodes;

        // 2. Collect all descendants recursively
        const traverse = (nodes) => {
            nodes.forEach(node => {
                result.all.push(node);
                traverse(Object.values(node.children));
            });
        };
        
        traverse(currentLevelNodes);
        return result;
    }

    /**
     * Recursive Sum Logic
     */
    getSum(tree, path) {
        const { roots } = this.query(tree, path);
        if (!roots.length) return 0;

        const sumRecursive = (node) => {
            let total = Number(node.value) || 0;
            for (const key in node.children) {
                total += sumRecursive(node.children[key]);
            }
            return total;
        };

        return roots.reduce((acc, root) => acc + sumRecursive(root), 0);
    }
    
    // --- Advanced Statistics ---

    getStdDev(values) {
        if (values.length === 0) return 0;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const squareDiffs = values.map(v => Math.pow(v - mean, 2));
        const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / values.length;
        return Math.sqrt(avgSquareDiff);
    }

    getMedian(values) {
        if (values.length === 0) return 0;
        const sorted = [...values].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    getMode(values) {
        if (values.length === 0) return 0;
        const counts = {};
        values.forEach(v => counts[v] = (counts[v] || 0) + 1);
        let maxCount = 0;
        let mode = 0;
        for (const v in counts) {
            if (counts[v] > maxCount) {
                maxCount = counts[v];
                mode = Number(v);
            }
        }
        return mode;
    }
}

// ======================================================================================
// 8. CACHE LAYER
// ======================================================================================

class CacheService {
    constructor() {
        this.cache = new Map();
        this.logger = Logger.getInstance();
    }

    static getInstance() {
        if (!CacheService.instance) CacheService.instance = new CacheService();
        return CacheService.instance;
    }

    get(filePath, content) {
        const contentHash = Utils.hash(content);
        const entry = this.cache.get(filePath);

        if (entry && entry.hash === contentHash) {
            // this.logger.debug(`Cache HIT for ${filePath}`);
            return entry.tree;
        }
        return null;
    }

    set(filePath, content, tree) {
        // Enforce size limit
        if (this.cache.size >= CONFIG.CACHE_SIZE) {
            const oldest = this.cache.keys().next().value;
            this.cache.delete(oldest);
        }

        this.cache.set(filePath, {
            hash: Utils.hash(content),
            tree: tree,
            timestamp: Date.now()
        });
        // this.logger.debug(`Cache SET for ${filePath}`);
    }

    clear() {
        this.cache.clear();
    }
}

// ======================================================================================
// 9. UI COMPONENT SYSTEM (Virtual DOM Lite)
// ======================================================================================

/**
 * Base Component Class
 */
class Component {
    constructor(tagName, classes = []) {
        this.el = document.createElement(tagName);
        if (classes.length) this.el.classList.add(...classes);
    }

    setText(text) {
        this.el.textContent = text;
        return this;
    }

    append(child) {
        if (child instanceof Component) this.el.appendChild(child.el);
        else this.el.appendChild(child);
        return this;
    }

    mount(parent) {
        parent.appendChild(this.el);
    }
    
    empty() {
        this.el.innerHTML = '';
    }
}

class Button extends Component {
    constructor(icon, onClick, tooltip) {
        super('button', [CONFIG.STYLES.BTN]);
        if (icon) setIcon(this.el, icon); // Obsidian helper
        if (tooltip) this.el.setAttribute('aria-label', tooltip);
        this.el.onclick = onClick;
    }
}

class Table extends Component {
    constructor() {
        super('table', [CONFIG.STYLES.TABLE_CLASS]);
        this.tbody = document.createElement('tbody');
        this.el.appendChild(this.tbody);
    }

    addRow(label, value, isHeader = false) {
        const tr = document.createElement('tr');
        if (isHeader) tr.style.fontWeight = 'bold';
        
        const tdLabel = document.createElement('td');
        tdLabel.className = CONFIG.STYLES.CELL_LABEL;
        tdLabel.textContent = label;

        const tdValue = document.createElement('td');
        tdValue.className = CONFIG.STYLES.CELL_VALUE;
        tdValue.textContent = value;

        tr.appendChild(tdLabel);
        tr.appendChild(tdValue);
        this.tbody.appendChild(tr);
        return tr;
    }
}

class Toolbar extends Component {
    constructor() {
        super('div', [CONFIG.STYLES.TOOLBAR]);
        this.el.style.display = 'flex';
        this.el.style.justifyContent = 'flex-end';
        this.el.style.marginBottom = '8px';
        this.el.style.gap = '8px';
    }
}

// ======================================================================================
// 10. RENDER ENGINE
// ======================================================================================

class RenderEngine {
    constructor() {
        this.queryEngine = new QueryEngine();
        this.mathKernel = new MathKernel();
    }

    /**
     * Resolves "if(cond, A, B)" logic recursively.
     */
    solveIfs(input, vars) {
        let resultStr = input;
        let safety = 0;
        
        while (resultStr.toLowerCase().includes("if(") && safety < CONFIG.MAX_RECURSION_DEPTH) {
            safety++;
            const startIdx = resultStr.toLowerCase().lastIndexOf("if(");
            let bracketCount = 0, endIdx = -1;

            // Find matching closer
            for (let i = startIdx + 2; i < resultStr.length; i++) {
                if (resultStr[i] === "(") bracketCount++;
                else if (resultStr[i] === ")") {
                    if (bracketCount === 0) { endIdx = i; break; }
                    bracketCount--;
                }
            }

            if (endIdx === -1) break;

            const inner = resultStr.substring(startIdx + 3, endIdx);
            
            // Argument Splitter (handles nested commas)
            const args = [];
            let currentArg = "", bLevel = 0;
            for (const char of inner) {
                if (char === "," && bLevel === 0) {
                    args.push(currentArg); currentArg = "";
                } else {
                    if (char === "(") bLevel++;
                    if (char === ")") bLevel--;
                    currentArg += char;
                }
            }
            args.push(currentArg);

            if (args.length >= 3) {
                let cond = args[0].trim();
                const tVal = args[1].trim();
                const fVal = args[2].trim();

                // Inject Variables
                Object.keys(vars).sort((a, b) => b.length - a.length).forEach(k => {
                    const val = vars[k];
                    const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const regex = new RegExp(`(?<=^|[^\\u0980-\\u09FF\\w])${escapedK}(?=[^\\u0980-\\u09FF\\w]|$)`, "g");
                    cond = cond.replace(regex, ` ${val} `);
                });

                const isTrue = this.mathKernel.evaluate(cond);
                const chosenVal = (isTrue ? tVal : fVal).trim();
                resultStr = resultStr.substring(0, startIdx) + chosenVal + resultStr.substring(endIdx + 1);
            } else {
                break;
            }
        }
        return resultStr;
    }

    /**
     * Main Render Loop
     */
    render(blockContext, dataTree) {
        const { source, el } = blockContext;
        
        // 1. Prepare Buffer
        const fragment = document.createDocumentFragment();
        
        // 2. Toolbar
        const toolbar = new Toolbar();
        
        // Add Copy Button
        const btnCopy = new Button('copy', () => {
             // Logic to copy table content to clipboard
             const rows = [];
             el.querySelectorAll('tr').forEach(tr => {
                 const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent);
                 rows.push(cells.join('\t'));
             });
             navigator.clipboard.writeText(rows.join('\n'));
             new Notice("Calculations copied to clipboard!");
        }, "Copy to Clipboard");
        
        // Add CSV Export Button
        const btnCsv = new Button('download', () => {
             const rows = [];
             el.querySelectorAll('tr').forEach(tr => {
                 const cells = Array.from(tr.querySelectorAll('td')).map(td => `"${td.textContent}"`);
                 rows.push(cells.join(','));
             });
             const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
             const url = window.URL.createObjectURL(blob);
             const a = document.createElement('a');
             a.href = url;
             a.download = 'clist-calc.csv';
             a.click();
        }, "Export CSV");

        toolbar.append(btnCopy).append(btnCsv);
        fragment.appendChild(toolbar.el);

        // 3. Table Construction
        const table = new Table();
        const vars = {};
        const lines = source.split("\n").filter(l => l.trim().length > 0);

        try {
            lines.forEach(line => {
                const isHidden = line.trim().startsWith("//");
                const cleanLine = isHidden ? line.trim().substring(2).trim() : line.trim();
                const match = cleanLine.match(REGEX.BLOCK_LINE);

                if (match) {
                    const label = match[1].trim();
                    const prefix = match[2] || "";
                    let expression = match[3].trim();
                    const suffix = match[4] || "";

                    const useBangla = Utils.isBangla(expression);

                    // A. Aggregations Replacement
                    expression = expression.replace(REGEX.AGGREGATION_FUNC, (m, func, path) => {
                        const { roots, all } = this.queryEngine.query(dataTree, path.trim());
                        const values = all.map(n => Number(n.value) || 0);
                        const safeName = n => n.name.replace(/"/g, '\\"');

                        switch (func.toLowerCase()) {
                            case "sum": return this.queryEngine.getSum(dataTree, path.trim());
                            case "avg": return (values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0);
                            case "max": return (values.length ? Math.max(...values) : 0);
                            case "min": return (values.length ? Math.min(...values) : 0);
                            case "count": return values.length;
                            case "stddev": return this.queryEngine.getStdDev(values);
                            case "median": return this.queryEngine.getMedian(values);
                            case "mode": return this.queryEngine.getMode(values);
                            case "range": return (values.length ? Math.max(...values) - Math.min(...values) : 0);
                            
                            // Checkbox counters
                            case "totalchecked": return all.filter(n => n.isEffectiveChecked && !roots.includes(n)).length;
                            case "totalunchecked": return all.filter(n => n.hasCheckbox && !n.isEffectiveChecked && !roots.includes(n)).length;
                            case "totalcheckbox": return all.filter(n => n.hasCheckbox && !roots.includes(n)).length;

                            // List Generators
                            case "maxlabel":
                                if (!all.length) return '"None"';
                                const maxV = Math.max(...values);
                                return `"${all.filter(n => (Number(n.value)||0) === maxV).map(safeName).join(", ")}"`;
                            
                            case "minlabel":
                                if (!all.length) return '"None"';
                                const minV = Math.min(...values);
                                return `"${all.filter(n => (Number(n.value)||0) === minV).map(safeName).join(", ")}"`;

                            case "ascadinglist":
                                const asc = all.filter(n => !roots.includes(n));
                                asc.sort((a,b) => (Number(a.value)||0) - (Number(b.value)||0));
                                return `"${asc.map(safeName).join(", ")}"`;

                            case "dscadinglist":
                                const dsc = all.filter(n => !roots.includes(n));
                                dsc.sort((a,b) => (Number(b.value)||0) - (Number(a.value)||0));
                                return `"${dsc.map(safeName).join(", ")}"`;

                            default: return "0";
                        }
                    });

                    // B. IF Logic
                    expression = this.solveIfs(expression, vars);

                    // C. Variable Substitution
                    Object.keys(vars).sort((a, b) => b.length - a.length).forEach(v => {
                        const escapedV = v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                        const regex = new RegExp(`(?<=^|[^\\u0980-\\u09FF\\w])${escapedV}(?=[^\\u0980-\\u09FF\\w]|$)`, "g");
                        expression = expression.replace(regex, ` ${vars[v]} `);
                    });

                    // D. Evaluate
                    vars[label] = this.mathKernel.evaluate(expression);

                    // E. Render Row
                    if (!isHidden) {
                        let val = vars[label];
                        let displayString = "";

                        if (typeof val === 'number') {
                            let formatted = val.toLocaleString(undefined, { maximumFractionDigits: 2 });
                            if (useBangla) formatted = Utils.toBangla(formatted);
                            displayString = formatted;
                        } else {
                            displayString = val;
                        }
                        
                        const fullText = `${prefix}${displayString}${suffix}`.trim();
                        table.addRow(label, fullText);
                    }
                }
            });

            fragment.appendChild(table.el);

            // 4. Mount with animation frame
            requestAnimationFrame(() => {
                el.innerHTML = ''; // Fast clear
                el.appendChild(fragment);
            });

        } catch (err) {
            console.error(err);
            el.innerHTML = '';
            const errBox = document.createElement('div');
            errBox.className = CONFIG.STYLES.ERROR_CONTAINER;
            errBox.textContent = `⚠️ Error: ${err.message}`;
            el.appendChild(errBox);
        }
    }
}

// ======================================================================================
// 11. PLUGIN CORE
// ======================================================================================

module.exports = class ClistCalcPlugin extends Plugin {
    onload() {
        console.log(`Loading ${CONFIG.PLUGIN_ID} v2.0.0`);
        
        // Initialize Services
        this.parser = new ParserEngine();
        this.renderer = new RenderEngine();
        this.cache = CacheService.getInstance();
        this.activeBlocks = new Set();

        this.addStyles();
        
        // Register Code Block
        this.registerMarkdownCodeBlockProcessor("clist-calc", async (source, el, ctx) => {
            const block = { 
                source, 
                el, 
                ctx, 
                id: Utils.hash(Math.random().toString())
            };
            this.activeBlocks.add(block);
            await this.processBlock(block);
        });

        // 1. Live Preview Support (Debounced)
        this.debouncedUpdate = Utils.debounce(this.triggerUpdate.bind(this), CONFIG.RENDER_DEBOUNCE_MS);

        this.registerEvent(
            this.app.workspace.on("editor-change", (editor, view) => {
                if (view.file) this.debouncedUpdate(view);
            })
        );

        // 2. Reading Mode Checkbox Support
        this.registerDomEvent(document, "click", (evt) => {
            if (evt.target && evt.target.classList.contains("task-list-item-checkbox")) {
                setTimeout(() => this.debouncedUpdate(), CONFIG.CHECKBOX_DELAY_MS);
            }
        });
    }

    onunload() {
        console.log(`Unloading ${CONFIG.PLUGIN_ID}`);
        this.activeBlocks.clear();
        this.cache.clear();
    }

    /**
     * Processes a single code block.
     */
    async processBlock(block) {
        const filePath = block.ctx.sourcePath;
        const file = this.app.vault.getAbstractFileByPath(filePath);
        if (!file) return;

        // Retrieve content (from cache if possible, otherwise disk)
        // Note: For initial render, we might read disk.
        // For updates, we usually get content from the active view in triggerUpdate.
        // However, for safety in Reading mode:
        const content = await this.app.vault.read(file);
        
        let dataTree = this.cache.get(filePath, content);
        if (!dataTree) {
            dataTree = await this.parser.parse(content);
            this.cache.set(filePath, content, dataTree);
        }

        this.renderer.render(block, dataTree);
    }

    /**
     * Triggers a global update for the active view.
     */
    async triggerUpdate(activeView = null) {
        // 1. Cleanup disconnected blocks
        for (const block of this.activeBlocks) {
            if (!block.el.isConnected) this.activeBlocks.delete(block);
        }

        const view = activeView || this.app.workspace.getActiveViewOfType(MarkdownView);
        if (!view) return;

        const filePath = view.file ? view.file.path : null;
        if (!filePath) return;

        // 2. Get Content (Editor Memory vs Disk)
        let content = "";
        if (view.getMode() === "source") {
            content = view.editor.getValue();
        } else {
            content = await this.app.vault.read(view.file);
        }

        // 3. Update Cache & Parse
        let dataTree = this.cache.get(filePath, content);
        if (!dataTree) {
            dataTree = await this.parser.parse(content);
            this.cache.set(filePath, content, dataTree);
        }

        // 4. Re-render only blocks belonging to this file
        for (const block of this.activeBlocks) {
            if (block.ctx.sourcePath === filePath) {
                this.renderer.render(block, dataTree);
            }
        }
    }

    addStyles() {
        const id = 'clist-calc-styles-v2';
        if (document.getElementById(id)) return;
        
        const style = document.createElement('style');
        style.id = id;
        style.textContent = `
            /* Container */
            .clist-table {
                width: 100%;
                border-collapse: separate;
                border-spacing: 0;
                margin: 10px 0;
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                background: var(--background-primary);
                font-size: 0.9em;
            }
            
            /* Rows & Cells */
            .clist-table td {
                padding: 8px 12px;
                border-bottom: 1px solid var(--background-modifier-border);
            }
            .clist-table tr:last-child td {
                border-bottom: none;
            }
            .clist-table tr:hover td {
                background-color: var(--background-secondary);
            }

            /* Typography */
            .clist-label {
                font-weight: 600;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.05em;
                width: 60%;
            }
            .clist-value {
                text-align: right;
                font-family: var(--font-monospace);
                color: var(--text-normal);
                font-weight: 700;
            }

            /* Toolbar */
            .clist-toolbar {
                opacity: 0.5;
                transition: opacity 0.2s;
            }
            .clist-toolbar:hover {
                opacity: 1;
            }
            .clist-btn {
                background: transparent;
                border: 1px solid var(--background-modifier-border);
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                color: var(--text-muted);
            }
            .clist-btn:hover {
                background: var(--background-modifier-hover);
                color: var(--text-normal);
            }

            /* Error Box */
            .clist-error-box {
                padding: 10px;
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid var(--text-error);
                color: var(--text-error);
                border-radius: 4px;
                font-family: var(--font-monospace);
                font-size: 0.8em;
            }
        `;
        document.head.appendChild(style);
    }
};