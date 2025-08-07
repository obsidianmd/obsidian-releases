const { Plugin, TFile, MarkdownRenderer } = require("obsidian");

module.exports = class SidebarHeadingPreview extends Plugin {
  tooltipEl = null;
  timeoutId = null;
  hideTimeoutId = null;
  isHoveringTooltip = false;

  async onload() {
    console.log("✅ Sidebar Heading Preview loaded");
    this.injectStyles();

    this.registerDomEvent(document, "mousemove", (evt) => this.onMouseMove(evt));
  }

  onunload() {
    this.removeTooltip();
  }

  injectStyles() {
    const style = document.createElement("style");
    style.textContent = `
  .sidebar-heading-preview-tooltip {
    position: fixed;
    z-index: 9999;
    background-color: var(--background-secondary, #2a2a2a);
    color: var(--text-normal, #eeeeee);
    padding: 6px 10px;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.3;
    max-width: 280px;
    max-height: 300px;
    overflow-y: auto;
    overflow-x: hidden; /*  Disable horizontal scrolling */
    pointer-events: auto;
    white-space: normal;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    border: 1px solid var(--background-modifier-border, #444);
    font-family: var(--font-ui, "Inter", sans-serif);
    scrollbar-width: thin;
    display: block;
    margin: 0;
  }

  .sidebar-heading-preview-tooltip::-webkit-scrollbar {
    width: 8px;
  }

  .sidebar-heading-preview-tooltip::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 4px;
  }

  .sidebar-heading-preview-tooltip ul {
    max-height: none;
    margin: 0;
    padding-left: 1.2em;
  }

  .sidebar-heading-preview-tooltip li {
    margin: 0 0 4px 0;
    line-height: 1.4;
    font-style: italic;
    color: lightgreen;
    overflow-wrap: break-word;
  }

  .sidebar-heading-preview-tooltip strong {
    display: block;
    margin: 0 0 6px 0;
    font-weight: 600;
    font-size: 14px;
    color: var(--text-accent, #ffd700);
  }
`;


    document.head.appendChild(style);
  }

  async onMouseMove(evt) {
  const target = evt.target;
  const fileEl = target?.closest("[data-path]");
  const hoveringTooltip = target?.closest(".sidebar-heading-preview-tooltip");

  // Get bounding boxes to check for buffer zone
  const fileRect = fileEl?.getBoundingClientRect();
  const tooltipRect = this.tooltipEl?.getBoundingClientRect();

  const bufferZone = fileRect && tooltipRect && (
    evt.clientX >= Math.min(fileRect.left, tooltipRect.left) &&
    evt.clientX <= Math.max(fileRect.right, tooltipRect.right) &&
    evt.clientY >= fileRect.bottom &&
    evt.clientY <= tooltipRect.top
  );

  const shouldKeepTooltip = fileEl || hoveringTooltip || bufferZone;

  if (!shouldKeepTooltip) {
    if (!this.isHoveringTooltip) {
      if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
      this.hideTimeoutId = setTimeout(() => {
        if (!this.isHoveringTooltip) {
          this.removeTooltip();
        }
      }, 150);
    }
    return;
  }

  if (fileEl) {
    const path = fileEl.getAttribute("data-path");
    if (!path) {
      this.removeTooltip();
      return;
    }

    if (this.timeoutId) clearTimeout(this.timeoutId);
    this.timeoutId = window.setTimeout(async () => {
      await this.showTooltip(fileEl, path);
    }, 250);
  }
}

  async showTooltip(el, path) {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) {
      this.removeTooltip();
      return;
    }

    const content = await this.app.vault.read(file);
    const headings = content
      .split("\n")
      .filter(line => line.startsWith("# "))
      .map(line => line.replace(/^# /, "").trim());

    if (!headings.length) {
      this.removeTooltip();
      return;
    }

    if (!this.tooltipEl) {
      this.tooltipEl = document.createElement("div");
      this.tooltipEl.className = "sidebar-heading-preview-tooltip";
      document.body.appendChild(this.tooltipEl);

      this.tooltipEl.addEventListener("mouseenter", () => {
        this.isHoveringTooltip = true;
        if (this.hideTimeoutId) clearTimeout(this.hideTimeoutId);
      });

      this.tooltipEl.addEventListener("mouseleave", () => {
        this.isHoveringTooltip = false;
        this.hideTimeoutId = setTimeout(() => {
          if (!this.isHoveringTooltip) {
            this.removeTooltip();
          }
        }, 300);
      });
    } else {
      this.tooltipEl.innerHTML = "";
    }

    const title = document.createElement("div");
    title.innerHTML = "<strong>Headings:</strong>";
    this.tooltipEl.appendChild(title);

    const ul = document.createElement("ul");
    for (const heading of headings) {
      const li = document.createElement("li");

      await MarkdownRenderer.renderMarkdown(
        heading,
        li,
        path,
        this.app.workspace.activeLeaf
      );

      ul.appendChild(li);
    }

    this.tooltipEl.appendChild(ul);

    const rect = el.getBoundingClientRect();
const padding = 8;
const tooltipWidth = 280;

const tooltipHeight = 300; // fallback value; CSS will override anyway

let top;
if (rect.bottom + tooltipHeight > window.innerHeight) {
  // Not enough space below — stick tooltip directly above the file
  top = rect.top - tooltipHeight;
  if (top < 0) top = 0;
} else {
  // Stick tooltip directly below the file
  top = rect.bottom;
}

let left = rect.left;
if (left + tooltipWidth > window.innerWidth) {
  left = window.innerWidth - tooltipWidth - padding;
}

Object.assign(this.tooltipEl.style, {
  top: `${top}px`,
  left: `${left}px`,
});

  }

  removeTooltip() {
    if (this.tooltipEl) {
      this.tooltipEl.remove();
      this.tooltipEl = null;
    }
    this.isHoveringTooltip = false;
  }
};
