# ContextPad Changelog

## [0.2.0] - 2026-01-08

### Added - Phase 1 MVP Completion
- **File Operations**
  - Open file dialog (Ctrl+O) with support for multiple file formats
  - Save file (Ctrl+S) to existing path
  - Save As (Ctrl+Shift+S) with custom file naming
  - Automatic language detection from file extension
  - File path tracking per tab
- **Keyboard Shortcuts**
  - `Ctrl+N` / `Ctrl+T`: New tab
  - `Ctrl+O`: Open file
  - `Ctrl+S`: Save file
  - `Ctrl+Shift+S`: Save as
  - `Ctrl+W`: Close tab (with unsaved changes confirmation)
  - `Ctrl+Tab`: Next tab
  - `Ctrl+Shift+Tab`: Previous tab
  - `Ctrl+1-8`: Jump to specific tab
  - `Ctrl+9`: Jump to last tab
- **Functional Menu Bar**
  - File menu with New, Open, Save, Save As, Exit
  - Edit menu (placeholder for future features)
  - View menu (placeholder for future features)
  - Help menu with About dialog
  - Click-outside and ESC key to close dropdowns
- **Enhanced Status Bar**
  - Real-time cursor position display (Line, Column)
  - Current language/file type indicator
  - File encoding display (UTF-8)
  - Modified status indicator

### Improved
- Tab management with automatic untitled numbering
- Dirty state tracking for unsaved changes
- Confirmation dialogs before closing unsaved tabs

### Technical
- Added `rfd` 0.15 crate for native file dialogs
- Implemented Rust file I/O commands
- Created `useFileOperations` and `useKeyboardShortcuts` hooks
- Enhanced TabStore with cursor info tracking
- Updated Editor component to track selection changes

### Fixed
- Removed unused imports in window.rs (AppHandle, Manager)

## [0.1.0] - 2026-01-08

### Initial Release - MVP Foundation
- Custom title bar with embedded tabs
- Multi-tab interface with add/close functionality
- CodeMirror 6 editor with markdown support
- VS Code Dark+ theme with syntax highlighting
- Zustand state management
- Window controls (minimize, maximize, close)
- Basic status bar
- Visual-only menu bar
- 100+ language support via @codemirror/language-data

### Technical Stack
- Frontend: React 18.3.1, TypeScript 4.9.5, Vite 5.4.21
- Backend: Tauri 2.x, Rust
- Editor: CodeMirror 6.x
- State: Zustand 4.5.7
- Styling: CSS Modules
