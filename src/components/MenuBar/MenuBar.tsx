import { useState, useRef, useEffect } from 'react'
import { useFileOperations } from '../../hooks/useFileOperations'
import { useEditorCommands } from '../../hooks/useEditorCommands'
import { useViewCommands } from '../../hooks/useViewCommands'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useTemplateStore } from '../../store/templateStore'
import { useActionStore } from '../../store/actionStore'
import { executeAction } from '../../utils/actionExecutor'
import { processTemplateVariables } from '../../utils/templateVariables'
import {
  FilePlus, File, FolderOpen, Save, SaveAll, LogOut,
  Undo, Redo, Scissors, Copy, Clipboard, Search,
  PanelLeft, PanelBottom, ListOrdered, MoreHorizontal,
  ZoomIn, ZoomOut, Maximize, FileText, Zap, Settings, Info, RefreshCw,
  Calculator
} from 'lucide-react'
import { executeAllFormulas } from '../../extensions/inlineFormulas'
import styles from './MenuBar.module.css'

export function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { newFile, openFile, saveFile, saveFileAs, openRecentFile, openFolder } = useFileOperations()
  const { undo, redo, cut, copy, paste } = useEditorCommands()
  const { toggleStatusBar, toggleLineNumbers, toggleBreadcrumb, zoomIn, zoomOut, resetZoom, toggleBracketMatching, toggleFoldGutter, toggleAutoIndent } = useViewCommands()
  const { recentFiles, clearRecentFiles, toggleRightSidebar, toggleLeftSidebar, setSidebarView, getActiveTab, showRightSidebar } = useTabStore()
  const { getVisibleTemplates } = useTemplateStore()
  const { getEnabledActions } = useActionStore()
  const addNotification = useNotificationStore(state => state.addNotification)

  const activeTab = getActiveTab()
  const visibleTemplates = getVisibleTemplates().slice(0, 5)
  const enabledActions = getEnabledActions().slice(0, 5)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveMenu(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const handleMenuClick = (menu: string) => {
    setActiveMenu(activeMenu === menu ? null : menu)
  }

  const handleMenuItemClick = (action: () => void) => {
    action()
    setActiveMenu(null)
  }

  const handleOpenSearch = (mode: 'find' | 'replace') => {
    window.dispatchEvent(new CustomEvent('open-search', { detail: { mode } }))
    setActiveMenu(null)
  }

  const handleExecuteAllFormulas = () => {
    if (activeTab?.editorView) {
      executeAllFormulas(activeTab.editorView)
    } else {
      addNotification({
        type: 'warning',
        message: 'No active editor',
        details: 'Open a file to execute formulas'
      })
    }
    setActiveMenu(null)
  }

  const handleInsertTemplate = (templateContent: string) => {
    if (activeTab?.editorView) {
      const view = activeTab.editorView
      const selection = view.state.selection.main
      const selectedText = view.state.doc.sliceString(selection.from, selection.to)
      const processed = processTemplateVariables(templateContent, selectedText)
      
      view.dispatch({
        changes: { from: selection.from, to: selection.to, insert: processed.content },
        selection: processed.cursorOffset !== null 
          ? { anchor: selection.from + processed.cursorOffset }
          : undefined
      })
      view.focus()
    }
    setActiveMenu(null)
  }

  const handleRunAction = (actionCode: string) => {
    if (activeTab?.editorView) {
      executeAction(actionCode, activeTab.editorView)
    }
    setActiveMenu(null)
  }

  return (
    <div className={styles.menuBar} ref={menuRef}>
      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'file' ? styles.active : ''}`}
          onClick={() => handleMenuClick('file')}
        >
          File
        </button>
        {activeMenu === 'file' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(newFile)}>
              <FilePlus size={14} className={styles.menuIcon} />
              New <span className={styles.shortcut}>Ctrl+N</span>
            </button>
            <button onClick={() => handleMenuItemClick(openFile)}>
              <File size={14} className={styles.menuIcon} />
              Open File <span className={styles.shortcut}>Ctrl+O</span>
            </button>
            <button onClick={() => handleMenuItemClick(openFolder)}>
              <FolderOpen size={14} className={styles.menuIcon} />
              Open Workspace <span className={styles.shortcut}>Ctrl+K Ctrl+O</span>
            </button>

            {recentFiles.length > 0 && (
              <>
                <div className={styles.separator} />
                <div className={styles.submenuLabelWithAction}>
                  <span>Recent Files</span>
                  <button className={styles.clearButton} onClick={(e) => { e.stopPropagation(); handleMenuItemClick(clearRecentFiles); }} title="Clear history">
                    <RefreshCw size={12} />
                  </button>
                </div>
                {recentFiles.map((filePath, index) => (
                  <button
                    key={index}
                    onClick={() => handleMenuItemClick(() => openRecentFile(filePath))}
                    className={styles.recentFileItem}
                    title={filePath}
                  >
                    <File size={12} className={styles.menuIcon} />
                    {filePath.split('/').pop()?.split('\\').pop() || 'Untitled'}
                  </button>
                ))}
              </>
            )}

            <div className={styles.separator} />
            <button onClick={() => handleMenuItemClick(() => saveFile())}>
              <Save size={14} className={styles.menuIcon} />
              Save <span className={styles.shortcut}>Ctrl+S</span>
            </button>
            <button onClick={() => handleMenuItemClick(() => saveFileAs())}>
              <SaveAll size={14} className={styles.menuIcon} />
              Save As <span className={styles.shortcut}>Ctrl+Shift+S</span>
            </button>
            <div className={styles.separator} />
            <button onClick={() => handleMenuItemClick(() => window.close())}>
              <LogOut size={14} className={styles.menuIcon} />
              Exit
            </button>
          </div>
        )}
      </div>

      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'edit' ? styles.active : ''}`}
          onClick={() => handleMenuClick('edit')}
        >
          Edit
        </button>
        {activeMenu === 'edit' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(undo)}>
              <Undo size={14} className={styles.menuIcon} />
              Undo <span className={styles.shortcut}>Ctrl+Z</span>
            </button>
            <button onClick={() => handleMenuItemClick(redo)}>
              <Redo size={14} className={styles.menuIcon} />
              Redo <span className={styles.shortcut}>Ctrl+Y</span>
            </button>
            <div className={styles.separator} />
            <button onClick={() => handleOpenSearch('find')}>
              <Search size={14} className={styles.menuIcon} />
              Find & Replace <span className={styles.shortcut}>Ctrl+F</span>
            </button>
            <div className={styles.separator} />
            <button onClick={handleExecuteAllFormulas}>
              <Calculator size={14} className={styles.menuIcon} />
              Execute All Formulas
            </button>
            <div className={styles.separator} />
            <button onClick={() => handleMenuItemClick(cut)}>
              <Scissors size={14} className={styles.menuIcon} />
              Cut <span className={styles.shortcut}>Ctrl+X</span>
            </button>
            <button onClick={() => handleMenuItemClick(copy)}>
              <Copy size={14} className={styles.menuIcon} />
              Copy <span className={styles.shortcut}>Ctrl+C</span>
            </button>
            <button onClick={() => handleMenuItemClick(paste)}>
              <Clipboard size={14} className={styles.menuIcon} />
              Paste <span className={styles.shortcut}>Ctrl+V</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'view' ? styles.active : ''}`}
          onClick={() => handleMenuClick('view')}
        >
          View
        </button>
        {activeMenu === 'view' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(toggleLeftSidebar)}>
              <PanelLeft size={14} className={styles.menuIcon} />
              Toggle Outline <span className={styles.shortcut}>Ctrl+B</span>
            </button>
            <button onClick={() => handleMenuItemClick(toggleStatusBar)}>
              <PanelBottom size={14} className={styles.menuIcon} />
              Toggle Status Bar
            </button>
            <button onClick={() => handleMenuItemClick(toggleLineNumbers)}>
              <ListOrdered size={14} className={styles.menuIcon} />
              Toggle Line Numbers
            </button>
            <button onClick={() => handleMenuItemClick(toggleBreadcrumb)}>
              <MoreHorizontal size={14} className={styles.menuIcon} />
              Toggle Breadcrumb
            </button>
            <div className={styles.separator} />
            <button onClick={() => handleMenuItemClick(zoomIn)}>
              <ZoomIn size={14} className={styles.menuIcon} />
              Zoom In <span className={styles.shortcut}>Ctrl++</span>
            </button>
            <button onClick={() => handleMenuItemClick(zoomOut)}>
              <ZoomOut size={14} className={styles.menuIcon} />
              Zoom Out <span className={styles.shortcut}>Ctrl+-</span>
            </button>
            <button onClick={() => handleMenuItemClick(resetZoom)}>
              <Maximize size={14} className={styles.menuIcon} />
              Reset Zoom <span className={styles.shortcut}>Ctrl+0</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'templates' ? styles.active : ''}`}
          onClick={() => handleMenuClick('templates')}
        >
          Templates
        </button>
        {activeMenu === 'templates' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(() => setSidebarView('templates'))}>
              <FileText size={14} className={styles.menuIcon} />
              Template Manager
            </button>
            {visibleTemplates.length > 0 && (
              <>
                <div className={styles.separator} />
                <div className={styles.submenuLabel}>Quick Templates</div>
                {visibleTemplates.map(t => (
                  <button key={t.id} onClick={() => handleInsertTemplate(t.content)}>
                    <FileText size={12} className={styles.menuIcon} />
                    {t.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'actions' ? styles.active : ''}`}
          onClick={() => handleMenuClick('actions')}
        >
          Actions
        </button>
        {activeMenu === 'actions' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(() => setSidebarView('actions'))}>
              <Zap size={14} className={styles.menuIcon} />
              Action Manager
            </button>
            {enabledActions.length > 0 && (
              <>
                <div className={styles.separator} />
                <div className={styles.submenuLabel}>Quick Actions</div>
                {enabledActions.map(a => (
                  <button key={a.id} onClick={() => handleRunAction(a.code)}>
                    <Zap size={12} className={styles.menuIcon} />
                    {a.name}
                  </button>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <div className={styles.menuItem}>
        <button
          className={`${styles.menuButton} ${activeMenu === 'help' ? styles.active : ''}`}
          onClick={() => handleMenuClick('help')}
        >
          Help
        </button>
        {activeMenu === 'help' && (
          <div className={styles.dropdown}>
            <button onClick={() => handleMenuItemClick(() => setSidebarView('settings'))}>
              <Settings size={14} className={styles.menuIcon} />
              Settings <span className={styles.shortcut}>Ctrl+,</span>
            </button>
            <div className={styles.separator} />
            <button onClick={() => handleMenuItemClick(() => addNotification({
              type: 'info',
              message: 'About ContextPad',
                                details: 'ContextPad v1.3.2\n\nA professional Markdown editor optimized for prompt engineering and technical documentation.\n\nKey Features:\n- Context-aware snippets\n- Programmable Actions\n- Real-time Token & Cost Estimation\n- Smart Code Block Linting\n\nCreated by entropy_redux\nLicense: GPL-3.0',              duration: 8000
            }))}>
              <Info size={14} className={styles.menuIcon} />
              About
            </button>
          </div>
        )}
      </div>

      {/* Draggable region for window movement */}
      <div className={styles.dragRegion} data-tauri-drag-region />
    </div>
  )
}