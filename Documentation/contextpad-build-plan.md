app_build_plan_v2:
  
  project_info:
    name: "ContextPad"
    description: "Offline text editor with advanced code highlighting and tabbed interface"
    target_platform: "Windows (primary), cross-platform ready"
    architecture: "Tauri + React + CodeMirror 6"

phase_1_mvp:
  goal: "Working notepad-style editor with tabs and syntax highlighting"
  
  core_features:
    - "Multi-tab interface in title bar (like modern browsers)"
    - "Open/Save/New file operations per tab"
    - "CodeMirror 6 with syntax highlighting, different color patterns per language"
    - "Detect code blocks with parameters: ```language {param_1: 1, param_2: 2}"
    - "Primary language is markdown (detected with or without code blocks)"
    - "Simple menu bar (File, Edit, View)"
    - "Windows Notepad aesthetic with modern tabs"
    - "100% offline functionality"

tech_stack:
  frontend:
    framework: "React 18"
    editor: "CodeMirror 6"
    styling: "CSS Modules (scoped, modular)"
    state: "Zustand (for complex tab state management)"
    
  backend:
    language: "Rust"
    framework: "Tauri 2.x"
    
  build_tools:
    bundler: "Vite"
    package_manager: "pnpm"

key_architectural_change:
  custom_title_bar:
    reason: "Native title bar doesn't support embedded tabs"
    implementation: "Custom title bar with Tauri window controls"
    trade_off: "More control, but must implement drag, minimize, maximize, close"
    
  window_config:
    decorations: false  # Remove native title bar
    transparent: false
    titleBarStyle: "overlay"  # For macOS
    
project_structure: |
  contextpad/
  ├── src-tauri/              # Rust backend
  │   ├── src/
  │   │   ├── main.rs         # Entry point
  │   │   ├── commands/       # Tauri commands
  │   │   │   ├── mod.rs
  │   │   │   ├── file.rs     # File operations
  │   │   │   ├── dialog.rs   # Native dialogs
  │   │   │   └── window.rs   # Window controls (minimize, maximize, close)
  │   │   ├── utils/
  │   │   │   ├── mod.rs
  │   │   │   └── parser.rs   # Parse code block parameters
  │   │   └── error.rs
  │   ├── Cargo.toml
  │   └── tauri.conf.json
  │
  ├── src/                    # React frontend
  │   ├── main.tsx
  │   ├── App.tsx
  │   │
  │   ├── components/
  │   │   ├── TitleBar/       # CRITICAL: Custom title bar
  │   │   │   ├── TitleBar.tsx
  │   │   │   ├── TitleBar.module.css
  │   │   │   ├── TabBar.tsx           # Tab strip component
  │   │   │   ├── TabBar.module.css
  │   │   │   ├── WindowControls.tsx   # Min/Max/Close buttons
  │   │   │   └── WindowControls.module.css
  │   │   │
  │   │   ├── Editor/
  │   │   │   ├── Editor.tsx
  │   │   │   ├── Editor.module.css
  │   │   │   ├── useEditor.ts
  │   │   │   └── EditorContainer.tsx  # Wrapper for multi-tab
  │   │   │
  │   │   ├── MenuBar/
  │   │   │   ├── MenuBar.tsx
  │   │   │   └── MenuBar.module.css
  │   │   │
  │   │   ├── StatusBar/
  │   │   │   ├── StatusBar.tsx
  │   │   │   └── StatusBar.module.css
  │   │   │
  │   │   └── Layout/
  │   │       ├── Layout.tsx
  │   │       └── Layout.module.css
  │   │
  │   ├── hooks/
  │   │   ├── useFileOperations.ts
  │   │   ├── useKeyboardShortcuts.ts
  │   │   ├── useEditorState.ts
  │   │   ├── useTabs.ts              # NEW: Tab management
  │   │   └── useWindowControls.ts    # NEW: Window operations
  │   │
  │   ├── store/              # Zustand stores
  │   │   ├── tabStore.ts     # Tab state management
  │   │   └── editorStore.ts  # Editor state per tab
  │   │
  │   ├── services/
  │   │   ├── tauri.ts
  │   │   ├── editor.ts
  │   │   └── codeBlockParser.ts  # NEW: Parse ```lang {params}
  │   │
  │   ├── extensions/         # CodeMirror extensions
  │   │   ├── theme.ts
  │   │   ├── keymaps.ts
  │   │   ├── languages.ts
  │   │   └── markdownExtension.ts  # NEW: Enhanced markdown
  │   │
  │   ├── types/
  │   │   ├── editor.ts
  │   │   ├── file.ts
  │   │   ├── tab.ts          # NEW: Tab interface
  │   │   └── codeBlock.ts    # NEW: Code block with params
  │   │
  │   ├── constants/
  │   │   └── config.ts
  │   │
  │   └── styles/
  │       ├── global.css
  │       └── variables.css

implementation_steps:

  step_1_setup:
    task: "Initialize Tauri project"
    commands:
      - "npm create tauri-app@latest"
      - "cd contextpad"
      - "pnpm install"
      - "pnpm add zustand"
    
  step_2_dependencies:
    frontend:
      - "@codemirror/state: ^6.4.0"
      - "@codemirror/view: ^6.23.0"
      - "@codemirror/language: ^6.10.0"
      - "@codemirror/commands: ^6.3.3"
      - "@codemirror/lang-markdown: ^6.2.4"
      - "@codemirror/lang-javascript: ^6.2.1"
      - "@codemirror/lang-python: ^6.1.4"
      - "@codemirror/lang-html: ^6.4.8"
      - "@codemirror/lang-css: ^6.2.1"
      - "@codemirror/lang-json: ^6.0.1"
      - "zustand: ^4.5.0"
      - "@tauri-apps/api: ^2.x"
      
    backend:
      - "tauri: 2.x"
      - "serde: { version = '1', features = ['derive'] }"
      - "serde_json: 1"
      - "regex: 1"  # For parsing code block parameters
      
  step_3_tauri_config:
    file: "src-tauri/tauri.conf.json"
    critical_settings: |
      {
        "tauri": {
          "windows": [{
            "title": "ContextPad",
            "width": 1000,
            "height": 650,
            "minWidth": 500,
            "minHeight": 400,
            "decorations": false,  // CRITICAL: Remove native title bar
            "transparent": false,
            "fileDropEnabled": true
          }]
        }
      }
      
  step_4_rust_window_controls:
    file: "src-tauri/src/commands/window.rs"
    purpose: "Handle window operations from custom title bar"
    code: |
      use tauri::{AppHandle, Manager, Window};
      
      #[tauri::command]
      pub fn minimize_window(window: Window) {
          window.minimize().unwrap();
      }
      
      #[tauri::command]
      pub fn maximize_window(window: Window) {
          window.maximize().unwrap();
      }
      
      #[tauri::command]
      pub fn unmaximize_window(window: Window) {
          window.unmaximize().unwrap();
      }
      
      #[tauri::command]
      pub fn close_window(window: Window) {
          window.close().unwrap();
      }
      
      #[tauri::command]
      pub fn is_maximized(window: Window) -> bool {
          window.is_maximized().unwrap()
      }
      
  step_5_rust_code_block_parser:
    file: "src-tauri/src/utils/parser.rs"
    purpose: "Parse code block parameters on Rust side (optional, can do in JS)"
    code: |
      use regex::Regex;
      use serde::{Deserialize, Serialize};
      use std::collections::HashMap;
      
      #[derive(Debug, Serialize, Deserialize)]
      pub struct CodeBlock {
          pub language: String,
          pub parameters: HashMap<String, serde_json::Value>,
          pub content: String,
      }
      
      pub fn parse_code_blocks(content: &str) -> Vec<CodeBlock> {
          // Regex: ```language {params}
          let re = Regex::new(r"```(\w+)(?:\s*\{([^}]*)\})?\n([\s\S]*?)```").unwrap();
          
          let mut blocks = Vec::new();
          for cap in re.captures_iter(content) {
              let language = cap.get(1).map_or("", |m| m.as_str()).to_string();
              let params_str = cap.get(2).map_or("", |m| m.as_str());
              let code_content = cap.get(3).map_or("", |m| m.as_str()).to_string();
              
              // Parse params as JSON-like
              let parameters = parse_params(params_str);
              
              blocks.push(CodeBlock {
                  language,
                  parameters,
                  content: code_content,
              });
          }
          
          blocks
      }
      
      fn parse_params(params_str: &str) -> HashMap<String, serde_json::Value> {
          // Simple parser for key: value pairs
          // For MVP, can be basic implementation
          HashMap::new()
      }
      
  step_6_tab_store:
    file: "src/store/tabStore.ts"
    purpose: "Manage multiple tabs state"
    code: |
      import { create } from 'zustand'
      
      export interface Tab {
        id: string
        title: string
        content: string
        filePath: string | null
        isDirty: boolean
        language: 'markdown' | string  // Default markdown
      }
      
      interface TabState {
        tabs: Tab[]
        activeTabId: string | null
        
        addTab: (tab?: Partial<Tab>) => void
        removeTab: (id: string) => void
        setActiveTab: (id: string) => void
        updateTab: (id: string, updates: Partial<Tab>) => void
        getActiveTab: () => Tab | null
      }
      
      export const useTabStore = create<TabState>((set, get) => ({
        tabs: [],
        activeTabId: null,
        
        addTab: (tab) => {
          const newTab: Tab = {
            id: crypto.randomUUID(),
            title: tab?.title || 'Untitled',
            content: tab?.content || '',
            filePath: tab?.filePath || null,
            isDirty: false,
            language: tab?.language || 'markdown',
            ...tab
          }
          
          set((state) => ({
            tabs: [...state.tabs, newTab],
            activeTabId: newTab.id
          }))
        },
        
        removeTab: (id) => {
          set((state) => {
            const tabs = state.tabs.filter(t => t.id !== id)
            const activeTabId = state.activeTabId === id 
              ? (tabs[0]?.id || null) 
              : state.activeTabId
            return { tabs, activeTabId }
          })
        },
        
        setActiveTab: (id) => set({ activeTabId: id }),
        
        updateTab: (id, updates) => {
          set((state) => ({
            tabs: state.tabs.map(t => 
              t.id === id ? { ...t, ...updates } : t
            )
          }))
        },
        
        getActiveTab: () => {
          const { tabs, activeTabId } = get()
          return tabs.find(t => t.id === activeTabId) || null
        }
      }))
      
  step_7_custom_title_bar:
    file: "src/components/TitleBar/TitleBar.tsx"
    purpose: "Custom title bar with tabs and window controls"
    code: |
      import { TabBar } from './TabBar'
      import { WindowControls } from './WindowControls'
      import styles from './TitleBar.module.css'
      
      export function TitleBar() {
        return (
          <div className={styles.titleBar} data-tauri-drag-region>
            <div className={styles.appIcon}>
              {/* App icon/logo */}
              <span>📝</span>
            </div>
            
            <TabBar />
            
            <WindowControls />
          </div>
        )
      }
      
  step_7b_tab_bar:
    file: "src/components/TitleBar/TabBar.tsx"
    purpose: "Tab strip with add button"
    code: |
      import { useTabStore } from '../../store/tabStore'
      import styles from './TabBar.module.css'
      
      export function TabBar() {
        const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useTabStore()
        
        return (
          <div className={styles.tabBar}>
            {tabs.map(tab => (
              <div 
                key={tab.id}
                className={`${styles.tab} ${tab.id === activeTabId ? styles.active : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className={styles.tabTitle}>
                  {tab.isDirty && '• '}
                  {tab.title}
                </span>
                <button 
                  className={styles.closeBtn}
                  onClick={(e) => {
                    e.stopPropagation()
                    removeTab(tab.id)
                  }}
                >
                  ×
                </button>
              </div>
            ))}
            
            <button 
              className={styles.addTabBtn}
              onClick={() => addTab()}
              title="New tab"
            >
              +
            </button>
          </div>
        )
      }
      
  step_7c_window_controls:
    file: "src/components/TitleBar/WindowControls.tsx"
    purpose: "Minimize, maximize, close buttons"
    code: |
      import { invoke } from '@tauri-apps/api/core'
      import { useState, useEffect } from 'react'
      import styles from './WindowControls.module.css'
      
      export function WindowControls() {
        const [isMaximized, setIsMaximized] = useState(false)
        
        const minimize = () => invoke('minimize_window')
        const toggleMaximize = async () => {
          if (isMaximized) {
            await invoke('unmaximize_window')
          } else {
            await invoke('maximize_window')
          }
          setIsMaximized(!isMaximized)
        }
        const close = () => invoke('close_window')
        
        useEffect(() => {
          invoke<boolean>('is_maximized').then(setIsMaximized)
        }, [])
        
        return (
          <div className={styles.windowControls}>
            <button className={styles.btn} onClick={minimize}>
              <span>−</span>
            </button>
            <button className={styles.btn} onClick={toggleMaximize}>
              <span>{isMaximized ? '❐' : '□'}</span>
            </button>
            <button className={`${styles.btn} ${styles.close}`} onClick={close}>
              <span>×</span>
            </button>
          </div>
        )
      }
      
  step_8_title_bar_css:
    file: "src/components/TitleBar/TitleBar.module.css"
    purpose: "Style title bar to look native"
    code: |
      .titleBar {
        display: flex;
        height: 40px;
        background: #202020;
        color: #fff;
        align-items: center;
        user-select: none;
        border-bottom: 1px solid #333;
      }
      
      .appIcon {
        padding: 0 12px;
        font-size: 18px;
      }
      
      /* Make most of title bar draggable except interactive elements */
      .titleBar[data-tauri-drag-region] {
        -webkit-app-region: drag;
      }
      
      .titleBar button {
        -webkit-app-region: no-drag;
      }
      
  step_8b_tab_bar_css:
    file: "src/components/TitleBar/TabBar.module.css"
    purpose: "Chrome-like tabs"
    code: |
      .tabBar {
        display: flex;
        flex: 1;
        overflow-x: auto;
        overflow-y: hidden;
        gap: 2px;
        padding: 0 4px;
      }
      
      .tab {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: #2d2d2d;
        border-radius: 6px 6px 0 0;
        cursor: pointer;
        min-width: 120px;
        max-width: 200px;
        transition: background 0.15s;
      }
      
      .tab:hover {
        background: #3d3d3d;
      }
      
      .tab.active {
        background: #1e1e1e;
      }
      
      .tabTitle {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 13px;
      }
      
      .closeBtn {
        background: none;
        border: none;
        color: #999;
        font-size: 20px;
        cursor: pointer;
        padding: 0 4px;
        line-height: 1;
      }
      
      .closeBtn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 3px;
      }
      
      .addTabBtn {
        background: none;
        border: none;
        color: #999;
        font-size: 20px;
        cursor: pointer;
        padding: 8px 12px;
        transition: color 0.15s;
      }
      
      .addTabBtn:hover {
        color: #fff;
      }
      
  step_9_editor_container:
    file: "src/components/Editor/EditorContainer.tsx"
    purpose: "Render only active tab's editor"
    code: |
      import { useTabStore } from '../../store/tabStore'
      import { Editor } from './Editor'
      import styles from './Editor.module.css'
      
      export function EditorContainer() {
        const { tabs, activeTabId, updateTab } = useTabStore()
        const activeTab = tabs.find(t => t.id === activeTabId)
        
        if (!activeTab) {
          return (
            <div className={styles.emptyState}>
              <p>No file open. Create a new tab to get started.</p>
            </div>
          )
        }
        
        return (
          <Editor 
            key={activeTab.id}  // Force remount on tab change
            tabId={activeTab.id}
            initialContent={activeTab.content}
            onChange={(content) => {
              updateTab(activeTab.id, { 
                content, 
                isDirty: true 
              })
            }}
          />
        )
      }
      
  step_10_code_block_parser:
    file: "src/services/codeBlockParser.ts"
    purpose: "Parse ```language {params} syntax"
    code: |
      export interface CodeBlockParams {
        [key: string]: string | number | boolean
      }
      
      export interface ParsedCodeBlock {
        language: string
        params: CodeBlockParams
        content: string
        fullMatch: string
      }
      
      /**
       * Parse code blocks with optional parameters
       * Format: ```language {param1: value1, param2: value2}
       */
      export function parseCodeBlocks(text: string): ParsedCodeBlock[] {
        const regex = /```(\w+)(?:\s*\{([^}]*)\})?\n([\s\S]*?)```/g
        const blocks: ParsedCodeBlock[] = []
        
        let match
        while ((match = regex.exec(text)) !== null) {
          const [fullMatch, language, paramsStr, content] = match
          
          blocks.push({
            language,
            params: paramsStr ? parseParams(paramsStr) : {},
            content,
            fullMatch
          })
        }
        
        return blocks
      }
      
      function parseParams(paramsStr: string): CodeBlockParams {
        const params: CodeBlockParams = {}
        
        // Simple parser: key: value, key: value
        const pairs = paramsStr.split(',')
        
        for (const pair of pairs) {
          const [key, value] = pair.split(':').map(s => s.trim())
          if (key && value) {
            // Try to parse as number or boolean
            if (value === 'true') params[key] = true
            else if (value === 'false') params[key] = false
            else if (!isNaN(Number(value))) params[key] = Number(value)
            else params[key] = value.replace(/['"]/g, '')
          }
        }
        
        return params
      }
      
  step_11_markdown_extension:
    file: "src/extensions/markdownExtension.ts"
    purpose: "Enhanced markdown with code block detection"
    code: |
      import { markdown } from '@codemirror/lang-markdown'
      import { LanguageSupport } from '@codemirror/language'
      
      /**
       * Enhanced markdown extension that treats entire document as markdown
       * Code blocks get syntax highlighting automatically
       */
      export function enhancedMarkdown(): LanguageSupport {
        return markdown({
          codeLanguages: [
            { name: 'javascript', alias: ['js'] },
            { name: 'typescript', alias: ['ts'] },
            { name: 'python', alias: ['py'] },
            { name: 'html' },
            { name: 'css' },
            { name: 'json' },
            { name: 'rust', alias: ['rs'] },
            // Add more as needed
          ]
        })
      }
      
  step_12_updated_app:
    file: "src/App.tsx"
    code: |
      import { useEffect } from 'react'
      import { Layout } from './components/Layout/Layout'
      import { TitleBar } from './components/TitleBar/TitleBar'
      import { EditorContainer } from './components/Editor/EditorContainer'
      import { MenuBar } from './components/MenuBar/MenuBar'
      import { StatusBar } from './components/StatusBar/StatusBar'
      import { useTabStore } from './store/tabStore'
      
      export default function App() {
        const addTab = useTabStore(state => state.addTab)
        
        // Create initial tab on mount
        useEffect(() => {
          addTab({ title: 'Untitled-1' })
        }, [])
        
        return (
          <Layout>
            <TitleBar />
            <MenuBar />
            <EditorContainer />
            <StatusBar />
          </Layout>
        )
      }
      
  step_13_main_rs:
    file: "src-tauri/src/main.rs"
    updates: |
      // Register window control commands
      fn main() {
        tauri::Builder::default()
          .invoke_handler(tauri::generate_handler![
            commands::file::read_file,
            commands::file::write_file,
            commands::file::open_file_dialog,
            commands::file::save_file_dialog,
            commands::window::minimize_window,
            commands::window::maximize_window,
            commands::window::unmaximize_window,
            commands::window::close_window,
            commands::window::is_maximized,
          ])
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
      }

critical_styling_notes:

  title_bar_drag_region:
    problem: "Custom title bar must be draggable"
    solution: "Add data-tauri-drag-region attribute"
    css: "-webkit-app-region: drag"
    exception: "Buttons/tabs need -webkit-app-region: no-drag"
    
  windows_look:
    title_bar_height: "40px (Windows standard)"
    colors:
      dark_mode:
        title_bar: "#202020"
        active_tab: "#1e1e1e"
        inactive_tab: "#2d2d2d"
        border: "#333"
      light_mode:
        title_bar: "#f0f0f0"
        active_tab: "#ffffff"
        inactive_tab: "#e0e0e0"
        border: "#ccc"
    
  tab_behavior:
    max_width: "200px"
    min_width: "120px"
    overflow: "Scroll horizontally if many tabs"
    close_button: "Only visible on hover or active tab"

keyboard_shortcuts:

  tab_management:
    - "Ctrl+T: New tab"
    - "Ctrl+W: Close current tab"
    - "Ctrl+Tab: Next tab"
    - "Ctrl+Shift+Tab: Previous tab"
    - "Ctrl+1-8: Jump to tab N"
    - "Ctrl+9: Jump to last tab"
    
  file_operations:
    - "Ctrl+N: New tab (same as Ctrl+T)"
    - "Ctrl+O: Open file in current tab"
    - "Ctrl+S: Save current tab"
    - "Ctrl+Shift+S: Save as"

best_practices_implemented:

  modular_architecture:
    principle: "Separation of concerns"
    benefits:
      - "Tab state isolated in Zustand store"
      - "Title bar is independent component"
      - "Editor container manages active editor only"
      - "Window controls reusable"
      
  type_safety:
    typescript:
      - "Strict mode enabled"
      - "Tab interface well-defined"
      - "Code block params typed"
    rust:
      - "Window commands use Result<T, E>"
      - "Code block parser uses structs"
      
  performance:
    optimizations:
      - "Key prop on Editor forces remount (intentional)"
      - "Tab content preserved in store"
      - "Only active editor rendered"
      - "Lazy load languages on demand"
      
  state_management:
    zustand_over_context:
      reason: "Better performance for frequent tab updates"
      features:
        - "Devtools integration"
        - "Middleware support"
        - "Less boilerplate than Context"

configuration_files:

  tauri_conf:
    file: "src-tauri/tauri.conf.json"
    key_settings:
      window:
        decorations: false  # CRITICAL
        width: 1000
        height: 650
        transparent: false
        fileDropEnabled: true
        
  vite_config:
    optimizations: |
      export default defineConfig({
        optimizeDeps: {
          include: ['@codemirror/state', '@codemirror/view']
        }
      })

testing_strategy:

  mvp_phase: "Manual testing"
  test_scenarios:
    - "Open multiple tabs"
    - "Switch between tabs"
    - "Close tabs (including last tab)"
    - "Drag window by title bar"
    - "Minimize/maximize/close window"
    - "Open file in new vs existing tab"
    - "Code block with parameters renders"
    - "Markdown detected automatically"

success_criteria:
  mvp_complete_when:
    - "✓ Custom title bar with tabs like screenshot"
    - "✓ Can add/close/switch tabs"
    - "✓ Window controls work (min/max/close)"
    - "✓ Can drag window by title bar"
    - "✓ Tabs show dirty indicator (•)"
    - "✓ Code blocks parse with parameters"
    - "✓ Markdown is primary language"
    - "✓ Different syntax colors per language"
    - "✓ Looks like Windows Notepad with tabs"
    - "✓ 100% offline functionality"

next_phases:

  phase_2_features:
    - "Tab context menu (right-click)"
    - "Drag to reorder tabs"
    - "Close other tabs / Close all tabs"
    - "Pin tabs"
    - "Find/Replace per tab"
    - "Line numbers toggle"
    - "Word wrap toggle"
    
  phase_3_advanced:
    - "Split view (multiple editors)"
    - "Live preview pane"
    - "Session restore (reopen tabs)"
    - "Recent files per tab"
    - "Custom themes"
    - "Settings UI"

estimated_effort:
  setup: "2 hours"
  custom_title_bar: "8 hours"  # Most complex part
  tab_management: "6 hours"
  rust_backend: "4 hours"
  editor_integration: "6 hours"
  code_block_parser: "4 hours"
  styling: "6 hours"
  testing: "4 hours"
  total: "40 hours (1 week full-time)"

gotchas_and_tips:

  title_bar_drag:
    issue: "Buttons in title bar might not be clickable"
    fix: "Use -webkit-app-region: no-drag on interactive elements"
    
  tab_overflow:
    issue: "Too many tabs overflow"
    solution_1: "Horizontal scroll"
    solution_2: "Show dropdown with overflow tabs"
    mvp: "Use solution 1"
    
  editor_remount:
    issue: "Editor loses state on tab switch"
    fix: "Store content in tab store, use key prop to remount"
    
  file_dialog_tab:
    decision: "Open file in current tab or new tab?"
    mvp: "Current tab (can add 'Open in new tab' later)"
    
  markdown_primary:
    implementation: "Load markdown language by default"
    detection: "Treat all content as markdown unless specified"

deployment:
  
  windows:
    output: "contextpad.exe"
    installer: "contextpad-setup.exe"
    portable: "contextpad-portable.exe"
    
  build_command: "pnpm tauri build"
  
  distribution:
    - "GitHub releases"
    - "Direct download"
    - "Future: Microsoft Store"

Versioning rules:
contextpad_v0.1.0 --- first MVP
0.x.0 ---  adding features
0.1.x --- bug fixes
x.0.0 --- first fully functional complete app