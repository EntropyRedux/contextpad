# Module Analysis: Editor Engine

**Component:** `src/components/Editor/Editor.tsx`
**Core Library:** CodeMirror 6
**State:** `src/store/tabStore.ts`

---

## 1. Architecture

The Editor module is the heart of ContextPad. It is not just a text area but a fully configurable IDE instance wrapped in React.

### Key Components
*   **`EditorContainer.tsx`**: Manages the layout and switching between multiple open tabs.
*   **`Editor.tsx`**: The actual CodeMirror instance wrapper. It handles the lifecycle of the editor view.
*   **`FloatingSearch.tsx`**: A custom search widget that interfaces with CodeMirror's search API.

## 2. Implementation Details

### Configuration Compartments
The editor uses CodeMirror's `Compartment` system to allow dynamic reconfiguration without destroying the editor instance. This is crucial for performance.
*   **`fontThemeCompartment`**: Updates font size/family dynamically.
*   **`colorThemeCompartment`**: Switches between Light/Dark themes.
*   **`languageCompartment`**: Hot-swaps syntax highlighting (e.g., Markdown -> Python) when file extensions change.

### Performance Optimization ("Large File Mode")
The `Editor.tsx` contains logic to detect large files (based on line count vs `viewSettings.largeFileThreshold`).
If a file is deemed "Large":
*   `bracketMatching` is disabled.
*   `foldGutter` is disabled.
*   `markdownHighlighting` (complex AST parsing) is disabled in favor of simpler modes.
*   **Result:** Maintains 60 FPS scrolling even for multi-megabyte logs.

### Extensions Pipeline
The editor loads a robust set of plugins:
1.  **`slashCommands`**: Triggers a menu on `/`.
2.  **`templateVariables`**: Visually decorates `{{variable}}` patterns.
3.  **`inlineFormulas`**: Detects and highlights `{=FORMULA()}` patterns.
4.  **`actionButtons`**: Renders clickable widgets inside the text stream (if applicable).
5.  **`autocomplete`**: Context-aware completion based on local document words.

## 3. State Synchronization
*   **On Change:** Uses a debounced listener (`150ms`) to update the React state (`onChange` prop).
*   **Cursor Tracking:** Updates the global `cursorInfo` store on every selection change (for the Status Bar).

## 4. Assessment
*   **Strengths:** Extremely flexible, performant, and feature-rich. The use of Compartments is a best practice.
*   **Weaknesses:** The `underlinePlugin` (custom view plugin) iterates visible ranges; complex regexes here could impact scroll performance on very dense text.
