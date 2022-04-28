# Plugin review guidelines

This document lists the most common suggestions and feedback that plugin authors receive when they submit their plugin for review.

Read these guidelines and update your plugin accordingly before you submit it for review.

## General

### Resource management

Any resources, such as event listeners, created by the plugin, must be destroyed or released when the plugin is disabled. 

The following example registers the `onChange()` function for all CodeMirror instances when the plugin loads, and then unregisters it for all instances when the plugin unloads.

```ts
export default class MyPlugin extends Plugin {
  onload() {
    // Hook the 'change' event.
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
}
```

If possible, register any resources using the registration methods from the `Plugin` class, such as example `registerEvent()` or `addCommand()`. That way they are cleaned up automatically when the plugin unloads.

You don't need to resources that are guaranteed to be removed when your plugin unloads. For example, if you register a `mouseenter` listener on a DOM element, the event listener will be garbage-collected when the element goes out of scope.

### Class names

Rename the placeholder class names from the sample plugin, such as `MyPlugin`, `MyPluginSettings`, and `SampleSettingTab`. They should reflect the actual name of your plugin.

### Node.js and Electron API

The Node.js and Electron APIs are only available in the desktop version of Obsidian. If your plugin uses any of these APIs, you need to set `isDesktopOnly` to `true` in the `manifest.json`. Otherwise, the plugin will fail to load on mobile devices.

For example, Node.js packages like `fs`, `crypto`, and `os`, are only available on desktop.

If possible, use alternative features that are available in the Web API. For example:

- [`SubtleCrypto`](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto) instead of [`crypto`](https://nodejs.org/api/crypto.html).
- `navigator.clipboard.readText()` and `navigator.clipboard.writeText()` to access clipboard contents.

### Commands

When you add a command in your plugin, use the appropriate callback type.

- Use `callback` if the command runs unconditionally.
- Use `checkCallback` if the command only runs under certain conditions.

If the command requires an open and active Markdown editor, use `editorCallback`, or the corresponding `editorCheckCallback`.

## Workspace

### Avoid accessing `Workspace.activeLeaf` directly

If you want to access the editor in the active view, use `Workspace.getActiveViewOfType()` instead:

```ts
const view = app.workspace.getActiveViewOfType(MarkdownView);
// getActiveViewOfType will return null if the active view is null,
// or is not of type MarkdownView.
if (view) {
  const editor = view.editor;
  
  // Do something with editor
}
```

### Avoid managing references to custom views

 Doing so can cause memory leaks or unintended consequences.

**Don't** do this:

```ts
this.registerViewType(MY_VIEW_TYPE, () => this.view = new MyCustomView());
```

Do this instead:

```ts
this.registerViewType(MY_VIEW_TYPE, () => new MyCustomView());
```

To access the view from your plugin, use `Workspace.getActiveLeavesOfType()`:

```ts
for (let leaf of app.workspace.getActiveLeavesOfType(MY_VIEW_TYPE)) {
  let view = leaf.view;
  if (view instanceof MyCustomView) {
    // ...
  }
}
```

## Vault

### Prefer the Vault API over the Adapter API

Obsidian exposes two APIs for file operations: the Vault API (`app.vault`) and the Adapter API (`app.vault.adapter`).

While the file operations in the Adapter API are often more familiar to many developers, the Vault API has two main advantages over the adapter.

- **Performance:** The Vault API has a caching layer that can speed up file reads when the file is already known to Obsidian. 
- **Safety:** The Vault API performs file operations serially to avoid any race conditions, for example when reading a file that is being written to at the same time.

### Avoid iterating all files to find a file by its path

This is inefficient, especially for large vaults.
If you are running into problems because `Vault.getAbstractFileByPath` returns a `TAbstractFile` instead of a `TFile`, you can run a `if (file instanceof TFile)` check to have it converted to a `TFile`, like the example below.

**Don't** do this:

```ts
vault.getAllFiles().find(file => file.path === filePath)
```

Do this instead:

```ts
const filePath = 'folder/file.md';

const file = app.vault.getAbstractFileByPath(filePath);

// Check if it exists and is of the correct type
if (file instanceof TFile) {
  // file is automatically casted to TFile within this scope.
}
```

## Editor

### How to change/reconfigure your CM6 extensions

If you're registering a cm6 editor extension using `registerEditorExtension`, there might be times where you want to reconfigure it, for example, when a setting is changed.

To do so, the easiest way is to use an array extension, update the array when it needs reconfiguring, and finally call `Workspace.updateOptions()`.

```ts
class MyPlugin extends Plugin {
  private editorExtension: Extension[] = [];

  onload() {
    //...

    this.registerEditorExtension(this.editorExtension);
  }

  updateEditorExtension() {
    // Empty the array while keeping the same reference
    // (Don't create a new array here)
    this.editorExtension.length = 0;

    // Create new editor extension
    let myNewExtension = this.createEditorExtension();
    // Add it to the array
    this.editorExtension.push(myNewExtension);

    // Flush the changes to all editors
    this.app.workspace.updateOptions();
  }
}

```

## TypeScript

### Avoid `innerHTML`, `outerHTML` and `insertAdjacentHTML`

Building DOM elements using `innerHTML`, `outerHTML` and `insertAdjacentHTML` and user-defined input can pose a security risk.

For example, the following example builds a DOM element using a string that contains user input, `${name}`:

```ts
function showName(name: string) {
  let containerElement = document.querySelector('.my-container');
  containerElement.innerHTML = `<div class="my-class"><b>Your name is: </b>${name}</div>`;
}
```

In the example above, `name` can contain other DOM elements, such as `<script>alert()</script>`, and can allow a potential attacker to execute arbitrary code on the user's computer.

Instead, use the DOM API or the Obsidian helper functions, such as `createEl()`, `createDiv()` and `createSpan()` to build the create the DOM element programmatically.

### Prefer async/await over Promise

Recent versions of JavaScript and TypeScript support the `async` and `await` keywords to handle code that run asynchronously, which allow for more readable code.

**Don't** do this:

```ts
function test(): Promise<string | null> {
  return fetch('https://example.com')
    .then(res => res.text())
    .catch(e => {
      console.log(e);
      return null;
    });
}
```

Do this instead:

```ts
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
