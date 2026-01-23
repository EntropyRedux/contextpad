# ContextPad User Guide

Welcome to **ContextPad**. This guide will help you master the "sharp tool" designed for prompt engineering, workflow drafting, and AI context management.

---

## 1. Workspace & Navigation

### Setting Up Your Workspace
ContextPad works best when grounded in a project folder.
1.  **Open Folder**: Use `File > Open Folder` (or `Ctrl+K Ctrl+O`) to select a root directory on your computer.
2.  **Persistence**: The app remembers this workspace between sessions.

### 🍞 Breadcrumb Navigation
The bar at the top of the editor isn't just for show. It is your **mini file explorer**.
*   **Path View**: Shows exactly where the current file lives relative to your workspace root.
*   **Quick Jump**: Click any folder name in the breadcrumb path to dropdown a list of files in that folder. This allows rapid navigation without opening the full sidebar.

### 📑 Document Outline (`Ctrl+B`)
For long documents, navigating by scrollbar is inefficient.
*   **Toggle Sidebar**: Press `Ctrl+B` or click the Sidebar icon in the top left.
*   **Structure**: The "Outline" tab analyzes your Markdown headers (`#`, `##`, `###`) and creates a clickable table of contents.
*   **File Tree**: Switch to the "Files" tab to see the full directory structure of your workspace.

---

## 2. Markdown & Formatting

ContextPad is a "Markdown-First" editor.

### Basic Syntax
*   **Headers**: `# H1`, `## H2`, `### H3`
*   **Emphasis**: `**Bold**`, `*Italic*`, `~~Strikethrough~~`
*   **Lists**: `- Bullet point` or `1. Numbered list`
*   **Links**: `[Text](url)`
*   **Quotes**: `> Blockquote`

### 💻 Code Blocks
ContextPad automatically detects and highlights code blocks.
```python
def hello():
    print("Syntax Highlighting is automatic")
```
*   **Language Detection**: Specify the language after the triple backticks (e.g., ` ```json `) for accurate coloring.
*   **Auto-Formatting**: The editor respects indentation and brackets for over 100 languages.

---

## 3. Automation Tools

This is where ContextPad transforms from a text editor into a workflow engine.

### 📋 Templates
Templates are reusable text blocks for standardizing your work (e.g., "System Prompts", "Bug Reports", "Email Signatures").

1.  **Access**: Open the Right Sidebar and click the **Templates** icon (File).
2.  **Variables**: Use `{{variable_name}}` syntax in your template.
    *   *Example*: `Hello {{name}}, welcome to {{company}}.`
    *   **Action**: When inserting this template, ContextPad will automatically prompt you to fill in "name" and "company".
3.  **Usage**: Drag and drop a template into the editor, or click to insert at the cursor.

### ⚡ Actions (Buttons & Commands)
Actions allow you to manipulate text programmatically.

#### Types of Actions
*   **Button**: Saves the action to your sidebar for repeated use.
*   **Command**: A one-time execution (useful for quick transformations).

#### Engine 1: Formulas (Excel-Like)
Perfect for simple text cleanups.
*   **Syntax**: `FUNCTION(input)`
*   **Default Input**: If you use empty parentheses `()`, the formula applies to your **selected text**.
*   **Examples**:
    *   `UPPER()`: Converts selection to UPPERCASE.
    *   `LOWER()`: Converts selection to lowercase.
    *   `TRIM()`: Removes excess whitespace.
    *   `JOIN(", ")`: Joins selected lines with a comma.

#### Engine 2: JavaScript (Advanced)
Full programmatic control using the sandboxed `helpers` API.
*   **API Available**:
    *   `helpers.getSelection()`: Returns selected text.
    *   `helpers.replaceSelection(text)`: Replaces selection with new text.
    *   `helpers.insertAtCursor(text)`: Inserts text at current position.
    *   `helpers.getAllText()`: Gets entire document content.
    *   `helpers.insertTemplate(templateStr)`: Inserts a string and processes any `{{variables}}` inside it.

*   **Example Script (Wrap in Quotes)**:
    ```javascript
    const text = helpers.getSelection();
    helpers.replaceSelection('"' + text + '"');
    ```

---

## 4. Settings & AI Tools

### 🤖 Token Estimator
Track the "cost" of your text before sending it to an AI.
1.  **Open Settings**: Click the **Settings** gear in the Right Sidebar.
2.  **Token Provider**: Choose between:
    *   **Local (Offline)**: Uses `tiktoken` (GPT-4o compatible). Free and fast.
    *   **Online**: Connects to Anthropic or Google APIs for exact counts (requires API Keys).
3.  **API Keys**: Keys are stored securely in your OS Keychain (not in the file system).
4.  **Real-Time**: The status bar shows the current token count and estimated cost based on the selected model.

### ✍️ Editor Settings
Customize the writing experience.
*   **Appearance**: Change Font Family, Font Size, and Theme (VS Code Dark+ is default).
*   **Behavior**:
    *   **Word Wrap**: Toggle on/off for long lines.
    *   **Line Numbers**: Show/Hide gutter numbers.
    *   **Paste Formatting**: Choose whether to preserve styles on paste.

### 🧠 Intelligence
*   **Autocomplete**: Suggests words based on the current document's content.
    *   *Scope*: "Global" (all open tabs) or "Local" (current file).
*   **Spell Check**: Integrated spell checker.
    *   *Dictionaries*: Add custom words to your local dictionary to stop red squiggles on jargon.
