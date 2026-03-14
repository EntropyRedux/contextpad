import { ReactNode } from 'react'
import { ChevronDown, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react'
import styles from './SidebarManager.module.css'

interface ManagerListProps<T> {
  groups: Record<string, T[]>
  categories: string[]
  collapsedCategories: string[]
  onToggleCategory: (cat: string) => void
  onMoveCategory?: (cat: string, dir: 'up' | 'down') => void
  renderItem: (item: T) => ReactNode
  emptyMessage: string
  emptyIcon?: ReactNode
}

export function ManagerList<T>({
  groups,
  categories,
  collapsedCategories,
  onToggleCategory,
  onMoveCategory,
  renderItem,
  emptyMessage,
  emptyIcon
}: ManagerListProps<T>) {
  if (categories.length === 0) {
    return (
      <div className={styles.emptyState}>
        {emptyIcon}
        <p>{emptyMessage}</p>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {categories.map(category => {
        const items = groups[category] || []
        const isCollapsed = collapsedCategories.includes(category)

        return (
          <div key={category} className={styles.categoryGroup}>
            <div 
              className={styles.categoryHeader} 
              onClick={() => onToggleCategory(category)}
            >
              <div className={styles.categoryTitleArea}>
                <span className={styles.categoryChevron}>
                  {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                </span>
                <span className={styles.categoryName}>{category}</span>
              </div>

              <div className={styles.categoryActions} onClick={e => e.stopPropagation()}>
                {onMoveCategory && (
                  <>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => onMoveCategory(category, 'up')}
                      title="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      className={styles.actionButton} 
                      onClick={() => onMoveCategory(category, 'down')}
                      title="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </>
                )}
                <span className={styles.categoryCount}>{items.length}</span>
              </div>
            </div>

            {!isCollapsed && items.map(item => renderItem(item))}
          </div>
        )
      })}
    </div>
  )
}
