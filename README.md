# ContextPad

[![Version](https://img.shields.io/badge/version-1.10.0-blue.svg)](#)
[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-green.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)
[![Desktop](https://img.shields.io/badge/runtime-Tauri%20v2-24c8db.svg)](https://tauri.app/)
[![Frontend](https://img.shields.io/badge/frontend-React%2018-61dafb.svg)](https://react.dev/)

A desktop-first, keyboard-friendly workspace for structured writing, prompt engineering, technical drafting, and workflow automation.

ContextPad combines a fast CodeMirror editor with templates, action scripts, workflow/bookmark launchers, markdown preview/export, and token/cost insights.

## Quickstart (TL;DR)

1. Install dependencies:
  - `npm install`
2. Run desktop app in development:
  - `npm run tauri:dev`
3. Build production desktop app:
  - `npm run tauri:build`

If you are setting up on a fresh machine, run `npm run tauri:preflight` first.

## Documentation

- User guide: [`USERGUIDE.md`](./USERGUIDE.md)
- Release history: [`CHANGELOG.md`](./CHANGELOG.md)

## Screenshots

> Add release screenshots and reference them here when preparing public releases.

- Editor workspace (placeholder)
- Templates/Actions managers (placeholder)
- Token stats + status bar (placeholder)

## Highlights

- Multi-tab editor with drag/drop tab ordering
- Right sidebar managers for **Templates**, **Actions**, and **Workflows/Bookmarks**
- Left sidebar outline + file explorer workspace mode
- Formula engine (`FORMULA:...`) and inline formulas
- Sandboxed action execution with compatibility-safe helper API
- Token/cost estimation with model-aware thresholds and cached/live indicators
- Markdown rendering + live preview + HTML export + TOC
- Theme system (including **Monokai**) and app accent system
- Configurable editor fonts (`Inter`, `Roboto`, `Serif`, monospaced options)
- Optional app-wide font application
- Tauri desktop app with single-instance and deep-link plugins

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Editor:** CodeMirror 6
- **State:** Zustand (persisted stores)
- **Desktop runtime:** Tauri v2 (Rust backend + web frontend)
- **Markdown:** `marked`
- **Tokenization/cost estimation:** `js-tiktoken` + custom estimator services

---

## Project Structure

- `src/` – React app, editor extensions, stores, services, UI components
- `src/components/` – UI modules (`Editor`, `MenuBar`, `Sidebar`, `StatusBar`, etc.)
- `src/store/` – persisted stores for tabs, settings, templates, actions
- `src/services/` – token estimator, statistics, autocomplete, lint/spell services
- `src/themes/` – syntax themes and markdown highlight behavior
- `src-tauri/` – Rust commands, Tauri config, desktop packaging
- `templates&actions-library/` – import/export JSON samples for actions/workflows
- `scripts/` – desktop preflight tooling

---

## Core Systems

### 1) Tab + Workspace System

- Open/create files as tabs
- Open a folder workspace and browse files from left sidebar
- Detect dirty tabs and confirm on close
- Track cursor position, language, and editor view settings per workspace state

### 2) Template Manager

- Create/edit/delete templates
- Insert templates into active editor
- Supports variable placeholders and cursor handling
- Import/export template libraries
- Pin templates to quickly insert via Menu Bar

### 3) Action Manager

- Create command actions and button actions
- Run command actions directly; insert button actions as `[[action:ID]]`
- Action execution uses sandboxed iframe runtime
- Import/export actions with normalization + compatibility safeguards

### 4) Workflow Manager

- Store reusable workflow blueprints (content snapshots)
- Store bookmarks (file-path launchers)
- Launch as new tabs or open bound files
- Category organization, visibility toggle, bulk operations

### 5) Token & Cost System

- Debounced token estimation
- Supports local/custom/online strategy routing
- Model-aware context and budget thresholds
- Status bar badge indicators for live/cached/estimated modes

---

## Script Commands

- `npm run dev` – start frontend dev server
- `npm run build` – production frontend build
- `npm run tauri:dev` – run desktop app in dev mode
- `npm run tauri:build` – desktop production build (app + bundles)
- `npm run tauri:preflight` – validate desktop build prerequisites
- `npm run tauri:wrapup` – preflight + production desktop build

---

## Desktop Build Outputs

Typical outputs:

- App executable: `src-tauri/target/release/contextpad.exe`
- NSIS installer: `src-tauri/target/release/bundle/nsis/ContextPad_<version>_x64-setup.exe`

Current documented release target in this repository:

- Version: `1.10.0`

---

## Configuration Notes

- App theme and accent are persisted in local storage and applied early at startup to avoid flash/mismatch.
- Optional app-wide font setting applies selected editor font to the full UI shell.
- Markdown heading accent override is configurable in settings.

---

## Security & Reliability Notes

- Action scripts execute in an isolated sandbox and communicate mutations back via message passing.
- Action import pipeline sanitizes malformed payloads and normalizes legacy clipboard/helper calls for compatibility.
- File operations are delegated to Tauri commands rather than unrestricted browser APIs.

---

## License

`GPL-3.0`

Author: `entropy_redux`
