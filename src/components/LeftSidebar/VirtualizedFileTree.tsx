import { useState, useMemo, useCallback, useRef, useEffect, memo } from 'react'
import * as RW from 'react-window'
const List = (RW as any).FixedSizeList
import { invoke } from '@tauri-apps/api/core'
import { ContextMenu, ContextMenuItem } from '../shared/ContextMenu'
import styles from './FileTreeItem.module.css'

interface FileNode {
  name: string
  path: string
  is_dir: boolean
  children?: FileNode[]
}

interface FlattenedNode {
  id: string
  name: string
  path: string
  depth: number
  isDirectory: boolean
  isExpanded: boolean
  isLoading: boolean
  hasChildren: boolean
}

interface VirtualizedFileTreeProps {
  files: FileNode[]
  onFileClick: (path: string) => void
  onRefresh: () => void
}

const ITEM_HEIGHT = 24

// Get file icon based on extension
const getFileIcon = (name: string, isDir: boolean, isExpanded: boolean): string => {
  if (isDir) {
    return isExpanded ? '📂' : '📁'
  }

  const ext = name.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'md':
    case 'markdown':
      return '📝'
    case 'json':
      return '📋'
    case 'js':
    case 'jsx':
      return '🟨'
    case 'ts':
    case 'tsx':
      return '🔷'
    case 'py':
      return '🐍'
    case 'html':
      return '🌐'
    case 'css':
      return '🎨'
    case 'yaml':
    case 'yml':
      return '⚙️'
    case 'csv':
      return '📊'
    default:
      return '📄'
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
    flatNodes: FlattenedNode[]
    onToggle: (path: string) => void
    onFileClick: (path: string) => void
    onContextMenu: (e: React.MouseEvent, node: FlattenedNode) => void
  }
}) {
  const node = data.flatNodes[index]

  const handleClick = () => {
    if (!node.isDirectory) {
      data.onFileClick(node.path)
    }
  }

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (node.isDirectory) {
      data.onToggle(node.path)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    data.onContextMenu(e, node)
  }

  return (
    <div
      style={{
        ...style,
        paddingLeft: `${node.depth * 12 + 4}px`,
      }}
      className={styles.item}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {node.isDirectory ? (
        <div
          className={`${styles.chevron} ${node.isExpanded ? styles.expanded : styles.collapsed}`}
          onClick={handleToggle}
        />
      ) : (
        <div className={styles.chevron} style={{ visibility: 'hidden' }} />
      )}
      <span className={styles.icon}>
        {node.isLoading ? '⏳' : getFileIcon(node.name, node.isDirectory, node.isExpanded)}
      </span>
      <span className={styles.name}>{node.name}</span>
    </div>
  )
})

export const VirtualizedFileTree = memo(function VirtualizedFileTree({
  files,
  onFileClick,
  onRefresh
}: VirtualizedFileTreeProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set())
  const [loadingDirs, setLoadingDirs] = useState<Set<string>>(new Set())
  const [loadedChildren, setLoadedChildren] = useState<Map<string, FileNode[]>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerHeight, setContainerHeight] = useState(400)
  
  // Context Menu state
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, node: FlattenedNode } | null>(null)

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
  const flattenedNodes = useMemo(() => {
    const result: FlattenedNode[] = []

    const flatten = (nodes: FileNode[], depth: number) => {
      // Sort: directories first, then alphabetically
      const sorted = [...nodes].sort((a, b) => {
        if (a.is_dir !== b.is_dir) {
          return a.is_dir ? -1 : 1
        }
        return a.name.localeCompare(b.name)
      })

      for (const node of sorted) {
        const isExpanded = expandedDirs.has(node.path)
        const isLoading = loadingDirs.has(node.path)
        const children = loadedChildren.get(node.path) || node.children

        result.push({
          id: node.path,
          name: node.name,
          path: node.path,
          depth,
          isDirectory: node.is_dir,
          isExpanded,
          isLoading,
          hasChildren: node.is_dir
        })

        // Only include children if expanded and loaded
        if (node.is_dir && isExpanded && children && children.length > 0) {
          flatten(children, depth + 1)
        }
      }
    }

    flatten(files, 0)
    return result
  }, [files, expandedDirs, loadingDirs, loadedChildren])

  const toggleExpand = useCallback(async (path: string) => {
    if (expandedDirs.has(path)) {
      // Collapse
      setExpandedDirs(prev => {
        const next = new Set(prev)
        next.delete(path)
        return next
      })
    } else {
      // Expand - load children if not already loaded
      if (!loadedChildren.has(path)) {
        setLoadingDirs(prev => new Set(prev).add(path))

        try {
          const children = await invoke<FileNode[]>('read_directory', { path })
          setLoadedChildren(prev => new Map(prev).set(path, children))
        } catch (error) {
          console.error('Failed to load directory:', error)
        } finally {
          setLoadingDirs(prev => {
            const next = new Set(prev)
            next.delete(path)
            return next
          })
        }
      }

      setExpandedDirs(prev => new Set(prev).add(path))
    }
  }, [expandedDirs, loadedChildren])

  const handleContextMenu = useCallback((e: React.MouseEvent, node: FlattenedNode) => {
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }, [])

  const handleRename = async (node: FlattenedNode) => {
    const newName = prompt(`Rename "${node.name}" to:`, node.name)
    if (newName && newName !== node.name) {
      try {
        const newPath = node.path.replace(/[^\\/]+$/, newName)
        await invoke('rename_file', { oldPath: node.path, newPath })
        onRefresh()
      } catch (error) {
        alert(`Failed to rename: ${error}`)
      }
    }
  }

  const handleDelete = async (node: FlattenedNode) => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      try {
        await invoke('delete_file', { path: node.path })
        onRefresh()
      } catch (error) {
        alert(`Failed to delete: ${error}`)
      }
    }
  }

  const handleOpenInExplorer = async (node: FlattenedNode) => {
    try {
      await invoke('open_file_explorer', { path: node.path })
    } catch (error) {
      alert(`Failed to open explorer: ${error}`)
    }
  }

  const getContextMenuItems = (node: FlattenedNode): ContextMenuItem[] => {
    return [
      {
        label: 'Rename',
        onClick: () => handleRename(node)
      },
      {
        label: 'Delete',
        danger: true,
        onClick: () => handleDelete(node)
      },
      {
        label: 'Open in Explorer',
        separator: true,
        onClick: () => handleOpenInExplorer(node)
      }
    ]
  }

  // Memoize data object to prevent unnecessary re-renders
  const itemData = useMemo(() => ({
    flatNodes: flattenedNodes,
    onToggle: toggleExpand,
    onFileClick,
    onContextMenu: handleContextMenu
  }), [flattenedNodes, toggleExpand, onFileClick, handleContextMenu])

  if (flattenedNodes.length === 0) {
    return (
      <div className={styles.emptyState}>
        <span>No files in this folder</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} style={{ flex: 1, minHeight: 0, position: 'relative' }}>
      <List
        height={containerHeight}
        itemCount={flattenedNodes.length}
        itemSize={ITEM_HEIGHT}
        width="100%"
        itemData={itemData}
      >
        {Row}
      </List>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={getContextMenuItems(contextMenu.node)}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
})
