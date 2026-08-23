import { describe, it, expect } from 'vitest'
import { extractTemplateVariables, processTemplateVariables } from '../templateVariables'

describe('TemplateVariables', () => {
  describe('extractTemplateVariables', () => {
    it('should extract variables enclosed in double curly braces', () => {
      const template = 'Hello {{SELECTION}}, today is {{DATE}} and time is {{TIME}}'
      const vars = extractTemplateVariables(template)
      expect(vars).toEqual(['SELECTION', 'DATE', 'TIME'])
    })

    it('should deduplicate variables', () => {
      const template = '{{SELECTION}} and {{SELECTION}}'
      const vars = extractTemplateVariables(template)
      expect(vars).toEqual(['SELECTION'])
    })

    it('should return empty array when no variables exist', () => {
      const template = 'Plain markdown text without placeholders'
      const vars = extractTemplateVariables(template)
      expect(vars).toEqual([])
    })

    it('should trim variable names', () => {
      const template = '{{  MY_VAR  }}'
      const vars = extractTemplateVariables(template)
      expect(vars).toEqual(['MY_VAR'])
    })
  })

  describe('processTemplateVariables', () => {
    it('should replace {{SELECTION}} with selectedText', () => {
      const template = '```json\n{{SELECTION}}\n```'
      const result = processTemplateVariables(template, '{"key": "value"}')
      expect(result.content).toBe('```json\n{"key": "value"}\n```')
      expect(result.cursorOffset).toBeNull()
    })

    it('should replace {{DATE}} with current YYYY-MM-DD date', () => {
      const template = 'Date: {{DATE}}'
      const result = processTemplateVariables(template)
      const expectedDate = new Date().toISOString().split('T')[0]
      expect(result.content).toBe(`Date: ${expectedDate}`)
    })

    it('should replace {{DATETIME}} with full timestamp', () => {
      const template = 'Generated at: {{DATETIME}}'
      const result = processTemplateVariables(template)
      const expectedDate = new Date().toISOString().split('T')[0]
      expect(result.content).toContain(`Generated at: ${expectedDate}`)
    })

    it('should calculate cursor offset from {{CURSOR}} and strip the placeholder', () => {
      const template = 'Prefix: {{CURSOR}} Suffix'
      const result = processTemplateVariables(template)
      expect(result.content).toBe('Prefix:  Suffix')
      expect(result.cursorOffset).toBe('Prefix: '.length)
    })

    it('should combine multiple replacements correctly', () => {
      const template = '# Note on {{DATE}}\n\nAuthor: {{SELECTION}}\n\nBody:\n{{CURSOR}}'
      const result = processTemplateVariables(template, 'entropy_redux')
      const expectedDate = new Date().toISOString().split('T')[0]
      
      expect(result.content).toContain(`# Note on ${expectedDate}`)
      expect(result.content).toContain('Author: entropy_redux')
      expect(result.content).not.toContain('{{CURSOR}}')
      expect(result.cursorOffset).toBeGreaterThan(0)
    })
  })
})
