/**
 * Command Definition Types
 * Supports both Formula mode (simple) and JavaScript mode (advanced)
 */

export type CommandCategory =
  | 'Text Transform'
  | 'Markdown'
  | 'Insert'
  | 'Lines'
  | 'Selection'
  | 'Custom'

export type CommandLanguage = 'formula' | 'javascript'

export interface CommandDefinition {
  id: string
  label: string
  category: CommandCategory
  description?: string
  language: CommandLanguage
  codeTemplate: string
}

/**
 * Formula functions available in formula mode
 * These are executed at runtime with dynamic `selection` variable
 */
export const FORMULA_FUNCTIONS = [
  // Text Transform
  'UPPER', 'LOWER', 'TITLE', 'REVERSE', 'TRIM', 'LTRIM', 'RTRIM',
  // Insert
  'TODAY', 'NOW', 'TIME', 'UUID', 'RANDOM',
  // String manipulation
  'CONCAT', 'WRAP', 'PREFIX', 'SUFFIX', 'REPLACE', 'LEN',
  // Markdown
  'BOLD', 'ITALIC', 'CODE', 'CODEBLOCK', 'LINK', 'HEADING',
  // Lines
  'SORT', 'SORTDESC', 'UNIQUE', 'JOIN', 'SPLIT'
] as const

export type FormulaFunction = typeof FORMULA_FUNCTIONS[number]
