# Welcome to ContextPad v1.9.0

**ContextPad** is a high-performance workspace for **prompt engineering**, **technical drafting**, and **workflow automation**. 

It is designed to bridge the gap between initial ideas and final execution—providing a specialized environment for structuring, protecting, and transforming your context.

---

## 🚀 Key Features

### 1. Robust File & Workspace Management
*   **Workspace Explorer**: Open a folder (`Ctrl+K Ctrl+O`) to view your project structure. Features a virtualized tree that handles 10,000+ files with ease.
*   **Contextual Bookmarks**: Pin frequently used files as **Bookmarks** in the sidebar. Unlike workflows, bookmarks open the actual file from your disk.
*   **Hybrid Tabs**: Manage multiple drafts with a robust tab system. Right-click any tab to "Close Others" or "Close All".

### 2. High-Performance Live Preview
Experience your Markdown as "Rich Text" with our reworked preview engine:
*   **GFM Styling**: Renders with GitHub Flavored Markdown standards.
*   **Real-time Customization**: Adjust **Font Scale**, **Max Width**, and **Margins** in the Settings panel and see changes instantly without a refresh.
*   **Interactive TOC**: Use the hamburger menu (☰) in the preview to reveal a compact Table of Contents. It features **Scroll Spy** highlighting and auto-expanding sections.
*   **Deep Integration**: Native support for **Mermaid** diagrams and **MathJax** equations.

### 3. Precision Automation
*   **Dynamic Templates**: Insert snippets with smart variables (`{{name}}`).
*   **Custom Actions**: Run JavaScript or 70+ built-in formulas to transform text.
*   **Security & Redaction**: Use `{exclude="action:ID"}` to prevent specific scripts from "seeing" sensitive code blocks.

### 4. Locked Blocks & Forms
Transform static documents into interactive forms.
```yaml {lock, exclude="variables"}
Project: [[{{project_name}}]]
Status: [[PLANNING]]
```
*   **Marker Protection**: The fence markers (```) and structure are fully locked.
*   **Editable Holes**: Only the content inside `[[...]]` can be modified.
*   **Bypass Control**: Use `Ctrl+Shift+U` to force-unlock all blocks for structural edits.

---

## ⌨️ Essential Shortcuts

| Action | Shortcut |
|--------|----------|
| **Command Palette** | `Ctrl+Space` (or `Ctrl+Right Click`) |
| **Toggle Outline (Left)** | `Ctrl+B` |
| **Toggle Settings (Right)** | `Ctrl+,` |
| **New / Close Tab** | `Ctrl+T` / `Ctrl+W` |
| **Save / Save As** | `Ctrl+S` / `Ctrl+Shift+S` |
| **Unlock All Blocks** | `Ctrl+Shift+U` |
| **Toggle Markers** | `Ctrl+Shift+M` |

---

## 🎨 Customization
Open the **Settings Panel** (`Ctrl+,`) to skin your experience:
*   **Editor Themes**: Choose from One Dark, Dracula, Nord, and more.
*   **Custom CSS**: Paste your own CSS into the "Preview & Export" section to fully skin the live preview window in real-time.

*This document is read-only. Create a new tab (`Ctrl+T`) to start drafting.*