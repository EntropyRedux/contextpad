import { memo, useCallback } from 'react'
import { FileText, Code, List, Table, ChevronRight, ChevronDown } from 'lucide-react'
import { OutlineItem } from '../../services/markdownParser'
import styles from './OutlineItem.module.css'

interface OutlineItemProps {
  item: OutlineItem
  depth: number
  onItemClick: (item: OutlineItem) => void
  onToggleCollapse: (item: OutlineItem) => void
}

export const OutlineItemComponent = memo(function OutlineItemComponent({
  item,
  depth,
  onItemClick,
  onToggleCollapse
}: OutlineItemProps) {
  const hasChildren = item.children && item.children.length > 0

  // Memoized click handler
  const handleClick = useCallback(() => {
    onItemClick(item)
  }, [onItemClick, item])

  // Memoized toggle handler
  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleCollapse(item)
  }, [onToggleCollapse, item])

  // Get icon based on item type
  const getIcon = () => {
    switch (item.type) {
      case 'heading':
        return <FileText size={14} className={styles.typeIcon} />
      case 'codeblock':
        return <Code size={14} className={styles.typeIcon} />
      case 'list':
        return <List size={14} className={styles.typeIcon} />
      case 'table':
        return <Table size={14} className={styles.typeIcon} />
      default:
        return <span className={styles.bullet}>•</span>
    }
  }

  // Calculate indentation (16px per level for headings, fixed for others)
  const getIndentation = () => {
    if (item.type === 'heading') {
      return depth * 16
    }
    return depth * 16 + 16 // Extra indent for non-heading items under headings
  }

  return (
    <>
      <div
        className={styles.item}
        style={{ paddingLeft: `${8 + getIndentation()}px` }}
        onClick={handleClick}
      >
        {/* Chevron for collapsible items */}
        {hasChildren ? (
          <button
            className={styles.chevronButton}
            onClick={handleToggle}
          >
            {item.collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
          </button>
        ) : (
          <div className={styles.chevronPlaceholder} />
        )}

        {/* Icon */}
        <span className={styles.iconContainer}>{getIcon()}</span>

        {/* Text */}
        <span className={styles.text} title={item.text}>
          {item.text}
        </span>

        {/* Line number hint */}
        <span className={styles.lineNumber}>:{item.line}</span>
      </div>

      {/* Render children recursively if not collapsed */}
      {hasChildren && !item.collapsed && (
        <>
          {item.children!.map((child, index) => (
            <OutlineItemComponent
              key={`${child.type}-${child.from}-${index}`}
              item={child}
              depth={item.type === 'heading' ? depth + 1 : depth}
              onItemClick={onItemClick}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </>
      )}
    </>
  )
})
