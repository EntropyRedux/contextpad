/**
 * Auto-wrap utility for non-markdown files
 * Wraps content in invisible fence markers with syntax highlighting
 */

export interface AutoWrapInfo {
  isAutoWrapped: boolean
  language: string
  originalContent: string
}

/**
 * Wrap content with fence markers for syntax highlighting
 */
export function wrapContentWithFence(content: string, language: string): string {
  // Don't wrap if already has fence markers at start
  if (content.trim().startsWith('```')) {
    return content
  }

  return `\`\`\`${language}\n${content}\n\`\`\``
}

/**
 * Unwrap content by removing fence markers
 */
export function unwrapContentFromFence(content: string): string {
  const trimmed = content.trim()

  // Check if content starts with fence marker
  const fenceStartMatch = trimmed.match(/^```(\w+)?\n/)
  if (!fenceStartMatch) {
    return content
  }

  // Check if content ends with fence marker
  if (!trimmed.endsWith('```')) {
    return content
  }

  // Remove fence markers
  const startLength = fenceStartMatch[0].length
  const result = trimmed.slice(startLength, -3).trim()

  return result
}

/**
 * Check if content is auto-wrapped
 */
export function isContentAutoWrapped(content: string): boolean {
  const trimmed = content.trim()
  return trimmed.startsWith('```') && trimmed.endsWith('```')
}

/**
 * Determine if a file type should be auto-wrapped
 */
export function shouldAutoWrap(language: string): boolean {
  const noWrapLanguages = ['markdown', 'md', 'text', 'txt']
  return !noWrapLanguages.includes(language.toLowerCase())
}
