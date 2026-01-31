# High-Level Architecture Overview

## Overview
ContextPad is a local-first desktop application built using the **Tauri** framework. It leverages a modern web stack for its UI while utilizing Rust for secure system-level operations.

---

## 1. The "Thinking vs Execution" Philosophy
Architecturally, the app is designed as a **read-heavy drafting environment**. Unlike IDEs which focus on build/run cycles, ContextPad's architecture prioritizes:
- **Persistence Integrity:** Ensuring no thought is lost (IndexedDB + debounced saves).
- **Automation Friction-Reduction:** Rapid text transformation without leaving the keyboard.
- **Context Isolation:** Safe read-only regions (Locked Blocks) to preserve system prompts and constraints.

---

## 2. Structural Layers

### Desktop Bridge (Rust / Tauri)
- **File System:** Handles recursive directory scanning and workspace-aware I/O.
- **Security:** Manages the OS Keychain via the `keyring` crate for API keys.
- **Window:** Custom window decorations and drag-regions.

### State Engine (TypeScript / Zustand)
- **TabStore:** Centralized registry for all open documents.
- **ActionStore / TemplateStore:** Registries for user-defined logic and snippets.
- **SettingsStore:** Application configuration and workspace context.

### Editor Subsystem (CodeMirror 6)
- **Modular Core:** A compartment-based system that allows dynamic reconfiguration of syntax rules, themes, and font settings without re-initializing the editor.
- **Extension Pipeline:** Custom extensions handle the app's unique features (Inline Formulas, Variable Decoration, Locked blocks).

---

## 3. Data Flow Model

1. **User Action:** User types or executes a command.
2. **Editor Update:** CodeMirror updates its internal State and View.
3. **Zustand Sync:** The `EditorContainer` detects changes and updates the `TabStore`.
4. **Debounced Persistence:** 
    - **Immediately:** Metadata (tab titles, settings) is saved to `localStorage`.
    - **After 2s Idle:** The actual document content is pushed to `IndexedDB`.
5. **Rust Feedback:** For file operations, the UI invokes Rust commands via `@tauri-apps/api`.

---

## 4. Key Design Decisions

- **Why Remount Tabs?** In `EditorContainer.tsx`, the editor is remounted when switching tabs. This ensures a clean state restoration and prevents memory leaks from unused tab views, at the cost of per-tab undo history (which is currently globalized per-session).
- **Why Multi-Tiered Storage?** Using `IndexedDB` for content prevents the app from crashing due to `localStorage` size limits (usually 5MB), which is easily exceeded when drafting massive AI context windows.
- **Why Compartments?** CodeMirror Compartments allow for instant "Dark Mode" or "Font Change" transitions without the flicker of a full editor re-render.
