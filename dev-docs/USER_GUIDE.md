# ContextPad v1.9.2 — The Definitive User Guide

Welcome to the definitive guide for **ContextPad**, a cutting-edge workspace designed exclusively for high-performance prompt engineering, technical drafting, and localized JavaScript automation. This document is designed to be viewed in **Live Preview** (`Ctrl+Space` > View > Toggle Preview) to showcase the surgical rendering capabilities of the application.

---

## 1. The Surgical Live Preview Engine

ContextPad replaces traditional whole-page DOM replacements with a highly optimized, surgical child-node diffing engine. 

### 1.1 Zero-Flicker Updates
Most markdown editors flicker and lose your scroll state when handling 10,000+ words. ContextPad independently compares Abstract Syntax Nodes as you type and only repaints the exact HTML element that changed. You can write massive architecture documents with zero latency.

### 1.2 GitHub Parity (GFM)
- **Task Lists**: Clickable `[x]` boxes in the preview seamlessly update the source code without losing focus.
- **Tables**: Perfectly aligned, theme-aware responsive tables.
- **Autolinks**: https://github.com/EntropyRedux/contextpad

### 1.3 Technical Renderers (MathJax & Mermaid)
Render complex logic directly in your drafts:
- **MathJax (LaTeX):**
  - Inline: `The Pythagorean theorem is $a^2 + b^2 = c^2$.`
  - Block: `$$x = {-b \pm \sqrt{b^2-4ac} \over 2a}$$`
- **Mermaid Flowcharts:**
  Drop a ` ```mermaid ` block to visualize workflows. ContextPad handles automatic retry logic and prevents rendering crashes on malformed chart data.

---

## 2. AST Formula Engine (The Power of Inline Logic)

ContextPad goes beyond static text. In `v1.9.2`, we introduced the **Abstract Syntax Tree (AST) Recursive Descent Parser**. 

When you surround text with `{= ... }`, ContextPad executes built-in formulas. Unlike native regex replacements, this AST parser flawlessly handles deep mathematical and string nesting.

### 2.1 Essential Formulas
*   **Text Formatting:** `{=UPPER(selection)}`, `{=TITLE(selection)}`, `{=KEBAB(selection)}`
*   **Generators:** `{=UUID()}`, `{=TODAY()}`, `{=NOW()}`
*   **Structure:** `{=SORT(selection)}`, `{=UNIQUE(selection)}`
*   **Data Conversion:** Highlight a block of CSV text and run `{=CSVTABLE(selection)}` to instantly generate a Markdown-formatted table grid!

### 2.2 Deep Nesting Example
You can stack logic cleanly:
`{=UPPER(TRIM(JOIN(selection, ",")))}`
*This grabs the highlighted lines, joins them with commas, trims whitespace, and uppercases everything—instantly.*

---

## 3. Dynamic Action Scripts & The Secure Sandbox

ContextPad lets you write your own JavaScript logic to automate your repetitive writing tasks. Open the **Action Manager** in the left sidebar to build custom `.js` scripts.

### 3.1 The ContextPad Sandbox (Security First)
Every Action script you run is executed inside an invisible, ultra-secure `iframe` Sandbox.
*   **No DOM Access:** Scripts cannot maliciously access `window.document`.
*   **No Runtime Access:** Scripts are physically isolated from your computer's OS and Node API bindings.
*   **Strict CORS:** Operations are completely disconnected from the open web to prevent data exfiltration.

### 3.2 Injecting Output
Inside your Action Script, interact with the editor using the restricted `helpers` bridge:
```javascript
// Example Action: Wrap highlighted text in standard prompt tags
const selectedText = helpers.getSelection();
const promptBlock = `<user-prompt>\n${selectedText}\n</user-prompt>`;
helpers.replaceSelection(promptBlock);
```

### 3.3 Triggering Logic
*   **Command Palette:** Press `Ctrl+Space` or `Alt+/` to search and run your action globally.
*   **Action Buttons:** Type `[[action:my-script]]` directly into your markdown. ContextPad renders a sleek, transparent button in the text that you can click to trigger the automation manually.

---

## 4. Workspaces & Protected Engineering

### 4.1 Native File System Browsing
ContextPad does not trap your files in a proprietary SQLite hidden folder. The Workspace Explorer natively maps to your computer's File System using Rust bounds. Your files are yours.

### 4.2 Locked Code Blocks `{lock}`
Prompt engineers routinely build complex structural system prompts that they do not want to accidentally delete. Append `{lock}` to your fences:
```javascript {lock}
// This entire block, including the fences, is protected.
// It cannot be edited until you force-unlock with Ctrl+Shift+U.
function corePrompt(input) {
  return "Analyze the following: " + input;
}
```

### 4.3 Fill-In-The-Blank Forms
Take it a step further with `{lock, exclude="variables"}`:
```yaml {lock, exclude="variables"}
Model: [[{{gpt-4o}}]]
Instruction: [[Translate to French]]
Input: [[Hello world]]
```
*In this mode, the user can ONLY edit text inside the `[[ ... ]]` zones. Everything else is physically locked!* Combine this with the `{{gpt-4o}}` "smart hole" syntax to tab-jump between inputs instantly.

---

## 5. Master Keyboard Shortcuts

| Action | Shortcut |
| :--- | :--- |
| **Command Palette** | `Ctrl+Space` or `Alt+/` |
| **Toggle Outline (Left)** | `Ctrl+B` |
| **Toggle Settings (Right)** | `Ctrl+,` |
| **Quick Search / Replace** | `Ctrl+F` / `Ctrl+H` |
| **Unlock All Blocks** | `Ctrl+Shift+U` |
| **Toggle Block Markers** | `Ctrl+Shift+M` |
| **New Tab / Close Tab** | `Ctrl+T` / `Ctrl+W` |

---

## 6. Real-Time Themes & Customizations
Press `Ctrl+,` to open the Settings panel on the right. 
- **Scale:** Dynamically jump from 50% to 300% zoom with no artifacting.
- **CSS Engine:** Paste raw CSS into the custom styling box to completely redesign your workspace instantly. The layout leverages CSS variables, allowing immediate color palette swapping!

*Guide version: 1.9.2 | Last updated: 2026-02-22*