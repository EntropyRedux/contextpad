/**
 * Code Block Parameters Parser - Test Cases (Vitest Format)
 */

import { describe, it, expect } from 'vitest'
import {
  parseCodeBlockParams,
  extractCodeBlockInfo,
  serializeCodeBlockParams,
  buildInfoString,
  getParamAsBoolean,
  getParamAsString,
  isCodeBlockHeaderWithParams,
  CODE_BLOCK_HEADER_REGEX,
} from '../codeBlockParams'

describe('parseCodeBlockParams', () => {
  it('should handle empty string', () => {
    expect(parseCodeBlockParams('')).toEqual({})
  })

  it('should handle whitespace only', () => {
    expect(parseCodeBlockParams('   ')).toEqual({})
  })

  it('should handle single boolean flag', () => {
    expect(parseCodeBlockParams('ai_ignore')).toEqual({ ai_ignore: true })
  })

  it('should handle multiple boolean flags', () => {
    expect(parseCodeBlockParams('ai_ignore, echo')).toEqual({ ai_ignore: true, echo: true })
  })

  it('should handle boolean flags without commas', () => {
    expect(parseCodeBlockParams('ai_ignore echo eval')).toEqual({ ai_ignore: true, echo: true, eval: true })
  })

  it('should handle key=value with double quotes', () => {
    expect(parseCodeBlockParams('role="system"')).toEqual({ role: 'system' })
  })

  it('should handle key=value with single quotes', () => {
    expect(parseCodeBlockParams("role='system'")).toEqual({ role: 'system' })
  })

  it('should handle key=value unquoted', () => {
    expect(parseCodeBlockParams('echo=false')).toEqual({ echo: 'false' })
  })

  it('should handle mixed boolean and string', () => {
    expect(
      parseCodeBlockParams('ai_ignore, role="system"')
    ).toEqual({ ai_ignore: true, role: 'system' })
  })

  it('should handle complex mixed params', () => {
    expect(
      parseCodeBlockParams('ai_ignore, role="system", echo=false, class="highlight"')
    ).toEqual({ ai_ignore: true, role: 'system', echo: 'false', class: 'highlight' })
  })

  it('should handle whitespace tolerance', () => {
    expect(
      parseCodeBlockParams('  ai_ignore ,  role = "system"  ')
    ).toEqual({ ai_ignore: true, role: 'system' })
  })

  it('should handle value with spaces in quotes', () => {
    expect(
      parseCodeBlockParams('caption="Hello World"')
    ).toEqual({ caption: 'Hello World' })
  })

  it('should handle escaped quotes in value', () => {
    expect(
      parseCodeBlockParams('note="He said \\"hello\\""')
    ).toEqual({ note: 'He said "hello"' })
  })

  it('should handle hyphenated key names', () => {
    expect(
      parseCodeBlockParams('my-custom-param="value"')
    ).toEqual({ 'my-custom-param': 'value' })
  })

  it('should handle underscore key names', () => {
    expect(
      parseCodeBlockParams('my_custom_param="value"')
    ).toEqual({ my_custom_param: 'value' })
  })

  it('should handle empty value with quotes', () => {
    expect(
      parseCodeBlockParams('note=""')
    ).toEqual({ note: '' })
  })

  it('should handle numeric-looking values stay as strings', () => {
    expect(
      parseCodeBlockParams('width="500", height=300')
    ).toEqual({ width: '500', height: '300' })
  })
})

describe('extractCodeBlockInfo', () => {
  it('should handle language only', () => {
    const result = extractCodeBlockInfo('python')
    expect(result.language).toBe('python')
    expect(result.params).toEqual({})
  })

  it('should handle language with params', () => {
    const result = extractCodeBlockInfo('python {ai_ignore}')
    expect(result.language).toBe('python')
    expect(result.params).toEqual({ ai_ignore: true })
  })

  it('should handle language with complex params', () => {
    const result = extractCodeBlockInfo('python {ai_ignore, role="system", echo=false}')
    expect(result.language).toBe('python')
    expect(result.params).toEqual({ ai_ignore: true, role: 'system', echo: 'false' })
  })

  it('should handle no language with params', () => {
    const result = extractCodeBlockInfo('{ai_ignore}')
    expect(result.language).toBe('')
    expect(result.params).toEqual({ ai_ignore: true })
  })

  it('should handle empty string', () => {
    const result = extractCodeBlockInfo('')
    expect(result.language).toBe('')
    expect(result.params).toEqual({})
  })

  it('should preserve raw params', () => {
    const result = extractCodeBlockInfo('python {ai_ignore, role="system"}')
    // The raw params might have different formatting, just check they exist and contain key parts
    expect(result.rawParams).toBeTruthy()
    expect(result.rawParams).toContain('ai_ignore')
    expect(result.rawParams).toContain('role')
  })
})

describe('serializeCodeBlockParams', () => {
  it('should handle empty params', () => {
    expect(serializeCodeBlockParams({})).toBe('')
  })

  it('should handle boolean true', () => {
    expect(serializeCodeBlockParams({ ai_ignore: true })).toBe('ai_ignore')
  })

  it('should handle boolean false', () => {
    expect(serializeCodeBlockParams({ echo: false })).toBe('echo=false')
  })

  it('should handle string value', () => {
    expect(serializeCodeBlockParams({ role: 'system' })).toBe('role="system"')
  })

  it('should handle mixed params', () => {
    const result = serializeCodeBlockParams({ ai_ignore: true, role: 'system' })
    expect(result).toBe('ai_ignore, role="system"')
  })

  it('should escape quotes in values', () => {
    const result = serializeCodeBlockParams({ note: 'He said "hello"' })
    expect(result).toBe('note="He said \\"hello\\""')
  })
})

describe('buildInfoString', () => {
  it('should handle language with no params', () => {
    expect(buildInfoString('python', {})).toBe('python')
  })

  it('should handle language with params', () => {
    expect(
      buildInfoString('python', { ai_ignore: true })
    ).toBe('python {ai_ignore}')
  })

  it('should handle language with complex params', () => {
    expect(
      buildInfoString('python', { ai_ignore: true, role: 'system' })
    ).toBe('python {ai_ignore, role="system"}')
  })
})

describe('getParamAsBoolean', () => {
  it('should handle true value', () => {
    expect(getParamAsBoolean({ ai_ignore: true }, 'ai_ignore')).toBe(true)
  })

  it('should handle string "true"', () => {
    expect(getParamAsBoolean({ echo: 'true' }, 'echo')).toBe(true)
  })

  it('should handle string "false"', () => {
    expect(getParamAsBoolean({ echo: 'false' }, 'echo')).toBe(false)
  })

  it('should handle missing key with default', () => {
    expect(getParamAsBoolean({}, 'missing', true)).toBe(true)
  })
})

describe('getParamAsString', () => {
  it('should handle string value', () => {
    expect(getParamAsString({ role: 'system' }, 'role')).toBe('system')
  })

  it('should handle boolean value', () => {
    expect(getParamAsString({ ai_ignore: true }, 'ai_ignore')).toBe('true')
  })

  it('should handle missing key with default', () => {
    expect(getParamAsString({}, 'missing', 'default')).toBe('default')
  })
})

describe('CODE_BLOCK_HEADER_REGEX', () => {
  it('should match basic pattern', () => {
    const match = '```python {ai_ignore}'.match(CODE_BLOCK_HEADER_REGEX)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('```')
    expect(match![2]).toBe('python')
    expect(match![3]).toBe('ai_ignore')
  })

  it('should match pattern without params', () => {
    const match = '```python'.match(CODE_BLOCK_HEADER_REGEX)
    expect(match).not.toBeNull()
    expect(match![2]).toBe('python')
    expect(match![3]).toBeUndefined()
  })

  it('should match tilde fence', () => {
    const match = '~~~python {ai_ignore}'.match(CODE_BLOCK_HEADER_REGEX)
    expect(match).not.toBeNull()
    expect(match![1]).toBe('~~~')
  })
})

describe('isCodeBlockHeaderWithParams', () => {
  it('should return true for params', () => {
    expect(isCodeBlockHeaderWithParams('```python {ai_ignore}')).toBe(true)
  })

  it('should return false without params', () => {
    expect(isCodeBlockHeaderWithParams('```python')).toBe(false)
  })

  it('should return false for empty params', () => {
    expect(isCodeBlockHeaderWithParams('```python {}')).toBe(false)
  })
})

describe('Round-trip Tests', () => {
  it('should handle parse -> serialize -> parse', () => {
    const original = 'ai_ignore, role="system", echo=false'
    const parsed = parseCodeBlockParams(original)
    const serialized = serializeCodeBlockParams(parsed)
    const reparsed = parseCodeBlockParams(serialized)
    expect(reparsed).toEqual(parsed)
  })

  it('should handle full info string round-trip', () => {
    const original = 'python {ai_ignore, role="system"}'
    const parsed = extractCodeBlockInfo(original)
    const rebuilt = buildInfoString(parsed.language, parsed.params)
    expect(rebuilt).toBe(original)
  })
})
