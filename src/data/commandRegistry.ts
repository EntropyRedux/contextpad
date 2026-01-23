/**
 * Built-in Command Registry
 * Contains all pre-defined commands available in the Action Manager
 */

import { CommandDefinition } from '../types/commands'

export const BUILT_IN_COMMANDS: CommandDefinition[] = [
  // ===== TEXT TRANSFORM =====
  {
    id: 'text.uppercase',
    label: 'Uppercase',
    category: 'Text Transform',
    description: 'Convert selection to uppercase',
    language: 'formula',
    codeTemplate: 'UPPER(selection)'
  },
  {
    id: 'text.lowercase',
    label: 'Lowercase',
    category: 'Text Transform',
    description: 'Convert selection to lowercase',
    language: 'formula',
    codeTemplate: 'LOWER(selection)'
  },
  {
    id: 'text.titlecase',
    label: 'Title Case',
    category: 'Text Transform',
    description: 'Convert selection to Title Case',
    language: 'formula',
    codeTemplate: 'TITLE(selection)'
  },
  {
    id: 'text.reverse',
    label: 'Reverse Text',
    category: 'Text Transform',
    description: 'Reverse the selected text',
    language: 'formula',
    codeTemplate: 'REVERSE(selection)'
  },
  {
    id: 'text.trim',
    label: 'Trim Whitespace',
    category: 'Text Transform',
    description: 'Remove leading and trailing whitespace',
    language: 'formula',
    codeTemplate: 'TRIM(selection)'
  },

  // ===== MARKDOWN =====
  {
    id: 'markdown.bold',
    label: 'Bold',
    category: 'Markdown',
    description: 'Wrap selection in bold (**text**)',
    language: 'formula',
    codeTemplate: 'BOLD(selection)'
  },
  {
    id: 'markdown.italic',
    label: 'Italic',
    category: 'Markdown',
    description: 'Wrap selection in italic (*text*)',
    language: 'formula',
    codeTemplate: 'ITALIC(selection)'
  },
  {
    id: 'markdown.code',
    label: 'Inline Code',
    category: 'Markdown',
    description: 'Wrap selection in inline code (`text`)',
    language: 'formula',
    codeTemplate: 'CODE(selection)'
  },
  {
    id: 'markdown.codeblock',
    label: 'Code Block',
    category: 'Markdown',
    description: 'Wrap selection in code block',
    language: 'formula',
    codeTemplate: 'CODEBLOCK(selection)'
  },
  {
    id: 'markdown.link',
    label: 'Link',
    category: 'Markdown',
    description: 'Create markdown link [text](url)',
    language: 'formula',
    codeTemplate: 'LINK(selection, "url")'
  },
  {
    id: 'markdown.h1',
    label: 'Heading 1',
    category: 'Markdown',
    description: 'Convert to H1 heading',
    language: 'formula',
    codeTemplate: 'HEADING(selection, 1)'
  },
  {
    id: 'markdown.h2',
    label: 'Heading 2',
    category: 'Markdown',
    description: 'Convert to H2 heading',
    language: 'formula',
    codeTemplate: 'HEADING(selection, 2)'
  },
  {
    id: 'markdown.h3',
    label: 'Heading 3',
    category: 'Markdown',
    description: 'Convert to H3 heading',
    language: 'formula',
    codeTemplate: 'HEADING(selection, 3)'
  },
  {
    id: 'markdown.blockquote',
    label: 'Blockquote',
    category: 'Markdown',
    description: 'Convert to blockquote',
    language: 'formula',
    codeTemplate: 'PREFIX(selection, "> ")'
  },
  {
    id: 'markdown.bullet',
    label: 'Bullet List',
    category: 'Markdown',
    description: 'Convert to bullet list item',
    language: 'formula',
    codeTemplate: 'PREFIX(selection, "- ")'
  },

  // ===== INSERT =====
  {
    id: 'insert.date',
    label: 'Insert Date',
    category: 'Insert',
    description: 'Insert current date (YYYY-MM-DD)',
    language: 'formula',
    codeTemplate: 'TODAY()'
  },
  {
    id: 'insert.time',
    label: 'Insert Time',
    category: 'Insert',
    description: 'Insert current time (HH:MM:SS)',
    language: 'formula',
    codeTemplate: 'TIME()'
  },
  {
    id: 'insert.datetime',
    label: 'Insert DateTime',
    category: 'Insert',
    description: 'Insert current date and time',
    language: 'formula',
    codeTemplate: 'NOW()'
  },
  {
    id: 'insert.uuid',
    label: 'Insert UUID',
    category: 'Insert',
    description: 'Insert a random UUID',
    language: 'formula',
    codeTemplate: 'UUID()'
  },
  {
    id: 'insert.random',
    label: 'Insert Random Number',
    category: 'Insert',
    description: 'Insert random number (1-100)',
    language: 'formula',
    codeTemplate: 'RANDOM(1, 100)'
  },

  // ===== LINES =====
  {
    id: 'lines.sort',
    label: 'Sort Lines (A-Z)',
    category: 'Lines',
    description: 'Sort selected lines alphabetically',
    language: 'formula',
    codeTemplate: 'SORT(selection)'
  },
  {
    id: 'lines.sortdesc',
    label: 'Sort Lines (Z-A)',
    category: 'Lines',
    description: 'Sort selected lines in reverse order',
    language: 'formula',
    codeTemplate: 'SORTDESC(selection)'
  },
  {
    id: 'lines.unique',
    label: 'Remove Duplicates',
    category: 'Lines',
    description: 'Remove duplicate lines',
    language: 'formula',
    codeTemplate: 'UNIQUE(selection)'
  },
  {
    id: 'lines.join',
    label: 'Join Lines',
    category: 'Lines',
    description: 'Join lines with space',
    language: 'formula',
    codeTemplate: 'JOIN(selection, " ")'
  },

  // ===== SELECTION =====
  {
    id: 'selection.length',
    label: 'Selection Length',
    category: 'Selection',
    description: 'Show character count of selection',
    language: 'formula',
    codeTemplate: 'LEN(selection)'
  },
  {
    id: 'selection.wrap',
    label: 'Custom Wrap',
    category: 'Selection',
    description: 'Wrap selection with custom text',
    language: 'formula',
    codeTemplate: 'WRAP("[", selection, "]")'
  },
  {
    id: 'selection.prefix',
    label: 'Add Prefix',
    category: 'Selection',
    description: 'Add prefix to selection',
    language: 'formula',
    codeTemplate: 'PREFIX(selection, ">>> ")'
  },
  {
    id: 'selection.suffix',
    label: 'Add Suffix',
    category: 'Selection',
    description: 'Add suffix to selection',
    language: 'formula',
    codeTemplate: 'SUFFIX(selection, " <<<")'
  }
]

/**
 * Get commands grouped by category
 */
export function getCommandsByCategory(): Record<string, CommandDefinition[]> {
  const grouped: Record<string, CommandDefinition[]> = {}

  for (const cmd of BUILT_IN_COMMANDS) {
    if (!grouped[cmd.category]) {
      grouped[cmd.category] = []
    }
    grouped[cmd.category].push(cmd)
  }

  return grouped
}

/**
 * Get a command by ID
 */
export function getCommandById(id: string): CommandDefinition | undefined {
  return BUILT_IN_COMMANDS.find(cmd => cmd.id === id)
}
