# Welcome to ContextPad

**ContextPad** is a specialized workspace for **prompt engineering**, **technical drafting**, and **workflow automation**. 

It is designed to live *between* your messy thoughts and your final execution—whether that execution happens in an IDE, an AI model, or a project management tool.

---

## 🚀 Getting Started

### 1. The "Pre-Work" Philosophy
This is not an IDE. It is a **sharp tool** for preparing text.
*   **Draft** complex context for AI models without hitting enter prematurely.
*   **Automate** repetitive text transformations with Excel-like formulas or JavaScript.
*   **Structure** your ideas using Markdown and powerful templates.

### 2. Key Features

#### 📂 Workspace & Navigation
*   **Open Folder**: Use `Ctrl+K Ctrl+O` to open a local folder. ContextPad remembers your workspace.
*   **Breadcrumbs**: The top bar is your file explorer. Click folder names to jump between files instantly.
*   **Outline**: Press `Ctrl+B` to toggle the sidebar and navigate long documents via headers.

#### ⚡ Automation
*   **Templates**: Insert reusable snippets with dynamic variables (`{{name}}`).
*   **Actions**: Create custom scripts to manipulate text. 
    *   *Example*: Select a CSV list and transform it into a Markdown table instantly.
*   **Exclusion**: Use `{exclude="action:ID"}` on code blocks to hide sensitive data from your scripts.

#### 🔒 Locked Blocks
Create safe, fill-in-the-blank forms.
```yaml {lock, exclude="variables"}
model: [[{{gpt-4-turbo}}]]
temperature: [[{{0.7}}]]
```
*   You can edit the values inside `[[...]]`, but the structure is protected.

### 3. AI Readiness
*   **Token Stats**: See real-time token counts for your document in the status bar.
*   **Cost Projection**: Estimate the API cost of your prompt before you send it.

---

## ⌨️ Shortcuts

| Action | Shortcut |
|--------|----------|
| **Command Palette** | `Ctrl+Shift+P` |
| **Quick Open** | `Ctrl+P` |
| **Toggle Sidebar** | `Ctrl+B` |
| **Toggle Block Markers** | `Ctrl+Shift+M` |
| **Run Action** | `Ctrl+Enter` (on selected action) |

---

*This document is read-only. Create a new tab (`Ctrl+T`) to start drafting.*
