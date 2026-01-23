# Module Analysis: Intelligence Services

**Components:**
*   `src/services/autocompleteService.ts`
*   `src/services/spellCheckService.ts`
*   `src/services/codeLintService.ts`

**Integration:** CodeMirror Extensions (in `Editor.tsx`)

---

## 1. Autocomplete Service
A context-aware completion engine that mixes hardcoded snippets with dynamic document scanning.

### Strategy
*   **Dual Source:** Combines:
    1.  **Snippets:** Pre-defined templates (`func`, `if`, `table`) triggered by keywords.
    2.  **Document Words:** Scans the local document for repeated words (e.g., variable names).
*   **Context Awareness:**
    *   Uses `syntaxTree` to detect if the cursor is inside a `FencedCode` block.
    *   **Markdown Context:** Suggests `h1`, `link`, `image`.
    *   **Code Context:** Suggests `func`, `log`, `json`.
*   **Performance:**
    *   **Windowed Scanning:** Instead of scanning the entire document for words, it only scans a `±5000` character window around the cursor. This keeps typing fast even in 10MB files.

---

## 2. Spell Check Service
A custom-built linter that avoids the performance pitfalls of standard browser spellchecking.

### Architecture
*   **Custom Linter:** Uses CodeMirror's `linter()` API instead of the browser's `spellcheck="true"` attribute (though a browser mode is available).
*   **Dictionary:** Loads a `50k` word dictionary from `public/Dictionaries/en-US.txt`.
*   **Lazy Suggestions:**
    *   The linter *detects* errors eagerly but does **not** compute suggestions immediately.
    *   **Levenshtein Distance:** Computation is deferred until the user clicks "Get Suggestions". This prevents the UI from freezing when linting thousands of words.
*   **Session Ignore:** Supports "Ignore Word" and "Add to Dictionary" actions that update the `tabStore` settings.

---

## 3. Code Linting Service
A lightweight, syntax-aware linter for code blocks *embedded* within Markdown.

### Logic
*   **Tree Traversal:** Iterates the syntax tree to find `FencedCode` nodes.
*   **Language Detection:** Extracts the language string (e.g., `json`, `yaml`) from the fence info.
*   **Validators:**
    *   **JSON:** Uses `JSON.parse()` to catch syntax errors.
    *   **YAML:** checks indentation parity (2-space rule).
    *   **HTML:** Simple stack-based tag matching (`<div>` must meet `</div>`).
    *   **JS:** Brace matching.

### Value
This allows ContextPad to act as a "Code Playground" within a documentation tool. Users get immediate feedback if their example code is invalid.

---

## 4. Assessment
*   **Strengths:**
    *   **Zero-Lag Typing:** All services use debouncing (`delay: 500`) or windowed scanning.
    *   **Context Sensitivity:** It knows the difference between writing prose and writing code.
*   **Limitations:**
    *   **Linter Depth:** The code linters are "heuristic" (regex/stack-based) rather than using full language servers (LSP). This is a deliberate choice for file size and speed.
