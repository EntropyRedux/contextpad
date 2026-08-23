# ContextPad Workspace Requirements

## Current Version: Phase 3 Complete (Outline Sidebar)

Last Updated: 2026-01-09

---

## Development Environment

### Required Tools
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **Rust**: Latest stable (for Tauri)
- **Visual Studio Build Tools**: Windows development (if on Windows)

### Recommended IDE
- **VS Code** with extensions:
  - ESLint
  - Prettier
  - Rust Analyzer (for Tauri development)
  - TypeScript and JavaScript Language Features

---

## Project Structure

```
contextpad/
├── src/
│   ├── components/
│   │   ├── Editor/              # CodeMirror editor
│   │   ├── LeftSidebar/         # Outline + future Explorer
│   │   ├── Sidebar/             # Settings sidebar (right)
│   │   ├── TitleBar/
│   │   ├── TabBar/
│   │   ├── MenuBar/
│   │   ├── StatusBar/
│   │   └── Layout/
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.ts
│   │   ├── useFileOperations.ts
│   │   ├── useCodeBlockDetection.ts
│   │   └── useFileWatcher.ts
│   ├── services/
│   │   └── markdownParser.ts    # Markdown outline parsing
│   ├── store/
│   │   └── tabStore.ts          # Zustand state management
│   ├── styles/
│   │   └── global.css
│   └── extensions/
│       └── vscodeTheme.ts
├── src-tauri/                   # Rust backend
├── public/
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tauri.conf.json
```

---

## Dependencies

### Core Dependencies (package.json)

```json
{
  "dependencies": {
    "@codemirror/commands": "^6.10.1",
    "@codemirror/lang-css": "^6.3.1",
    "@codemirror/lang-html": "^6.4.11",
    "@codemirror/lang-javascript": "^6.2.4",
    "@codemirror/lang-json": "^6.0.2",
    "@codemirror/lang-markdown": "^6.5.0",
    "@codemirror/lang-python": "^6.2.1",
    "@codemirror/language": "^6.12.1",
    "@codemirror/language-data": "^6.5.2",
    "@codemirror/state": "^6.5.3",
    "@codemirror/view": "^6.39.9",
    "@lezer/highlight": "^1.2.3",
    "@tauri-apps/api": "^2.9.1",
    "@vitejs/plugin-react": "^5.1.2",
    "codemirror": "^6.0.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.7"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.9.6",
    "@types/react": "^18.3.27",
    "@types/react-dom": "^18.3.7",
    "typescript": "^4.9.5",
    "vite": "^5.4.21"
  }
}
```

### Upcoming Dependencies (For Feature Implementation)

```json
{
  "dependencies": {
    "@uiw/codemirror-themes": "^4.21.21",
    "@codemirror/theme-one-dark": "^6.1.2",
    "@codemirror/lang-yaml": "^6.0.0",
    "@codemirror/lang-csv": "^6.0.0",
    "@dqbd/tiktoken": "^1.0.7"
  }
}
```

---

## Build & Run Commands

### Development Mode
```bash
npm run dev              # Start Vite dev server
npm run tauri:dev        # Start Tauri app in dev mode
```

### Production Build
```bash
npm run build            # Build web assets
npm run tauri:build      # Build Tauri desktop app
```

### Type Checking
```bash
npx tsc --noEmit        # Check TypeScript types
```

---

## Environment Configuration

### Vite Configuration (vite.config.ts)
- React plugin enabled
- Port: 5173 (default)
- Hot Module Replacement (HMR) enabled

### Tauri Configuration (tauri.conf.json)
- App identifier: `com.contextpad.app`
- Window settings:
  - Width: 1200px
  - Height: 800px
  - Resizable: true
  - Decorations: false (custom title bar)
- File system access enabled

---

## Feature Flags / Settings

### Current Features (Implemented)
- ✅ Multi-tab editor
- ✅ Markdown syntax highlighting
- ✅ File operations (Open, Save, Save As)
- ✅ Font family/size customization
- ✅ Word wrap toggle
- ✅ Line numbers toggle
- ✅ Status bar with cursor position
- ✅ Right sidebar (Settings panel)
- ✅ Left sidebar (Markdown outline)
- ✅ Hierarchical outline collapse/expand
- ✅ Click-to-scroll from outline
- ✅ Per-tab outline isolation
- ✅ Ctrl+B to toggle left sidebar

### Planned Features (Next Phase)
- ⏳ Theme system (CodeMirror 6 library)
- ⏳ Multi-file type support (JSON, YAML, CSV, etc.)
- ⏳ VS Code-style markdown colors
- ⏳ Darker title bar / seamless tabs
- ⏳ Breadcrumb navigation
- ⏳ Open Folder + Explorer view
- ⏳ Document statistics (tiktoken.js)

---

## State Management

### Zustand Store (tabStore.ts)

**Persisted State (localStorage):**
- `tabs[]` - Open tabs with content
- `activeTabId` - Currently active tab
- `viewSettings` - Font, size, wrap, line numbers, theme
- `recentFiles[]` - Recently opened files

**Session State (Not Persisted):**
- `cursorInfo` - Current cursor position
- `findReplaceState` - Find/replace dialog state
- `showRightSidebar` - Right sidebar visibility
- `showLeftSidebar` - Left sidebar visibility
- `editorView` - CodeMirror EditorView reference (per tab)

---

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- ES2020 target
- Module: ESNext
- JSX: react-jsx

### React
- Functional components only
- Hooks for state management
- CSS Modules for styling

### File Naming
- Components: PascalCase (e.g., `LeftSidebar.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useKeyboardShortcuts.ts`)
- Services: camelCase (e.g., `markdownParser.ts`)
- CSS Modules: `Component.module.css`

### Import Order
1. React imports
2. Third-party libraries
3. Local components
4. Local hooks/services
5. Types
6. Styles

---

## Testing Strategy

### Manual Testing Checklist
See `TESTING_CHECKLIST.md` for comprehensive testing procedures.

**Critical Flows:**
1. Create new tab
2. Open file from disk
3. Edit content → Save
4. Switch between tabs
5. Toggle sidebars (Ctrl+B, Ctrl+,)
6. Outline navigation (click items)
7. Expand/collapse outline sections
8. Font/size changes
9. Word wrap toggle

---

## Performance Considerations

### Optimization Techniques
- **Debouncing**: Outline re-parsing (500ms)
- **Memoization**: Outline state persistence via Set
- **Lazy Loading**: EditorView created per tab
- **Efficient Updates**: CodeMirror Compartment API for theme/settings
- **Selective Re-renders**: Zustand selector optimization

### Known Limitations
- Large files (>5MB) may cause lag in outline parsing
- Outline updates every 500ms (can be optimized with change listeners)
- Font loading from Google Fonts CDN (offline mode uses fallbacks)

---

## Security & Permissions

### Tauri Allowlist
- **fs**: read, write, readDir, exists
- **dialog**: open, save
- **window**: all window management APIs

### Content Security Policy
- Scripts: self
- Styles: self, unsafe-inline (for dynamic themes)
- Fonts: Google Fonts CDN

---

## Known Issues & Workarounds

### Issue: Editor fold gutter chevrons affected by CSS
**Description**: Custom CSS for outline chevrons also affects CodeMirror's fold gutter icons.
**Workaround**: Accepted as minor visual inconsistency (user confirmed OK).
**Future Fix**: Scope CSS more specifically or override CM6 gutter styles.

### Issue: Outline doesn't update on first render
**Description**: EditorView reference not immediately available when tab opens.
**Workaround**: Interval-based parsing checks for editorView existence.
**Future Fix**: Use CodeMirror update listeners for real-time parsing.

---

## Deployment

### Desktop App Distribution
- **Windows**: `.msi` installer via Tauri
- **macOS**: `.dmg` installer via Tauri
- **Linux**: `.AppImage` or `.deb` via Tauri

### Build Artifacts
Located in `src-tauri/target/release/bundle/`

---

## Contributing Guidelines

### Before Making Changes
1. Read `DEVELOPMENT_GUIDELINES.md`
2. Review Phase 3 plan in `.claude/plans/`
3. Check current implementation plan
4. Test critical user flows

### Pull Request Process
1. Create feature branch from main
2. Implement single feature/fix
3. Test manually using checklist
4. Update WORKSPACE_REQUIREMENTS.md if needed
5. Commit with descriptive message
6. Submit PR with summary

---

## Useful Commands

```bash
# Install dependencies
npm install

# Start dev server (web only)
npm run dev

# Start Tauri app (desktop)
npm run tauri:dev

# Build for production
npm run build
npm run tauri:build

# Type check
npx tsc --noEmit

# Clean build cache
rm -rf dist/ src-tauri/target/

# Check Tauri info
npm run tauri info
```

---

## Support & Documentation

### Internal Documentation
- `DEVELOPMENT_GUIDELINES.md` - Development best practices
- `TESTING_CHECKLIST.md` - Manual testing procedures
- `.claude/plans/` - Implementation plans
- `APP_STATUS.md` - Current app status and feature roadmap

### External Resources
- [CodeMirror 6 Documentation](https://codemirror.net/docs/)
- [Tauri Documentation](https://tauri.app/v1/guides/)
- [React Documentation](https://react.dev/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)

---

Last Updated: 2026-01-09
Version: Phase 3 Complete
