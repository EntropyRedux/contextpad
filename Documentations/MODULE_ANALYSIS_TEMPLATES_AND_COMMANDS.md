# Module Analysis: Templates, Commands & Buttons

**Components:** `src/components/Sidebar/TemplateManager.tsx`, `src/utils/templateVariables.ts`, `src/store/templateStore.ts`
**Integration:** Action System (`src/store/actionStore.ts`)

---

## 1. The Template Engine
The Template System is designed for **reusable content injection** with dynamic variable support.

### Variable Logic (`templateVariables.ts`)
*   **Syntax:** Uses strict `{{variable_name}}` regex detection.
*   **Parsing:**
    *   The `processTemplateVariables(content, selection)` function scans the template string.
    *   It identifies unique variable names.
    *   **Auto-Fill:** If a variable is named `{{selection}}`, it is automatically populated with the user's currently selected text in the editor.
    *   **Prompting:** For other variables, it triggers a UI modal (via `window.prompt` currently, but extensible) to request user input.
*   **Cursor Placement:** If the template contains `{{cursor}}`, the editor cursor is automatically placed there after insertion.

### UI & Drag-and-Drop
*   **HTML5 DND:** The `TemplateManager` uses native `draggable` attributes.
*   **Drop Handler:** The CodeMirror editor has a specialized drop handler that:
    1.  Detects the drop coordinates.
    2.  Moves the cursor to that position.
    3.  Inserts the template content (processing variables on the fly).

---

## 2. Action Types: Buttons vs. Commands

While both use the same execution engines (Formula/JS), they differ in **Persistence** and **UX Intent**.

### 🔘 Buttons
*   **Intent:** Frequent, repetitive workflows (e.g., "Format as User Message", "Clean AI Response").
*   **UI:** Rendered as persistent, clickable icons in the `ActionManager` sidebar.
*   **State:** Their `enabled` state toggles their visibility.

### ⚡ Commands
*   **Intent:** One-off or less frequent transformations.
*   **UI:** Often accessed via the Command Palette (`Ctrl+P` equivalent) or triggered via keyboard shortcuts (future).
*   **Execution:** They run once and do not necessarily need a persistent UI presence.

---

## 3. Advanced JavaScript Helpers
The `actionExecutor.ts` provides a **Helpers API** to bridge the gap between sandboxed user code and the complex CodeMirror instance.

### The `helpers` Object
When a user writes JavaScript in an action, they get this object:

| Method | Description |
| :--- | :--- |
| `getSelection()` | Returns the string currently highlighted by the user. |
| `replaceSelection(text)` | Replaces the highlight with new `text`. Handles transaction dispatch. |
| `insertAtCursor(text)` | Injects text at the caretaker position. |
| `getAllText()` | Returns the entire document buffer. |
| `replaceAllText(text)` | Replaces the entire document (useful for full-file formatters). |
| `insertTemplate(content)` | **Power Feature:** Inserts a string *and* runs the Template Engine on it (processing `{{vars}}`). |

### Example: Chaining Helpers
A user can write a script that combines these:
```javascript
// Get text
const input = helpers.getSelection();
// Transform
const processed = input.toUpperCase();
// Insert as a template with a wrapper
helpers.insertTemplate("Title: " + processed + "\n\nBody: {{cursor}}");
```
This script transforms text, formats it, and places the cursor ready for typing.
