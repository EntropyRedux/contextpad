# ContextPad User Guide

This guide explains how to use ContextPad day-to-day: writing, managing reusable content, running action scripts, and exporting results.

## Quickstart (5-minute setup)

1. Open ContextPad.
2. Create or open a file/workspace.
3. Press `Ctrl+,` to open Settings and pick your theme/font.
4. Add one template in **Templates** manager and test insert.
5. Add one command action in **Actions** manager and run it.
6. Enable token stats in settings and monitor usage in the status bar.

If you are new to the app, read sections in this order:

1. **Files, Tabs, and Workspace**
2. **Templates**
3. **Actions**
4. **Workflows & Bookmarks**
5. **Token & Cost Tracking**

---

## 1) Getting Started

### Launch Modes

- Desktop dev mode: `npm run tauri:dev`
- Desktop production build: `npm run tauri:build`

On launch, ContextPad restores your workspace state and opens startup files when provided by OS/file associations.

### Main Layout

- **Top:** Title bar, menu bar, breadcrumb
- **Center:** Editor tabs + editor pane
- **Left Sidebar:** File explorer + outline/workspace navigation
- **Right Sidebar:** Settings / Templates / Actions / Workflows
- **Bottom:** Status bar (cursor, char count, tokens, language, encoding)

---

## 2) Files, Tabs, and Workspace

### Common file actions

- New file
- Open file
- Open workspace folder
- Save / Save As
- Recent files list in File menu

### Tab controls

- Reorder tabs by drag/drop
- Close dirty tabs with confirmation
- Jump between tabs via shortcuts (see Shortcuts section)

---

## 3) Editor Features

### Search

- Find (`Ctrl+F`)
- Replace (`Ctrl+H`)

### Code block control

- Toggle lock on current block (`Ctrl+L`)
- Lock all (`Ctrl+Shift+L`)
- Unlock all (`Ctrl+Shift+U`)
- Toggle block markers (`Ctrl+Shift+M`)

### Markdown behavior

- Markdown rendering can be enabled/disabled from settings
- Optional accent coloring for markdown headings
- Syntax theme controls code/editor token colors

### Fonts and theme

- Select app theme + accent color
- Choose editor syntax theme (includes Monokai)
- Choose editor font (`Inter`, `Roboto`, `Serif`, and monospaced choices)
- Option: apply editor font app-wide

---

## 4) Templates

Templates are reusable snippets with optional placeholders.

### Template format basics

- Use plain text/markdown as template content.
- Variables can be written as placeholders (for example `{{name}}`) and reused in repeatable prompt structures.
- Templates can be simple one-liners or large multi-block prompt scaffolds.

### What you can do

- Add/edit/delete templates
- Organize by category
- Hide/show templates
- Pin templates for quick insert from menu
- Import/export template libraries as JSON
- Bulk operations (visibility, delete)

### Creating templates efficiently

#### Option A: Create manually

1. Open **Templates** manager.
2. Click **Add Template**.
3. Enter name, category, and content.
4. Save.

#### Option B: Capture from selected text (fast path)

1. Select text in editor.
2. In Templates manager, use **Add Selection**.
3. Name and categorize the template.
4. Save.

This is the fastest way to turn successful prompt fragments into reusable building blocks.

### Use template in editor

- Run template from Template Manager (play button)
- Or insert pinned template from Menu Bar → Templates

### Template organization tips

- Keep categories focused (for example: `SYSTEM`, `ANALYSIS`, `WORKFLOW`, `EXPORT`).
- Pin only high-frequency templates to keep top-level menus clean.
- Hide old templates instead of deleting when you are unsure.
- Export your library before major refactors.

### Import/export behavior

- Templates import/export as JSON.
- Imports can include duplicates if names already exist.
- Recommended: keep a versioned backup file for team/shared libraries.

---

## 5) Actions

Actions are automation snippets. Two types:

- **Command action:** executes immediately
- **Button action:** inserts `[[action:your-id]]` into document

### Action authoring modes

ContextPad supports two authoring styles for actions:

1. **Formula Builder** (no JavaScript required)
2. **JavaScript actions** (custom logic with helper APIs)

### Formula Builder (recommended for common transforms)

Use this when you want fast text transformations without writing JS.

#### Builder flow

1. Open **Actions** manager.
2. Set action type (`command` or `button`).
3. Switch code mode to **Formula**.
4. Choose a formula category.
5. Pick a formula function.
6. Choose formula input style:
   - `selection` (default, applies to highlighted text)
   - `custom` (manual argument input)
7. Apply formula from builder and save action.

#### How formulas are stored

- Formula actions are persisted as `FORMULA:<expression>`.
- You can edit formula text directly after builder generation.

#### Good use-cases for formula actions

- Case transforms (`UPPER`, `LOWER`, title/snake/camel variants)
- Line operations (sort, deduplicate, cleanup)
- Utility inserts (date/UUID)

### JavaScript Actions (advanced/custom automation)

Use JavaScript mode when your workflow needs multi-step logic, pattern matching, or document-structure-aware behavior.

#### Runtime model

- JS actions execute in a **sandboxed environment**.
- They do not run with unrestricted browser/OS access.
- Mutations are applied via approved helper operations.

#### Core helper patterns

Read data:

- `helpers.getSelection()`
- `helpers.getAllText()`
- `helpers.getLines()` / `helpers.getLine(n)`
- `helpers.getCursorPosition()`

Write/mutate:

- `helpers.replaceSelection(text)`
- `helpers.insertAtCursor(text)`
- `helpers.replaceAllText(text)`
- `helpers.setCursorPosition(pos)`
- `helpers.copyToClipboard(text)`

#### Minimal JS action example

- Uppercase selected text:
  - read selection
  - transform
  - replace selection

Pseudo-flow:

1. `const selected = helpers.getSelection()`
2. if empty, exit early
3. `helpers.replaceSelection(selected.toUpperCase())`

### Command vs Button action strategy

- Use **Command** for immediate operations from manager/menu/command palette.
- Use **Button** when a document should embed executable checkpoints (for repeatable workflows).

### Action insertion in documents

- Button actions render from `[[action:ID]]` syntax.
- Great for procedural docs where execution should happen in-context.

### Import/export and compatibility notes

- Action imports are normalized for compatibility where possible.
- Legacy clipboard/helper patterns are auto-migrated to supported helper calls.
- If an imported action behaves unexpectedly, open it in editor and verify helper usage explicitly.

### Action management

- Add/edit/delete
- Enable/disable
- Pin actions for quick run from Menu Bar → Actions
- Import/export JSON libraries
- Bulk operations supported

### Action debugging checklist

If an action does not work as expected:

1. Confirm action is **enabled**.
2. Verify whether it is `command` vs `button` (execution path differs).
3. Check helper method names and arguments.
4. Re-import only after exporting a backup.
5. Start from a minimal working version, then add complexity.

---

## 6) Workflows & Bookmarks

Workflow Manager stores quick-launch items:

- **Workflow:** stored content blueprint
- **Bookmark:** path to an existing file on disk

### Capabilities

- Categorize and icon-tag items
- Launch item by click
- Open fresh copy by double-click (workflow)
- Hide/show and bulk-manage entries

---

## 7) Live Preview & Export

### Live preview

- Start/Stop from File menu
- Preview settings available in Settings → Preview & Export

### Export options

- Export HTML document
- Export Blueprint JSON

### Preview customization

- Theme (`match`, dark, light)
- Max width
- Font scale
- Content margin
- Optional TOC display
- Custom CSS block

---

## 8) Token & Cost Tracking

Status bar token panel provides:

- Token count
- Cost estimate
- Method badges:
  - **Live** (online exact count)
  - **Cached** (result reused)
  - **Est** (approximation)

Click token panel for detailed breakdown popup.

### Token settings

In Settings → Token Calculation:

- Select model
- Enable/disable online calculation
- Limit mode:
  - model max
  - custom token limit
  - cost budget
- Configure warning/danger thresholds
- Manage custom models

---

## 9) Spell Check, Autocomplete, and Linting

### Autocomplete

Toggle globally and tune:

- Markdown snippets
- Code block snippets
- Document words

### Spell check

- Built-in mode (with custom dictionary)
- Browser mode (OS dictionary, faster)

### Code linting

Toggle syntax checks for:

- JSON
- YAML
- JavaScript

---

## 10) Keyboard Shortcuts

### File/Tab

- `Ctrl+N` / `Ctrl+T` – New tab
- `Ctrl+O` – Open file
- `Ctrl+S` – Save
- `Ctrl+Shift+S` – Save As
- `Ctrl+W` – Close tab
- `Ctrl+Tab` / `Ctrl+Shift+Tab` – Next/Previous tab
- `Ctrl+1..8` – Jump to tab index
- `Ctrl+9` – Jump to last tab

### Editor/Navigation

- `Ctrl+F` – Find
- `Ctrl+H` – Replace
- `Ctrl+B` – Toggle left sidebar (outline)
- `Ctrl+,` – Toggle right sidebar (settings/managers)

### Block controls

- `Ctrl+L` – Toggle lock current block
- `Ctrl+Shift+L` – Lock all blocks
- `Ctrl+Shift+U` – Unlock all blocks
- `Ctrl+Shift+M` – Toggle code block markers

### Template shortcut

- `Ctrl+Shift+T` – Save selected text as template

---

## 11) Troubleshooting

### Action import issues

If an imported action fails:

1. Re-import with latest export format if available.
2. Check action code for direct runtime assumptions.
3. Prefer helper APIs over direct globals.

Compatibility normalizers exist for legacy clipboard/helper calls, but explicit helper-based code remains best.

### Token panel confusion

- `Live` = online exact mode
- `Cached` = reused result
- `Est` = approximation (often due to indexing scope or mode)

### Build issues (desktop)

Run preflight:

- `npm run tauri:preflight`

This validates Rust/Tauri toolchain readiness before packaging.

---

## 12) Recommended Workflow

1. Open workspace folder.
2. Create templates for recurring prompt structures.
3. Add actions for repetitive text manipulation.
4. Pin your highest-use templates/actions/workflows.
5. Use token panel to keep context and budget in check.
6. Export final output as HTML or blueprint as needed.

---

If you maintain team libraries, keep shared template/action JSON in versioned files and re-import after updates.
