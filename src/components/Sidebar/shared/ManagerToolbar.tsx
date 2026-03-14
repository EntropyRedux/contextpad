import { ReactNode } from 'react'
import { Plus, Download, Upload, Trash2, CheckSquare, Square } from 'lucide-react'
import styles from './SidebarManager.module.css'

interface ManagerToolbarProps {
  onAdd: () => void
  onImport?: () => void
  onExport?: () => void
  bulkMode: boolean
  onToggleBulk: () => void
  selectedCount: number
  onBulkDelete: () => void
  standardActions?: ReactNode // Actions shown in normal mode (e.g. Add Selection)
  bulkActions?: ReactNode     // Actions shown in bulk mode (e.g. Pin, Toggle)
  viewControls?: ReactNode    // Actions shown always/right side (e.g. Eye toggle)
  addTooltip?: string
}

export function ManagerToolbar({
  onAdd,
  onImport,
  onExport,
  bulkMode,
  onToggleBulk,
  selectedCount,
  onBulkDelete,
  standardActions,
  bulkActions,
  viewControls,
  addTooltip = 'Add'
}: ManagerToolbarProps) {
  return (
    <div className={styles.toolbar}>
      {!bulkMode ? (
        <>
          <button className={styles.toolbarButton} onClick={onAdd} title={addTooltip}>
            <Plus size={16} />
          </button>
          {standardActions}
          {onImport && (
            <button className={styles.toolbarButton} onClick={onImport} title="Import">
              <Upload size={16} />
            </button>
          )}
          {onExport && (
            <button className={styles.toolbarButton} onClick={onExport} title="Export">
              <Download size={16} />
            </button>
          )}
        </>
      ) : (
        <>
          <button className={styles.toolbarButton} onClick={onBulkDelete} title="Delete Selected">
            <Trash2 size={16} color="#ff6b6b" />
          </button>
          {bulkActions}
          <div className={styles.bulkCount}>{selectedCount} selected</div>
        </>
      )}

      <div style={{ flex: 1 }} />

      {viewControls}

      <button
        className={`${styles.toolbarButton} ${bulkMode ? styles.active : ''}`}
        onClick={onToggleBulk}
        title="Toggle Selection Mode"
      >
        {bulkMode ? <CheckSquare size={16} color="#4cc9f0" /> : <Square size={16} />}
      </button>
    </div>
  )
}