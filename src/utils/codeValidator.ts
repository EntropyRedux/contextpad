/**
 * Code validator for action execution security
 * Validates action code for sandbox execution safety
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Pre-filter: quick regex checks for obviously dangerous patterns
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /import\s+/i,
  /require\s*\(/i,
  /process\./i,
  /child_process/i,
  /\.invoke\s*\(/i,
  /window\s*[\[.]/i,
  /document\s*[\[.]/i,
  /localStorage/i,
  /sessionStorage/i,
  /indexedDB/i,
  /globalThis/i,
  /__proto__/,
  /\.constructor\b/,
  /\.prototype\b/,
  /Reflect\./i,
  /Proxy\s*\(/i,
]

// Dynamic access patterns that bypass simple word matching
const DYNAMIC_ACCESS_PATTERNS = [
  /\[\s*['"`].*['"`]\s*\]/,           // bracket notation with any string
  /\[\s*[^'"`\]\s].*\+.*\]/,          // bracket notation with concatenation
  /String\.fromCharCode/i,
  /atob\s*\(/i,
  /btoa\s*\(/i,
  /decodeURI/i,
  /\\x[0-9a-fA-F]{2}/,
  /\\u[0-9a-fA-F]{4}/,
  /\\u\{[0-9a-fA-F]+\}/,
  /`[^`]*\$\{/,                       // template literals with expressions
]

// Warning patterns (allowed but risky)
const WARNING_PATTERNS = [
  /while\s*\(/i,
  /for\s*\(/i,
  /\.forEach/i,
  /fetch\s*\(/i,
]

/**
 * Validate action code for security.
 * Layer 1: Regex pre-filter for known dangerous patterns.
 * Layer 2: Syntax validation via Function constructor.
 * Layer 3: Dynamic access pattern detection.
 */
export function validateActionCode(code: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Layer 1: Dangerous pattern pre-filter
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Forbidden pattern detected: ${pattern.source}`)
    }
  }

  // Layer 3: Dynamic access bypass detection
  for (const pattern of DYNAMIC_ACCESS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Potentially unsafe dynamic access: ${pattern.source}`)
    }
  }

  // Layer 2: Warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(`Potentially risky pattern: ${pattern.source} (may cause performance issues)`)
    }
  }

  // Syntax validation
  try {
    new Function('helpers', 'console', 'navigator', code)
  } catch (err) {
    errors.push(`Syntax error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}
