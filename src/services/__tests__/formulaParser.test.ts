import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  executeFormula,
  validateFormula,
  setEditorContext,
  getFormulaFunctions,
  getFormulaFunctionsByCategory,
  type EditorContext
} from '../formulaParser'

describe('FormulaParser', () => {
  describe('Text Transformations', () => {
    it('should convert to UPPER', () => {
      const result = executeFormula('UPPER(selection)', 'hello world')
      expect(result.success).toBe(true)
      expect(result.value).toBe('HELLO WORLD')
    })

    it('should convert to LOWER', () => {
      const result = executeFormula('LOWER(selection)', 'HELLO WORLD')
      expect(result.success).toBe(true)
      expect(result.value).toBe('hello world')
    })

    it('should convert to TITLE case', () => {
      const result = executeFormula('TITLE(selection)', 'hello world')
      expect(result.success).toBe(true)
      expect(result.value).toBe('Hello World')
    })

    it('should convert to SENTENCE case', () => {
      const result = executeFormula('SENTENCE(selection)', 'HELLO WORLD')
      expect(result.success).toBe(true)
      expect(result.value).toBe('Hello world')
    })

    it('should REVERSE text', () => {
      const result = executeFormula('REVERSE(selection)', 'abcd')
      expect(result.success).toBe(true)
      expect(result.value).toBe('dcba')
    })

    it('should TRIM text', () => {
      const result = executeFormula('TRIM(selection)', '  padded text  ')
      expect(result.success).toBe(true)
      expect(result.value).toBe('padded text')
    })
  })

  describe('Case Conversions', () => {
    it('should convert to CAMEL case', () => {
      const result = executeFormula('CAMEL(selection)', 'hello world')
      expect(result.success).toBe(true)
      expect(result.value).toBe('helloWorld')
    })

    it('should convert to PASCAL case', () => {
      const result = executeFormula('PASCAL(selection)', 'hello world')
      expect(result.success).toBe(true)
      expect(result.value).toBe('HelloWorld')
    })

    it('should convert to SNAKE case', () => {
      const result = executeFormula('SNAKE(selection)', 'helloWorld')
      expect(result.success).toBe(true)
      expect(result.value).toBe('hello_world')
    })

    it('should convert to KEBAB case', () => {
      const result = executeFormula('KEBAB(selection)', 'helloWorld')
      expect(result.success).toBe(true)
      expect(result.value).toBe('hello-world')
    })

    it('should convert to CONSTANT case', () => {
      const result = executeFormula('CONSTANT(selection)', 'helloWorld')
      expect(result.success).toBe(true)
      expect(result.value).toBe('HELLO_WORLD')
    })
  })

  describe('Date, Time & UUID', () => {
    it('should generate TODAY()', () => {
      const result = executeFormula('TODAY()')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('should generate UUID()', () => {
      const result = executeFormula('UUID()')
      expect(result.success).toBe(true)
      expect(result.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
    })
  })

  describe('String Manipulation & Markdown', () => {
    it('should BOLD and ITALIC text', () => {
      expect(executeFormula('BOLD(selection)', 'important').value).toBe('**important**')
      expect(executeFormula('ITALIC(selection)', 'emphasis').value).toBe('*emphasis*')
      expect(executeFormula('CODE(selection)', 'const x = 1').value).toBe('`const x = 1`')
    })

    it('should WRAP and CONCAT text', () => {
      const wrapped = executeFormula('WRAP("[", selection, "]")', 'item')
      expect(wrapped.success).toBe(true)
      expect(wrapped.value).toBe('[item]')
    })

    it('should REPLACE text in selection', () => {
      const replaced = executeFormula('REPLACE(selection, "foo", "bar")', 'foo and foo')
      expect(replaced.success).toBe(true)
      expect(replaced.value).toBe('bar and bar')
    })
  })

  describe('List and Lines Operations', () => {
    it('should SORT lines alphabetically', () => {
      const result = executeFormula('SORT(selection)', 'zebra\napple\nbanana')
      expect(result.success).toBe(true)
      expect(result.value).toBe('apple\nbanana\nzebra')
    })

    it('should create NUMBERLIST', () => {
      const result = executeFormula('NUMBERLIST(selection)', 'first\nsecond')
      expect(result.success).toBe(true)
      expect(result.value).toBe('1. first\n2. second')
    })

    it('should create BULLETLIST and CHECKLIST', () => {
      expect(executeFormula('BULLETLIST(selection)', 'task').value).toBe('- task')
      expect(executeFormula('CHECKLIST(selection)', 'todo').value).toBe('- [ ] todo')
    })

    it('should create CSVTABLE from CSV', () => {
      const csv = 'Name,Age\nAlice,30\nBob,25'
      const result = executeFormula('CSVTABLE(selection)', csv)
      expect(result.success).toBe(true)
      expect(result.value).toContain('| Name | Age |')
      expect(result.value).toContain('| --- | --- |')
      expect(result.value).toContain('| Alice | 30 |')
    })
  })

  describe('Math Operations', () => {
    it('should calculate SUM and AVG', () => {
      expect(executeFormula('SUM(selection)', '10, 20, 30').value).toBe('60')
      expect(executeFormula('AVG(selection)', '10, 20, 30').value).toBe('20')
      expect(executeFormula('MAX(selection)', '5, 100, 2').value).toBe('100')
      expect(executeFormula('MIN(selection)', '5, 100, 2').value).toBe('2')
    })
  })

  describe('Editor Context Functions', () => {
    beforeEach(() => {
      const mockContext: EditorContext = {
        line: 5,
        column: 12,
        lineCount: 20,
        charCount: 350,
        wordCount: 55,
        getLine: (n: number) => `Line ${n} content`,
        getRange: (from: number, to: number) => `Lines ${from}-${to}`
      }
      setEditorContext(mockContext)
    })

    afterEach(() => {
      setEditorContext(null)
    })

    it('should return LINE(), COL(), LINECOUNT(), WORDCOUNT()', () => {
      expect(executeFormula('LINE()').value).toBe('5')
      expect(executeFormula('COL()').value).toBe('12')
      expect(executeFormula('LINECOUNT()').value).toBe('20')
      expect(executeFormula('WORDCOUNT()').value).toBe('55')
      expect(executeFormula('GETLINE(3)').value).toBe('Line 3 content')
    })
  })

  describe('Nested Formulas', () => {
    it('should evaluate nested formulas properly', () => {
      const result = executeFormula('UPPER(TRIM(selection))', '   nested formula   ')
      expect(result.success).toBe(true)
      expect(result.value).toBe('NESTED FORMULA')
    })
  })

  describe('Formula Validation', () => {
    it('should validate valid formulas', () => {
      const valid1 = validateFormula('UPPER(selection)')
      expect(valid1.valid).toBe(true)
      expect(valid1.functions).toContain('UPPER')

      const validNested = validateFormula('BOLD(TRIM(selection))')
      expect(validNested.valid).toBe(true)
      expect(validNested.functions).toEqual(['BOLD', 'TRIM'])
    })

    it('should reject unknown functions', () => {
      const invalid = validateFormula('NON_EXISTENT_FUNCTION(selection)')
      expect(invalid.valid).toBe(false)
      expect(invalid.error).toContain('Unknown function')
    })

    it('should reject empty formula', () => {
      const empty = validateFormula('')
      expect(empty.valid).toBe(false)
    })
  })

  describe('Function Information Catalog', () => {
    it('should provide complete formula info and grouped catalog', () => {
      const list = getFormulaFunctions()
      expect(list.length).toBeGreaterThan(30)

      const grouped = getFormulaFunctionsByCategory()
      expect(grouped['Text']).toBeDefined()
      expect(grouped['Markdown']).toBeDefined()
      expect(grouped['Math']).toBeDefined()
    })
  })
})
