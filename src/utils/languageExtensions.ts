import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { json } from '@codemirror/lang-json'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { yaml } from '@codemirror/lang-yaml'
import type { Extension } from '@codemirror/state'

/**
 * Get the appropriate CodeMirror language extension based on the language identifier
 */
export function getLanguageExtension(language: string): Extension {
  switch (language.toLowerCase()) {
    case 'markdown':
    case 'md':
      return markdown({
        base: markdownLanguage
      })

    case 'json':
      return json()

    case 'javascript':
    case 'js':
    case 'jsx':
      return javascript({ jsx: true })

    case 'typescript':
    case 'ts':
    case 'tsx':
      return javascript({ jsx: true, typescript: true })

    case 'python':
    case 'py':
      return python()

    case 'html':
    case 'htm':
      return html()

    case 'css':
    case 'scss':
    case 'sass':
      return css()

    case 'yaml':
    case 'yml':
      return yaml()

    case 'csv':
      // CSV doesn't need syntax highlighting, just plain text
      return []

    case 'text':
    case 'txt':
      // Plain text, no highlighting
      return []

    default:
      // Default to markdown
      return markdown({
        base: markdownLanguage
      })
  }
}

/**
 * Get file icon emoji based on language/file type
 */
export function getFileIcon(language: string): string {
  switch (language.toLowerCase()) {
    case 'markdown':
    case 'md':
      return '📝'
    case 'json':
      return '📋'
    case 'javascript':
    case 'js':
    case 'jsx':
      return '🟨'
    case 'typescript':
    case 'ts':
    case 'tsx':
      return '🔷'
    case 'python':
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
    case 'text':
    case 'txt':
      return '📄'
    default:
      return '📄'
  }
}
