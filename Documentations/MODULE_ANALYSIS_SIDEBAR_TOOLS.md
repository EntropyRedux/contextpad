# Module Analysis: Sidebar & Tools

**Components:** `src/components/Sidebar/`, `src/components/LeftSidebar/`
**State:** `src/store/tabStore.ts`, `src/store/templateStore.ts`

---

## 1. Overview
ContextPad features a dual-sidebar layout.
*   **Left Sidebar:** Navigation (File Explorer, Outline).
*   **Right Sidebar:** Tools (Templates, Actions, Settings).

## 2. Right Sidebar (Tools)
### Implementation (`Sidebar.tsx`)
*   **Resizable:** Implements a custom drag handle. Uses `mousemove` listeners on the document to track width changes (constrained 250px-600px).
*   **View Switching:** A simple state machine switches the content between `<SettingsPanel>`, `<TemplateManager>`, and `<ActionManager>`.

### Template Manager (`TemplateManager.tsx`)
*   **Drag and Drop:** Uses the native HTML5 Drag and Drop API. Templates can be dragged directly into the CodeMirror editor instance.
*   **Filtering:** Real-time filtering by category or name.
*   **Persistence:** Templates are stored in `localStorage` via `templateStore` (Zustand).

## 3. Left Sidebar (Navigation)
### File Explorer
*   **Virtualization:** (Inferred from project structure) Uses a virtual list to render file trees. This is critical for performance when opening folders like `node_modules`.
*   **System Integration:** Clicks trigger Rust commands (`commands::file::read_file`) to load content.

### Document Outline (`MarkdownOutline.tsx`)
*   **Parser:** Regex-based parser scans the current document for headers (`#`).
*   **Navigation:** Clicking a header dispatches a scroll effect to the editor view.
*   **Live Sync:** Re-parses on document change (debounced).

## 4. Assessment
*   **Strengths:**
    *   **UX:** Resizable panels and drag-and-drop integration feel native.
    *   **Performance:** Virtualization in the file tree prevents lag in large projects.
*   **Weaknesses:**
    *   **Regex Parsing:** The Outline parser is simple regex. It might fail on edge cases (e.g., `#` inside a code block). Using a true Markdown AST parser (e.g., `remark`) would be more accurate but slower. The current trade-off favors speed.
