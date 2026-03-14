/**
 * Code Block Parameters Parser - Test Cases
 *
 * Run with: npx tsx src/utils/codeBlockParams.test.ts
 */

import {
  parseCodeBlockParams,
  extractCodeBlockInfo,
  serializeCodeBlockParams,
  buildInfoString,
  getParamAsBoolean,
  getParamAsString,
  isCodeBlockHeaderWithParams,
  CODE_BLOCK_HEADER_REGEX,
} from './codeBlockParams'

// =============================================================================
// Test Utilities
// =============================================================================

let passCount = 0
let failCount = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✅ ${name}`)
    passCount++
  } catch (error) {
    console.log(`❌ ${name}`)
    console.log(`   ${error}`)
    failCount++
  }
}

function assertEquals<T>(actual: T, expected: T, message = '') {
  const actualStr = JSON.stringify(actual)
  const expectedStr = JSON.stringify(expected)
  if (actualStr !== expectedStr) {
    throw new Error(`${message}\n   Expected: ${expectedStr}\n   Actual:   ${actualStr}`)
  }
}

// =============================================================================
// parseCodeBlockParams Tests
// =============================================================================

console.log('\n--- parseCodeBlockParams ---\n')

test('empty string', () => {
  assertEquals(parseCodeBlockParams(''), {})
})

test('whitespace only', () => {
  assertEquals(parseCodeBlockParams('   '), {})
})

test('single boolean flag', () => {
  assertEquals(parseCodeBlockParams('ai_ignore'), { ai_ignore: true })
})

test('multiple boolean flags', () => {
  assertEquals(parseCodeBlockParams('ai_ignore, echo'), { ai_ignore: true, echo: true })
})

test('boolean flags without commas', () => {
  assertEquals(parseCodeBlockParams('ai_ignore echo eval'), { ai_ignore: true, echo: true, eval: true })
})

test('key=value with double quotes', () => {
  assertEquals(parseCodeBlockParams('role="system"'), { role: 'system' })
})

test('key=value with single quotes', () => {
  assertEquals(parseCodeBlockParams("role='system'"), { role: 'system' })
})

test('key=value unquoted', () => {
  assertEquals(parseCodeBlockParams('echo=false'), { echo: 'false' })
})

test('mixed boolean and string', () => {
  assertEquals(
    parseCodeBlockParams('ai_ignore, role="system"'),
    { ai_ignore: true, role: 'system' }
  )
})

test('complex mixed params', () => {
  assertEquals(
    parseCodeBlockParams('ai_ignore, role="system", echo=false, class="highlight"'),
    { ai_ignore: true, role: 'system', echo: 'false', class: 'highlight' }
  )
})

test('whitespace tolerance', () => {
  assertEquals(
    parseCodeBlockParams('  ai_ignore ,  role = "system"  '),
    { ai_ignore: true, role: 'system' }
  )
})

test('value with spaces in quotes', () => {
  assertEquals(
    parseCodeBlockParams('caption="Hello World"'),
    { caption: 'Hello World' }
  )
})

test('escaped quotes in value', () => {
  assertEquals(
    parseCodeBlockParams('note="He said \\"hello\\""'),
    { note: 'He said "hello"' }
  )
})

test('hyphenated key names', () => {
  assertEquals(
    parseCodeBlockParams('my-custom-param="value"'),
    { 'my-custom-param': 'value' }
  )
})

test('underscore key names', () => {
  assertEquals(
    parseCodeBlockParams('my_custom_param="value"'),
    { my_custom_param: 'value' }
  )
})

test('empty value with quotes', () => {
  assertEquals(
    parseCodeBlockParams('note=""'),
    { note: '' }
  )
})

test('numeric-looking values stay as strings', () => {
  assertEquals(
    parseCodeBlockParams('width="500", height=300'),
    { width: '500', height: '300' }
  )
})

// =============================================================================
// extractCodeBlockInfo Tests
// =============================================================================

console.log('\n--- extractCodeBlockInfo ---\n')

test('language only', () => {
  const result = extractCodeBlockInfo('python')
  assertEquals(result.language, 'python')
  assertEquals(result.params, {})
})

test('language with params', () => {
  const result = extractCodeBlockInfo('python {ai_ignore}')
  assertEquals(result.language, 'python')
  assertEquals(result.params, { ai_ignore: true })
})

test('language with complex params', () => {
  const result = extractCodeBlockInfo('python {ai_ignore, role="system", echo=false}')
  assertEquals(result.language, 'python')
  assertEquals(result.params, { ai_ignore: true, role: 'system', echo: 'false' })
})

test('no language with params', () => {
  const result = extractCodeBlockInfo('{ai_ignore}')
  assertEquals(result.language, '')
  assertEquals(result.params, { ai_ignore: true })
})

test('empty string', () => {
  const result = extractCodeBlockInfo('')
  assertEquals(result.language, '')
  assertEquals(result.params, {})
})

test('preserves raw params', () => {
  const result = extractCodeBlockInfo('python {ai_ignore, role="system"}')
  assertEquals(result.rawParams, 'ai_ignore, role="system"')
})

// =============================================================================
// serializeCodeBlockParams Tests
// =============================================================================

console.log('\n--- serializeCodeBlockParams ---\n')

test('empty params', () => {
  assertEquals(serializeCodeBlockParams({}), '')
})

test('boolean true', () => {
  assertEquals(serializeCodeBlockParams({ ai_ignore: true }), 'ai_ignore')
})

test('boolean false', () => {
  assertEquals(serializeCodeBlockParams({ echo: false }), 'echo=false')
})

test('string value', () => {
  assertEquals(serializeCodeBlockParams({ role: 'system' }), 'role="system"')
})

test('mixed params', () => {
  const result = serializeCodeBlockParams({ ai_ignore: true, role: 'system' })
  assertEquals(result, 'ai_ignore, role="system"')
})

test('escapes quotes in values', () => {
  const result = serializeCodeBlockParams({ note: 'He said "hello"' })
  assertEquals(result, 'note="He said \\"hello\\""')
})

// =============================================================================
// buildInfoString Tests
// =============================================================================

console.log('\n--- buildInfoString ---\n')

test('language with no params', () => {
  assertEquals(buildInfoString('python', {}), 'python')
})

test('language with params', () => {
  assertEquals(
    buildInfoString('python', { ai_ignore: true }),
    'python {ai_ignore}'
  )
})

test('language with complex params', () => {
  assertEquals(
    buildInfoString('python', { ai_ignore: true, role: 'system' }),
    'python {ai_ignore, role="system"}'
  )
})

// =============================================================================
// Utility Function Tests
// =============================================================================

console.log('\n--- Utility Functions ---\n')

test('getParamAsBoolean - true value', () => {
  assertEquals(getParamAsBoolean({ ai_ignore: true }, 'ai_ignore'), true)
})

test('getParamAsBoolean - string "true"', () => {
  assertEquals(getParamAsBoolean({ echo: 'true' }, 'echo'), true)
})

test('getParamAsBoolean - string "false"', () => {
  assertEquals(getParamAsBoolean({ echo: 'false' }, 'echo'), false)
})

test('getParamAsBoolean - missing key with default', () => {
  assertEquals(getParamAsBoolean({}, 'missing', true), true)
})

test('getParamAsString - string value', () => {
  assertEquals(getParamAsString({ role: 'system' }, 'role'), 'system')
})

test('getParamAsString - boolean value', () => {
  assertEquals(getParamAsString({ ai_ignore: true }, 'ai_ignore'), 'true')
})

test('getParamAsString - missing key with default', () => {
  assertEquals(getParamAsString({}, 'missing', 'default'), 'default')
})

// =============================================================================
// Regex Tests
// =============================================================================

console.log('\n--- Regex Patterns ---\n')

test('CODE_BLOCK_HEADER_REGEX - basic', () => {
  const match = '```python {ai_ignore}'.match(CODE_BLOCK_HEADER_REGEX)
  assertEquals(match !== null, true)
  assertEquals(match![1], '```')
  assertEquals(match![2], 'python')
  assertEquals(match![3], 'ai_ignore')
})

test('CODE_BLOCK_HEADER_REGEX - no params', () => {
  const match = '```python'.match(CODE_BLOCK_HEADER_REGEX)
  assertEquals(match !== null, true)
  assertEquals(match![2], 'python')
  assertEquals(match![3], undefined)
})

test('CODE_BLOCK_HEADER_REGEX - tilde fence', () => {
  const match = '~~~python {ai_ignore}'.match(CODE_BLOCK_HEADER_REGEX)
  assertEquals(match !== null, true)
  assertEquals(match![1], '~~~')
})

test('isCodeBlockHeaderWithParams - with params', () => {
  assertEquals(isCodeBlockHeaderWithParams('```python {ai_ignore}'), true)
})

test('isCodeBlockHeaderWithParams - without params', () => {
  assertEquals(isCodeBlockHeaderWithParams('```python'), false)
})

test('isCodeBlockHeaderWithParams - empty params', () => {
  assertEquals(isCodeBlockHeaderWithParams('```python {}'), false)
})

// =============================================================================
// Round-trip Tests
// =============================================================================

console.log('\n--- Round-trip Tests ---\n')

test('parse -> serialize -> parse', () => {
  const original = 'ai_ignore, role="system", echo=false'
  const parsed = parseCodeBlockParams(original)
  const serialized = serializeCodeBlockParams(parsed)
  const reparsed = parseCodeBlockParams(serialized)
  assertEquals(reparsed, parsed)
})

test('full info string round-trip', () => {
  const original = 'python {ai_ignore, role="system"}'
  const parsed = extractCodeBlockInfo(original)
  const rebuilt = buildInfoString(parsed.language, parsed.params)
  assertEquals(rebuilt, original)
})

// =============================================================================
// Summary
// =============================================================================

console.log('\n========================================')
console.log(`Tests: ${passCount + failCount} | Passed: ${passCount} | Failed: ${failCount}`)
console.log('========================================\n')

if (failCount > 0) {
  process.exit(1)
}
