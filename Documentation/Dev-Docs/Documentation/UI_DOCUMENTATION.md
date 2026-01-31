# UI Components Documentation

## Overview
ContextPad follows a modular, feature-based component architecture. The UI is designed to maximize drafting space while keeping automation tools accessible.

---

## 1. Core Shell (`src/components/Layout`)
**Purpose:** Defines the primary grid and layout constraints.

- **Layout.tsx:** Uses a flexbox-based shell to manage the header, main content area, and sidebars.
- **GlobalErrorHandler.tsx:** An Error Boundary wrapper that prevents total application crashes on UI rendering errors.

---

## 2. Editor Subsystem (`src/components/Editor`)
**Purpose:** Orchestrates the CodeMirror 6 instance and its surrounding utilities.

- **EditorContainer.tsx:** React-CodeMirror bridge. It implements a **Reliable Remount** strategy (re-rendering the editor on tab switch) to ensure stable state restoration from the Zustand store.
- **Editor.tsx:** The main engine. Uses **Compartments** to allow hot-swapping themes, fonts, and language rules without resetting the editor view.
- **EditorContextMenu.tsx:** Provides quick access to common commands (Lock Block, Run Formula).
- **FloatingSearch.tsx:** A lightweight, non-blocking search and replace widget.

---

## 3. Sidebars (`src/components/LeftSidebar` & `src/components/Sidebar`)
**Purpose:** Provides structural navigation and management tools.

### Left Sidebar:
- **FileExplorer.tsx:** Recursive tree view for the active workspace.
- **MarkdownOutline.tsx:** Analyzes headers in real-time to provide a clickable Table of Contents.

### Right Sidebar (Feature Managers):
- **ActionManager.tsx / TemplateManager.tsx:** Unified interfaces for managing executable logic and snippets.
- **WorkflowManager.tsx:** Manages "Pinned" workflows with dual-click navigation logic.
- **Shared Components:** Uses `ManagerToolbar`, `ManagerList`, and `ManagerItem` to ensure consistent UX across all feature managers.

---

## 4. Title & Navigation (`src/components/TitleBar` & `Breadcrumb`)
**Purpose:** Handles application window controls and file path context.

- **TitleBar.tsx:** Implements a multi-tab system.
- **TabBar.tsx:** Handles tab reordering via drag-and-drop and tab-closing logic.
- **Breadcrumb.tsx:** A "Mini Explorer" that allows clicking on path segments to see sibling files in that directory.

---

## 5. Status Bar (`src/components/StatusBar`)
**Purpose:** Real-time document metrics and feedback.

- **StatusBar.tsx:** Displays line/column counts and token estimations.
- **TokenStatsPopup.tsx:** Detail view for prompt costs and multi-model token counts.
