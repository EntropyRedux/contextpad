/**
 * Code Block Parameters Parser
 *
 * Parses Pandoc/R Markdown style attributes from fenced code block info strings.
 *
 * Syntax: ```language {key=value, boolean_flag, key="quoted value"}
 *
 * @module codeBlockParams
 * @version 1.5.0
 */

// =============================================================================
// Types
// =============================================================================

export interface CodeBlockParams {
  [key: string]: string | boolean
}

export interface ParsedCodeBlock {
  language: string
  params: CodeBlockParams
  rawParams: string  // Original params string for round-trip preservation
}

// =============================================================================
// Known Parameters (Source of Truth)
// =============================================================================

export const KNOWN_PARAMS = {
  // Editor Behavior
  lock: { type: 'boolean', description: 'Lock block content (use exclude="variables" to keep {{variables}} editable)' },
  exclude: { type: 'string', description: 'Comma-separated list of exclusions (e.g., "variables", "action:ID")' },
  
  // Automation
  action: { type: 'boolean', description: 'Mark block as an action definition (for future use)' },
} as const

export type KnownParamKey = keyof typeof KNOWN_PARAMS

// =============================================================================
// Parser
// =============================================================================

/**
 * Parses the parameters portion of a code block info string.
 */
export function parseCodeBlockParams(paramsString: string): CodeBlockParams {
  const params: CodeBlockParams = {}

  if (!paramsString || paramsString.trim() === '') {
    return params
  }

  // Tokenizer state machine
  let i = 0
  const len = paramsString.length

  while (i < len) {
    // Skip whitespace and commas
    while (i < len && /[\s,]/.test(paramsString[i])) {
      i++
    }

    if (i >= len) break

    // Parse key (identifier)
    const keyStart = i
    while (i < len && /[\w\-]/.test(paramsString[i])) {
      i++
    }
    const key = paramsString.slice(keyStart, i)

    if (!key) {
      // Skip invalid character
      i++
      continue
    }

    // Skip whitespace
    while (i < len && /\s/.test(paramsString[i])) {
      i++
    }

    // Check for '='
    if (i < len && paramsString[i] === '=') {
      i++ // consume '='

      // Skip whitespace after '='
      while (i < len && /\s/.test(paramsString[i])) {
        i++
      }

      // Parse value
      if (i < len) {
        const quote = paramsString[i]

        if (quote === '"' || quote === "'") {
          // Quoted string value
          i++ // consume opening quote
          const valueStart = i
          let value = ''

          while (i < len && paramsString[i] !== quote) {
            // Handle escaped characters
            if (paramsString[i] === '\\' && i + 1 < len) {
              i++
              value += paramsString[i]
            } else {
              value += paramsString[i]
            }
            i++
          }

          if (i < len) {
            i++ // consume closing quote
          }

          params[key] = value
        } else {
          // Unquoted value (until comma, whitespace, or end)
          const valueStart = i
          while (i < len && !/[\s,}]/.test(paramsString[i])) {
            i++
          }
          const value = paramsString.slice(valueStart, i)
          params[key] = value
        }
      } else {
        // Key with '=' but no value
        params[key] = ''
      }
    } else {
      // Boolean flag (no '=')
      params[key] = true
    }
  }

  return params
}

/**
 * Extracts language and parameters from a full code block info string.
 */
export function extractCodeBlockInfo(infoString: string): ParsedCodeBlock {
  const trimmed = infoString.trim()

  // Match: language {params} or just language
  const match = trimmed.match(/^(\S*?)(?:\s*\{(.*)\})?$/s)

  if (!match) {
    return { language: trimmed, params: {}, rawParams: '' }
  }

  const language = match[1] || ''
  const rawParams = match[2] || ''
  const params = parseCodeBlockParams(rawParams)

  return { language, params, rawParams }
}

// =============================================================================
// Serializer
// =============================================================================

export function serializeCodeBlockParams(params: CodeBlockParams): string {
  const parts: string[] = []

  for (const [key, value] of Object.entries(params)) {
    if (value === true) {
      parts.push(key)
    } else if (value === false) {
      parts.push(`${key}=false`)
    } else if (typeof value === 'string') {
      const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      parts.push(`${key}="${escaped}"`)
    }
  }

  return parts.join(', ')
}

export function buildInfoString(language: string, params: CodeBlockParams): string {
  const paramsStr = serializeCodeBlockParams(params)

  if (!paramsStr) {
    return language
  }

  return `${language} {${paramsStr}}`
}

// =============================================================================
// Utilities
// =============================================================================

export function isKnownParam(key: string): key is KnownParamKey {
  return key in KNOWN_PARAMS
}

export function getParamAsBoolean(params: CodeBlockParams, key: string, defaultValue = false): boolean {
  const value = params[key]
  if (value === undefined) return defaultValue
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return defaultValue
}

export function getParamAsString(params: CodeBlockParams, key: string, defaultValue = ''): string {
  const value = params[key]
  if (value === undefined) return defaultValue
  if (typeof value === 'string') return value
  if (typeof value === 'boolean') return value.toString()
  return defaultValue
}

export function mergeParams(existing: CodeBlockParams, updates: CodeBlockParams): CodeBlockParams {
  return { ...existing, ...updates }
}

export function removeParam(params: CodeBlockParams, key: string): CodeBlockParams {
  const { [key]: _, ...rest } = params
  return rest
}
