# ContextPad - Codebase Analysis

**Date:** January 23, 2026
**Version:** 1.3.3
**Framework:** Tauri 2.x + React 18 + CodeMirror 6

---

## 1. Application Overview

**ContextPad** is a specialized, local-first desktop text editor designed primarily for **Prompt Engineering** and **AI Context Management**. Unlike general-purpose code editors (VS Code) or simple text editors (Notepad), ContextPad focuses on the specific needs of working with Large Language Models (LLMs): **Token Counting**, **Context Window Management**, and **Cost Estimation**.

It is built as a **standalone native executable** using Tauri, ensuring low memory footprint, high performance, and complete offline privacy.

### Core Philosophy
*   **Context-First:** The editor treats text as "context" for AI models, providing real-time feedback on token usage and cost.
*   **Local & Private:** No cloud dependencies. API keys for estimation are stored locally via OS keychains.
*   **Performance:** Optimized for handling large text files (logs, datasets, long prompts) without lagging.

---

## 2. Architecture & Tech Stack

The application follows a modern **Hybrid Architecture**:

*   **Frontend (UI/UX):**
    *   **React 18**: Component-based UI.
    *   **Zustand**: Global state management (Tabs, Settings, Sidebar state).
    *   **CSS Modules**: Scoped styling to prevent conflicts.
    *   **Vite**: Fast build tool and dev server.

*   **Editor Engine:**
    *   **CodeMirror 6**: A modular, extensible text editor framework.
    *   **Custom Extensions**: `slashCommands`, `inlineFormulas`, `templateVariables`, `tokenEstimator` integration.

*   **Backend (System Integration):**
    *   **Tauri 2.0 (Rust)**: Bridges the web frontend with the operating system.
    *   **Rust Commands**: Handles file I/O, window management, and secure storage (API keys).
    *   **Capabilities**: configured via `tauri.conf.json` for security (CSP, permissions).

*   **Services:**
    *   **TokenEstimatorService**: A singleton service orchestrating token counting logic (Local vs. Online).
    *   **IndexedDB**: Persists user session (open tabs, unsaved changes) across restarts.

---

## 3. Key Features Breakdown

### A. Intelligent Token Estimator
The "Killer Feature" of ContextPad. It provides real-time metrics essential for AI work.
*   **Dual Estimation Strategies:**
    *   **Local (Offline):** Uses `js-tiktoken` for OpenAI models (`gpt-4o`, `gpt-3.5`). fast and free.
    *   **Online (API):** Connects to Anthropic/Google APIs for models with proprietary tokenizers (Claude, Gemini).
*   **Cost Calculation:** Real-time cost estimates based on model pricing (Input/Output rates per 1M tokens).
*   **Smart Caching:** Deduplicates requests and caches results to prevent API rate limiting and reduce latency.
*   **Large File Strategy:** Automatically switches to "sampling & extrapolation" for massive files to prevent UI freezing.

### B. Specialized Editor
*   **Performance Mode:** Automatically detects large files (>100k chars) and disables heavy plugins (bracket matching, folding) to maintain 60fps scrolling.
*   **Syntax Highlighting:** Support for 100+ languages via CodeMirror language packages.
*   **Markdown Support:** First-class Markdown support with optional "Preview" logic and highlighting.
*   **Extensions:**
    *   **Slash Commands:** Using CTRL + SPACE or CTRL + RIGHT CLICK (mouse) triggers a menu for quick insertions (templates, snippets, actions).
    *   **Template Variables:** Highlights `{{variable}}` syntax for prompt templates.

### C. Sidebar Tools
*   **File Explorer:** Standard file tree for project navigation.
*   **Template Manager:** A dedicated space to save, organize, and drag-and-drop prompt templates.
*   **Action Manager (Advanced):** A powerful extensibility layer for automating text transformations.

### D. Extensibility & Action System
ContextPad features a robust **Action System** that allows users to extend the editor's functionality without modifying the source code.

*   **Dual Execution Engines:**
    *   **Formula Engine:** A user-friendly, Excel-like syntax for common text operations (e.g., `UPPER()`, `BOLD()`, `TODAY()`). Ideal for quick transformations.
    *   **JavaScript Sandbox:** A secure environment for complex logic using a `helpers` API. Actions can manipulate selection, insert templates, or perform document-wide replacements.
*   **Helper API:** Actions have access to a streamlined `helpers` object:
    *   `getSelection()` / `replaceSelection(text)`
    *   `insertAtCursor(text)` / `insertTemplate(content)`
    *   `getAllText()` / `replaceAllText(text)`
*   **UI Integration:** Actions can be registered as persistent **Buttons** in the Sidebar or triggered as one-time **Commands**.
*   **Formula Builder:** An interactive UI for constructing and previewing formulas before saving them.
*   **Import/Export:** User-defined actions can be shared via JSON files.

### E. Session Management
*   **Auto-Restore:** The app remembers exactly where you left off (open tabs, scroll position, unsaved content) using IndexedDB.
*   **Tab System:** Chrome-like tab management with drag-and-drop reordering.

---

## 4. Use Cases

### Primary: Prompt Engineering
*   **Scenario:** A user is crafting a complex system prompt for `Claude 3.5 Sonnet`.
*   **Value:** They can see exactly how many tokens the prompt consumes and the estimated cost *before* sending it to the API. They can use the **Template Manager** to inject standard "persona" blocks.

### Secondary: Dataset Preparation
*   **Scenario:** A developer is cleaning a large JSONL dataset for fine-tuning.
*   **Value:** ContextPad's **Performance Mode** handles the large file smoothly, while the **Token Estimator** helps ensure individual examples fit within the context window.

### Tertiary: Privacy-Focused Note Taking
*   **Scenario:** A user needs to draft sensitive documents (legal, medical) but wants IDE-like features (highlighting, search).
*   **Value:** The app works 100% offline with no telemetry, ensuring data never leaves the machine.

---

## 5. File Structure Highlights

*   `src/services/tokenEstimator/`: Contains the complex logic for token counting, including the `TokenEstimatorService` class and `models.ts` registry.
*   `src/components/Editor/`: Houses the CodeMirror implementation. `Editor.tsx` configures the extensions array based on settings and file size.
*   `src/store/`: Zustand stores. `tabStore.ts` is the central hub for editor state.
*   `src-tauri/src/commands/`: Rust functions callable from the frontend (e.g., `file.rs` for FS operations).
