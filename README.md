# ContextPad

**Version**: 1.3.3  
**Status**: Stable Release  
**Philosophy**: Simple. Fast. No Friction.  
**Core Truth**: This app exists *before real work begins*. It lives between thinking and execution—where ideas become clear enough to hand off.

---

## 🚀 Downloads

You can download the latest pre-built binaries from the [releases](./releases) folder:
- **[ContextPad-v1.3.3.exe](./releases/ContextPad-v1.3.3.exe)**: Standalone portable executable.
- **[ContextPad-v1.3.3-Setup.exe](./releases/ContextPad-v1.3.3-Setup.exe)**: Windows installer.

📘 **[Read the User Guide](./USER_GUIDE.md)** for detailed instructions on workflows, shortcuts, and settings.

---

## 1. What is ContextPad for?

ContextPad is a specialized workspace for **workflow drafting and automation**. It is designed for prompt engineers, technical writers, and developers who need to prepare text, logic, or context for AI consumption or project execution without the bloat of a full IDE or the limitations of a basic text editor.

### Key Use Cases:
*   **AI Context Drafting**: Preparing complex system prompts or context windows with real-time token estimation.
*   **Workflow Automation**: Using Excel-like formulas or JavaScript to clean, transform, and format text instantly.
*   **Technical Documentation**: Writing in Markdown with specialized export and preview capabilities.
*   **Idea Handoff**: Refining thoughts into "AI Blueprints" clear enough for LLM execution.

---

## 2. Core Features

### 📂 Workspace & Navigation
*   **Workspace Settings**: Define a root project directory.
*   **Breadcrumb Navigation**: A specialized "file explorer within the workspace" via the breadcrumb bar for frictionless file jumping.
*   **Left Sidebar (Indexes)**: A powerful Outline view (`Ctrl+B`) for navigating Markdown headers and file structures.

### ⚡ Automation & Workflow
*   **Template System**: Reusable text blocks with **Template Variables** for dynamic content injection.
*   **Advanced Action System**: 
    *   **Excel-style Formulas**: Familiar syntax for rapid text manipulation (e.g., `UPPER()`, `BOLD()`).
    *   **JavaScript Engine**: Deep automation via a sandboxed JS environment with a specialized `helpers` API.
*   **Workflow Drafting**: Combined templates and actions allow for building complex text pipelines organically from usage.

### 🤖 AI-Centric Tools
*   **Token Estimators**: Real-time token calculations for OpenAI, Anthropic, and Google Gemini models.
*   **Cost Projection**: Instant financial visibility of prompt costs based on current model pricing.
*   **AI Blueprint Exports (Planned)**: Specialized `.cntxt` file format (Markdown-based) designed to optimize how LLMs ingest and understand your drafted content while maintaining human readability.

### 📝 Documentation & Export
*   **Markdown Core**: Full Markdown support with live syntax highlighting.
*   **HTML Export**: Capability to download documentation as portable HTML.
*   **Live HTML Preview (Planned)**: Hot-reloading preview window for real-time visualization of documentation.

### ⚙️ User Control
*   **Granular Settings**: Full control over font, themes, line numbers, word wrap, and large-file performance thresholds.
*   **Local-First**: Privacy-centric. All data, API keys (via OS keychain), and files stay on the local machine.

---

## 3. Future Architecture: Unified Block Metadata

**Status:** Planned Feature

ContextPad will implement a single, standardized parser for fenced code block metadata using **R Markdown / Pandoc** attribute style. This prevents feature creep by unifying multiple subsystems into one extensibility point.

```markdown
```language {key=value, boolean_flag, "quoted key"="value"}
code here...
```
```

This system will handle:
1.  **Action Manager Ignore Flags**: ` {ignore=true} ` prevents specific blocks from being processed by automation.
2.  **HTML Rendering Options**: ` {render="interactive"} ` controls how blocks appear in documentation exports.
3.  **AI Blueprint Context**: ` {ai_role="system_prompt"} ` tags blocks with semantic meaning for LLMs.

---

## 4. Why it isn't an IDE
ContextPad deliberately avoids:
*   Project Management / Task tracking.
*   Code compilation or execution.
*   Cloud synchronization or bloat.

It remains a **sharp tool**—focused entirely on the friction-free transition from thought to draft.

---

## 5. Development

### Tech Stack
- **Frontend**: React 18.3.1, TypeScript 4.9.5, Vite 5.4.21
- **Editor**: CodeMirror 6.x
- **Backend**: Tauri 2.x, Rust
- **State**: Zustand 4.5.7
- **Styling**: CSS Modules

### Commands
```bash
npm install         # Install dependencies
npm run tauri:dev   # Start dev server
npm run tauri:build # Build for production
```

## License
GPL v3
