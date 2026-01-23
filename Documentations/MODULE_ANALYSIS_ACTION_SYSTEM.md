# Module Analysis: Action & Formula System

**Components:** `src/components/Sidebar/ActionManager.tsx`, `src/utils/actionExecutor.ts`, `src/services/formulaParser.ts`
**State:** `src/store/actionStore.ts`

---

## 1. Overview
The Action System is the user-extensibility layer. It allows users to define custom logic to manipulate text. It supports two distinct "engines" for different user skill levels.

## 2. Engine 1: The Formula Parser (`formulaParser.ts`)
A recursive descent parser that executes Excel-like functions.
*   **Tokenization:** Regex-based tokenizer (`tokenize` function) splits strings into Function Names and Arguments.
*   **Recursion:** Supports nested calls (e.g., `UPPER(TRIM(selection))`).
*   **Registry:** `FORMULA_FUNCTIONS` object maps names (`UPPER`, `UUID`) to actual JS implementations.
*   **Context Awareness:** Can access Editor state (Line number, Column) via a global context object set before execution.

## 3. Engine 2: JavaScript Sandbox (`actionExecutor.ts`)
A safer wrapper around `new Function()` to execute user code.
*   **Sandbox:** The code does **not** have direct access to the DOM or `window` object of the main app.
*   **Helpers API:** The code receives a `helpers` object:
    *   `getSelection()`, `replaceSelection()`, `insertAtCursor()`
    *   `insertTemplate()` (Reuses the template variable parser)
*   **Validation:** `validateActionCode` checks for syntax errors before saving.

## 4. Action Manager UI
*   **Formula Builder:** A GUI that lets users pick categories and functions to build formulas without typing.
*   **Filtering:** Actions are categorized and can be filtered/searched.
*   **Persistence:** Actions are saved to `localStorage` via `actionStore` (Zustand).

## 5. Assessment
*   **Strengths:**
    *   **Versatility:** Covers both non-technical users (Formulas) and developers (JS).
    *   **Safety:** The `helpers` abstraction prevents users from breaking the editor instance easily.
*   **Risks:**
    *   **Main Thread:** User JS runs on the main thread. A loop like `while(true)` will freeze the entire app.
    *   **Security:** Importing a malicious JSON action file could theoretically execute unwanted text replacements (though it can't steal files due to sandbox limits).
