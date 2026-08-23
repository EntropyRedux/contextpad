import { describe, it, expect } from 'vitest'
import { validateActionCode } from '../codeValidator'

describe('validateActionCode', () => {
  describe('Valid JavaScript Actions', () => {
    it('should allow basic variable declarations and string operations', () => {
      const code = `
        const text = helpers.getSelection();
        const upper = text.toUpperCase();
        helpers.replaceSelection(upper);
      `
      const result = validateActionCode(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow template literals with interpolation', () => {
      const code = `
        const sel = helpers.getSelection();
        const result = \`Prefix: \${sel} - Suffix\`;
        helpers.insertAtCursor(result);
      `
      const result = validateActionCode(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow safe object and array bracket access', () => {
      const code = `
        const obj = { name: 'ContextPad', version: '1.10.0' };
        const arr = ['first', 'second', 'third'];
        const val = obj['name'];
        const item = arr[0];
        helpers.replaceSelection(\`\${val}: \${item}\`);
      `
      const result = validateActionCode(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should allow clipboard helper calls', () => {
      const code = `
        const text = helpers.getAllText();
        helpers.copyToClipboard(text);
      `
      const result = validateActionCode(code)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should flag warning patterns without invalidating', () => {
      const code = `
        const lines = helpers.getLines();
        for (let i = 0; i < lines.length; i++) {
          console.log(lines[i]);
        }
      `
      const result = validateActionCode(code)
      expect(result.valid).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('Dangerous JavaScript Detection', () => {
    it('should block eval calls', () => {
      const code = 'eval("alert(1)")'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('eval'))).toBe(true)
    })

    it('should block Function constructor calls', () => {
      const code = 'const fn = Function("return 42");'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block DOM/window access', () => {
      const code = 'window.location.href = "https://example.com";'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block document access', () => {
      const code = 'document.cookie = "token=xyz";'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block storage access', () => {
      const code = 'localStorage.setItem("key", "val");'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block process and child_process access', () => {
      const code = 'process.exit(0);'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block prototype pollution attempts', () => {
      const code = 'obj.__proto__.isAdmin = true;'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should block dynamic access to global objects', () => {
      const code = 'const w = window["location"];'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
    })

    it('should catch syntax errors', () => {
      const code = 'const x = {;'
      const result = validateActionCode(code)
      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('Syntax error'))).toBe(true)
    })
  })
})
