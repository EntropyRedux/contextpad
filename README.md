# ContextPad

**Version**: 1.3.3
**Status**: Stable Release

A minimal, fast text editor with syntax highlighting and modern IDE features. Built with Tauri 2.x + React 18 + CodeMirror 6.

## 🚀 Downloads

You can download the latest pre-built binaries from the [releases](./releases) folder:
- **[ContextPad-v1.3.3.exe](./releases/ContextPad-v1.3.3.exe)**: Standalone portable executable.
- **[ContextPad-v1.3.3-Setup.exe](./releases/ContextPad-v1.3.3-Setup.exe)**: Windows installer.

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
- **Sidebar (New)**: Integrated File Explorer, Markdown Outline, and Template Manager.
- **Token Estimator (New)**: Real-time token counting for various LLM models (GPT, Anthropic, Gemini).
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

Executable location: `src-tauri/target/release/contextpad.exe`

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
│   │   ├── Sidebar/        # File Explorer & Tools
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand state (Tabs, Settings, etc.)
│   ├── extensions/         # CodeMirror extensions
│   └── services/           # Utilities (Token Estimator, etc.)
├── src-tauri/              # Rust backend
│   └── src/commands/       # Tauri commands
└── releases/               # Pre-built binaries
```

## License
GPL v3