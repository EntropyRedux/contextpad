# ContextPad Customization Guide

This guide details how to create advanced Actions and import/export Actions and Templates for sharing or backup.

---

## 1. Writing Actions

Actions in ContextPad are JavaScript scripts or Formulas that run within the editor's context.

### Execution Environment
Actions run in a sandboxed environment. They do **not** have access to the full `window` or `document` objects for security reasons. Instead, they interact with the editor through provided arguments:

*   **`editor`**: The CodeMirror `EditorView` instance. This gives you full low-level control over the editor state if needed.
*   **`helpers`**: A safe, high-level API for common tasks. **Using helpers is recommended** because they respect features like *Action Exclusion*.

### The `helpers` API
Using these methods ensures your action plays nicely with the rest of the app (e.g., ignoring blocks marked with `exclude="action:..."`).

| Method | Description |
| :--- | :--- |
| `helpers.getSelection()` | Returns the currently selected text. If no selection, returns empty string. |
| `helpers.replaceSelection(text)` | Replaces the current selection (or cursor position) with `text`. |
| `helpers.insertAtCursor(text)` | Inserts `text` at the current cursor position. |
| `helpers.getAllText()` | Returns the entire document content. **Respects exclusion parameters.** |
| `helpers.replaceAllText(text)` | Replaces the entire document content. |
| `helpers.getLine(lineNumber)` | Returns content of a specific line (1-based index). |
| `helpers.getLines()` | Returns an array of all lines. |
| `helpers.getCurrentLine()` | Returns the content of the line where the cursor is. |
| `helpers.insertTemplate(content)` | Inserts a template string, processing any `{{variables}}` inside it. |

### Example: JavaScript Action
Transform selection to Title Case.

```javascript
// Get selection
const text = helpers.getSelection();

if (text) {
  // Transform
  const titleCase = text.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
  
  // Replace
  helpers.replaceSelection(titleCase);
} else {
  // Optional: Notify user (if notification API exposed, otherwise console)
  console.log("No selection");
}
```

### Example: Formula Action
Formulas are simpler one-liners for text transformation. Select "Formula" type in the Action Manager.

```excel
UPPER(selection)
```
```excel
JOIN(SORT(UNIQUE(selection)), ", ")
```

---

## 2. Importing & Exporting

ContextPad uses JSON files for importing and exporting Actions and Templates. You can create these files manually to share collections of tools.

### Global Import Rules
1.  **File Format**: Must be valid `.json`.
2.  **Duplicate Handling**: The app will check names. If an item with the same name exists, it will prompt you to skip or overwrite.
3.  **IDs**: If you provide an `id`, the app tries to preserve it. If it conflicts or is missing, a new UUID is generated.

### Actions Import Format (`.json`)

**Structure:**
```json
{
  "version": "1.0",
  "actions": [
    {
      "id": "optional-uuid-here",
      "name": "My Custom Action",
      "description": "Description of what it does",
      "type": "command", 
      "code": "helpers.replaceSelection('Hello')",
      "category": "My Tools",
      "enabled": true
    }
  ]
}
```

**Fields:**
*   `version`: (Optional) Metadata version.
*   `actions`: Array of action objects.
*   **Action Object**:
    *   `name` (Required): Display name.
    *   `type` (Required): `"command"` (runs code) or `"button"` (inserts a button widget).
    *   `code` (Required): The JavaScript code or Formula string (prefix formulas with `FORMULA:` if editing raw JSON, though standard exports handle this).
    *   `category` (Recommended): Group name. Defaults to "General".
    *   `description` (Optional): Tooltip text.
    *   `enabled` (Optional): Default `true`.

### Templates Import Format (`.json`)

**Structure:**
```json
{
  "version": "1.0",
  "templates": [
    {
      "id": "optional-uuid-here",
      "name": "Bug Report",
      "content": "### Bug Report\n**Description**: {{desc}}\n**Steps**: {{steps}}",
      "category": "Issues",
      "isHidden": false
    }
  ]
}
```

**Fields:**
*   `version`: (Optional).
*   `templates`: Array of template objects.
*   **Template Object**:
    *   `name` (Required): Display name.
    *   `content` (Required): The text to insert. Use `{{variable}}` for placeholders.
    *   `category` (Recommended): Group name.
    *   `isHidden` (Optional): Default `false`. Set to `true` to hide from the quick menu.

### Troubleshooting Imports
*   **"Invalid JSON"**: Ensure all keys are quoted (`"key":`) and string values are properly escaped (e.g., newlines `\n` inside code strings).
*   **"Import failed"**: Check the browser console (Ctrl+Shift+I) for detailed error messages.
*   **IDs**: It is safest to omit the `id` field when creating shared files; the app will generate unique IDs for the user. Only include `id` if you are restoring a backup and want to preserve references (e.g., for `exclude="action:ID"`).
