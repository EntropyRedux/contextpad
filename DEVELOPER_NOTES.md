# Developer Notes

## Last updated since
January 25, 2026

## High-Level Architecture
ContextPad is a Tauri-based desktop app using a React/Zustand frontend and a Rust backend.
- **Frontend:** Handles UI, state management, and the CodeMirror 6 engine.
- **Backend (Rust):** Manages secure keychain access, file system I/O, and window decorations.

## Core Concepts
- **Thinking vs. Execution:** The app is optimized for high-friction drafting, not low-friction engineering (no shell access).
- **Locked Islands:** A SyntaxTree-based locking system that allows precise "editable holes" (`[[...]]`) within read-only regions.
- **Action Exclusions:** The ability for logic (JS/Formula) to "ignore" parts of a document based on metadata flags.

## Data Flow
User Input → CodeMirror (State) → Zustand (TabStore) → IndexedDB (Persistence).
Settings → Zustand (SettingsStore) → LocalStorage (Metadata).
Secrets → Rust Command → OS Keychain.

## Key Design Decisions
- **Zustand over Redux:** Chosen for low boilerplate and performant partial state subscriptions (crucial for a complex editor).
- **IndexedDB for Content:** Alternative to `localStorage` to bypass the 5MB quota for large drafting sessions.
- **Compartments (CodeMirror):** Used instead of reconfiguring the whole editor to allow instant theme/font swaps without flickering.
- **Dual-Click Workflows:** Single-click for navigation vs. Double-click for instantiation balances speed and safety.

## Folder Structure
- `src/components/Sidebar/shared`: Unifies the UI logic for Actions, Templates, and Workflows.
- `src/extensions`: Custom CodeMirror logic (Formulas, Locking, Variables).
- `src/services/storage`: Strategy pattern for persistence (IndexedDB vs LocalStorage).

## Development Setup
1. `npm install`
2. `npm run tauri:dev`
3. Debugging: Use browser devtools for UI and terminal for Rust logs.

## Gotchas
- **Position Drift:** Do not use index-based positions for code blocks; always use the `syntaxTree` to query `FencedCode` nodes.
- **Zustand Persistence:** Metadata is saved immediately; content is debounced by 2 seconds. Don't close the app instantly after a large paste.

## Future Work
- **AI Blueprint Export / Transform** Transform/Download documents into highly structured AI agent/chatbot processing documents, e.g. attentionn mechanism, vecor embedding tags, frontmatter
- **HTML export / Live Preview with Hot Reload:** Implementation preview handled by the default browser and online dependencies
- **Code Block Parameters:** Expansion of the metadata parser to support more key-value pairs for plugin-like behavior.