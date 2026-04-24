# Ministry Theme for Obsidian

A warm, purposeful theme designed for **ministers, pastors, and theological writers**. Optimized for sermon preparation, Bible study, biblical exposition, and preaching.

---

## Features

### Rich Typography
- **Cinzel** serif font for headings — conveys gravitas and timelessness
- **Inter** sans-serif for body text — crisp, modern readability
- Optimized line-height (1.72) and generous margins for long-form reading
- Distinctive heading hierarchy with gold and navy accents

### 9 Ministry Callouts

| Callout | Purpose | Style |
|---------|---------|-------|
| `theology` | Theological points | Gold left border |
| `application` | Application points | Green left border |
| `wordstudy` / `hebrew` / `greek` | Original language study | Purple right border, monospace |
| `illustration` | Sermon illustrations | Double gold border, italic |
| `challenge` | Challenge to audience | Animated underline on title |
| `reflection` | Reflection questions | Gentle pulse glow |
| `point` | Main sermon points | Gold sweep animation on hover |
| `gem` / `wow` | Key insight gems | Teal border with shimmer |
| `proclaim` | Projector/slide mode | Dark gradient, gold glow, presentation-ready |

### Sermon Outline Hierarchy
Ordered lists follow classic sermon structure automatically:
- **I, II, III** — First level (upper-roman)
- **A, B, C** — Second level (upper-alpha)
- **1, 2, 3** — Third level (decimal)
- **a, b, c** — Fourth level (lower-alpha)
- **i, ii, iii** — Fifth level (lower-roman)

### Scripture & Quote Styling
- Beautiful blockquotes with gold left border
- `.scripture-quote` class for Bible passages (thick 8px gold border)
- `.pull-quote` class for key sermon quotes (centered, large, gold)

### Styled Tables
- Navy header row with white text
- Zebra striping for readability
- Pastel color wrappers: `.blue`, `.slate`, `.pink`, `.green`
- `.table-gem` variant with gold headers

### Special Modes
- **Titus mode** — Green-styled mentoring blocks
- **Timothy mode** — Blue-styled discipleship blocks
- **Eldership notes** — Wide, spacious format for leadership notes

### Print Optimized
- Full `@media print` support
- Background colors forced to print
- UI chrome hidden
- Page break controls
- Links show their URLs

### Plugin Support
- Kanban boards styled with ministry palette
- Dataview tables themed
- Calendar plugin themed
- Sliding Panes (Andy's Mode) support

---

## Installation

### Method 1: Manual Installation (Recommended)

1. Download and extract the `ministry-theme` folder
2. Copy the entire `ministry-theme` folder into your Obsidian vault's themes directory:
   - **Windows**: `%USERPROFILE%\Documents\Obsidian Vault\.obsidian\themes\`
   - **Mac**: `~/Library/Application Support/obsidian/themes/` or `~/Documents/Obsidian Vault/.obsidian/themes/`
   - **Linux**: `~/.config/obsidian/themes/`
3. In Obsidian, go to **Settings → Appearance → Themes**
4. Select "Ministry Theme" from the dropdown

### Method 2: Community Themes (Coming Soon)

Once approved, you can install directly from Obsidian:
1. Go to **Settings → Appearance → Themes → Manage**
2. Search for "Ministry Theme"
3. Click **Install**

### Method 3: Snippet Mode (For Testing)

If you want to try the theme without fully installing it:
1. Open your vault's `.obsidian/snippets/` folder (create it if it doesn't exist)
2. Copy `theme.css` into that folder and rename it to `ministry-theme.css`
3. In Obsidian, go to **Settings → Appearance → CSS Snippets**
4. Enable the `ministry-theme` snippet

---

## How to Use the Callouts

Callouts use Obsidian's native callout syntax with custom types:

```markdown
> [!theology] Key Doctrine
> This is a theological point about the Trinity.

> [!application] For Today
> How does this apply to your walk with Christ?

> [!wordstudy] Hebrew: Shalom
> Meaning: peace, completeness, wholeness

> [!proclaim] # Slide 1
> **"The Lord is my shepherd"** — Psalm 23:1
```

## Sermon Outline Example

Simply use numbered lists — the hierarchy formats automatically:

```markdown
1. The Problem of Sin
   1. Its origin
   2. Its consequence
2. The Solution in Christ
   1. His sacrifice
   2. Our redemption
```

Renders as:
- **I.** The Problem of Sin
  - **A.** Its origin
  - **B.** Its consequence
- **II.** The Solution in Christ
  - **A.** His sacrifice
  - **B.** Our redemption

---

## Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| Navy | #22334C | Primary text, headers |
| Gold | #bfa046 | Accents, borders, strong text |
| Paper | #FAF8F3 | Light mode background |
| Steel Blue | #3B82F6 | Interactive elements, links |
| Ink | #111827 | Dark text on light backgrounds |

---

## Contributing

This theme is open for improvement. If you have suggestions for ministry-specific features, please share them.

---

*"From Word to Life" — Ex Verbo Vita*
