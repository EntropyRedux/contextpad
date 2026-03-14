import { EditorView } from '@codemirror/view'
import { syntaxTree } from '@codemirror/language'
import { SyntaxNode } from '@lezer/common'

export interface OutlineItem {
  type: 'heading' | 'codeblock' | 'list' | 'table'
  level: number // 1-6 for headings, indentation for lists
  text: string // Display text
  line: number // Line number in document (1-indexed)
  from: number // Character position start
  to: number // Character position end
  language?: string // For code blocks
  children?: OutlineItem[] // Nested items
  collapsed?: boolean // Expand/collapse state
}

/**
 * Parse markdown document and extract outline structure
 * Uses CodeMirror's syntaxTree() to traverse the parsed markdown AST
 */
export function parseMarkdownOutline(view: EditorView): OutlineItem[] {
  const items: OutlineItem[] = []
  const tree = syntaxTree(view.state)
  const doc = view.state.doc

  // Stack to track heading hierarchy
  const headingStack: OutlineItem[] = []

  tree.iterate({
    enter: (node: SyntaxNode) => {
      const { type, from, to } = node

      // Parse Headings (H1-H6)
      if (type.name.startsWith('ATXHeading')) {
        const level = parseInt(type.name.replace('ATXHeading', '')) || 1
        const line = doc.lineAt(from).number
        const text = doc.sliceString(from, to)
          .replace(/^#{1,6}\s*/, '') // Remove heading markers
          .trim()

        const heading: OutlineItem = {
          type: 'heading',
          level,
          text: text || `Heading ${level}`,
          line,
          from,
          to,
          children: [],
          collapsed: false
        }

        // Build hierarchy: attach to parent heading if lower level
        while (headingStack.length > 0) {
          const parent = headingStack[headingStack.length - 1]
          if (parent.level < level) {
            parent.children!.push(heading)
            headingStack.push(heading)
            return
          }
          headingStack.pop()
        }

        // Top-level heading
        items.push(heading)
        headingStack.push(heading)
      }

      // Parse Code Blocks
      else if (type.name === 'FencedCode') {
        const line = doc.lineAt(from).number
        let language = ''
        let text = 'Code Block'

        // Try to extract language from code fence info
        const firstLine = doc.lineAt(from).text
        const langMatch = firstLine.match(/^```(\w+)/)
        if (langMatch) {
          language = langMatch[1]
          text = `Code Block (${language})`
        }

        const codeBlock: OutlineItem = {
          type: 'codeblock',
          level: 0,
          text,
          line,
          from,
          to,
          language,
          collapsed: false
        }

        // Attach to current heading context if exists
        if (headingStack.length > 0) {
          const parent = headingStack[headingStack.length - 1]
          parent.children!.push(codeBlock)
        } else {
          items.push(codeBlock)
        }
      }

      // Parse Lists (BulletList, OrderedList)
      else if (type.name === 'BulletList' || type.name === 'OrderedList') {
        const line = doc.lineAt(from).number
        const text = type.name === 'BulletList' ? 'Bullet List' : 'Ordered List'

        // Count list items
        let itemCount = 0
        node.node.cursor().iterate((child) => {
          if (child.type.name === 'ListItem') itemCount++
        })

        const list: OutlineItem = {
          type: 'list',
          level: 0,
          text: `${text} (${itemCount} items)`,
          line,
          from,
          to,
          collapsed: false
        }

        // Attach to current heading context if exists
        if (headingStack.length > 0) {
          const parent = headingStack[headingStack.length - 1]
          parent.children!.push(list)
        } else {
          items.push(list)
        }
      }

      // Parse Tables
      else if (type.name === 'Table') {
        const line = doc.lineAt(from).number

        // Count rows
        let rowCount = 0
        node.node.cursor().iterate((child) => {
          if (child.type.name === 'TableRow') rowCount++
        })

        const table: OutlineItem = {
          type: 'table',
          level: 0,
          text: `Table (${rowCount} rows)`,
          line,
          from,
          to,
          collapsed: false
        }

        // Attach to current heading context if exists
        if (headingStack.length > 0) {
          const parent = headingStack[headingStack.length - 1]
          parent.children!.push(table)
        } else {
          items.push(table)
        }
      }
    }
  })

  return items
}

/**
 * Flatten outline items into a flat array (for rendering)
 * Respects collapsed state
 */
export function flattenOutline(items: OutlineItem[]): OutlineItem[] {
  const result: OutlineItem[] = []

  function traverse(item: OutlineItem, depth: number = 0) {
    result.push(item)
    if (!item.collapsed && item.children) {
      item.children.forEach(child => traverse(child, depth + 1))
    }
  }

  items.forEach(item => traverse(item))
  return result
}
