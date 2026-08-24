# ContextPad: AGY Session & Sync Development Master Context

**Document Version**: `1.0.0`  
**Last Updated**: `2026-08-24`  
**Target Audience**: Antigravity (AGY) CLI Agents, Autonomous Pair Programmers, and Developers  
**Current Application Version**: `v1.11.0`

---

## 1. Executive Summary & Mission

ContextPad is a high-performance, lightweight markdown and AI-context editor. Development is conducted via a **dual-track sync strategy**:

1. **ContextPad Desktop (Production Host)**: Tauri v2 + React 18 + CodeMirror 6 + Rust backend. Delivers native file I/O, local HTTP/WS preview server, and instant desktop cold starts with a ~40MB RAM footprint.
2. **ContextPad AI Studio (Rapid UI Sandbox)**: Pure React + Tailwind CSS v4 web harness located at [`contextpad_AI Studio/`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/contextpad_AI%20Studio). Used to design, prototype, and polish modern UI components (ActivityBar, Modals, CommandPalette, Outline) without native desktop dependencies.

**Agent Objective**: Seamlessly integrate polished UI components from `contextpad_AI Studio` into the main desktop repository, run verification tests, and release production desktop builds.

---

## 2. Directory & Workspace Topology

```text
C:\Projects\LocalActive\Repo\Active\ContextPad\
├── .github/workflows/          # CI/CD release pipelines (release-windows.yml, release-linux.yml)
├── src-tauri/                  # Rust Desktop Shell (Tauri v2)
│   ├── src/                    # Rust backend: main.rs, preview_server.rs, commands/
│   ├── Cargo.toml              # Rust crate manifest (v1.11.0)
│   └── tauri.conf.json         # Tauri v2 application configuration (v1.11.0)
├── src/                        # Desktop UI Source (React 18 + TypeScript + Tailwind v4 + CSS Modules)
│   ├── components/             # React View Components (TabBar, Editor, Sidebars, Modals)
│   ├── extensions/             # CodeMirror 6 extensions (formulas, slash commands, locked editor)
│   ├── services/               # Core services (formulaParser, tokenEstimator, autocomplete)
│   ├── store/                  # Zustand state stores (tabStore, settingsStore, actionStore)
│   ├── styles/                 # Global styles & Tailwind v4 imports (global.css)
│   └── utils/                  # Security validator, logger, debounce, htmlGenerator
├── contextpad_AI Studio/       # Web UI Sandbox (Tailwind v4, React, Lucide, Mock APIs)
│   └── src/components/         # Polished UI components (ActivityBar, OutlinePanel, Modals)
├── release-builds/             # Local compiled Windows release executables (.exe)
├── package.json                # npm configuration (v1.11.0)
└── vitest.config.ts            # Test harness configuration (122 tests / 11 suites)
```

---

## 3. Technology Stack & Configuration

| Layer | Technology | Configuration Details |
| :--- | :--- | :--- |
| **Desktop Wrapper** | Tauri v2 (Rust) | Native WebView2 on Windows, embedded Axum preview server ([`preview_server.rs`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/src-tauri/src/preview_server.rs)). |
| **Frontend Framework** | React 18 / TypeScript | Functional components, custom hooks, strictly typed interfaces. |
| **Styling Engine** | Tailwind CSS v4 + CSS Modules | `@tailwindcss/vite` enabled in [`vite.config.ts`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/vite.config.ts) and imported in [`global.css`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/src/styles/global.css). |
| **Editor Core** | CodeMirror 6 | Modular extensions: `inlineFormulas`, `slashCommands`, `codeBlockParams`, `codeValidator`. |
| **State Management** | Zustand | Browser-compatible state stores (`tabStore`, `settingsStore`, `actionStore`, etc.). |
| **Testing Suite** | Vitest + React Testing Library | 122 automated unit & component tests passing (`npm run test:run`). |
| **Git Remote** | GitHub | `https://github.com/EntropyRedux/contextpad.git` (`origin/main`). |

---

## 4. Component Inventory & Porting Status

The following components exist in `contextpad_AI Studio` and are designed to be imported into `src/components/`:

| Component | AI Studio Source Path | Desktop Target Path | Status / Features |
| :--- | :--- | :--- | :--- |
| **ActivityBar** | `contextpad_AI Studio/src/components/ActivityBar/` | `src/components/ActivityBar/` | Ready. Left/right icon rail switching side panels. |
| **OutlinePanel** | `contextpad_AI Studio/src/components/Sidebar/OutlinePanel.tsx` | `src/components/LeftSidebar/` | Ready. Multi-element outline (H1-H6, code, checklists, tables). |
| **CommandPalette** | `contextpad_AI Studio/src/components/Modals/CommandPalette.tsx` | `src/components/Modals/` | Ready. Global `Ctrl+K` searchable command modal. |
| **VariableFillerModal** | `contextpad_AI Studio/src/components/Modals/VariableFillerModal.tsx` | `src/components/Modals/` | Ready. Form dialog for populating `{{template_variables}}`. |
| **ActionEditorModal** | `contextpad_AI Studio/src/components/Modals/ActionEditorModal.tsx` | `src/components/Modals/` | Ready. Interactive JavaScript action authoring sandbox. |
| **ShortcutsModal** | `contextpad_AI Studio/src/components/Modals/ShortcutsModal.tsx` | `src/components/Modals/` | Ready. Visual keyboard shortcut cheatsheet (`Ctrl+/`). |
| **FormulaPlayground** | `contextpad_AI Studio/src/components/Sidebar/FormulaPlayground.tsx` | `src/components/Sidebar/` | Ready. Live calculation & text transformation tester. |
| **TokenAnalytics** | `contextpad_AI Studio/src/components/Sidebar/TokenAnalytics.tsx` | `src/components/Sidebar/` | Ready. Token count & LLM cost estimator visualizer. |

---

## 5. Standard Operating Procedures (SOPs) for AGY Agents

### 1. Verification & Testing
Always run the test suite and build check before committing any changes:
```powershell
# Run Vitest test suite (122 tests across 11 suites)
npm run test:run

# Verify production Vite build (Tailwind v4 compilation)
npm run build
```

### 2. Porting Components from AI Studio to Desktop
When bringing a component from `contextpad_AI Studio` into `src/components/`:
1. **No Direct `@tauri-apps/api` Imports**: Components must remain pure React or interact through Zustand stores / prop callbacks.
2. **Tailwind Classes**: Use Tailwind v4 classes directly.
3. **CSS Transitions Only**: Use Tailwind `transition-all duration-150` instead of heavy JavaScript animation runtimes (`motion` / Framer Motion) to maintain low CPU/memory usage.

### 3. Local Desktop Packaging & Installation
```powershell
# Run preflight checks
npm run tauri:preflight

# Build local Windows NSIS setup installer & portable executable
npm run tauri:build
# Output: src-tauri/target/release/bundle/nsis/ContextPad_1.11.0_x64-setup.exe
```

### 4. Version Bumping & GitHub Releases
When releasing a new version (e.g., `1.12.0`):
1. Update `"version"` in:
   - [`package.json`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/package.json)
   - [`src-tauri/tauri.conf.json`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/src-tauri/tauri.conf.json)
   - [`src-tauri/Cargo.toml`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/src-tauri/Cargo.toml)
   - [`.github/workflows/release-windows.yml`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/.github/workflows/release-windows.yml)
   - [`.github/workflows/release-linux.yml`](file:///C:/Projects/LocalActive/Repo/Active/ContextPad/.github/workflows/release-linux.yml)
2. Sync lockfile: `npm i --package-lock-only`
3. Commit and tag:
   ```powershell
   git add -A
   git commit -m "release: bump version to v1.X.X"
   git tag v1.X.X
   git push origin master:main
   git push origin v1.X.X
   ```

---

## 6. User Rules & Guardrails
- **File Overwrites**: Permission is granted to overwrite files within the project repository.
- **Focus Mode**: Do not launch the desktop app in focus mode; the user tests UI in a separate dedicated terminal.
- **Performance Budget**: Preserve fast startup (<250ms), small binary size (<6MB installer), and low memory footprint (~40MB RAM).
