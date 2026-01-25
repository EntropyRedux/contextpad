import { useState, useRef, useEffect } from 'react'
import { useFileOperations } from '../../hooks/useFileOperations'
import { useEditorCommands } from '../../hooks/useEditorCommands'
import { useViewCommands } from '../../hooks/useViewCommands'
import { useWindowDrag } from '../../hooks/useWindowDrag'
import { useTabStore } from '../../store/tabStore'
import { useNotificationStore } from '../../store/notificationStore'
import { useTemplateStore } from '../../store/templateStore'
import { useActionStore } from '../../store/actionStore'
import { executeAction } from '../../utils/actionExecutor'
import { processTemplateVariables } from '../../utils/templateVariables'
import {
  FilePlus, File, FolderOpen, Save, SaveAll, LogOut,
  Undo, Redo, Scissors, Copy, Clipboard, Search,
  PanelLeft, PanelBottom, PanelRight, ListOrdered, MoreHorizontal,
  ZoomIn, ZoomOut, Maximize, FileText, Zap, Settings, Info, RefreshCw,
  Calculator, Star
} from 'lucide-react'
import { executeAllFormulas } from '../../extensions/inlineFormulas'
import styles from './MenuBar.module.css'

export function MenuBar() {
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { newFile, openFile, saveFile, saveFileAs, openRecentFile, openFolder } = useFileOperations()
  const { undo, redo, cut, copy, paste, lockAll, unlockAll, toggleLock } = useEditorCommands()
  const { toggleStatusBar, toggleLineNumbers, toggleBreadcrumb, toggleActivityBar, zoomIn, zoomOut, resetZoom, toggleBracketMatching, toggleFoldGutter, toggleAutoIndent, toggleCodeBlockMarkers } = useViewCommands()
  const { recentFiles, clearRecentFiles, toggleRightSidebar, toggleLeftSidebar, setSidebarView, getActiveTab, showRightSidebar, viewSettings } = useTabStore()
  
  // Stores for Pinned Items
  const { templates, isTemplatePinned } = useTemplateStore()
  const { actions, isActionPinned } = useActionStore()
  
  const addNotification = useNotificationStore(state => state.addNotification)
  const { handleMouseDown: handleWindowDrag } = useWindowDrag()

  const activeTab = getActiveTab()

  // Filter Pinned Items
  const pinnedTemplates = templates.filter(t => isTemplatePinned(t.id) && !t.isHidden)
  const pinnedActions = actions.filter(a => isActionPinned(a.id) && a.enabled)

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
            <button onClick={() => handleMenuItemClick(lockAll)}>
              <Zap size={14} className={styles.menuIcon} />
              Lock All Blocks <span className={styles.shortcut}>Ctrl+Shift+L</span>
            </button>
            <button onClick={() => handleMenuItemClick(unlockAll)}>
              <LogOut size={14} className={styles.menuIcon} style={{transform: 'rotate(90deg)'}} />
              Unlock All Blocks <span className={styles.shortcut}>Ctrl+Shift+U</span>
            </button>
            <button onClick={() => handleMenuItemClick(toggleLock)}>
              <Zap size={14} className={styles.menuIcon} />
              Toggle Block Lock <span className={styles.shortcut}>Ctrl+L</span>
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
            <button onClick={() => handleMenuItemClick(toggleCodeBlockMarkers)}>
              <Star size={14} className={styles.menuIcon} fill={viewSettings.showCodeBlockMarkers ? 'currentColor' : 'none'} />
              Toggle Block Markers <span className={styles.shortcut}>Ctrl+Shift+M</span>
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
            <button onClick={() => handleMenuItemClick(toggleActivityBar)}>
              <PanelRight size={14} className={styles.menuIcon} />
              Toggle Activity Bar
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
            {pinnedTemplates.length > 0 && (
              <>
                <div className={styles.separator} />
                <div className={styles.submenuLabel}>Pinned Templates</div>
                {pinnedTemplates.map(t => (
                  <button key={t.id} onClick={() => handleInsertTemplate(t.content)}>
                    <Star size={12} className={styles.menuIcon} fill="orange" stroke="none" />
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
            {pinnedActions.length > 0 && (
              <>
                <div className={styles.separator} />
                <div className={styles.submenuLabel}>Pinned Actions</div>
                {pinnedActions.map(a => (
                  <button key={a.id} onClick={() => handleRunAction(a.code)}>
                    <Star size={12} className={styles.menuIcon} fill="orange" stroke="none" />
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
              details: 'ContextPad v1.5.0\n\nA professional workspace designed to live between thinking and execution. Optimized for prompt engineering, technical drafting, and workflow automation.\n\nKey Features:\n- Advanced Action & Formula Engine\n- Dynamic Template Variables\n- Real-time Token & Cost Estimation\n- Smart Code Block Locking & Forms\n- Workspace-aware Navigation\n\nGitHub: https://github.com/EntropyRedux/contextpad\nCreated by entropy_redux\nLicense: GPL-3.0',
              duration: 10000
            }))}>
              <Info size={14} className={styles.menuIcon} />
              About
            </button>
          </div>
        )}
      </div>

      {/* Draggable region for window movement */}
      <div className={styles.dragRegion} onMouseDown={handleWindowDrag} />
    </div>
  )
}
