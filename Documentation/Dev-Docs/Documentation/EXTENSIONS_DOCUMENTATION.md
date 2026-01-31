# Editor Extensions Documentation

## Overview
ContextPad extends **CodeMirror 6** with custom logic to handle the specific requirements of prompt engineering and workflow drafting.

---

## 1. Locked Editor (`src/extensions/lockedEditor.ts`)
**Purpose:** Provides robust, syntax-aware read-only regions within Markdown documents.

### Features:
- **Block Identification:** Uses the CodeMirror `syntaxTree` to accurately detect `FencedCode` nodes.
- **Form Mode:** Supports `{lock, exclude="variables"}` metadata.
- **Editable Islands:** Within a locked block, any text inside `[[...]]` remains editable while the brackets themselves are locked.
- **Auto-Restore:** If an editable field is cleared, it automatically restores to its initial default value (e.g., a placeholder).

---

## 2. Inline Formulas (`src/extensions/inlineFormulas.ts`)
**Purpose:** Detects and executes Excel-style formulas embedded in text.

### Syntax:
`{=UPPER(selection)}` or `{=DATE()}`

### Features:
- **Run Button:** Injects a small "▶" widget next to detected formulas.
- **Keybinding:** `Ctrl + Enter` executes the formula at the cursor position.
- **State Integration:** Provides formulas with a `helpers` context (current line, selection, document stats).

---

## 3. Template Variables (`src/extensions/templateVariables.ts`)
**Purpose:** Visual highlighting and navigation for placeholders.

### Syntax:
`{{variable_name}}`

### Features:
- **Decoration:** Applies an underline and distinct background to placeholders.
- **Tab Navigation:** `Tab` key jumps between variables sequentially, looping back to the start if necessary.

---

## 4. Slash Commands (`src/extensions/slashCommands.ts`)
**Purpose:** A context-aware palette for inserting templates and running actions.

### Features:
- **Trigger:** Explicitly activated via `Ctrl + Space` or `Ctrl + Right-Click`.
- **Searchable List:** Unified list of enabled Actions and visible Templates.
- **Custom Rendering:** Color-coded icons and badges (`CMD`, `BTN`, `TMPL`) for fast identification.

---

## 5. Action Buttons (`src/extensions/actionButtons.ts`)
**Purpose:** Embeds executable UI widgets directly into the document.

### Syntax:
`[[action:ACTION_ID]]`

### Features:
- **Widget Injection:** Replaces the text syntax with a stylized button.
- **Validation:** Displays a warning state if the linked `ACTION_ID` does not exist in the store.
- **Interaction:** One-click execution of the linked logic against the current editor state.
