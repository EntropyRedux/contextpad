/**
 * Template variable processor for ContextPad templates
 * Based on monolithic implementation (lines 7070-7106)
 */

export interface ProcessedTemplate {
  content: string
  cursorOffset: number | null
}

export function processTemplateVariables(
  content: string,
  selectedText: string = ''
): ProcessedTemplate {
  let processed = content
  let cursorOffset: number | null = null

  // {{SELECTION}} - Replace with currently selected text
  processed = processed.replace(/\{\{SELECTION\}\}/g, selectedText)

  // {{DATE}} - Current date (YYYY-MM-DD)
  const now = new Date()
  const date = now.toISOString().split('T')[0]
  processed = processed.replace(/\{\{DATE\}\}/g, date)

  // {{TIME}} - Current time (HH:MM:SS)
  const time = now.toTimeString().split(' ')[0]
  processed = processed.replace(/\{\{TIME\}\}/g, time)

  // {{DATETIME}} - Full timestamp
  const datetime = `${date} ${time}`
  processed = processed.replace(/\{\{DATETIME\}\}/g, datetime)

  // {{CURSOR}} - Mark where cursor should be positioned after insert
  const cursorMatch = processed.match(/\{\{CURSOR\}\}/)
  if (cursorMatch && cursorMatch.index !== undefined) {
    const beforeCursor = processed.substring(0, cursorMatch.index)
    cursorOffset = beforeCursor.length
    processed = processed.replace(/\{\{CURSOR\}\}/g, '')
  }

  return { content: processed, cursorOffset }
}

/**
 * Extract variable names from template content
 * Used to show which variables a template uses
 */
export function extractTemplateVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const matches = content.matchAll(regex)
  const variables = Array.from(matches, m => m[1].trim())
  return [...new Set(variables)]
}
