import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { OutlineItem } from '../../services/markdownParser'
import styles from './OutlineItem.module.css'

interface FlattenedOutlineItem {
  id: string
  text: string
  type: string
  level: number
  depth: number
  isExpanded: boolean
  hasChildren: boolean
  line: number
  from: number
  to: number
}

interface VirtualizedOutlineProps {
  items: OutlineItem[]
  onItemClick: (item: OutlineItem) => void
  onToggleCollapse: (item: OutlineItem) => void
}

const ITEM_HEIGHT = 24

// Get icon for outline item type
const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'heading':
      return '#'
    case 'code':
      return '{ }'
    case 'list':
      return '•'
    case 'table':
      return '▦'
    case 'blockquote':
      return '❝'
    default:
      return '○'
  }
}

// Row component - memoized for performance
const Row = memo(function Row({
  index,
  style,
  data
}: {
  index: number
  style: React.CSSProperties
  data: {
    flatItems: FlattenedOutlineItem[]
    expandedItems: Set<string>
    onItemClick: (item: FlattenedOutlineItem) => void
    onToggle: (key: string) => void
  }
}) {
  const item = data.flatItems[index]

  const handleClick = () => {
    data.onItemClick(item)
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    data.onToggle(item.id)
  }

  const levelClass = item.type === 'heading' ? styles[`level${Math.min(item.level, 6)}`] : ''

  return (
    <div
      style={{
        ...style,
        paddingLeft: `${item.depth * 12 + 8}px`,
      }}
      className={`${styles.item} ${levelClass}`}
      onClick={handleClick}
    >
      {item.hasChildren ? (
        <button
          className={`${styles.toggle} ${item.isExpanded ? styles.expanded : ''}`}
          onClick={handleToggle}
        >
          {item.isExpanded ? '▼' : '▶'}
        </button>
      ) : (
        <span className={styles.toggleSpacer} />
      )}
      <span className={styles.typeIcon}>{getTypeIcon(item.type)}</span>
      <span className={styles.text} title={item.text}>
        {item.text}
      </span>
    </div>
  )
})

export const VirtualizedOutline = memo(function VirtualizedOutline({
  items,
  onItemClick,
  onToggleCollapse
}: VirtualizedOutlineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)

  // Measure container height
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height)
        }
      })
      resizeObserver.observe(containerRef.current)
      return () => resizeObserver.disconnect()
    }
  }, [])

  // Flatten tree for virtualization
  const flattenedItems = useMemo(() => {
    const result: FlattenedOutlineItem[] = []

    const flatten = (items: OutlineItem[], depth: number) => {
      for (const item of items) {
        const id = `${item.from}-${item.to}`
        const isExpanded = expandedItems.has(id)
        const hasChildren = (item.children?.length || 0) > 0

        result.push({
          id,
          text: item.text,
          type: item.type,
          level: item.level,
          depth,
          isExpanded,
          hasChildren,
          line: item.line,
          from: item.from,
          to: item.to
        })

        // Only include children if expanded
        if (isExpanded && item.children) {
          flatten(item.children, depth + 1)
        }
      }
    }

    flatten(items, 0)
    return result
  }, [items, expandedItems])

  const handleToggle = useCallback((id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleItemClick = useCallback((flatItem: FlattenedOutlineItem) => {
    // Convert back to OutlineItem format for callback
    onItemClick({
      type: flatItem.type as OutlineItem['type'],
      text: flatItem.text,
      level: flatItem.level,
      line: flatItem.line,
      from: flatItem.from,
      to: flatItem.to,
      collapsed: !flatItem.isExpanded
    })
  }, [onItemClick])

  // Memoize data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    flatItems: flattenedItems,
    expandedItems,
    onItemClick: handleItemClick,
    onToggle: handleToggle
  }), [flattenedItems, expandedItems, handleItemClick, handleToggle])

  if (flattenedItems.length === 0) {
    return null
  }

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0 }}>
      <List
        height={containerHeight}
        itemCount={flattenedItems.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
        itemData={itemData}
      >
        {Row}
      </List>
    </div>
  )
})
