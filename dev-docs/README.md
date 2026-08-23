<p align="center">
  <img src="./public/cntxt.ico" width="128" alt="ContextPad Logo"/>
</p>

# ContextPad
**The Ultimate Markdown Laboratory & Prompt Engineering Workspace**

ContextPad is a lightning-fast, highly extensible, offline-first Markdown editor built on **React, CodeMirror 6, Tauri 2.0, and Rust**. It is meticulously designed for prompt engineers, technical writers, and developers who need more than just a text editor. ContextPad bridges the gap between drafting thoughts and executing code by embedding **Sandboxed JavaScript Macros, AST-Parsed Formulas, and dynamic templates** directly into your workspace.

---

## 🚀 Flagship Features

### 1. The Surgical Live-Preview Engine
ContextPad boasts a deeply optimized split-pane rendering engine. Instead of destructively flashing `innerHTML` on every keystroke, ContextPad uses surgical child-node replacement strategies to sync your DOM.
* **Zero-Flicker Updates:** Write massive 10,000+ word technical documents with zero scroll jump or UI lag.
* **GitHub Flavored Markdown (GFM):** Complete parity with GitHub tables, task lists, blockquotes, and autolinks.
* **Rich Mathematics & Diagrams:** Native out-of-the-box support for `MathJax` (LaTeX formulas) and `Mermaid` flowcharts/diagrams.

### 2. AST Formula Engine
Why manually format text when ContextPad can do it for you inline? Using a custom-built **Recursive Descent Parser**, ContextPad intelligently evaluates inline logic securely via an Abstract Syntax Tree (AST).
* **50+ Built-in Formulas:** Ranging from array manipulation (`{=SORT(selection)}`) to data transformation (`{=CSVTABLE(selection)}`), Mathematics (`{=SUM()}`), and Environment (`{=UUID()}`).
* **Deep Nesting:** Our AST evaluator allows you to deeply nest logic cleanly, e.g., `{=UPPER(TRIM(JOIN(selection, ",")))}`.
* **Smart Holes:** Create form-like templates using `{{variable_name}}` syntax. Hit `Tab` to rapidly jump between empty fields when building repeated prompts.

### 3. Isolated JavaScript Action Sandbox
ContextPad allows you to write your own custom JavaScript snippets and map them to the Command Palette or floating Action Buttons (`[[action:my-script]]`). 
* **Bulletproof Isolation:** Version 1.9.2 introduces an invisible, fully isolated `iframe` security architecture. Untrusted community scripts are sandboxed entirely away from the DOM, Node APIs, and Tauri OS bridges, communicating back to the editor via strict `postMessage` channels. No `eval` hacks, no risks.
* **Contextual Helpers:** Safely inject computed output directly back into the editor using the restricted `helpers.insertAtCursor("value")` proxy.

### 4. Smart Workspace & Locked Blocks
* **Massive File System Support:** Effortlessly index and navigate deep project directories natively mapped to your OS using Rust.
* **Prompt Protection (Locked Blocks):** Working on a strict system prompt? Append `{lock}` to any Code block to render it completely read-only in the editor, preventing accidental destructive edits.
* **Interactive Forms:** Append `{lock, exclude="variables"}` to a block to lock the structure, but allow typing *strictly* inside `[[ ... ]]` bracket zones.

---

## 🛠 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+)
* [Rust](https://www.rust-lang.org/) (Ensure C++ Build Tools are installed on Windows)

### Local Development Setup
ContextPad is strictly offline and requires no cloud connectivity.

```bash
# Clone the repository
git clone https://github.com/EntropyRedux/contextpad.git
cd contextpad

# Install Dependencies
npm install

# Spin up the Tauri Dev Server (React + Rust Backend)
npm run tauri dev
```

### Building for Production
To package ContextPad into a standalone executable or an OS-specific installer (e.g., `.msi`, `.exe`, `.AppImage`):

```bash
npm run tauri build
```
Binaries will be outputted to `src-tauri/target/release/bundle/`.

---

## 🛡 Security & Privacy
ContextPad operates entirely on your local machine. It intercepts your Markdown keystrokes and runs them through a tight localized environment. 
* **Restricted CORS Policy:** The local preview server bounds requests strictly to `localhost`.
* **Safe Sandbox:** Adheres to a strict Content Security Policy (No `'unsafe-eval'`).

## 🤝 Contributing
ContextPad is highly modular. Whether adding a new Formula to `formulaParser.ts`, creating new community Actions, or enhancing the Rust backend, pull requests are warmly welcomed! Please check out the `DEVELOPER_NOTES.md` file for architectural deep dives before submitting a PR.
