import { useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import styles from './FileTreeItem.module.css'

interface FileNode {
  name: string
  path: string
  is_dir: boolean
  children?: FileNode[]
}

interface FileTreeItemProps {
  node: FileNode
  onFileClick: (path: string) => void
}

export function FileTreeItem({ node, onFileClick }: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [children, setChildren] = useState<FileNode[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()

    if (!node.is_dir) return

    if (!isExpanded && children.length === 0) {
      // Load children
      setIsLoading(true)
      try {
        const items = await invoke<FileNode[]>('read_directory', { path: node.path })
        setChildren(items)
        setIsExpanded(true)
      } catch (error) {
        console.error('Failed to read directory:', error)
      } finally {
        setIsLoading(false)
      }
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  const handleClick = () => {
    if (!node.is_dir) {
      onFileClick(node.path)
    }
  }

  const getIcon = () => {
    if (node.is_dir) {
      return isExpanded ? '📂' : '📁'
    }

    // File icons based on extension
    const ext = node.name.split('.').pop()?.toLowerCase()
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
      case 'htm':
        return '🌐'
      case 'css':
      case 'scss':
      case 'sass':
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

  return (
    <>
      <div className={styles.item} onClick={handleClick}>
        {node.is_dir ? (
          <div
            className={`${styles.chevron} ${isExpanded ? styles.expanded : styles.collapsed}`}
            onClick={handleToggle}
          />
        ) : (
          <div className={styles.chevron} style={{ visibility: 'hidden' }} />
        )}
        <span className={styles.icon}>{getIcon()}</span>
        <span className={styles.name}>{node.name}</span>
      </div>

      {node.is_dir && isExpanded && !isLoading && (
        <div className={styles.children}>
          {children.map((child) => (
            <FileTreeItem
              key={child.path}
              node={child}
              onFileClick={onFileClick}
            />
          ))}
        </div>
      )}
    </>
  )
}
