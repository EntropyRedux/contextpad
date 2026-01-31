# Technical Report: Drag-and-Drop Implementation

**Date:** January 25, 2026
**Feature:** File Drag-and-Drop to Editor
**Status:** Implemented (v1.5.0)

---

## 1. Technical Mechanism

Unlike standard web applications that use the HTML5 `ondrop` event, ContextPad (as a Tauri app) uses the **Tauri Webview Event System**. 

### Why not HTML5?
Standard browser drag events do not provide the full OS file path for security reasons (they usually provide a File object with limited metadata). Tauri intercepts the OS-level drop event and provides the absolute file paths directly to the frontend.

### Implementation Details
- **Configuration:** Enabled via `"dragDropEnabled": true` in `tauri.conf.json`.
- **Event Listener:** Implemented in `src/hooks/useFileDrop.ts`.
- **Event Name:** `tauri://drop` (detected via `onDragDropEvent` in Tauri v2).
- **Processing:** 
    1. The payload is parsed for a list of paths.
    2. Files are filtered against a `SUPPORTED_EXTENSIONS` set.
    3. Supported files are read via the Rust `read_file` command.
    4. New tabs are spawned via the `TabStore`.

---

## 2. Visual Feedback (UX)

To provide clear feedback, a global CSS overlay is triggered during the drag operation.

- **Trigger:** The hook adds the `.file-dragging` class to the `document.body` on `enter` and removes it on `drop` or `leave`.
- **Style:** Defined in `src/styles/global.css`. It creates a dashed blue border and a semi-transparent overlay stating "Drop files to open".

---

## 3. Troubleshooting the Dev Build

If drag-and-drop is not working in your development environment (`npm run tauri:dev`), check the following:

### A. Windows Privilege Isolation (UIPI) - MOST LIKELY
Windows prevents "Lower Privilege" applications from sending messages to "Higher Privilege" applications.
- **Problem:** If you run your Terminal/IDE as **Administrator**, but your File Explorer is running as a **Normal User**, Windows will block the drag-and-drop event.
- **Solution:** Run both as the same user level (standard user is recommended).

### B. Configuration Refresh
Tauri's `tauri.conf.json` changes are not always hot-reloaded perfectly.
- **Solution:** Completely stop the dev server (Ctrl+C) and run `npm run tauri:dev` again to ensure the `"dragDropEnabled": true` flag is active.

### C. Capability Permissions
The `tauri://drop` event is an internal Tauri event.
- **Verification:** Ensure `src-tauri/capabilities/default.json` contains `"core:event:default"`, `"core:event:allow-listen"`, and `"core:default"`.

### D. Console Debugging
1. Open DevTools in the app (F12 or Right-click -> Inspect).
2. Look for any `window.onDragDropEvent is not a function` or permission errors.
3. If no overlay appears, the `enter` event is not being captured.

---

## 4. Supported File Types
The system currently whitelists:
- **Markdown:** `.md`, `.markdown`
- **Text:** `.txt`, `.text`, `.log`, `.ini`, `.cfg`, `.conf`, `.env`
- **Code:** `.json`, `.yaml`, `.yml`, `.xml`, `.js`, `.ts`, `.py`, `.rs`, `.sql`, etc.
- **Special:** `Dockerfile`, `Makefile` (detected by name if no extension).