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

// Dynamic access patterns that attempt to evade global variable restrictions
// Relaxed to allow safe bracket notation while blocking dangerous patterns
const DANGEROUS_DYNAMIC_ACCESS_PATTERNS = [
  // Only block dynamic access on dangerous global objects
  /(?:window|globalThis|document|global|root|top|parent|self)\s*\[.*[^"'0-9_\s]\]/i,
  // Still block prototype manipulation
  /(?:__proto__|prototype|constructor)\s*\[/i,
  // Still block string manipulation that could be used for code obfuscation
  /String\.fromCharCode/i,
  /atob\s*\(/i,
  /btoa\s*\(/i,
  // Still block hex/unicode escape sequences (obfuscation)
  /\\x[0-9a-fA-F]{2}/,
  /\\u[0-9a-fA-F]{4}/,
  /\\u\{[0-9a-fA-F]+\}/,
]

// Template literal validation - allow safe literals but check for dangerous content
const TEMPLATE_LITERAL_DANGEROUS_PATTERNS = [
  /\beval\s*\(/i,
  /\bFunction\s*\(/i,
  /\bprocess\s*\./i,
  /\brequire\s*\(/i,
  /\bimport\s*\(/i,
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
]

// Warning patterns (allowed but risky)
const WARNING_PATTERNS = [
  /while\s*\(/i,
  /for\s*\(/i,
  /\.forEach/i,
  /fetch\s*\(/i,
]

/**
 * Validate template literals for dangerous content
 * Allows safe template literals while blocking dangerous patterns
 */
function validateTemplateLiterals(code: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // Extract template literals
  const templateLiteralRegex = /`([^`]*)`/g
  let match
  
  while ((match = templateLiteralRegex.exec(code)) !== null) {
    const content = match[1]
    
    // Check for dangerous patterns in template literal content
    for (const pattern of TEMPLATE_LITERAL_DANGEROUS_PATTERNS) {
      if (pattern.test(content)) {
        errors.push(`Template literal contains dangerous pattern: ${pattern.source}`)
      }
    }
  }
  
  return { valid: errors.length === 0, errors }
}

/**
 * Validate action code for security.
 * Layer 1: Regex pre-filter for known dangerous patterns.
 * Layer 2: Dynamic access bypass detection.
 * Layer 3: Template literal validation (allows safe literals, blocks dangerous content).
 * Layer 4: Syntax validation via Function constructor.
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

  // Layer 2: Dynamic access bypass detection
  for (const pattern of DANGEROUS_DYNAMIC_ACCESS_PATTERNS) {
    if (pattern.test(code)) {
      errors.push(`Potentially unsafe dynamic access: ${pattern.source}`)
    }
  }

  // Layer 3: Template literal validation
  const templateValidation = validateTemplateLiterals(code)
  if (!templateValidation.valid) {
    errors.push(...templateValidation.errors)
  }

  // Layer 4: Warning patterns
  for (const pattern of WARNING_PATTERNS) {
    if (pattern.test(code)) {
      warnings.push(`Potentially risky pattern: ${pattern.source} (may cause performance issues)`)
    }
  }

  // Layer 5: Syntax validation
  try {
    new Function('helpers', 'console', 'navigator', code)
  } catch (err) {
    errors.push(`Syntax error: ${err instanceof Error ? err.message : String(err)}`)
  }

  return { valid: errors.length === 0, errors, warnings }
}
