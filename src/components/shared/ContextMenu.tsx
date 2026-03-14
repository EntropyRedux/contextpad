import { useEffect, useRef, ReactNode } from 'react'
import styles from './ContextMenu.module.css'

export interface ContextMenuItem {
  label: string
  icon?: ReactNode
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  separator?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    // Adjust position if it would overflow the viewport
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const { innerWidth, innerHeight } = window

      if (x + rect.width > innerWidth) {
        menuRef.current.style.left = `${innerWidth - rect.width - 5}px`
      }
      if (y + rect.height > innerHeight) {
        menuRef.current.style.top = `${innerHeight - rect.height - 5}px`
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [x, y, onClose])

  return (
    <div
      ref={menuRef}
      className={styles.contextMenu}
      style={{ left: x, top: y }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {items.map((item, index) => (
        <div key={index}>
          {item.separator && <div className={styles.separator} />}
          <button
            className={`${styles.menuItem} ${item.danger ? styles.danger : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              item.onClick()
              onClose()
            }}
            disabled={item.disabled}
          >
            {item.icon && <span className={styles.icon}>{item.icon}</span>}
            <span className={styles.label}>{item.label}</span>
          </button>
        </div>
      ))}
    </div>
  )
}
