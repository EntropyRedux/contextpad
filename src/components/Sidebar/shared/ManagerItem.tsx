import { ReactNode } from 'react'
import { CheckSquare, Square } from 'lucide-react'
import styles from './SidebarManager.module.css'

interface ManagerItemProps {
  id: string
  title: string
  icon?: ReactNode
  actions: ReactNode
  bulkMode: boolean
  isSelected: boolean
  onToggleSelect: (id: string) => void
  badges?: ReactNode
  isHidden?: boolean
  onClick?: () => void
  onDoubleClick?: () => void
}

export function ManagerItem({
  id,
  title,
  icon,
  actions,
  bulkMode,
  isSelected,
  onToggleSelect,
  badges,
  isHidden,
  onClick,
  onDoubleClick
}: ManagerItemProps) {
  return (
    <div 
      className={isHidden ? styles.itemHidden : styles.item}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
    >
      {bulkMode && (
        <div 
          className={styles.selectionCheckbox} 
          onClick={(e) => {
            e.stopPropagation()
            onToggleSelect(id)
          }}
        >
          {isSelected ? (
            <CheckSquare size={16} color="#4cc9f0" />
          ) : (
            <Square size={16} color="#666" />
          )}
        </div>
      )}

      {icon && <div className={styles.itemIcon}>{icon}</div>}

      <div className={styles.itemInfo}>
        <div className={styles.itemName}>
          {title}
          {badges}
        </div>
      </div>

      <div className={styles.itemActions} onClick={e => e.stopPropagation()}>
        {actions}
      </div>
    </div>
  )
}
