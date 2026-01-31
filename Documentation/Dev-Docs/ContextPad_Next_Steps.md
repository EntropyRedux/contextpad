# ContextPad: Development Handover & Roadmap

**Version:** 1.5.1-dev
**Date:** January 31, 2026
**Status:** Post-Fix Stability / Ready for Feature Phase

---

## 1. Executive Summary
ContextPad is a local-first, "Thinking Environment" built on **Tauri v2** and **React**. Unlike standard code editors, it prioritizes **persistence integrity** (never lose a thought) and **text automation** (formulas, macros). 

**Core Philosophy:** 
- **Read-Heavy Drafting:** Optimized for reading and structuring thoughts, not just compiling code.
- **Context Isolation:** Uses "Locked Blocks" and "Blueprints" to manage context for AI interactions.
- **Native Performance:** Rust backend for heavy lifting (File I/O, Secrets), React for fluid UI.

---

## 2. Architecture Snapshot

### Frontend (React + Zustand + CodeMirror 6)
*   **State Management:** `Zustand` with a multi-tiered storage strategy:
    *   **Metadata (Tabs, Settings):** `localStorage` (Fast, synchronous).
    *   **Content (Large Docs):** `IndexedDB` (Async, massive capacity).
*   **Editor:** `CodeMirror 6` with a custom extension pipeline:
    *   `lockedEditorExtension`: Implements "Read-Only" zones.
    *   `codeBlockParams`: Custom parser for metadata (e.g., `json {lock=true}`).
    *   `inlineFormulas`: Excel-like functions inside text (`=UPPER(selection)`).

### Backend (Rust / Tauri v2)
*   **Command Pattern:** All system operations (`read_file`, `secrets`) are exposed via `src-tauri/src/commands`.
*   **Security:** `tauri-plugin-single-instance` ensures singleton behavior. `keyring` crate manages API keys.

---

## 3. Recent Updates (v1.5.0-parallel)
The following critical fixes were applied on Jan 31, 2026:

1.  **Code Block Array Support:** The parser now supports nested arrays: `javascript {tags=["ai", "rag"]}`. *Prerequisite for AI Blueprints.*
2.  **Category Freedom:** Removed forced UPPERCASE normalization in `ActionStore` and `TemplateStore`.
3.  **Action Builder UX:** Added `Description` field, `Type Badges` (Button vs Command), and `Aria Labels`.
4.  **Startup Stability:** Refactored `useStartupFiles` to fix a re-subscription race condition that caused duplicate tabs on file open.
5.  **Dev/Prod Coexistence:** Changed dev identifier to `com.entropyredux.contextpad.dev` to allow running alongside the installed version.

---

## 4. Feature Roadmap (Immediate Priorities)

### Feature A: AI Blueprint Exports (Priority: High)
**Goal:** Transform markdown documents into machine-readable "RAG Blueprints" (JSON/YAML).
**Use Case:** User tags a code block with `embedding_model=["ada-002"]`. The export generates a JSON file where that block is pre-chunked and tagged, ready for a Vector DB.

**Implementation Plan:**
1.  **New Store:** Create `BlueprintStore` (or extend `ActionStore`) to manage export configurations.
2.  **Export Logic:**
    *   Parse the Markdown AST (using `remark` or internal logic).
    *   Extract `codeBlockParams` (using the newly fixed array support).
    *   Generate a JSON structure:
        ```json
        {
          "title": "Doc Title",
          "chunks": [
            { "content": "...", "tags": ["ai", "rag"], "model": "ada-002" }
          ]
        }
        ```
3.  **UI:** Add an "Export Blueprint" button in the Sidebar.

**Dependencies Needed:**
*   `js-yaml` (Frontend) or `serde_yaml` (Backend) - *Standard libraries, low risk.*

### Feature B: HTML Live Preview (Priority: Medium)
**Goal:** Real-time visualization of the document as rendered HTML.
**Use Case:** User is designing a UI component or email template. They see the result in a browser window that updates instantly.

**Implementation Plan:**
1.  **Rust Backend (`src-tauri`):**
    *   Add `axum` crate to spin up a local HTTP server (e.g., `http://127.0.0.1:3000`).
    *   Implement a WebSocket route (`/ws`) for hot-reload signals.
2.  **Frontend:**
    *   Create `usePreviewSync` hook.
    *   On editor change (debounced), send HTML content to the Rust server via WebSocket.
3.  **UX:**
    *   "Start Preview Server" toggle in the Activity Bar.

**Dependencies Needed:**
*   Crates: `axum`, `tokio`, `tower-http`.

### Feature C: Smart Clipboard Watcher (Priority: Low)
**Goal:** "listen" to external clipboard changes (e.g., Excel copy) and auto-paste formatted text into a target zone.

**Implementation Plan:**
1.  **Plugin:** Install `tauri-plugin-clipboard-manager`.
2.  **Logic:**
    *   Frontend poll or Backend event loop checking clipboard content hash.
    *   If changed -> Parse -> Insert into active editor at specific marker.

---

## 5. Refactoring Requirements

1.  **ActionManager Extensibility:** Currently hardcoded for "Formula" and "JS". Needs a generic "Job" interface to handle "Exports" and "Server Toggles" without bloating the component.
2.  **Locked Blocks UX:** The current implementation locks content but not the "markers" (fences). Users can accidentally delete the backticks.
    *   *Fix:* Update `lockedEditorExtension` to treat the *entire range* (including fences) as atomic/read-only.

## 6. How to Use This Document (For AI Agents)
*   **Context:** Use Section 2 to understand where files are located (`src/store`, `src-tauri/src/commands`).
*   **State:** Section 3 details what *works now*. Do not try to fix "UPPERCASE categories" or "Duplicate Tabs" - they are done.
*   **Action:** When asked to "Implement Blueprints," refer to **Feature A** in Section 4. Use the `codeBlockParams` util (which now supports arrays) to extract the data.
