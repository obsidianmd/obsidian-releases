# Plugin Review Master List

In this document, you will find a summary of most common suggestions for plugins when they are going through code review.
Feel free to contribute to this document through a Pull Request!

## Plugin review self checklist

- I am not using NodeJS API, or Electron API. If these are used, then the `isDesktopOnly` flag set in `manifest.json`.
- I am using `editorCallback` whever appropriate instead of `checkCallback`.
- I am not using `Workspace.activeLeaf`.
- If using custom `View`s, I am not assigning references to new custom views to my plugin.
- I am not using `innerHTML`, `outerHTML`, or `insertAdjacentHTML`.
- I am using `async` and `await` instead of `.then(callback)` and `.catch(callback)`.

## Obsidian API recommendations

### Plugin loading and unloading

When you hook any event handlers during your plugin's `onload` function, you must find a way to un-hook them when your plugin runs the `onunload` function. This is done to properly cleanup your plugin so that a user who disables the plugin will no longer see the functionality active.

There are a few exceptions to this rule:
- If you use any of the plugin interface's provided registration functions such as `this.registerXXX` or  `this.addXXX`, then this should automatically clean the registration up when your plugin unloads.
- If you use `addEventListener` on any DOM elements that is guaranteed to be removed when your plugin unloads (for example, you may want to add a hover `mouseenter` handler for your plugin's ribbon icon), then those don't need to be registered because the event listener will be garbage collected when the DOM element goes out of scope.

Below is an example:

```ts
onload() {
	// Hook the 'change' event
	this.registerCodeMirror(cm => {
		cm.on('change', this.onChange);
	});
}

onunload() {
	// Unhook the 'change' event
	this.app.workspace.iterateCodeMirrors(cm => {
		cm.off('change', this.onChange);
	});
}

onChange: () => {
	// ...
}
```

### Plugin and setting class naming

Often times, developers forget to rename `MyPlugin` `MyPluginSettings` `DEFAULT_SETTINGS` and `SampleSettingTab` when forking the sample plugin. Please remember to rename them!

### NodeJS, Electron, and Web API.

Be careful when using NodeJS packages, such as `require('fs')`, `require('crypto')`, `require('fs')`, or Electron's modules such as `require('electron').remote`.

If you decide to use these, your plugin will only function in the desktop app that's built with Electron. It will fail to initialize on a mobile device.

Very often, you can find replacements in the web/browser API instead, or you can write your own utility functions.

Some examples:

- `SubtleCrypto` is the web equivalent of `require('crypto')`.
- `navigator.clipboard.readText()` and `navigator.clipboard.writeText()` to access clipboard contents.

If you must use a NodeJS or Electron API, then you must change the `isDesktopOnly` flag in your `manifest.json` to `true`.

### Commands

#### When to use different callbacks

Obsidian's command API offers multiple ways to register a command: `callback`, `checkCallback`, `editorCallback` and `editorCheckCallback`.

Commands may require some condition to be satisfied, such as having a markdown file open, or having some text selected.

#### Callback command

If your command can always run, and does not require any condition, then you should use the most simple Command form `callback`.

```ts
// An example callback that shows a simple notice.
callback: () => {
	new Notice('I am alive!');
}
```

#### Editor Callback

If your command only requires having an active markdown editor open, then you should use the `editorCallback` which will pass the active `Editor` object as well as the `MarkdownView` object to your callback.

```ts
// An example editorCallback that shows a notice of the selection content.
editorCallback: (editor: Editor) => {
	new Notice(`Your selection is: "${editor.getSelection()}"`);
}
```

#### Check Callback

If your command can only run under certain conditions, then you should use either `checkCallback` or `editorCheckCallback`.

```ts
// An example checkCallback that only works on Monday.
checkCallback: (checking: boolean) => {
	// Prepare some variable that's used both in the condition
	// checking process and the actual command action.
	let now = new Date();
	// Condition is only satisfied on Monday.
	let conditionSatisfied = now.getDay() === 0;
	// Check successful!
	if (conditionSatisfied) {
		// Only perform work when checking is false
		if (!checking) {
			new Notice('It is Monday!');
		}
		// Return true regardless of checking is true or false
		// to tell the command runner that this command can run
		// under the current conditions.
		return true;
	}
	// Don't return anything (or return false) here to indicate
	// that the conditions are not satisfied.
	// This will hide the command from the Command Palette.
}
```

### Active Leaf/View

Often times, plugins will need to work with the active view (or leaf). While many plugin uses `Workspace.activeLeaf`, there is usually a better and safer way to access the current active leaf or view.

#### Active Markdown Editor

The most common need for the active leaf or view is to get access to the current `Editor` instance. The best way is usually something like this:

```ts
const view = app.workspace.getActiveViewOfType(MarkdownView);
// getActiveViewOfType will return null if the active view is null,
// or is not of type MarkdownView.
if (view) {
	const editor = view.editor;
	// Do something with editor
}
```

### Custom view types

When registering a custom view type, developers commonly assign a reference to their plugin's view inside their plugin for convenience.

```ts
// Bad
this.registerViewType(MY_VIEW_TYPE, () => this.view = new MyCustomView());

// Good
this.registerViewType(MY_VIEW_TYPE, () => new MyCustomView());
...
for (let leaf of app.workspace.getActiveLeavesOfType(MY_VIEW_TYPE)) {
	let view = leaf.view;
	if (view instanceof MyCustomView) {
		// Do something with my view.
	}
}
```

This is something to be avoided, because some situations may cause your plugin to keep a stale reference (causing a memory leak), or overwrite the correct reference (when the app creates a view but does not use it).

Instead, you can always get the latest workspace state of your custom views using `Workspace.getActiveLeavesOfType`.

### Vault

#### Should I use Vault or Adapter

Often times, plugin developers tend to use `vault.adapter` to directly access files from the file system, because it's generally simpler to use file paths (as strings) when addressing files.

We recommend developers to use the Vault API instead of the Adapter API whenever possible because the Vault API is more tightly integrated to Obsidian. It has the following advantages:

- The Vault API has a caching layer that improves performance. Obsidian (and plugins) can use `cachedRead(tfile)` to read previously known files without incurring a disk read. We can also update the cache when using `create(tfile, data)` and `modify(tfile, data)` instead of having to flush the cache when using `vault.adapter.write(path, data)`.
- The Vault API is serially updated within Obsidian and plugins to avoid any race conditions that occurs when issueing file system operations, such as reading a file that's being written to at the same time.

#### How to get a TFile from a file path

Many developers end up using a variation of `vault.getAllFiles().find(file => file.path === filePath)` after being slightly frustrated not knowing how to deal with a `TAbstractFile`.
This is pretty inefficient, especially when the vault gets large, so here's the suggested alternative.

```ts
// Suppose you have some file path
const filePath = 'folder/file.md';
// Attempt to get the abstract file
const file = app.vault.getAbstractFile(filePath);
// Check if it exists and is of the correct type
if (file instanceof TFile) {
	// Do something with the file here.
	// TypeScript will automatically "cast" file to a TFile
	// within this instanceof check.
}
```

## TypeScript recommendations

### DOM injection using HTML

Often times, developers will write HTML strings rather than building the DOM using the DOM API.

```ts
function showName(name: string) {
	let containerElement = document.querySelector('.my-container');
	containerElement.innerHTML = `<div class="my-class"><b>Your name is: </b>${name}</div>`;
}
```

This is dangerous and can allow user-controlled strings to inject DOM elements into the app, and execute code on the user's machine.

We recommend using the DOM API to create each element and append them to the correct tree, or use Obsidian's helper functions such as `createEl` `createDiv` and `createSpan` to quickly generate DOM elements safely.

Please avoid using `innerHTML`, `outerHTML` and `insertAdjacentHTML` as much as possible!

### Async Await

Many developers come from the old JavaScript world of using `Promise`. Some of them are still using the old way of chaining promise `.then()` and `.catch()` manually.

In the latest versions of JavaScript (and TypeScript), the new and preferred way is to use `async` and `await`, coupled with `try { ... } catch (e) { ... }`.

```ts
// Old way
function test(): Promise<string | null> {
	return fetch('https://example.com')
		.then(res => res.text())
		.catch(e => {
			console.log(e);
			return null;
		});
}

// New way
async function AsyncTest(): Promise<string | null> {
	try {
		let res = await fetch('https://example.com');
		let text = await r.text();
		return text;
	}
	catch (e) {
		console.log(e);
		return null;
	}
}
```