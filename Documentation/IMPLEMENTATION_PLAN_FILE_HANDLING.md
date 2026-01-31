# Implementation Plan: File Drag-Drop & File Associations

**Date:** January 25, 2026
**Version:** v1.5.0-parallel
**Location:** `Repo/ContextPad/dev/ContextPad-v1.5.0-parallel`
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#1-overview)
2. [Current State Analysis](#2-current-state-analysis)
3. [Part A: Drag-and-Drop Implementation](#3-part-a-drag-and-drop-implementation)
4. [Part B: File Associations (Open With...)](#4-part-b-file-associations-open-with)
5. [Part C: Single Instance Support](#5-part-c-single-instance-support)
6. [File Change Summary](#6-file-change-summary)
7. [Testing Guide](#7-testing-guide)
8. [Rollback Plan](#8-rollback-plan)
9. [Sources](#9-sources)

---

## 1. Overview

### Goals

| Feature | Description |
|---------|-------------|
| **Drag-and-Drop** | Drag files from Explorer into ContextPad to open them as tabs |
| **File Associations** | Right-click → "Open with ContextPad" for `.md`, `.txt`, `.json`, etc. |
| **Single Instance** | Opening a file when app is running adds a tab instead of new window |

### Technical Requirements

- **Tauri Version:** v2.9.x (already installed)
- **New Plugins Required:**
  - `tauri-plugin-deep-link` (file associations)
  - `tauri-plugin-single-instance` (prevent duplicate windows)
- **Frontend Changes:** Add drag-drop event listener hook
- **Rust Changes:** Handle CLI arguments on startup

---

## 2. Current State Analysis

### Existing Infrastructure

| Component | Status | Location |
|-----------|--------|----------|
| File reading | ✅ Implemented | `src-tauri/src/commands/file.rs` → `read_file()` |
| Language detection | ✅ Implemented | `src-tauri/src/commands/file.rs` → `detect_language_from_path()` |
| Tab creation | ✅ Implemented | `src/store/tabStore.ts` → `addTab()` |
| File operations hook | ✅ Implemented | `src/hooks/useFileOperations.ts` |
| Recent files | ✅ Implemented | `tabStore.ts` → `addRecentFile()` |
| Drag-drop handling | ❌ Not implemented | — |
| File associations | ❌ Not implemented | — |
| Single instance | ❌ Not implemented | — |

### Current Tauri Configuration

**File:** `src-tauri/tauri.conf.json`
```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ContextPad",
  "version": "1.5.0",
  "identifier": "com.entropyredux.contextpad",
  "app": {
    "windows": [{
      "title": "ContextPad",
      "width": 1000,
      "height": 650,
      "decorations": false
    }]
  }
}
```

### Current Rust Dependencies

**File:** `src-tauri/Cargo.toml`
```toml
[dependencies]
tauri = { version = "2", features = [] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rfd = "0.15"
keyring = "3.6.3"
```

---

## 3. Part A: Drag-and-Drop Implementation

### Approach

Use Tauri v2's native `onDragDropEvent` from the webview/window API. Browser's native drag events don't provide file paths in Tauri for security reasons.

### Step A1: Enable Drag-Drop in Config

**File:** `src-tauri/tauri.conf.json`

Add `dragDropEnabled: true` under the window configuration:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ContextPad",
  "version": "1.5.0",
  "identifier": "com.entropyredux.contextpad",
  "app": {
    "windows": [{
      "title": "ContextPad",
      "width": 1000,
      "height": 650,
      "minWidth": 500,
      "minHeight": 400,
      "decorations": false,
      "transparent": false,
      "dragDropEnabled": true
    }]
  }
}
```

### Step A2: Create Drag-Drop Hook

**File:** `src/hooks/useFileDrop.ts` (NEW FILE)

```typescript
import { useEffect, useRef, useCallback } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

// Supported file extensions for opening
const SUPPORTED_EXTENSIONS = new Set([
  'md', 'markdown', 'txt', 'text', 'log', 'ini', 'cfg', 'conf',
  'json', 'yaml', 'yml', 'xml', 'csv', 'tsv',
  'html', 'htm', 'css', 'scss', 'sass', 'less',
  'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs',
  'py', 'pyw', 'rb', 'php', 'java', 'c', 'cpp', 'h', 'hpp',
  'rs', 'go', 'swift', 'kt', 'scala', 'lua',
  'sh', 'bash', 'zsh', 'ps1', 'bat', 'cmd',
  'sql', 'graphql', 'gql',
  'env', 'gitignore', 'dockerignore', 'editorconfig'
])

interface DragDropPayload {
  type: 'enter' | 'over' | 'drop' | 'leave'
  paths: string[]
  position: { x: number; y: number }
}

export function useFileDrop() {
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const setActiveTab = useTabStore(state => state.setActiveTab)
  const addRecentFile = useTabStore(state => state.addRecentFile)

  const isDraggingRef = useRef(false)

  /**
   * Get file extension from path
   */
  const getExtension = (path: string): string => {
    const parts = path.split('.')
    if (parts.length < 2) return ''
    return parts[parts.length - 1].toLowerCase()
  }

  /**
   * Check if file is supported
   */
  const isSupported = (path: string): boolean => {
    const ext = getExtension(path)
    // Files without extension (like Dockerfile, Makefile) are supported
    if (!ext) {
      const filename = path.split(/[/\\]/).pop()?.toLowerCase() || ''
      return ['dockerfile', 'makefile', 'jenkinsfile', 'vagrantfile'].includes(filename)
    }
    return SUPPORTED_EXTENSIONS.has(ext)
  }

  /**
   * Open a single file in a new tab (or navigate to existing)
   */
  const openFileInTab = useCallback(async (filePath: string) => {
    try {
      // Check if file is already open
      const existingTab = tabs.find(t => t.filePath === filePath)
      if (existingTab) {
        setActiveTab(existingTab.id)
        return
      }

      // Read file content
      const content = await invoke<string>('read_file', { path: filePath })

      // Get filename
      const fileName = await invoke<string>('get_file_name', { path: filePath })

      // Detect language
      const language = await invoke<string>('detect_language_from_path', { path: filePath })

      // Create new tab
      addTab({
        title: fileName,
        content,
        filePath,
        language,
        isDirty: false
      })

      // Add to recent files
      addRecentFile(filePath)

    } catch (error) {
      console.error(`Failed to open file: ${filePath}`, error)
    }
  }, [tabs, addTab, setActiveTab, addRecentFile])

  /**
   * Handle multiple dropped files
   */
  const handleDroppedFiles = useCallback(async (paths: string[]) => {
    // Filter to supported files only
    const supportedPaths = paths.filter(isSupported)

    if (supportedPaths.length === 0) {
      console.warn('No supported files in drop')
      return
    }

    // Open files sequentially to maintain order
    for (const path of supportedPaths) {
      await openFileInTab(path)
    }
  }, [openFileInTab])

  /**
   * Set up drag-drop event listener
   */
  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async () => {
      try {
        const currentWindow = getCurrentWindow()

        unlisten = await currentWindow.onDragDropEvent((event) => {
          const payload = event.payload as DragDropPayload

          switch (payload.type) {
            case 'enter':
              isDraggingRef.current = true
              // Optional: Add visual feedback class to body
              document.body.classList.add('file-dragging')
              break

            case 'over':
              // Could update drop zone highlight based on position
              break

            case 'drop':
              isDraggingRef.current = false
              document.body.classList.remove('file-dragging')

              if (payload.paths && payload.paths.length > 0) {
                handleDroppedFiles(payload.paths)
              }
              break

            case 'leave':
              isDraggingRef.current = false
              document.body.classList.remove('file-dragging')
              break
          }
        })
      } catch (error) {
        console.error('Failed to set up drag-drop listener:', error)
      }
    }

    setupListener()

    // Cleanup on unmount
    return () => {
      if (unlisten) {
        unlisten()
      }
      document.body.classList.remove('file-dragging')
    }
  }, [handleDroppedFiles])

  return {
    isDragging: isDraggingRef.current
  }
}
```

### Step A3: Add Visual Feedback Styles

**File:** `src/styles/global.css` (ADD to existing file)

```css
/* Drag-drop visual feedback */
body.file-dragging {
  position: relative;
}

body.file-dragging::after {
  content: 'Drop files to open';
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 3px dashed rgba(59, 130, 246, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 600;
  color: rgba(59, 130, 246, 0.8);
  pointer-events: none;
  z-index: 9999;
}
```

### Step A4: Initialize Hook in App

**File:** `src/App.tsx`

Add the hook import and call:

```typescript
// Add import at top
import { useFileDrop } from './hooks/useFileDrop'

function App() {
  // ... existing code ...

  // Initialize file drop handler
  useFileDrop()

  // ... rest of component ...
}
```

---

## 4. Part B: File Associations (Open With...)

### Approach

1. Configure file associations in Tauri bundle config
2. Add `tauri-plugin-deep-link` for handling file opens
3. Listen for file paths passed as CLI arguments on startup
4. On Windows/Linux, use single-instance plugin to forward to existing window

### Step B1: Install Deep Link Plugin (Rust)

**File:** `src-tauri/Cargo.toml`

Add the plugin dependency:

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-deep-link = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rfd = "0.15"
keyring = "3.6.3"
```

### Step B2: Install Deep Link Plugin (Frontend)

Run in terminal:
```bash
cd src-tauri/../
npm install @tauri-apps/plugin-deep-link
```

Or add to `package.json`:
```json
{
  "dependencies": {
    "@tauri-apps/plugin-deep-link": "^2.0.0"
  }
}
```

### Step B3: Configure File Associations

**File:** `src-tauri/tauri.conf.json`

Add bundle file associations:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "ContextPad",
  "version": "1.5.0",
  "identifier": "com.entropyredux.contextpad",
  "app": {
    "windows": [{
      "title": "ContextPad",
      "width": 1000,
      "height": 650,
      "minWidth": 500,
      "minHeight": 400,
      "decorations": false,
      "transparent": false,
      "dragDropEnabled": true
    }],
    "security": {
      "csp": null
    }
  },
  "bundle": {
    "active": true,
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "fileAssociations": [
      {
        "ext": ["md", "markdown"],
        "name": "Markdown Document",
        "description": "Markdown text file",
        "role": "Editor",
        "mimeType": "text/markdown"
      },
      {
        "ext": ["txt", "text", "log"],
        "name": "Text Document",
        "description": "Plain text file",
        "role": "Editor",
        "mimeType": "text/plain"
      },
      {
        "ext": ["json"],
        "name": "JSON Document",
        "description": "JSON data file",
        "role": "Editor",
        "mimeType": "application/json"
      },
      {
        "ext": ["yaml", "yml"],
        "name": "YAML Document",
        "description": "YAML configuration file",
        "role": "Editor",
        "mimeType": "text/yaml"
      },
      {
        "ext": ["xml"],
        "name": "XML Document",
        "description": "XML data file",
        "role": "Editor",
        "mimeType": "application/xml"
      },
      {
        "ext": ["html", "htm"],
        "name": "HTML Document",
        "description": "HTML web page",
        "role": "Editor",
        "mimeType": "text/html"
      },
      {
        "ext": ["css", "scss", "sass", "less"],
        "name": "Stylesheet",
        "description": "CSS stylesheet",
        "role": "Editor",
        "mimeType": "text/css"
      },
      {
        "ext": ["js", "jsx", "mjs", "cjs"],
        "name": "JavaScript File",
        "description": "JavaScript source file",
        "role": "Editor",
        "mimeType": "text/javascript"
      },
      {
        "ext": ["ts", "tsx"],
        "name": "TypeScript File",
        "description": "TypeScript source file",
        "role": "Editor",
        "mimeType": "text/typescript"
      },
      {
        "ext": ["py", "pyw"],
        "name": "Python File",
        "description": "Python source file",
        "role": "Editor",
        "mimeType": "text/x-python"
      },
      {
        "ext": ["rs"],
        "name": "Rust File",
        "description": "Rust source file",
        "role": "Editor",
        "mimeType": "text/rust"
      },
      {
        "ext": ["sql"],
        "name": "SQL File",
        "description": "SQL query file",
        "role": "Editor",
        "mimeType": "application/sql"
      },
      {
        "ext": ["csv", "tsv"],
        "name": "Data File",
        "description": "Comma/Tab separated values",
        "role": "Editor",
        "mimeType": "text/csv"
      },
      {
        "ext": ["ini", "cfg", "conf", "env"],
        "name": "Configuration File",
        "description": "Configuration file",
        "role": "Editor",
        "mimeType": "text/plain"
      }
    ]
  },
  "plugins": {
    "deep-link": {
      "desktop": {
        "schemes": ["contextpad"]
      }
    }
  }
}
```

### Step B4: Register Plugin in Rust

**File:** `src-tauri/src/main.rs`

Update to register the deep-link plugin and handle CLI arguments:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        // Register deep-link plugin
        .plugin(tauri_plugin_deep_link::init())
        // Set up handler for when app receives file paths
        .setup(|app| {
            // Get CLI arguments (file paths passed via "Open With")
            let args: Vec<String> = std::env::args().collect();

            // Skip first arg (executable path), collect file paths
            let file_paths: Vec<String> = args
                .iter()
                .skip(1)
                .filter(|arg| !arg.starts_with('-')) // Skip flags
                .filter(|arg| std::path::Path::new(arg).exists()) // Only existing files
                .cloned()
                .collect();

            // If we have file paths, emit event to frontend
            if !file_paths.is_empty() {
                let app_handle = app.handle().clone();

                // Emit after a short delay to ensure frontend is ready
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = app_handle.emit("open-files", file_paths);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::unmaximize_window,
            commands::window::close_window,
            commands::window::is_maximized,

            // File commands
            commands::file::read_file,
            commands::file::write_file,
            commands::file::open_file_dialog,
            commands::file::save_file_dialog,
            commands::file::get_file_name,
            commands::file::detect_language_from_path,
            commands::file::get_file_modified_time,
            commands::file::open_folder_dialog,
            commands::file::read_directory,
            commands::file::rename_file,
            commands::file::open_file_explorer,

            // Secrets commands
            commands::secrets::store_api_key,
            commands::secrets::get_api_key,
            commands::secrets::delete_api_key,
            commands::secrets::has_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step B5: Create Startup File Handler Hook

**File:** `src/hooks/useStartupFiles.ts` (NEW FILE)

```typescript
import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'
import { useTabStore } from '../store/tabStore'

/**
 * Hook to handle files passed via CLI arguments or "Open With" context menu
 */
export function useStartupFiles() {
  const addTab = useTabStore(state => state.addTab)
  const tabs = useTabStore(state => state.tabs)
  const setActiveTab = useTabStore(state => state.setActiveTab)
  const addRecentFile = useTabStore(state => state.addRecentFile)

  useEffect(() => {
    let unlisten: (() => void) | null = null

    const setupListener = async () => {
      // Listen for files opened via CLI or deep link
      unlisten = await listen<string[]>('open-files', async (event) => {
        const filePaths = event.payload

        for (const filePath of filePaths) {
          try {
            // Check if already open
            const existingTab = tabs.find(t => t.filePath === filePath)
            if (existingTab) {
              setActiveTab(existingTab.id)
              continue
            }

            // Read and open file
            const content = await invoke<string>('read_file', { path: filePath })
            const fileName = await invoke<string>('get_file_name', { path: filePath })
            const language = await invoke<string>('detect_language_from_path', { path: filePath })

            addTab({
              title: fileName,
              content,
              filePath,
              language,
              isDirty: false
            })

            addRecentFile(filePath)
          } catch (error) {
            console.error(`Failed to open startup file: ${filePath}`, error)
          }
        }
      })
    }

    setupListener()

    return () => {
      if (unlisten) {
        unlisten()
      }
    }
  }, [tabs, addTab, setActiveTab, addRecentFile])
}
```

### Step B6: Initialize in App

**File:** `src/App.tsx`

Add the hook:

```typescript
// Add import
import { useStartupFiles } from './hooks/useStartupFiles'

function App() {
  // ... existing code ...

  // Initialize file drop handler
  useFileDrop()

  // Initialize startup files handler (Open With...)
  useStartupFiles()

  // ... rest of component ...
}
```

---

## 5. Part C: Single Instance Support

### Purpose

When ContextPad is already running and the user opens a file via "Open With...", instead of launching a second instance, send the file path to the existing window.

### Step C1: Install Single Instance Plugin (Rust)

**File:** `src-tauri/Cargo.toml`

```toml
[dependencies]
tauri = { version = "2", features = [] }
tauri-plugin-deep-link = "2"
tauri-plugin-single-instance = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
rfd = "0.15"
keyring = "3.6.3"
```

### Step C2: Register Single Instance Plugin

**File:** `src-tauri/src/main.rs`

Update to include single-instance handling:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        // Single instance plugin - forwards args to existing instance
        .plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
            // This runs in the EXISTING instance when a new instance is launched

            // Extract file paths from args
            let file_paths: Vec<String> = args
                .iter()
                .skip(1) // Skip executable path
                .filter(|arg| !arg.starts_with('-'))
                .filter(|arg| std::path::Path::new(arg).exists())
                .cloned()
                .collect();

            if !file_paths.is_empty() {
                // Emit event to frontend with the new file paths
                let _ = app.emit("open-files", file_paths);
            }

            // Focus the existing window
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        }))
        // Deep link plugin
        .plugin(tauri_plugin_deep_link::init())
        // Initial setup
        .setup(|app| {
            // Handle files passed on initial launch
            let args: Vec<String> = std::env::args().collect();

            let file_paths: Vec<String> = args
                .iter()
                .skip(1)
                .filter(|arg| !arg.starts_with('-'))
                .filter(|arg| std::path::Path::new(arg).exists())
                .cloned()
                .collect();

            if !file_paths.is_empty() {
                let app_handle = app.handle().clone();

                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = app_handle.emit("open-files", file_paths);
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Window commands
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::unmaximize_window,
            commands::window::close_window,
            commands::window::is_maximized,

            // File commands
            commands::file::read_file,
            commands::file::write_file,
            commands::file::open_file_dialog,
            commands::file::save_file_dialog,
            commands::file::get_file_name,
            commands::file::detect_language_from_path,
            commands::file::get_file_modified_time,
            commands::file::open_folder_dialog,
            commands::file::read_directory,
            commands::file::rename_file,
            commands::file::open_file_explorer,

            // Secrets commands
            commands::secrets::store_api_key,
            commands::secrets::get_api_key,
            commands::secrets::delete_api_key,
            commands::secrets::has_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### Step C3: Configure Capabilities (Tauri v2)

**File:** `src-tauri/capabilities/default.json` (CREATE or UPDATE)

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for ContextPad",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:event:default",
    "core:event:allow-emit",
    "core:event:allow-listen",
    "core:window:default",
    "core:window:allow-set-focus",
    "core:window:allow-unminimize",
    "deep-link:default",
    "single-instance:default"
  ]
}
```

---

## 6. File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/hooks/useFileDrop.ts` | Drag-and-drop event handling |
| `src/hooks/useStartupFiles.ts` | CLI/Open-With file handling |
| `src-tauri/capabilities/default.json` | Tauri v2 capabilities config |

### Modified Files

| File | Changes |
|------|---------|
| `src-tauri/Cargo.toml` | Add `tauri-plugin-deep-link`, `tauri-plugin-single-instance` |
| `src-tauri/tauri.conf.json` | Add `dragDropEnabled`, `fileAssociations`, `plugins.deep-link` |
| `src-tauri/src/main.rs` | Register plugins, handle CLI args, emit events |
| `src/App.tsx` | Import and initialize new hooks |
| `src/styles/global.css` | Add drag-drop visual feedback styles |
| `package.json` | Add `@tauri-apps/plugin-deep-link` |

### Dependencies to Install

**Rust (automatic via Cargo.toml):**
```
tauri-plugin-deep-link = "2"
tauri-plugin-single-instance = "2"
```

**NPM:**
```bash
npm install @tauri-apps/plugin-deep-link
```

---

## 7. Testing Guide

### A. Drag-and-Drop Testing

| Test | Steps | Expected |
|------|-------|----------|
| Single file drop | Drag `.md` file from Explorer to app | File opens in new tab |
| Multiple files drop | Drag 3 files at once | All 3 open as tabs, last one active |
| Duplicate prevention | Drop same file twice | Second drop navigates to existing tab |
| Unsupported file | Drop `.exe` or `.dll` | No action, console warning |
| Visual feedback | Start dragging file over app | Blue overlay appears |
| Cancel drag | Drag file over, then away | Overlay disappears |

### B. File Association Testing

**Note:** File associations only work after building an installer. They won't work in dev mode.

| Test | Steps | Expected |
|------|-------|----------|
| Build installer | `npm run tauri build` | Creates NSIS/MSI installer |
| Install app | Run installer | File associations registered |
| Open With menu | Right-click `.md` → Open With → ContextPad | App opens with file |
| Double-click | Double-click `.txt` file | App opens with file |
| Multiple files | Select 3 files → Open With → ContextPad | All 3 open as tabs |

### C. Single Instance Testing

| Test | Steps | Expected |
|------|-------|----------|
| First launch | Double-click file when app closed | App starts, file opens |
| Second file | Open another file (app running) | New tab in existing window, no second window |
| Window focus | Minimize app, open file | App window restored and focused |

### D. Dev Mode Testing

For development, test drag-drop with:
```bash
npm run tauri dev
```

For file associations, you must build:
```bash
npm run tauri build
```

---

## 8. Rollback Plan

### If Issues Arise

**Drag-Drop Issues:**
1. Remove `useFileDrop` hook call from `App.tsx`
2. Set `dragDropEnabled: false` in `tauri.conf.json`
3. Remove CSS styles from `global.css`

**File Association Issues:**
1. Remove `fileAssociations` from `tauri.conf.json`
2. Remove `plugins.deep-link` from config
3. Remove plugin registrations from `main.rs`
4. Remove hooks from `App.tsx`

**Single Instance Issues:**
1. Remove `tauri-plugin-single-instance` from `Cargo.toml`
2. Remove plugin init from `main.rs`
3. App will open multiple windows (original behavior)

### Uninstall File Associations

If file associations cause problems after installation:
1. Uninstall ContextPad via Windows Settings
2. File associations will be removed automatically
3. Reinstall without the `fileAssociations` config if needed

---

## 9. Sources

- [Tauri v2 Event Documentation](https://v2.tauri.app/reference/javascript/api/namespaceevent/)
- [Tauri v2 Window Module](https://v2.tauri.app/reference/javascript/api/namespacewindow/)
- [Tauri Deep Linking Plugin](https://v2.tauri.app/plugin/deep-linking/)
- [Tauri File Drop Discussion](https://github.com/tauri-apps/tauri/discussions/4736)
- [Tauri Configuration Files](https://v2.tauri.app/develop/configuration-files/)
- [tauri-plugin-deep-link on npm](https://www.npmjs.com/package/@tauri-apps/plugin-deep-link)
- [tauri-plugin-single-instance](https://crates.io/crates/tauri-plugin-single-instance)

---

## Implementation Order

1. **Phase 1: Drag-Drop** (can test in dev mode)
   - Step A1: Config change
   - Step A2: Create hook
   - Step A3: CSS styles
   - Step A4: Initialize in App

2. **Phase 2: File Associations** (requires build to test)
   - Step B1-B2: Install plugins
   - Step B3: Bundle config
   - Step B4: Rust setup
   - Step B5-B6: Frontend hooks

3. **Phase 3: Single Instance** (requires build to test)
   - Step C1: Install plugin
   - Step C2: Register in Rust
   - Step C3: Capabilities config

4. **Phase 4: Testing**
   - Dev mode drag-drop tests
   - Build installer
   - Full integration tests
