# Core State Documentation (Zustand Stores)

## Overview
ContextPad uses **Zustand** for lightweight, performant global state management. Each major feature has a dedicated store that handles both state logic and persistence (LocalStorage or IndexedDB).

---

## 1. Tab Store (`src/store/tabStore.ts`)
**Purpose:** Manages the lifecycle of editor tabs, pinned workflows, and view settings.

### Key State:
- `tabs`: Array of active editor documents.
- `activeTabId`: ID of the currently focused tab.
- `pinnedTabs`: User-defined workflows (instantiable templates).
- `viewSettings`: Global editor preferences (font, theme, word wrap).

### Key Functions:
- `initializeFromStorage`: Loads tab content from **IndexedDB** to bypass LocalStorage limits.
- `addTab`: Creates new tabs with optional `pinnedTabId` linkage.
- `updateTab`: Debounced persistence of content changes.
- `movePinnedTabCategory`: Handles reordering of workflow groups.

### Persistence:
- **Metadata:** LocalStorage (`contextpad-tabs-v2`).
- **Content:** IndexedDB via `IndexedDBStorage.ts`.

---

## 2. Action Store (`src/store/actionStore.ts`)
**Purpose:** Manages user-defined JavaScript and Formula actions.

### Key State:
- `actions`: Array of executable logic blocks.
- `collapsedCategories`: UI state for the action sidebar.
- `pinnedActionIds`: Actions promoted to the Top Menu/Activity Bar.

### Key Functions:
- `executeAction`: (External util) Runs the action code against the editor view.
- `importActions`: Handles JSON merging with duplicate detection.
- `toggleCategoryCollapse`: Persists the visibility state of action groups.

### Persistence:
- LocalStorage (`contextpad-actions`, `contextpad-actions-ui`).

---

## 3. Template Store (`src/store/templateStore.ts`)
**Purpose:** Manages reusable text snippets with variable support.

### Key State:
- `templates`: Array of snippets.
- `collapsedCategories`: UI state for the template sidebar.

### Key Functions:
- `extractVariables`: Automatically detects `{{placeholder}}` patterns in content.
- `importTemplates`: JSON import with duplicate name warnings.

### Persistence:
- LocalStorage (`contextpad-templates`, `contextpad-templates-ui`).

---

## 4. Settings Store (`src/store/settingsStore.ts`)
**Purpose:** Manages application-wide configurations (API keys, workspace root).

### Key State:
- `workspaceRoot`: Path to the currently open project folder.
- `apiKeys`: (Securely managed) keys for token estimation services.

---

## 5. Notification Store (`src/store/notificationStore.ts`)
**Purpose:** Global toast notification system.

### Key State:
- `notifications`: Queue of active alerts (info, success, warning, error).

### Key Functions:
- `addNotification`: Pushes new alerts with auto-dismiss duration.
