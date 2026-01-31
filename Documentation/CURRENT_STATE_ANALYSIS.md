# ContextPad - Current State Analysis

**Date:** January 25, 2026
**Version:** v1.5.0-parallel
**Location:** `Repo/ContextPad/dev/ContextPad-v1.5.0-parallel`

---

## 1. Project Overview
**ContextPad** is a localized, offline-first notepad replacement designed for "pre-work" thinking. It bridges the gap between messy thoughts and structured execution, featuring advanced templating, custom actions, and workflow management without becoming a full-fledged IDE.

### Core Philosophy
- **Identity:** "Between thinking and execution."
- **Constraints:** No shell execution, no plugin ecosystem, no file explorer, no IDE features (debuggers/compilers).
- **Goal:** Reduce friction and ambiguity before handing off to other tools.

---

## 2. Technical Architecture

### Stack
- **Frontend:** React 18 (TypeScript), Vite 5
- **Backend/Host:** Tauri 2.9 (Rust)
- **State Management:** Zustand 4.5
- **Editor:** CodeMirror 6 (with multiple language support and custom themes)
- **Icons:** Lucide React
- **Build System:** npm / cargo

### Directory Structure
- `src/components`: UI components organized by feature (Sidebar, Editor, Layout).
- `src/store`: centralized state management via Zustand (`actionStore`, `templateStore`, `tabStore`, etc.).
- `src/services`: Core business logic (FormulaParser, IndexedDBStorage).
- `src-tauri`: Rust backend configuration and capabilities.
- `src/styles`: CSS modules and global styles.

---

## 3. Key Features & Implementation Status

### A. Editor & Tab Management
- **Multi-Tab Interface:** Supports multiple open files with metadata persistence.
- **Pinned Tabs (Workflows):** Dedicated "pinned" tabs that act as persistent workflows or scratchpads.
- **Content Persistence:** 
    - **Metadata:** `localStorage` (fast load).
    - **Content:** `IndexedDB` (large file support, debounced saving).
- **View Settings:** Extensive customization (Line numbers, Minimap, Word wrap, Theme, Font size/family).
- **Performance:** specialized settings for large files (parser modes, disable features threshold).

### B. Action Manager
- **Functionality:** Execute JavaScript commands or custom Formulas within the editor.
- **Organization:** Categorized actions, collapsible groups.
- **Bulk Operations:** Multi-select for Delete, Disable/Enable, and Pinning.
- **Persistence:** `localStorage` for actions and UI state (collapsed categories, sort order).
- **Code Types:** Supports both raw JavaScript and a simplified "Formula" syntax.

### C. Template Manager
- **Functionality:** Insert text snippets.
- **Variable Extraction:** Automatically detects `{{variables}}` in templates for dynamic insertion.
- **Organization:** Categorized templates, collapsible groups.
- **Bulk Operations:** Multi-select for Delete, Hide/Show, and Pinning.
- **Persistence:** `localStorage`.

### D. Settings & Customization
- **Themes:** Support for One Dark, Dracula, GitHub, Nord, VS Code.
- **Linting & Spellcheck:** Configurable built-in or browser-native spellcheck; basic linting for JSON/YAML/SQL/HTML.
- **Token Stats:** Visual indicator of token usage (approximated via `js-tiktoken`).

---

## 4. Data Management Strategy
- **Local Storage:** Used for user preferences, UI state (collapsed folders, active tab ID), and lightweight metadata (action lists, template definitions).
- **IndexedDB:** Used for heavy lifting—storing the actual content of open tabs to ensure data safety without bloating local storage constraints.
- **File System:** Explicit file saving/loading via Tauri API (dialogs) for exporting/importing configurations or saving files to disk.

---

## 5. Recent Improvements (v1.5.0)
- **Parallel Dev Branch:** Development is currently active in a parallel structure to ensure stability of the main branch.
- **Bulk Operations:** comprehensive bulk actions added to both Action and Template managers.
- **UI Refinements:**
    - Standardized scrollbars.
    - Improved category collapse persistence.
    - "Pinning" system for quick access to actions/templates.
- **Stability:** Focus on state persistence and preventing data loss.

---

## 6. Recommendations / Next Steps
*Based on current code and roadmap notes:*

1.  **Unified Preview System:** The roadmap mentions a need for HTML Live Preview and Mermaid diagrams.
2.  **Code Block Parameters:** Implementation of metadata for code blocks to support advanced features like "runnable" blocks or specific rendering contexts.
3.  **Documentation:** While internal notes exist, user-facing documentation for custom formulas and scripting actions could be expanded.
4.  **Testing:** No comprehensive test suite was observed in the source tree; adding unit tests for core logic (FormulaParser, Store reducers) is recommended.
