# Implementation Plan: UI Fixes (Tab Bar + Workflow Management)

**Date:** January 25, 2026
**Version:** v1.5.0-parallel
**Location:** `Repo/ContextPad/dev/ContextPad-v1.5.0-parallel`
**Status:** Pending Implementation

---

## Overview

This plan addresses two UI polish issues identified in ContextPad v1.5.0:

| Issue | Summary |
|-------|---------|
| **#1** | "+" button for new tabs should be anchored to far right |
| **#2** | Workflow clicks should navigate to existing tabs instead of creating duplicates |

---

## Issue #1: Tab Bar "+" Button Position

### Current State

**File:** `src/components/TitleBar/TabBar.tsx`

The current layout order in the JSX:

```
[Left Scroll Arrow] [Tab Container] [Right Scroll Arrow] [+ Button] [Drag Spacer]
```

The `+` button is positioned immediately after the tab container, causing it to shift horizontally as tabs are added or removed. The `dragSpacer` fills remaining space on the right.

**Current CSS (`TabBar.module.css`):**
```css
.addTabBtn {
  flex-shrink: 0;
  /* Button never shrinks but position is not fixed */
}

.dragSpacer {
  flex: 1;
  min-width: 20px;
  /* Fills remaining space AFTER the + button */
}
```

### Problem

- The `+` button moves left/right as tabs change
- Unnecessary layout recalculation
- Inconsistent click target position for users

### Proposed Solution

Anchor the `+` button to the far right by swapping the order of `addTabBtn` and `dragSpacer`.

**New Layout:**
```
[Left Scroll Arrow] [Tab Container] [Right Scroll Arrow] [Drag Spacer] [+ Button]
```

### Implementation Details

#### File: `src/components/TitleBar/TabBar.tsx`

**Location:** Around lines 165-180 (end of the component's return statement)

**Current Code:**
```tsx
{/* Add tab button */}
<button
  className={styles.addTabBtn}
  onClick={() => addTab()}
  title="New tab"
>
  <Plus size={16} />
</button>

{/* Drag region spacer */}
<div className={styles.dragSpacer} data-tauri-drag-region />
```

**New Code:**
```tsx
{/* Drag region spacer */}
<div className={styles.dragSpacer} data-tauri-drag-region />

{/* Add tab button - anchored to far right */}
<button
  className={styles.addTabBtn}
  onClick={() => addTab()}
  title="New tab"
>
  <Plus size={16} />
</button>
```

#### File: `src/components/TitleBar/TabBar.module.css` (Optional Enhancement)

Add a small margin to separate the button from window controls:

```css
.addTabBtn {
  flex-shrink: 0;
  margin-right: 4px; /* Optional: spacing from window controls */
}
```

### Testing Checklist

- [ ] Button remains fixed at far right with 0 tabs
- [ ] Button remains fixed at far right with 1-3 tabs
- [ ] Button remains fixed at far right with many tabs (overflow state)
- [ ] Button remains clickable and functional
- [ ] Drag region still works for window dragging
- [ ] No visual overlap with window controls (minimize/maximize/close)

---

## Issue #2: Workflow Tab Deduplication

### Current State

**Files:**
- `src/components/Sidebar/WorkflowManager.tsx` (workflow list clicks)
- `src/components/Sidebar/Sidebar.tsx` (icon bar clicks)
- `src/store/tabStore.ts` (tab state management)

**Current Behavior:**
Every click on a workflow (either in the workflow manager list or the icon bar) creates a new tab, regardless of whether that workflow is already open.

**Current Code (`WorkflowManager.tsx` ~line 146-152):**
```tsx
const handleOpen = (pin: PinnedTab) => {
  addTab({
    title: pin.name,
    content: pin.content,
    language: 'markdown'
  })
}
```

**Current Code (`Sidebar.tsx` ~line 68-74):**
```tsx
const handleOpenPinnedTab = (pin: typeof pinnedTabs[0]) => {
  addTab({
    title: pin.name,
    content: pin.content,
    language: 'markdown'
  })
}
```

### Problem

- Users accidentally create multiple tabs of the same workflow
- No way to navigate to an already-open workflow
- Clutters the tab bar with duplicates

### Proposed Solution

Implement dual-click behavior:

| Action | Behavior |
|--------|----------|
| **Single Click** | Navigate to existing workflow tab if open, otherwise create new tab |
| **Double Click** | Force open a fresh copy of the workflow (original content, ignores existing) |

This allows users to:
- Quickly access an already-open workflow (single click)
- Get a fresh copy when needed, discarding edits (double click)

### Implementation Details

#### Step 1: Extend Tab Interface

**File:** `src/store/tabStore.ts`

**Location:** Tab interface definition (around line 10-20)

**Current:**
```typescript
export interface Tab {
  id: string
  title: string
  content: string
  language?: string
  filePath?: string
  isDirty?: boolean
  // ... other fields
}
```

**Add:**
```typescript
export interface Tab {
  id: string
  title: string
  content: string
  language?: string
  filePath?: string
  isDirty?: boolean
  pinnedTabId?: string  // Links tab to a workflow/pinned tab
  // ... other fields
}
```

#### Step 2: Update WorkflowManager.tsx

**File:** `src/components/Sidebar/WorkflowManager.tsx`

**Add imports (if not present):**
```typescript
import { useTabStore } from '../../store/tabStore'
```

**Add store selectors:**
```typescript
const tabs = useTabStore(state => state.tabs)
const setActiveTab = useTabStore(state => state.setActiveTab)
```

**Replace single handler with dual handlers:**

```typescript
/**
 * Single click: Navigate to existing workflow tab or open new
 */
const handleWorkflowClick = (pin: PinnedTab) => {
  const existingTab = tabs.find(t => t.pinnedTabId === pin.id)

  if (existingTab) {
    // Navigate to existing tab (preserves user edits)
    setActiveTab(existingTab.id)
  } else {
    // Open new tab
    addTab({
      title: pin.name,
      content: pin.content,
      language: 'markdown',
      pinnedTabId: pin.id
    })
  }
}

/**
 * Double click: Force open fresh copy of workflow
 */
const handleWorkflowDoubleClick = (pin: PinnedTab) => {
  addTab({
    title: pin.name,
    content: pin.content,
    language: 'markdown',
    pinnedTabId: pin.id
  })
}
```

**Update JSX click handlers:**

Find the workflow item element (likely a `<div>` or `<button>`) and update:

```tsx
<div
  className={styles.workflowItem}
  onClick={() => handleWorkflowClick(pin)}
  onDoubleClick={() => handleWorkflowDoubleClick(pin)}
  title="Click to open, double-click for fresh copy"
>
  {/* ... workflow item content */}
</div>
```

**Prevent click-through on double-click:**

To prevent single-click firing before double-click, add a small delay:

```typescript
const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

const handleWorkflowClick = (pin: PinnedTab) => {
  // Clear any pending click
  if (clickTimeoutRef.current) {
    clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = null
    return
  }

  // Delay single-click to allow double-click detection
  clickTimeoutRef.current = setTimeout(() => {
    clickTimeoutRef.current = null

    const existingTab = tabs.find(t => t.pinnedTabId === pin.id)
    if (existingTab) {
      setActiveTab(existingTab.id)
    } else {
      addTab({
        title: pin.name,
        content: pin.content,
        language: 'markdown',
        pinnedTabId: pin.id
      })
    }
  }, 200) // 200ms delay for double-click window
}

const handleWorkflowDoubleClick = (pin: PinnedTab) => {
  // Clear single-click timeout
  if (clickTimeoutRef.current) {
    clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = null
  }

  // Force open fresh copy
  addTab({
    title: pin.name,
    content: pin.content,
    language: 'markdown',
    pinnedTabId: pin.id
  })
}
```

#### Step 3: Update Sidebar.tsx (Icon Bar)

**File:** `src/components/Sidebar/Sidebar.tsx`

Apply the same pattern for the pinned workflow icons in the activity bar.

**Add store selectors:**
```typescript
const tabs = useTabStore(state => state.tabs)
const setActiveTab = useTabStore(state => state.setActiveTab)
```

**Add handlers:**
```typescript
const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

const handlePinnedTabClick = (pin: PinnedTab) => {
  if (clickTimeoutRef.current) {
    clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = null
    return
  }

  clickTimeoutRef.current = setTimeout(() => {
    clickTimeoutRef.current = null

    const existingTab = tabs.find(t => t.pinnedTabId === pin.id)
    if (existingTab) {
      setActiveTab(existingTab.id)
    } else {
      addTab({
        title: pin.name,
        content: pin.content,
        language: 'markdown',
        pinnedTabId: pin.id
      })
    }
  }, 200)
}

const handlePinnedTabDoubleClick = (pin: PinnedTab) => {
  if (clickTimeoutRef.current) {
    clearTimeout(clickTimeoutRef.current)
    clickTimeoutRef.current = null
  }

  addTab({
    title: pin.name,
    content: pin.content,
    language: 'markdown',
    pinnedTabId: pin.id
  })
}
```

**Update JSX:**
```tsx
<button
  className={styles.pinnedTabIcon}
  onClick={() => handlePinnedTabClick(pin)}
  onDoubleClick={() => handlePinnedTabDoubleClick(pin)}
  title={`${pin.name} (double-click for fresh copy)`}
>
  {/* icon */}
</button>
```

#### Step 4: Optional - Extract Shared Logic

If both components use identical logic, consider extracting to a custom hook:

**File:** `src/hooks/useWorkflowNavigation.ts` (new file)

```typescript
import { useRef, useCallback } from 'react'
import { useTabStore } from '../store/tabStore'
import type { PinnedTab } from '../store/tabStore'

export function useWorkflowNavigation() {
  const tabs = useTabStore(state => state.tabs)
  const addTab = useTabStore(state => state.addTab)
  const setActiveTab = useTabStore(state => state.setActiveTab)

  const clickTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleClick = useCallback((pin: PinnedTab) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
      return
    }

    clickTimeoutRef.current = setTimeout(() => {
      clickTimeoutRef.current = null

      const existingTab = tabs.find(t => t.pinnedTabId === pin.id)
      if (existingTab) {
        setActiveTab(existingTab.id)
      } else {
        addTab({
          title: pin.name,
          content: pin.content,
          language: 'markdown',
          pinnedTabId: pin.id
        })
      }
    }, 200)
  }, [tabs, addTab, setActiveTab])

  const handleDoubleClick = useCallback((pin: PinnedTab) => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current)
      clickTimeoutRef.current = null
    }

    addTab({
      title: pin.name,
      content: pin.content,
      language: 'markdown',
      pinnedTabId: pin.id
    })
  }, [addTab])

  return { handleClick, handleDoubleClick }
}
```

**Usage in components:**
```typescript
const { handleClick, handleDoubleClick } = useWorkflowNavigation()

// JSX
<button
  onClick={() => handleClick(pin)}
  onDoubleClick={() => handleDoubleClick(pin)}
>
```

### Testing Checklist

- [ ] Single click on workflow (no existing tab) → opens new tab
- [ ] Single click on workflow (existing tab open) → navigates to existing tab
- [ ] Single click preserves edits made in existing workflow tab
- [ ] Double click always opens fresh copy with original content
- [ ] Double click works even when workflow tab already exists
- [ ] Icon bar clicks behave same as workflow manager clicks
- [ ] No race conditions between single and double click
- [ ] Tab `pinnedTabId` is correctly set when opening workflows
- [ ] Closing workflow tab allows single-click to open new tab again

---

## File Change Summary

| File | Changes |
|------|---------|
| `src/components/TitleBar/TabBar.tsx` | Swap `addTabBtn` and `dragSpacer` order |
| `src/components/TitleBar/TabBar.module.css` | Optional: add margin to `addTabBtn` |
| `src/store/tabStore.ts` | Add `pinnedTabId?: string` to Tab interface |
| `src/components/Sidebar/WorkflowManager.tsx` | Add dual-click handlers with dedup logic |
| `src/components/Sidebar/Sidebar.tsx` | Add dual-click handlers for icon bar |
| `src/hooks/useWorkflowNavigation.ts` | (Optional) Shared hook for workflow navigation |

---

## Implementation Order

1. **Issue #1** (Tab Bar) - Independent, can be done first
2. **Issue #2 Step 1** (tabStore.ts) - Add interface field
3. **Issue #2 Step 2** (WorkflowManager.tsx) - Add handlers
4. **Issue #2 Step 3** (Sidebar.tsx) - Add handlers
5. **Issue #2 Step 4** (Optional) - Extract hook if desired

---

## Rollback Plan

If issues arise:
- Issue #1: Swap the two elements back to original order
- Issue #2: Remove `pinnedTabId` checks, revert to always calling `addTab()`

---

## Notes

- The 200ms delay for double-click detection is a standard UX pattern
- Consider adding a tooltip hint about double-click behavior
- The `pinnedTabId` field enables future features like "sync workflow edits back to definition"
