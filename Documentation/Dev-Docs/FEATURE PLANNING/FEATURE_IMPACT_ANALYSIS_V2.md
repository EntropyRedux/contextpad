# Feature Impact Analysis: AI Blueprints & HTML Preview

**Date:** January 25, 2026
**Target Features:** AI Blueprint Exports, HTML Download, Live Preview (Hot Reload)
**Goal:** Assess architectural impact and integration strategy.

---

## 1. Current State Assessment

### Core Modules Analysis
*   **Editor Engine (`src/extensions/`):** Robust extension system. Currently handles `Locked Blocks` and `Formulas`.
    *   *Gap:* No native support for HTML syntax highlighting or specialized "AI Blueprint" metadata blocks beyond generic `{key=value}`.
*   **Parameter Parser (`codeBlockParams.ts`):** Supports `lock`, `exclude`, and basic key-value pairs.
    *   *Gap:* Needs to support complex, nested metadata for AI tags (e.g., embeddings dimensions, model constraints) and HTML attributes (class, id, style).
*   **Action Manager (`ActionManager.tsx`):** Handles JS/Formula execution.
    *   *Gap:* Export logic is currently limited to JSON. Needs a dedicated "Export Pipeline" for different formats (HTML, PDF, AI Blueprint JSON/YAML).
*   **Outline System (`MarkdownOutline.tsx`):** Parses Markdown headers for navigation.
    *   *Gap:* Hardcoded to Markdown tokens (`#`). Needs abstraction to support an "HTML Structure" mode for the proposed HTML sidebar.

---

## 2. Integration Strategy: AI Blueprints

**Concept:** "AI Blueprints" are machine-readable representations of the document, optimized for RAG (Retrieval-Augmented Generation) or direct LLM consumption.

### Option A: Vector-Ready Export (Recommended)
Transform the document into a structured JSON/YAML that pre-chunks content based on semantic boundaries (headers, code blocks).
*   **Implementation:** Refactor `ActionManager` export to include a "Blueprint" mode.
*   **Metadata:** Use YAML Frontmatter (`--- ... ---`) at the top of the file for global settings (model, temperature) and Code Block Parameters for local settings (embedding tags).
*   **Code Block Params:** Extend `src/utils/codeBlockParams.ts` to allow list-based values (e.g., `tags=["rag", "core"]`).

### Option B: Attention Mechanism (Visual)
Allow users to visually "highlight" parts of the text that should carry higher weight in the prompt.
*   **Implementation:** New CodeMirror extension (`src/extensions/attentionHighlighter.ts`).
*   **Data:** Store attention weights as a parallel `RangeSet` (similar to `LockedEditor`).
*   **Export:** When exporting to "Blueprint", these ranges are converted to XML tags (e.g., `<attention weight="2.0">...`) or specific prompt instructions.

### Option C: Token Saver Format
An export mode that aggressively strips whitespace, comments, and non-essential formatting to minimize token usage for expensive models.
*   **Implementation:** A "Compress" Action in `src/utils/actionExecutor.ts` or a standalone export option.

---

## 3. Integration Strategy: HTML Live Preview

**Concept:** A real-time, hot-reloading HTML preview of the Markdown document, leveraging the user's default browser for rendering "Online Dependencies" (CDN scripts, fonts).

### Architecture Choice: Browser vs. Webview
*   **Recommendation:** **Offload to Default Browser**.
    *   *Why:* Security (Sandbox), Performance (Browser engine), and Compatibility (CDM libraries like Tailwind/Bootstrap work out of the box).
    *   *Mechanism:* ContextPad starts a tiny local HTTP server (using Rust/Tauri `sidecar` or internal server) that serves the compiled HTML. The browser connects to `localhost:port`.
    *   *Hot Reload:* The server uses WebSockets to push updates to the browser whenever the Editor content changes (debounced).

### Refactoring Needs
1.  **New Module:** `src/services/previewServer.ts` (Rust) or Node sidecar. Ideally Rust for lightweight handling.
2.  **Frontend Hook:** `usePreviewSync` to listen for editor changes and emit `update-preview` events.
3.  **Outline Adapter:** Refactor `MarkdownOutline.tsx` to `DocumentStructure.tsx`. It should accept a "Strategy" (Markdown vs. HTML) to populate the sidebar.

---

## 4. Code Block Parameters Refactoring

The current parser is good but strict. For AI and HTML, we need flexibility.

**Proposed Syntax Expansion:**
```markdown
```html {render="true", auto-reload, classes=["preview", "dark"]}
<div>...</div>
```

**Changes Required:**
*   Update `parseCodeBlockParams` to handle array syntax `[]`.
*   Update `KNOWN_PARAMS` to include `render` (bool), `tags` (array), `model` (string).

---

## 5. Decision Matrix

| Feature | Difficulty | Impact | Priority |
| :--- | :--- | :--- | :--- |
| **Blueprint Export (JSON)** | Low | High (Core AI use case) | 1 |
| **Code Block Array Params** | Medium | Medium (Enabler) | 2 |
| **Token Saver Export** | Low | Low (Utility) | 2 |
| **HTML Preview (Browser)** | High | High (Visual Mockups) | 3 |
| **Attention Mechanism** | High | Low (Niche) | 4 |

---

## 7. Research Validation

**AI Blueprints:**
*   **YAML Frontmatter** is the industry standard for metadata separation in RAG/LLM contexts.
*   **Vector Tags:** Embedding model specifications (`embedding_model: "ada-002"`) directly in frontmatter is a valid pattern.
*   **Structure:** External embedding references (file paths) vs. inline JSON arrays are both viable, but inline is better for "Blueprint" portability.

**Attention Mechanism:**
*   **Unique Value:** No mainstream editor offers real-time attention highlighting for prompt engineering. Existing tools are separate visualizers (e.g., BertViz). This is a strong differentiator.

**HTML Preview:**
*   **Server:** A local Node/Rust server with WebSocket hot-reload is the proven architecture for this feature (similar to `vite` dev server).
*   **Rust vs. Node:** Using Rust (`axum` or `actix-web`) avoids shipping a heavy Node.js runtime with the app.

---

## 6. Next Steps
1.  **Refactor `codeBlockParams.ts`** to support arrays (prerequisite for advanced tagging).
2.  **Prototype "Blueprint Export"**: Create a simple JSON export that respects `exclude` and new tags.
3.  **Research Rust HTTP Server**: Investigate `axum` crate for the Tauri side to serve the HTML hot-reload preview.