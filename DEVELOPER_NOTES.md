# Developer Notes

**Application:** ContextPad
**Version:** 1.3.3
**Framework:** Tauri 2.x + React 18 + CodeMirror 6

---

## 1. Architecture Overview

ContextPad is a local-first desktop text editor utilizing a hybrid architecture:
*   **Frontend:** React 18 with Zustand for state management.
*   **Editor:** CodeMirror 6, customized with extensions for Markdown, formulas, and large-file handling.
*   **Backend:** Tauri 2.x (Rust) handles file I/O, window management, and secure key storage.
*   **Persistence:** IndexedDB is used for content storage (Tabs) to bypass `localStorage` quotas, while `localStorage` retains lightweight metadata (Settings, recent files).

---

## 2. Editor Engine

**Location:** `src/components/Editor/Editor.tsx`

The editor is built on CodeMirror 6 and utilizes a "Compartment" system for dynamic reconfiguration.

### Key Implementation Details:
*   **Compartments:** `fontThemeCompartment`, `colorThemeCompartment`, and `languageCompartment` allow hot-swapping of themes, fonts, and syntax highlighting without destroying the editor instance.
*   **Large File Mode:** The editor automatically detects large files based on line count (default > 5000 lines). In this mode, resource-intensive features (Bracket Matching, Fold Gutter, AST-based Markdown Highlighting) are disabled to ensure 60fps scrolling performance.
*   **Extensions Pipeline:** The editor loads a custom extension stack including:
    *   `slashCommands`: Triggered by `/`.
    *   `templateVariables`: Decorates `{{variable}}` patterns.
    *   `inlineFormulas`: Detects `{=FORMULA()}` syntax.
    *   `autocomplete`: Context-aware completion engine.

---

## 3. Action & Formula System

**Location:** `src/services/formulaParser.ts`, `src/utils/actionExecutor.ts`

The application supports user-defined logic through two distinct engines.

### Engine A: Formula Parser
A recursive descent parser for Excel-like syntax.
*   **Syntax:** `FUNCTION(arg1, arg2)`. Nested calls like `UPPER(TRIM(selection))` are supported.
*   **Registry:** `FORMULA_FUNCTIONS` maps keywords to JavaScript implementations.
*   **Context:** Functions can access editor state (Line number, Column) via a global context object.

### Engine B: JavaScript Sandbox
A restricted execution environment for complex scripts.
*   **Mechanism:** Uses the `Function` constructor with a limited scope. Direct access to `window` or DOM is restricted.
*   **Helpers API:** Scripts receive a `helpers` object to interact with the editor:
    *   `getSelection()` / `replaceSelection(text)`
    *   `insertAtCursor(text)`
    *   `insertTemplate(content)` (Invokes the template parser)
    *   `getAllText()` / `replaceAllText(text)`

---

## 4. Token Estimator Service

**Location:** `src/services/tokenEstimator/TokenEstimatorService.ts`

A singleton service managing token counting across multiple providers.

*   **Offline Mode:** Uses `js-tiktoken` (WASM) for local OpenAI model estimation.
*   **Online Mode:** Connects to Anthropic/Google APIs for proprietary tokenizers.
*   **Debouncing:** Calculations are debounced (1000ms idle / 5000ms max wait) to prevent API rate limiting.
*   **Caching:** Results are cached based on `Hash(Content + ModelID)` to deduplicate requests.
*   **Approximation:** For files exceeding 50,000 characters, the service samples the text and extrapolates the token count to avoid freezing the UI.

---

## 5. Navigation & Sidebar

**Location:** `src/components/Breadcrumb/Breadcrumb.tsx`, `src/components/Sidebar/`

### Breadcrumb Navigation
*   **Logic:** Parses the active file path relative to the workspace root.
*   **Interaction:** Clicking a segment calls the Rust command `read_directory` to fetch folder contents on-demand, rendering a dropdown portal for navigation.

### Sidebar Tools
*   **Resizable Pane:** Implements custom drag handlers constrained between 250px and 600px.
*   **Virtualization:** The File Explorer utilizes virtualized lists to handle large directory structures (e.g., `node_modules`) without DOM overload.
*   **Template Manager:** Uses the native HTML5 Drag and Drop API for inserting templates into the editor.

---

## 6. Intelligence Services

**Location:** `src/services/autocompleteService.ts`, `src/services/spellCheckService.ts`

### Autocomplete
*   **Dual Source:** Combines hardcoded snippets (`func`, `table`) with dynamic document scanning.
*   **Windowed Scanning:** Scans only a ±5000 character window around the cursor to find repeated words, ensuring performance in large files.
*   **Context Awareness:** Detects cursor context (Code Block vs. Markdown) to filter relevant suggestions.

### Spell Check
*   **Architecture:** Custom linter implementation instead of browser native spellcheck.
*   **Dictionary:** Loads a 50k word dictionary from `public/Dictionaries/en-US.txt`.
*   **Lazy Evaluation:** Suggestions are computed only when the user interacts with a flagged word (Levenshtein distance), deferring expensive calculations.

### Code Linting
*   **Heuristic Validation:** Uses regex and stack-based parsing to validate embedded JSON, YAML, and HTML within Markdown code blocks.

---

## 7. Security & Persistence

*   **API Keys:** Stored in the OS Keychain via the `keyring` crate in Rust. Keys are never saved to plain-text files.
*   **File I/O:** All file operations are gated through Rust commands using `rfd` dialogs for explicit user confirmation.
*   **State:** The application uses a strictly typed `TabState` interface. `localStorage` is used for preferences, while `IndexedDB` handles content persistence.
