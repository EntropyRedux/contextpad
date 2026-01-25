# User Guide (Operational Manual)

## Last updated since
January 25, 2026

## Who this is for
ContextPad is designed for power users who work with structured text and AI:
- **Prompt Engineers:** Building complex, multi-block context windows for LLMs.
- **Technical Writers:** Drafting Markdown documentation with reusable snippets.
- **Developers:** Rapidly reformatting logs, JSON, or CSV data using logic.
- **Data Analysts:** Transforming raw text into structured Markdown tables.

## Installation
1. **Download:** Go to the `releases/` directory in the repository.
2. **Execute:** 
   - **Windows:** Run `ContextPad-v1.5.0.exe`.
   - **macOS/Linux:** Run the corresponding platform binary.
3. **No Setup:** The application is portable; it stores all data in the user's local application data folder.

## Basic Usage
### 1. Workspace Drafting
- **Create Tabs:** Press `Ctrl+N` for a new blank tab.
- **Save Work:** The app uses **Multi-Tiered Persistence**. Metadata is saved instantly to LocalStorage, while document content is saved to **IndexedDB** after 2 seconds of inactivity.
- **Markdown Highlighting:** Full syntax highlighting is provided for Markdown, including code blocks for JS, Python, YAML, and JSON.

### 2. Navigation
- **Breadcrumb Quick Jump:** Click any segment of the path in the top bar to see all files in that folder. Click a file to open it instantly.
- **Outline Navigation:** Press `Ctrl+B` to open the left sidebar. Click any header (`#`, `##`, etc.) to jump to that section in the document.
- **Tab Reordering:** Drag and drop tabs horizontally to organize your session.

### 3. Text Transformation
- **Manager Sidebar:** Press `Ctrl+Shift+A` or `Ctrl+Shift+T` to open the Action or Template managers.
- **Execution:** Select text in the editor, find an item in the sidebar, and click the **Play (▶)** button.

## Configuration
### Editor Settings (`Ctrl+,`)
- **Theme:** Switch between *One Dark*, *Dracula*, *GitHub Light/Dark*, *Nord*, and *VS Code*.
- **Font Family:** Supports system monospaced fonts (Default: Consolas).
- **Word Wrap:** Toggle to prevent horizontal scrolling.
- **Line Numbers:** Toggle for a cleaner reading view.

### Performance & Safety
- **Large File Threshold:** (Default: 5000 lines). For files exceeding this, ContextPad disables heavy AST-based syntax highlighting and bracket matching to maintain 60fps scrolling.
- **Spell Check Mode:** Choose between *Built-in* (custom dictionary) or *Browser* (native OS engine).
- **API Keys:** Enter keys for Anthropic or Google Gemini in the Settings tab to enable billing-grade token counting. Keys are stored securely in your OS Keychain.

## Common Tasks
### Creating a Dynamic Template
1. Open the **Template Manager** in the right sidebar.
2. Click the **Plus (+)** button.
3. Enter a name and content using `{{variable}}` syntax (e.g., `Hello {{name}}!`).
4. Click **Create**.
5. To use: Click the template in the sidebar. Use **Tab** to jump between placeholders in the editor.

### Transforming CSV to a Markdown Table
1. Paste your CSV data into the editor.
2. Select the CSV text.
3. In the editor, type `{=CSVTABLE(selection)}`.
4. Press `Ctrl+Enter`. The CSV will be replaced by a perfectly formatted Markdown table.

### Using Locked "Form" Blocks
1. Wrap your text in a code block:
   ```yaml {lock, exclude="variables"}
   System: [[You are a helpful assistant]]
   User: [[Your name here]]
   ```
2. The block is now read-only EXCEPT for the text inside `[[...]]`.
3. If you delete the content of a field, it will auto-restore its default value when you move the cursor.

### Managing Workflows
- **Pinning:** Click the **Star** icon on any Action or Template to add it to your **Pinned Workflows**.
- **Navigation:** Single-click a pinned icon in the Activity Bar to jump to its open tab. Double-click to force open a fresh copy.

## Errors & Troubleshooting
| Symptom | Probable Cause | Fix |
|---------|----------------|-----|
| **Editor feels laggy** | File exceeds performance threshold. | Increase "Large File Threshold" or disable "Bracket Matching" in Settings. |
| **Formula won't run** | Incorrect syntax or missing selection. | Ensure the formula is wrapped in `{=...}` and you have selected text if using `selection`. |
| **Changes didn't save** | App closed before debounce. | Wait at least 2 seconds after typing before closing the application. |
| **About info is wrong** | Cache issue. | Restart the application to reload version metadata. |

## Limitations
- **File Types:** Only plain-text files (Markdown, TXT, JSON, etc.) are supported.
- **Exporting:** Currently supports raw Markdown saving; Rich Text/HTML export is planned for future releases.
- **External Scripts:** No support for running shell scripts or system commands for security reasons.
- **History:** Undo history is currently preserved per-session, not per-tab across restarts.