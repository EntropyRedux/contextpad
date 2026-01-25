/**
 * Formula Parser Service
 * Parses and executes Excel-like formulas for the action system
 *
 * Inline formula syntax: {=FORMULA()}
 *
 * Supported formulas:
 * - Text: UPPER, LOWER, TITLE, TRIM, REVERSE, etc.
 * - Case: CAMEL, SNAKE, KEBAB, PASCAL, SENTENCE
 * - Date/Time: TODAY(), NOW(), TIME(), UUID()
 * - Markdown: BOLD, ITALIC, CODE, CODEBLOCK, LINK, HEADING
 * - Lines: SORT, UNIQUE, JOIN, SPLIT, NUMBERLIST, BULLETLIST, CHECKLIST
 * - String: CONCAT, WRAP, PREFIX, SUFFIX, REPLACE, LEN, LEFT, RIGHT, MID, REPEAT, PAD
 * - Encode: BASE64, BASE64D, URLENCODE, URLDECODE, HTMLESCAPE, HTMLUNESCAPE
 * - Math: SUM, AVG, MIN, MAX, COUNT, ROUND, FLOOR, CEIL
 * - Document: LINE(), COL(), LINECOUNT(), CHARCOUNT(), WORDCOUNT()
 * - Position: GETLINE(n), GETRANGE(from, to)
 */

export interface FormulaResult {
  success: boolean
  value?: string
  error?: string
}

export interface FormulaValidation {
  valid: boolean
  error?: string
  functions: string[]
}

// Editor context for position-based functions
export interface EditorContext {
  line: number
  column: number
  lineCount: number
  charCount: number
  wordCount: number
  getLine: (n: number) => string
  getRange: (fromLine: number, toLine: number) => string
}

// Global context that can be set before formula execution
let editorContext: EditorContext | null = null

export function setEditorContext(ctx: EditorContext | null) {
  editorContext = ctx
}

export function getEditorContext(): EditorContext | null {
  return editorContext
}

// All supported formula functions
const FORMULA_FUNCTIONS: Record<string, (...args: string[]) => string> = {
  // Text Transform
  UPPER: (text: string) => text?.toUpperCase() ?? '',
  LOWER: (text: string) => text?.toLowerCase() ?? '',
  TITLE: (text: string) => {
    if (!text) return ''
    return text.replace(/\b\w/g, char => char.toUpperCase())
  },
  REVERSE: (text: string) => text?.split('').reverse().join('') ?? '',
  TRIM: (text: string) => text?.trim() ?? '',
  LTRIM: (text: string) => text?.trimStart() ?? '',
  RTRIM: (text: string) => text?.trimEnd() ?? '',

  // Case Conversions (for coding)
  CAMEL: (text: string) => {
    if (!text) return ''
    return text.toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toLowerCase())
  },
  PASCAL: (text: string) => {
    if (!text) return ''
    return text.toLowerCase()
      .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
      .replace(/^./, char => char.toUpperCase())
  },
  SNAKE: (text: string) => {
    if (!text) return ''
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s\-]+/g, '_')
      .toLowerCase()
  },
  KEBAB: (text: string) => {
    if (!text) return ''
    return text
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase()
  },
  CONSTANT: (text: string) => {
    if (!text) return ''
    return text
      .replace(/([a-z])([A-Z])/g, '$1_$2')
      .replace(/[\s\-]+/g, '_')
      .toUpperCase()
  },
  SENTENCE: (text: string) => {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
  },

  // Insert - these don't use selection
  TODAY: () => new Date().toISOString().split('T')[0],
  NOW: () => new Date().toISOString().replace('T', ' ').slice(0, 19),
  TIME: () => new Date().toTimeString().split(' ')[0],
  UUID: () => crypto.randomUUID(),
  RANDOM: (min: string = '1', max: string = '100') => {
    const minNum = parseInt(min, 10) || 1
    const maxNum = parseInt(max, 10) || 100
    return String(Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum)
  },

  // String manipulation
  CONCAT: (...args: string[]) => args.join(''),
  WRAP: (before: string, text: string, after: string) => `${before}${text}${after}`,
  PREFIX: (text: string, prefix: string) => `${prefix}${text}`,
  SUFFIX: (text: string, suffix: string) => `${text}${suffix}`,
  REPLACE: (text: string, search: string, replace: string) => {
    if (!text || !search) return text ?? ''
    return text.split(search).join(replace)
  },
  LEN: (text: string) => String(text?.length ?? 0),
  LEFT: (text: string, count: string = '1') => {
    const n = parseInt(count, 10) || 1
    return text?.slice(0, n) ?? ''
  },
  RIGHT: (text: string, count: string = '1') => {
    const n = parseInt(count, 10) || 1
    return text?.slice(-n) ?? ''
  },
  MID: (text: string, start: string = '0', length: string = '1') => {
    const s = parseInt(start, 10) || 0
    const l = parseInt(length, 10) || 1
    return text?.slice(s, s + l) ?? ''
  },
  REPEAT: (text: string, count: string = '2') => {
    const n = Math.min(100, parseInt(count, 10) || 2) // Limit to prevent abuse
    return (text ?? '').repeat(n)
  },
  PAD: (text: string, length: string = '10', char: string = ' ') => {
    const len = parseInt(length, 10) || 10
    const padChar = char || ' '
    return (text ?? '').padEnd(len, padChar)
  },
  PADSTART: (text: string, length: string = '10', char: string = ' ') => {
    const len = parseInt(length, 10) || 10
    const padChar = char || ' '
    return (text ?? '').padStart(len, padChar)
  },

  // Encoding
  BASE64: (text: string) => {
    try { return btoa(text ?? '') } catch { return '' }
  },
  BASE64D: (text: string) => {
    try { return atob(text ?? '') } catch { return '' }
  },
  URLENCODE: (text: string) => encodeURIComponent(text ?? ''),
  URLDECODE: (text: string) => {
    try { return decodeURIComponent(text ?? '') } catch { return text ?? '' }
  },
  HTMLESCAPE: (text: string) => {
    return (text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  },
  HTMLUNESCAPE: (text: string) => {
    return (text ?? '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
  },

  // Math operations (on comma-separated numbers or lines)
  SUM: (text: string) => {
    const nums = extractNumbers(text)
    return String(nums.reduce((a, b) => a + b, 0))
  },
  AVG: (text: string) => {
    const nums = extractNumbers(text)
    if (nums.length === 0) return '0'
    return String(nums.reduce((a, b) => a + b, 0) / nums.length)
  },
  MIN: (text: string) => {
    const nums = extractNumbers(text)
    if (nums.length === 0) return '0'
    return String(Math.min(...nums))
  },
  MAX: (text: string) => {
    const nums = extractNumbers(text)
    if (nums.length === 0) return '0'
    return String(Math.max(...nums))
  },
  COUNT: (text: string) => {
    const nums = extractNumbers(text)
    return String(nums.length)
  },
  ROUND: (text: string, decimals: string = '0') => {
    const num = parseFloat(text) || 0
    const dec = parseInt(decimals, 10) || 0
    return num.toFixed(dec)
  },
  FLOOR: (text: string) => String(Math.floor(parseFloat(text) || 0)),
  CEIL: (text: string) => String(Math.ceil(parseFloat(text) || 0)),
  ABS: (text: string) => String(Math.abs(parseFloat(text) || 0)),

  // Markdown
  BOLD: (text: string) => `**${text ?? ''}**`,
  ITALIC: (text: string) => `*${text ?? ''}*`,
  STRIKE: (text: string) => `~~${text ?? ''}~~`,
  CODE: (text: string) => `\`${text ?? ''}\``,
  CODEBLOCK: (text: string, lang: string = '') => `\`\`\`${lang}\n${text ?? ''}\n\`\`\``,
  LINK: (text: string, url: string = 'url') => `[${text ?? ''}](${url})`,
  IMAGE: (alt: string, url: string = 'url') => `![${alt ?? ''}](${url})`,
  HEADING: (text: string, level: string = '1') => {
    const lvl = Math.min(6, Math.max(1, parseInt(level, 10) || 1))
    return `${'#'.repeat(lvl)} ${text ?? ''}`
  },
  QUOTE: (text: string) => {
    if (!text) return '> '
    return text.split('\n').map(line => `> ${line}`).join('\n')
  },

  // Quick wrapping
  PARENTHESES: (text: string) => `(${text ?? ''})`,
  BRACKETS: (text: string) => `[${text ?? ''}]`,
  BRACES: (text: string) => `{${text ?? ''}}`,
  ANGLES: (text: string) => `<${text ?? ''}>`,
  SINGLEQUOTE: (text: string) => `'${text ?? ''}'`,
  DOUBLEQUOTE: (text: string) => `"${text ?? ''}"`,

  // Lines operations
  SORT: (text: string) => {
    if (!text) return ''
    return text.split('\n').sort().join('\n')
  },
  SORTDESC: (text: string) => {
    if (!text) return ''
    return text.split('\n').sort().reverse().join('\n')
  },
  SORTNUMERIC: (text: string) => {
    if (!text) return ''
    return text.split('\n').sort((a, b) => {
      const numA = parseFloat(a) || 0
      const numB = parseFloat(b) || 0
      return numA - numB
    }).join('\n')
  },
  UNIQUE: (text: string) => {
    if (!text) return ''
    const lines = text.split('\n')
    return [...new Set(lines)].join('\n')
  },
  JOIN: (text: string, separator: string = ' ') => {
    if (!text) return ''
    return text.split('\n').join(separator)
  },
  SPLIT: (text: string, separator: string = ',') => {
    if (!text) return ''
    return text.split(separator).join('\n')
  },
  NUMBERLIST: (text: string) => {
    if (!text) return ''
    return text.split('\n').map((line, i) => `${i + 1}. ${line}`).join('\n')
  },
  BULLETLIST: (text: string) => {
    if (!text) return ''
    return text.split('\n').map(line => `- ${line}`).join('\n')
  },
  CHECKLIST: (text: string) => {
    if (!text) return ''
    return text.split('\n').map(line => `- [ ] ${line}`).join('\n')
  },
  INDENT: (text: string, spaces: string = '2') => {
    if (!text) return ''
    const indent = ' '.repeat(parseInt(spaces, 10) || 2)
    return text.split('\n').map(line => `${indent}${line}`).join('\n')
  },
  UNINDENT: (text: string, spaces: string = '2') => {
    if (!text) return ''
    const count = parseInt(spaces, 10) || 2
    const regex = new RegExp(`^\\s{1,${count}}`)
    return text.split('\n').map(line => line.replace(regex, '')).join('\n')
  },
  LINECOUNT: () => {
    if (!editorContext) return '0'
    return String(editorContext.lineCount)
  },

  // CSV/TSV to Table conversion
  CSVTABLE: (text: string) => {
    if (!text) return ''
    const lines = text.trim().split('\n')
    if (lines.length === 0) return ''

    const rows = lines.map(line => {
      // Parse CSV: handle quoted values with commas
      const cells: string[] = []
      let current = ''
      let inQuotes = false

      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
          inQuotes = !inQuotes
        } else if (char === ',' && !inQuotes) {
          cells.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      cells.push(current.trim())
      return cells
    })

    // Build markdown table
    const header = `| ${rows[0].join(' | ')} |`
    const separator = `| ${rows[0].map(() => '---').join(' | ')} |`
    const body = rows.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n')

    return `${header}\n${separator}\n${body}`
  },
  TSVTABLE: (text: string) => {
    if (!text) return ''
    const lines = text.trim().split('\n')
    if (lines.length === 0) return ''

    const rows = lines.map(line => line.split('\t').map(cell => cell.trim()))

    // Build markdown table
    const header = `| ${rows[0].join(' | ')} |`
    const separator = `| ${rows[0].map(() => '---').join(' | ')} |`
    const body = rows.slice(1).map(row => `| ${row.join(' | ')} |`).join('\n')

    return `${header}\n${separator}\n${body}`
  },

  // Document info (require editor context)
  LINE: () => {
    if (!editorContext) return '0'
    return String(editorContext.line)
  },
  COL: () => {
    if (!editorContext) return '0'
    return String(editorContext.column)
  },
  POS: () => {
    if (!editorContext) return 'Line 0, Col 0'
    return `Line ${editorContext.line}, Col ${editorContext.column}`
  },
  CHARCOUNT: () => {
    if (!editorContext) return '0'
    return String(editorContext.charCount)
  },
  WORDCOUNT: () => {
    if (!editorContext) return '0'
    return String(editorContext.wordCount)
  },

  // Position-based operations
  GETLINE: (lineNum: string) => {
    if (!editorContext) return ''
    const n = parseInt(lineNum, 10) || 1
    return editorContext.getLine(n)
  },
  GETRANGE: (fromLine: string, toLine: string) => {
    if (!editorContext) return ''
    const from = parseInt(fromLine, 10) || 1
    const to = parseInt(toLine, 10) || from
    return editorContext.getRange(from, to)
  }
}

// Helper to extract numbers from text (comma-separated, space-separated, or line-separated)
function extractNumbers(text: string): number[] {
  if (!text) return []
  const nums = text.split(/[\s,\n]+/).map(s => parseFloat(s.trim())).filter(n => !isNaN(n))
  return nums
}

// Function names for validation
const VALID_FUNCTION_NAMES = Object.keys(FORMULA_FUNCTIONS)

/**
 * Parse a formula string and extract function calls
 * Returns tokens for execution
 */
function tokenize(formula: string): { func: string; args: string[] }[] {
  const tokens: { func: string; args: string[] }[] = []
  let remaining = formula.trim()

  // Simple regex to match FUNCTION(args) pattern
  // Supports nested calls and quoted strings
  const funcPattern = /^([A-Z_]+)\s*\(/i

  while (remaining.length > 0) {
    remaining = remaining.trim()
    const match = remaining.match(funcPattern)

    if (match) {
      const funcName = match[1].toUpperCase()
      remaining = remaining.slice(match[0].length)

      // Extract arguments until closing paren
      const args: string[] = []
      let depth = 1
      let currentArg = ''
      let inString = false
      let stringChar = ''

      for (let i = 0; i < remaining.length && depth > 0; i++) {
        const char = remaining[i]

        if (inString) {
          if (char === stringChar) {
            inString = false
          } else {
            currentArg += char
          }
        } else if (char === '"' || char === "'") {
          inString = true
          stringChar = char
        } else if (char === '(') {
          depth++
          currentArg += char
        } else if (char === ')') {
          depth--
          if (depth === 0) {
            if (currentArg.trim()) {
              args.push(currentArg.trim())
            }
            remaining = remaining.slice(i + 1)
          } else {
            currentArg += char
          }
        } else if (char === ',' && depth === 1) {
          args.push(currentArg.trim())
          currentArg = ''
        } else {
          currentArg += char
        }
      }

      tokens.push({ func: funcName, args })
    } else {
      // Not a function call, skip
      break
    }
  }

  return tokens
}

/**
 * Execute a single formula with the given selection
 */
export function executeFormula(formula: string, selection: string = ''): FormulaResult {
  try {
    const tokens = tokenize(formula)

    if (tokens.length === 0) {
      return { success: false, error: 'Invalid formula: No function found' }
    }

    // For now, execute the first function (we can add chaining later)
    const token = tokens[0]
    const func = FORMULA_FUNCTIONS[token.func]

    if (!func) {
      return { success: false, error: `Unknown function: ${token.func}` }
    }

    // Process arguments - replace 'selection' keyword with actual selection
    // If no arguments provided, use selection as the first argument (for functions like BOLD(), UPPER(), etc.)
    let processedArgs: string[]

    if (token.args.length === 0) {
      // Empty parens () means use selection as first argument
      processedArgs = [selection]
    } else {
      processedArgs = token.args.map(arg => {
        const trimmed = arg.trim().toLowerCase()
        if (trimmed === 'selection') {
          return selection
        }
        // Handle nested function calls recursively
        if (/^[A-Z_]+\s*\(/i.test(arg)) {
          const nestedResult = executeFormula(arg, selection)
          if (nestedResult.success) {
            return nestedResult.value!
          }
          throw new Error(nestedResult.error)
        }
        return arg
      })
    }

    const result = func(...processedArgs)
    return { success: true, value: result }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

/**
 * Validate a formula without executing it
 */
export function validateFormula(formula: string): FormulaValidation {
  if (!formula || !formula.trim()) {
    return { valid: false, error: 'Formula cannot be empty' }
  }

  try {
    const tokens = tokenize(formula)

    if (tokens.length === 0) {
      return { valid: false, error: 'No valid function found in formula' }
    }

    const functions: string[] = []

    for (const token of tokens) {
      if (!VALID_FUNCTION_NAMES.includes(token.func)) {
        return {
          valid: false,
          error: `Unknown function: ${token.func}. Valid functions: ${VALID_FUNCTION_NAMES.join(', ')}`
        }
      }
      functions.push(token.func)

      // Validate nested functions in arguments
      for (const arg of token.args) {
        if (/^[A-Z_]+\s*\(/i.test(arg)) {
          const nested = validateFormula(arg)
          if (!nested.valid) {
            return nested
          }
          functions.push(...nested.functions)
        }
      }
    }

    return { valid: true, functions }
  } catch (err) {
    return { valid: false, error: `Parse error: ${String(err)}` }
  }
}

/**
 * Get all available formula functions with descriptions, organized by category
 */
export interface FormulaFunctionInfo {
  name: string
  description: string
  example: string
  category: string
}

export function getFormulaFunctions(): FormulaFunctionInfo[] {
  return [
    // Text Transform
    { name: 'UPPER', description: 'Convert to uppercase', example: 'UPPER(selection)', category: 'Text' },
    { name: 'LOWER', description: 'Convert to lowercase', example: 'LOWER(selection)', category: 'Text' },
    { name: 'TITLE', description: 'Convert to Title Case', example: 'TITLE(selection)', category: 'Text' },
    { name: 'SENTENCE', description: 'Capitalize first letter only', example: 'SENTENCE(selection)', category: 'Text' },
    { name: 'REVERSE', description: 'Reverse the text', example: 'REVERSE(selection)', category: 'Text' },
    { name: 'TRIM', description: 'Remove leading/trailing whitespace', example: 'TRIM(selection)', category: 'Text' },
    { name: 'LTRIM', description: 'Remove leading whitespace', example: 'LTRIM(selection)', category: 'Text' },
    { name: 'RTRIM', description: 'Remove trailing whitespace', example: 'RTRIM(selection)', category: 'Text' },

    // Case Conversions (for coding)
    { name: 'CAMEL', description: 'Convert to camelCase', example: 'CAMEL(hello world)', category: 'Case' },
    { name: 'PASCAL', description: 'Convert to PascalCase', example: 'PASCAL(hello world)', category: 'Case' },
    { name: 'SNAKE', description: 'Convert to snake_case', example: 'SNAKE(helloWorld)', category: 'Case' },
    { name: 'KEBAB', description: 'Convert to kebab-case', example: 'KEBAB(helloWorld)', category: 'Case' },
    { name: 'CONSTANT', description: 'Convert to CONSTANT_CASE', example: 'CONSTANT(helloWorld)', category: 'Case' },

    // Insert
    { name: 'TODAY', description: 'Insert current date (YYYY-MM-DD)', example: 'TODAY()', category: 'Insert' },
    { name: 'NOW', description: 'Insert current date and time', example: 'NOW()', category: 'Insert' },
    { name: 'TIME', description: 'Insert current time (HH:MM:SS)', example: 'TIME()', category: 'Insert' },
    { name: 'UUID', description: 'Insert a random UUID', example: 'UUID()', category: 'Insert' },
    { name: 'RANDOM', description: 'Insert random number', example: 'RANDOM(1, 100)', category: 'Insert' },

    // String manipulation
    { name: 'CONCAT', description: 'Concatenate strings', example: 'CONCAT(selection, " text")', category: 'String' },
    { name: 'WRAP', description: 'Wrap text with prefix/suffix', example: 'WRAP("[", selection, "]")', category: 'String' },
    { name: 'PREFIX', description: 'Add prefix to text', example: 'PREFIX(selection, ">>> ")', category: 'String' },
    { name: 'SUFFIX', description: 'Add suffix to text', example: 'SUFFIX(selection, " <<<")', category: 'String' },
    { name: 'REPLACE', description: 'Replace text', example: 'REPLACE(selection, "old", "new")', category: 'String' },
    { name: 'LEN', description: 'Get text length', example: 'LEN(selection)', category: 'String' },
    { name: 'LEFT', description: 'Get first N characters', example: 'LEFT(selection, 5)', category: 'String' },
    { name: 'RIGHT', description: 'Get last N characters', example: 'RIGHT(selection, 5)', category: 'String' },
    { name: 'MID', description: 'Get substring from position', example: 'MID(selection, 2, 5)', category: 'String' },
    { name: 'REPEAT', description: 'Repeat text N times', example: 'REPEAT(selection, 3)', category: 'String' },
    { name: 'PAD', description: 'Pad text to length (end)', example: 'PAD(selection, 20, ".")', category: 'String' },
    { name: 'PADSTART', description: 'Pad text to length (start)', example: 'PADSTART(selection, 10, "0")', category: 'String' },

    // Encoding
    { name: 'BASE64', description: 'Encode to Base64', example: 'BASE64(selection)', category: 'Encode' },
    { name: 'BASE64D', description: 'Decode from Base64', example: 'BASE64D(selection)', category: 'Encode' },
    { name: 'URLENCODE', description: 'URL encode text', example: 'URLENCODE(selection)', category: 'Encode' },
    { name: 'URLDECODE', description: 'URL decode text', example: 'URLDECODE(selection)', category: 'Encode' },
    { name: 'HTMLESCAPE', description: 'Escape HTML entities', example: 'HTMLESCAPE(selection)', category: 'Encode' },
    { name: 'HTMLUNESCAPE', description: 'Unescape HTML entities', example: 'HTMLUNESCAPE(selection)', category: 'Encode' },

    // Math
    { name: 'SUM', description: 'Sum numbers', example: 'SUM(1, 2, 3)', category: 'Math' },
    { name: 'AVG', description: 'Average of numbers', example: 'AVG(selection)', category: 'Math' },
    { name: 'MIN', description: 'Minimum value', example: 'MIN(selection)', category: 'Math' },
    { name: 'MAX', description: 'Maximum value', example: 'MAX(selection)', category: 'Math' },
    { name: 'COUNT', description: 'Count numbers', example: 'COUNT(selection)', category: 'Math' },
    { name: 'ROUND', description: 'Round to decimals', example: 'ROUND(3.14159, 2)', category: 'Math' },
    { name: 'FLOOR', description: 'Round down', example: 'FLOOR(3.9)', category: 'Math' },
    { name: 'CEIL', description: 'Round up', example: 'CEIL(3.1)', category: 'Math' },
    { name: 'ABS', description: 'Absolute value', example: 'ABS(-5)', category: 'Math' },

    // Markdown
    { name: 'BOLD', description: 'Wrap in bold (**text**)', example: 'BOLD(selection)', category: 'Markdown' },
    { name: 'ITALIC', description: 'Wrap in italic (*text*)', example: 'ITALIC(selection)', category: 'Markdown' },
    { name: 'STRIKE', description: 'Wrap in strikethrough', example: 'STRIKE(selection)', category: 'Markdown' },
    { name: 'CODE', description: 'Wrap in inline code', example: 'CODE(selection)', category: 'Markdown' },
    { name: 'CODEBLOCK', description: 'Wrap in code block', example: 'CODEBLOCK(selection, "js")', category: 'Markdown' },
    { name: 'LINK', description: 'Create markdown link', example: 'LINK(selection, "https://...")', category: 'Markdown' },
    { name: 'IMAGE', description: 'Create markdown image', example: 'IMAGE("alt", "url")', category: 'Markdown' },
    { name: 'HEADING', description: 'Create heading (H1-H6)', example: 'HEADING(selection, 2)', category: 'Markdown' },
    { name: 'QUOTE', description: 'Create block quote', example: 'QUOTE(selection)', category: 'Markdown' },

    // Quick wrapping
    { name: 'PARENTHESES', description: 'Wrap in ()', example: 'PARENTHESES(selection)', category: 'Wrap' },
    { name: 'BRACKETS', description: 'Wrap in []', example: 'BRACKETS(selection)', category: 'Wrap' },
    { name: 'BRACES', description: 'Wrap in {}', example: 'BRACES(selection)', category: 'Wrap' },
    { name: 'ANGLES', description: 'Wrap in <>', example: 'ANGLES(selection)', category: 'Wrap' },
    { name: 'SINGLEQUOTE', description: "Wrap in ''", example: 'SINGLEQUOTE(selection)', category: 'Wrap' },
    { name: 'DOUBLEQUOTE', description: 'Wrap in ""', example: 'DOUBLEQUOTE(selection)', category: 'Wrap' },

    // Lines
    { name: 'SORT', description: 'Sort lines A-Z', example: 'SORT(selection)', category: 'Lines' },
    { name: 'SORTDESC', description: 'Sort lines Z-A', example: 'SORTDESC(selection)', category: 'Lines' },
    { name: 'SORTNUMERIC', description: 'Sort lines numerically', example: 'SORTNUMERIC(selection)', category: 'Lines' },
    { name: 'UNIQUE', description: 'Remove duplicate lines', example: 'UNIQUE(selection)', category: 'Lines' },
    { name: 'JOIN', description: 'Join lines with separator', example: 'JOIN(selection, ", ")', category: 'Lines' },
    { name: 'SPLIT', description: 'Split text into lines', example: 'SPLIT(selection, ",")', category: 'Lines' },
    { name: 'NUMBERLIST', description: 'Create numbered list', example: 'NUMBERLIST(selection)', category: 'Lines' },
    { name: 'BULLETLIST', description: 'Create bullet list', example: 'BULLETLIST(selection)', category: 'Lines' },
    { name: 'CHECKLIST', description: 'Create checkbox list', example: 'CHECKLIST(selection)', category: 'Lines' },
    { name: 'INDENT', description: 'Indent lines', example: 'INDENT(selection, 4)', category: 'Lines' },
    { name: 'UNINDENT', description: 'Remove indentation', example: 'UNINDENT(selection, 2)', category: 'Lines' },

    // Table conversion
    { name: 'CSVTABLE', description: 'Convert CSV to markdown table', example: 'CSVTABLE(selection)', category: 'Table' },
    { name: 'TSVTABLE', description: 'Convert TSV to markdown table', example: 'TSVTABLE(selection)', category: 'Table' },

    // Document info
    { name: 'LINE', description: 'Current line number', example: 'LINE()', category: 'Document' },
    { name: 'COL', description: 'Current column number', example: 'COL()', category: 'Document' },
    { name: 'POS', description: 'Current position as text', example: 'POS()', category: 'Document' },
    { name: 'LINECOUNT', description: 'Total line count', example: 'LINECOUNT()', category: 'Document' },
    { name: 'CHARCOUNT', description: 'Total character count', example: 'CHARCOUNT()', category: 'Document' },
    { name: 'WORDCOUNT', description: 'Total word count', example: 'WORDCOUNT()', category: 'Document' },
    { name: 'GETLINE', description: 'Get content of line N', example: 'GETLINE(5)', category: 'Document' },
    { name: 'GETRANGE', description: 'Get content of lines', example: 'GETRANGE(1, 10)', category: 'Document' }
  ]
}

/**
 * Get formula functions grouped by category
 */
export function getFormulaFunctionsByCategory(): Record<string, FormulaFunctionInfo[]> {
  const functions = getFormulaFunctions()
  const grouped: Record<string, FormulaFunctionInfo[]> = {}

  for (const fn of functions) {
    if (!grouped[fn.category]) {
      grouped[fn.category] = []
    }
    grouped[fn.category].push(fn)
  }

  return grouped
}

/**
 * Check if a string is a formula or JavaScript code
 */
export function isFormula(code: string): boolean {
  const trimmed = code.trim()
  // Formula if it starts with a known function name followed by parenthesis
  return /^[A-Z_]+\s*\(/i.test(trimmed) && VALID_FUNCTION_NAMES.some(fn =>
    trimmed.toUpperCase().startsWith(fn + '(') || trimmed.toUpperCase().startsWith(fn + ' (')
  )
}

/**
 * Inline formula syntax: {=FORMULA()}
 * Regex to detect inline formulas in text
 */
export const INLINE_FORMULA_REGEX = /\{=([^}]+)\}/g

/**
 * Check if text contains inline formulas
 */
export function hasInlineFormulas(text: string): boolean {
  return INLINE_FORMULA_REGEX.test(text)
}

/**
 * Find all inline formulas in text with their positions
 */
export interface InlineFormulaMatch {
  fullMatch: string      // The complete {=...} string
  formula: string        // Just the formula part (without {= and })
  start: number          // Start position in text
  end: number            // End position in text
}

export function findInlineFormulas(text: string): InlineFormulaMatch[] {
  const matches: InlineFormulaMatch[] = []
  const regex = /\{=([^}]+)\}/g
  let match

  while ((match = regex.exec(text)) !== null) {
    matches.push({
      fullMatch: match[0],
      formula: match[1],
      start: match.index,
      end: match.index + match[0].length
    })
  }

  return matches
}

/**
 * Execute a single inline formula and return the result
 */
export function executeInlineFormula(
  formulaMatch: InlineFormulaMatch,
  selection: string = ''
): FormulaResult {
  return executeFormula(formulaMatch.formula, selection)
}

/**
 * Process all inline formulas in text and replace them with results
 * Returns the processed text and any errors encountered
 */
export interface ProcessedFormulasResult {
  text: string
  executed: number
  errors: { formula: string; error: string }[]
}

export function processInlineFormulas(
  text: string,
  selection: string = ''
): ProcessedFormulasResult {
  const matches = findInlineFormulas(text)
  const errors: { formula: string; error: string }[] = []
  let executed = 0
  let result = text

  // Process in reverse order to maintain correct positions
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i]
    const formulaResult = executeFormula(match.formula, selection)

    if (formulaResult.success) {
      result = result.slice(0, match.start) + formulaResult.value + result.slice(match.end)
      executed++
    } else {
      errors.push({ formula: match.formula, error: formulaResult.error || 'Unknown error' })
    }
  }

  return { text: result, executed, errors }
}

/**
 * Get a preview of what a formula would return (for UI display)
 */
export function previewFormula(formula: string, selection: string = ''): string {
  const result = executeFormula(formula, selection)
  if (result.success) {
    return result.value || ''
  }
  return `Error: ${result.error}`
}
