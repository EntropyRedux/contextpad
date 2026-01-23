# ContextPad

**Version**: 1.2.0
**Status**: Phase 1 Complete

A minimal, fast text editor with syntax highlighting and modern IDE features. Built with Tauri 2.x + React 18 + CodeMirror 6.

## Features

### ✅ Core Functionality
- **Multi-tab Interface**: Chrome-style tabs in custom title bar with reordering support.
- **File Operations**: Open, Save, Save As with native dialogs.
- **Session Restore**: Automatically restores open tabs and settings on startup.
- **Recent Files**: Quick access to recently opened files.
- **Syntax Highlighting**: 100+ languages via CodeMirror 6.
- **Auto Language Detection**: Based on file extension.
- **VS Code Dark+ Theme**: Accurate syntax colors.
- **Real-time Status**: Cursor position, language, encoding.
- **100% Offline**: No internet required.

### 🛠️ Editor Tools
- **Find & Replace**: Floating search widget with full regex support.
- **Command Palette**: Quick access to commands.
- **Settings UI**: Configurable font, theme, word wrap, line numbers, and more.
- **Auto-Complete**: Intelligent suggestions while typing.
- **Spell Check**: Configurable spell checking with custom dictionary.
- **Code Linting**: Basic linting for supported languages.

### 📝 Supported Languages
Markdown (primary), JavaScript, TypeScript, Python, Rust, HTML, CSS, JSON, and 90+ more.

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+N` / `Ctrl+T` | New tab |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save file |
| `Ctrl+Shift+S` | Save as |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` | Next tab |
| `Ctrl+Shift+Tab` | Previous tab |
| `Ctrl+F` | Find / Replace |
| `Ctrl+1-9` | Jump to tab |
| `Ctrl+Z` / `Ctrl+Y` | Undo / Redo |

## Quick Start

### Development
```bash
npm install
npm run tauri:dev
```

### Production Build
```bash
npm run tauri:build
```

Executable location: `src-tauri/target/release/contextpad-tauri.exe`

## Tech Stack
- **Frontend**: React 18.3.1, TypeScript 4.9.5, Vite 5.4.21
- **Editor**: CodeMirror 6.x
- **Backend**: Tauri 2.x, Rust
- **State**: Zustand 4.5.7
- **Styling**: CSS Modules

## Project Structure
```
contextpad/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── Editor/         # Editor & Search
│   │   ├── Settings/       # Settings UI
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state (Tabs, Settings, etc.)
│   ├── extensions/         # CodeMirror extensions
│   └── services/           # Utilities
├── src-tauri/              # Rust backend
│   └── src/commands/       # Tauri commands
└── Documentation/          # Project docs
```

## Documentation
- [`CHANGELOG.md`](Documentation/CHANGELOG.md) - Version history
- [`app-status-0108.md`](Documentation/app-status-0108.md) - Detailed status report
- [`v0.2.0-implementation-summary.md`](Documentation/v0.2.0-implementation-summary.md) - Implementation details
- [`contextpad-build-plan.md`](Documentation/contextpad-build-plan.md) - Development roadmap

## Roadmap

### v1.3.0 (Planned)
- Split editor view
- Plugin system foundation
- Enhanced Markdown preview
- File tree sidebar (Project view)

## License
GPL v3

## Contributing
This is an active development project. See `Documentation/contextpad-build-plan.md` for planned features.
