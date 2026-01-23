/**
 * Code validator for action execution security
 * Based on monolithic implementation
 */

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Dangerous patterns that should be blocked
const DANGEROUS_PATTERNS = [
  /eval\s*\(/i,
  /Function\s*\(/i,
  /setTimeout\s*\(/i,
  /setInterval\s*\(/i,
  /fetch\s*\(/i,
  /XMLHttpRequest/i,
  /WebSocket/i,
  /import\s+/i,
  /require\s*\(/i,
  /process\./i,
  /fs\./i,
  /child_process/i,
  /\.invoke\s*\(/i, // Tauri invoke
  /window\./i,
  /document\./i,
  /localStorage/i,
  /sessionStorage/i,
  /indexedDB/i,
]

// Warning patterns (allowed but risky)
const WARNING_PATTERNS = [
  /while\s*\(/i,
  /for\s*\(/i,
  /\.forEach/i,
]

/**
 * Validate action code for security
 * Only allows safe operations on editor and monaco objects
 */
export function validateActionCode(code: string): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Forbidden pattern detected: ${pattern.source}`)
    }
  }

  // Check for warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(`Potentially risky pattern: ${pattern.source} (may cause performance issues)`)
    }
  }

  // Check for syntax errors (basic check)
  try {
    new Function('editor', 'monaco', code)
  } catch (err) {
    errors.push(`Syntax error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  }
}
