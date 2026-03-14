# Changelog
All notable changes to this project will be documented in this file.

## [1.10.0] - 2026-03-14
### Added
- **Monokai Syntax Theme:** Added a first-party Monokai editor theme in the syntax theme registry.
- **Expanded Font Options:** Added `Inter`, `Roboto`, and `Serif` to editor font choices.
- **App-Wide Font Toggle:** Added `Apply selected font app-wide` setting and startup-time font hydration to avoid first-render font mismatch.
- **Desktop Build Preflight:** Added `tauri:preflight` script and preflight checks for Node/npm/Tauri/Rust tooling.

### Changed
- **Markdown Heading Accent Behavior:** Heading accent override is now compatible with syntax-theme marker colors (markdown markers/fences no longer forced to gray by the markdown override layer).
- **Status Bar Badge Contrast:** Token badges (`Live`, `Cached`, `Est`) now use semantic class-based colors with explicit text contrast, independent of accent selection.
- **Action Import Robustness:** Import pipeline now sanitizes malformed actions, supports legacy payload shapes, and normalizes legacy clipboard calls to the supported helper API.
- **Action Runtime Compatibility:** Added helper aliases to maintain compatibility with older action snippets (`helpers.toCopy`, `helpers.copy`, `navigator.clipboard.writeText`).

### Fixed
- **COPY Action Runtime Errors:** Resolved `editor is not defined` and clipboard helper mismatches in migrated action scripts.
- **Clipboard Execution in Sandbox:** Implemented reliable clipboard mutation bridging from sandboxed actions to main app context.
- **Menu Bar Font Inheritance:** Menu bar controls now properly follow app-wide font when enabled.
- **V0 Session Stop Logging Path:** Corrected workspace root resolution for stop-hook logging and ensured log directory creation.

### Build & Packaging
- **Executable Build Verified:** `src-tauri/target/release/contextpad.exe`
- **NSIS Installer Verified:** `src-tauri/target/release/bundle/nsis/ContextPad_1.10.0_x64-setup.exe`

## [1.9.2] - 2026-02-22
### Added
- **AST Formula Engine (Phase 3):** Replaced the legacy regex-based formula string matching with a fully hand-crafted Recursive Descent Parser. ContextPad now securely and flawlessly evaluates heavily nested inline macros (e.g., `{=UPPER(TRIM(selection))}`) into an Abstract Syntax Tree (AST) before runtime execution.
- **Dynamic Script Execution Sandbox (Phase 2):** Eradicated the unsafe `new Function` JavaScript macro evaluation. Custom user Action Scripts are now executed entirely within an isolated, invisible `iframe` sandbox that cannot access the DOM or Node APIs. Manipulations are piped back to CodeMirror securely via `postMessage`.
- **System Hardening:**
  - Enforced strict CORS policy limiting the Rust preview server strictly to `localhost:1420`.
  - Removed `'unsafe-eval'` from the Content Security Policy explicitly.
- **Robust Application Startup:**
  - Refactored `src-tauri/src/main.rs` and `useStartupFiles.ts` to utilize event-driven hydration rather than a fragile `thread::sleep` delay.
  - Rewrote cross-platform directory definitions using `@tauri-apps/api/path` to natively support macOS and Linux pathing without hardcoded Windows `\\` limiters.
- **Port Resilience:** Disabled `strictPort` on Vite to allow dynamic fallback if port 5173 is occupied.

## [1.9.0] - 2026-02-08
### Added
- **Reworked Live Preview:** 
  - Switched to an optimized surgical DOM update engine (prevents flickering).
  - Integrated GitHub Flavored Markdown (GFM) styling.
  - Added real-time customization for Font Scale, Max Width, and Margins via an `eval` bridge.
  - Improved Mermaid robustness with automatic retry logic and diagram cleanup.
  - Implemented an interactive Table of Contents (TOC) with Scroll Spy highlighting and auto-expanding sections.
- **Contextual Bookmarks:** New pinned tab type that opens actual files from disk instead of loading blueprints.
- **Hybrid Context Menus:** 
  - Added custom context menus for Tabs (Close Others/All) and File Explorer (Rename/Delete/Open in Explorer).
  - Preserved the native OS context menu in the Editor to keep features like "Talk to Type," Emojis, and Clipboard History.
- **UI Refinement:** 
  - Sleek, semi-transparent design for Action Buttons.
  - New "View" settings section to toggle Activity Bar, Status Bar, and Line Numbers.
  - Category normalization (forced UPPERCASE) across all managers for data consistency.
  - Improved Category Input UX with a hybrid select/input component.
- **File System Protection:** Locked blocks now fully protect their fence markers (```).
- **Core Reliability:** Added a `processingFilesRef` to prevent double-tab opening during file drops.

### Changed
- **Tauri v2 Migration:** Fully updated the backend and capabilities system to Tauri v2 standards.
- **Performance:** Implemented debounced metadata persistence (500ms) to eliminate UI micro-stutters during typing.

### Fixed
- **ReferenceErrors:** Resolved multiple startup and runtime errors related to undefined variables in the editor helpers.
- **Hook Order Warnings:** Refactored `App.tsx` to strictly follow React Hook rules.

## [1.5.0-dev] - 2026-01-31
### Added
- **Android Support:** Added v0.1.0 APK for Android Tablets (Keyboard-first design).
- **Linux Support:** Added official `.AppImage` build for Linux platforms.
- **Action Description:** New description field in the Action Builder.
- **Action Type Indicators:** Visual badges in the sidebar.

### Fixed
- **Startup Reliability:** preventing duplicate tabs.
- **Accessibility:** Added missing aria-labels.

## [1.5.0] - 2026-01-25
### Added
- **Welcome Document:** Interactive introduction loaded on first launch.
- **Workflow Smart Navigation:** Single-click vs Double-click behavior.
- **Bulk Operations:** Multi-select support in all managers.

## [1.0.0] - 2021-01-03
### Added
- First production-ready release.