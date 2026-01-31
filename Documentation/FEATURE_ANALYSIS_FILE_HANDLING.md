# Feature Analysis: File Association & Drag-and-Drop

**Date:** January 25, 2026
**Status:** Analysis Complete
**Feasibility:** High (Native support in Tauri v2)

---

## 1. Goal
Enable ContextPad to behave like a native editor:
1.  **Open With...**: Appear in the OS context menu for `.md`, `.txt`, `.json`, etc.
2.  **Drag-and-Drop**: Dragging a file from Explorer into the app window opens it.

---

## 2. Implementation Strategy

### Part A: File Associations (OS Integration)
**Config:** `src-tauri/tauri.conf.json`

Tauri supports defining file associations that are registered during installation (NSIS/WiX).

```json
"bundle": {
  "fileAssociations": [
    {
      "ext": ["md", "markdown"],
      "name": "Markdown File",
      "role": "Editor"
    },
    {
      "ext": ["txt", "log", "ini"],
      "name": "Text File",
      "role": "Editor"
    },
    {
      "ext": ["json", "yaml", "yml", "xml", "csv", "html", "js", "ts", "py"],
      "name": "Code File",
      "role": "Editor"
    }
  ]
}
```

**Handling the Launch:**
When the user double-clicks a file, the OS launches `ContextPad.exe "path/to/file.txt"`.
- **Logic:** We need to update `src/main.tsx` or `src/App.tsx` to check for CLI arguments on startup using `@tauri-apps/plugin-cli`.
- **Single Instance:** Ideally, we should use the `single-instance` plugin so that if the app is *already* open, double-clicking a new file opens a tab in the *existing* window instead of launching a second instance.

### Part B: Drag-and-Drop
**Mechanism:** Tauri webview event.

Tauri automatically intercepts file drops on the webview. We don't use standard HTML5 `onDrop` because the path is protected. Instead, we listen for the Tauri event.

**Code (`src/hooks/useFileDrop.ts`):**
```typescript
import { listen } from '@tauri-apps/api/event'

useEffect(() => {
  const unlisten = listen('tauri://drop', async (event) => {
    // event.payload is string[] of file paths
    const paths = event.payload as string[]
    for (const path of paths) {
      await openFileInTab(path)
    }
  })
  return () => { unlisten.then(f => f()) }
}, [])
```

---

## 3. Recommended Roadmap

1.  **Add `tauri-plugin-cli` and `tauri-plugin-single-instance`**: Essential for robust "Open With" behavior.
2.  **Configure `tauri.conf.json`**: Define the extensions.
3.  **Create `useFileDrop` Hook**: Implement the drag-and-drop listener.
4.  **Update `App.tsx`**: 
    - Initialize the Drop listener.
    - Check for launch args (file paths) on startup and open them.

---

## 4. Complexity & Risks
- **Low Risk:** Drag-and-drop is straightforward.
- **Medium Complexity:** "Open With" requires rebuilding the installer (MSI/EXE) to test properly; it won't work in `npm run tauri:dev` easily.
