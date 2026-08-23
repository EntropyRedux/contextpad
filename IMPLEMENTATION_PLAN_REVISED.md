# ContextPad Implementation Plan - Revised

**Version**: 2.0  
**Date**: 2026-08-22  
**Project**: ContextPad v1.10.0  
**Status**: Ready for Implementation

---

## 📋 Executive Summary

This revised implementation plan addresses the actual issues in ContextPad without over-engineering. The plan focuses on critical bugs, missing functionality, and pragmatic testing approaches that provide real value.

### Key Corrections from Original Plan
- ❌ **Removed**: Cucumber/Gherkin BDD testing (over-engineering for desktop app)
- ❌ **Removed**: Custom null safety utilities (TypeScript 5.5+ handles this natively)
- ❌ **Removed**: Configurable debounce UI (unnecessary user-facing complexity)
- ✅ **Added**: Orphaned FileExplorer connection to Left Sidebar
- ✅ **Added**: Cross-platform path separator fixes
- ✅ **Added**: Action validator regex fixes for valid JavaScript
- ✅ **Added**: Preview server CORS port correction

### Revised Impact
- **Timeline**: 8 weeks → 4 weeks (more focused)
- **Complexity**: High → Low (pragmatic solutions)
- **Value**: Theoretical → Actual (addresses real user issues)
- **Testing**: BDD framework → Standard Vitest + React Testing Library

---

## 🚨 Phase 1: Critical Bug & Orphan Fixes (Week 1)

### Priority: CRITICAL - User-Facing Issues

### 1.1 Connect Orphaned File Explorer to Left Sidebar

**Problem**: `FileExplorer.tsx` and `VirtualizedFileTree.tsx` exist but are never rendered by `LeftSidebar.tsx`.

**Files**: 
- `src/components/LeftSidebar/LeftSidebar.tsx`
- `src/components/LeftSidebar/FileExplorer.tsx`

**Solution**:

**Update LeftSidebar.tsx**:
```typescript
import { useState } from 'react'
import { Outline } from './MarkdownOutline'
import { FileExplorer } from './FileExplorer'
import { useTabStore } from '../../store/tabStore'

export function LeftSidebar() {
  const [view, setView] = useState<'outline' | 'explorer'>('outline')
  const activeTab = useTabStore(state => state.tabs.find(t => t.id === state.activeTabId))
  const openFolderPath = useTabStore(state => state.openFolderPath)

  // Show explorer if folder is open, otherwise show outline
  const shouldShowExplorer = openFolderPath !== null
  const shouldShowOutline = !shouldShowExplorer || view === 'outline'

  return (
    <div className={styles.leftSidebar}>
      {/* View Toggle */}
      {(shouldShowExplorer && shouldShowOutline) && (
        <div className={styles.viewToggle}>
          <button 
            className={view === 'outline' ? styles.active : ''}
            onClick={() => setView('outline')}
          >
            Outline
          </button>
          <button 
            className={view === 'explorer' ? styles.active : ''}
            onClick={() => setView('explorer')}
          >
            Files
          </button>
        </div>
      )}

      {/* Content */}
      {shouldShowOutline && <Outline />}
      {shouldShowExplorer && <FileExplorer />}
    </div>
  )
}
```

**Remove language restriction** - the current code prevents non-markdown files from using the file explorer unnecessarily.

**Testing**: Verify file explorer appears when folder is opened, works with all file types.

### 1.2 Fix Cross-Platform Path Separators in Breadcrumbs

**Problem**: `Breadcrumb.tsx` has hardcoded backslash `\\` path issues that break on non-Windows platforms.

**File**: `src/components/Breadcrumb/Breadcrumb.tsx`

**Solution**:
```typescript
// Add path separator utility
const getPathSeparator = () => {
  return process.platform === 'win32' ? '\\' : '/'
}

const normalizePath = (path: string) => {
  const separator = getPathSeparator()
  // Convert all separators to the platform's preferred separator
  return path.replace(/[\\/]/g, separator)
}

// Update breadcrumb rendering
const renderBreadcrumb = (path: string) => {
  const normalizedPath = normalizePath(path)
  const separator = getPathSeparator()
  const parts = normalizedPath.split(separator).filter(Boolean)
  
  return parts.map((part, index) => (
    <React.Fragment key={index}>
      <span className={styles.breadcrumbItem}>{part}</span>
      {index < parts.length - 1 && (
        <span className={styles.separator}>{separator}</span>
      )}
    </React.Fragment>
  ))
}
```

**Testing**: Test on Windows, macOS, and Linux to ensure correct path display.

### 1.3 Fix Action Code Validator Regex

**Problem**: `codeValidator.ts` blocks valid JavaScript template literals (`text ${var}`) and bracket notation (`obj['key']`).

**File**: `src/utils/codeValidator.ts`

**Solution**:
```typescript
// Current over-restrictive patterns:
const DYNAMIC_ACCESS_PATTERNS = [
  /\[\s*["'].*["']\s*\]/,  // Blocks obj['key']
  /`.*`/,                  // Blocks template literals
]

// Updated permissive patterns:
const DYNAMIC_ACCESS_PATTERNS = [
  // Only block dangerous dynamic access
  /\[\s*[^"'0-9][^"'0-9\s]*\s*\]/,  // Allow obj['key'] and obj[variable], block obj[keyName]
  /\beval\s*\(/i,                    // Block eval
  /\bFunction\s*\(/i,                // Block Function constructor
]

// Allow template literals but check for dangerous content
const TEMPLATE_LITERAL_PATTERN = /`([^`]*)`/

function validateTemplateLiteral(template: string): boolean {
  const match = template.match(TEMPLATE_LITERAL_PATTERN)
  if (!match) return true
  
  const content = match[1]
  // Allow simple interpolations but block dangerous patterns
  const dangerousPatterns = [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /\bprocess\s*\./,
    /\brequire\s*\(/,
  ]
  
  return !dangerousPatterns.some(pattern => pattern.test(content))
}
```

**Testing**: Test with valid template literals and bracket notation to ensure they pass validation.

### 1.4 Remove Hardcoded Path Migrations

**Problem**: User-specific hardcoded paths in `tabStore.ts` lines 296-318.

**File**: `src/store/tabStore.ts`

**Solution**:
```typescript
// Remove lines 295-318 entirely:
// const currentDir = 'Repo/Active/ContextPad';
// const oldDir = 'Repo/ContextPad';
// const tabs = (parsed.tabs || []).map((tab: any) => {
//   if (tab.filePath && tab.filePath.includes(oldDir) && !tab.filePath.includes(currentDir)) {
//     return { ...tab, filePath: tab.filePath.replace(oldDir, currentDir) };
//   }
//   if (tab.folderPath && tab.folderPath.includes(oldDir) && !tab.folderPath.includes(currentDir)) {
//     return { ...tab, folderPath: tab.folderPath.replace(oldDir, currentDir) };
//   }
//   return tab;
// });

// Replace with simple:
const tabs = (parsed.tabs || [])
```

**Testing**: Verify app works for new users without path migration.

### 1.5 Memory & Listener Cleanup

**Problem**: Memory leaks in action executor and formula buttons (from original analysis).

**File**: `src/utils/actionExecutor.ts`

**Solution**:
```typescript
// Add cleanup function
const cleanupIframe = () => {
  try {
    if (iframe && iframe.parentNode) {
      document.body.removeChild(iframe)
    }
  } catch (e) {
    console.warn('Failed to cleanup iframe:', e)
  }
}

// Replace timeout handler (lines 58-62)
const timeout = setTimeout(() => {
  window.removeEventListener('message', messageHandler)
  cleanupIframe()
  resolve({ success: false, error: 'Action execution timed out' })
}, 5000)

// Replace cleanup in message handler (lines 71-73)
clearTimeout(timeout)
window.removeEventListener('message', messageHandler)
cleanupIframe()
```

**File**: `src/extensions/inlineFormulas.ts`

**Solution**:
```typescript
class FormulaButtonWidget extends WidgetType {
  private clickHandler: ((e: Event) => void) | null = null

  destroy() {
    if (this.clickHandler) {
      this.clickHandler = null
    }
  }

  toDOM(view: EditorView): HTMLElement {
    const button = document.createElement('button')
    button.className = 'cm-formula-run-btn'
    button.textContent = '▶'
    button.title = 'Execute formula (Ctrl+Enter)'

    this.clickHandler = (e: Event) => {
      e.preventDefault()
      e.stopPropagation()
      executeFormulaAtPosition(view, this.from, this.to, this.formula)
    }
    
    button.addEventListener('click', this.clickHandler)
    return button
  }
}
```

**Testing**: Verify no memory leaks with repeated action/formula executions.

---

## 🔧 Phase 2: Types & Code Cleanliness (Week 2)

### Priority: HIGH - Maintainability

### 2.1 Type Safety: Add Missing Declarations

**Problem**: Using `as any` for react-window and marked extensions due to missing type definitions.

**Solution**:

**Create `src/types/react-window.d.ts`**:
```typescript
import { FixedSizeList as List } from 'react-window'

declare module 'react-window' {
  export interface FixedSizeListProps {
    // Add any missing props as needed
  }
}

export const FixedSizeList = List
```

**Create `src/types/marked.d.ts`**:
```typescript
import { TokenizerExtension, RendererExtension } from 'marked'

interface ActionButtonExtension extends TokenizerExtension, RendererExtension {
  name: 'actionButton'
  level: 'inline'
  start: (src: string) => number | void
  tokenizer: (src: string) => { id: string } | void
  renderer: (token: { id: string }) => string
}

declare module 'marked' {
  extension: (ext: ActionButtonExtension) => void
}
```

**Update imports**:
- `src/components/LeftSidebar/VirtualizedOutline.tsx`: Use proper FixedSizeList import
- `src/components/LeftSidebar/VirtualizedFileTree.tsx`: Use proper FixedSizeList import
- `src/utils/markdownRenderer.ts`: Use proper marked extension types

### 2.2 Reduce `as any` Usage

**Files**: Multiple files with `as any` usage

**Solution**: Replace remaining `as any` with proper types:
- `src/extensions/slashCommands.ts`: Add proper completion interface
- `src/store/tabStore.ts`: Add proper metadata interface
- `src/components/Sidebar/WorkflowManager.tsx`: Add proper icon type

**Example for slashCommands.ts**:
```typescript
interface ContextPadCompletion extends Completion {
  contextPadType?: 'action-command' | 'action-button' | 'template'
  contextPadIcon?: string
  typeLabel?: 'CMD' | 'BTN' | 'TMPL'
  type?: 'function' | 'template'
}

// Replace (opt as any).typeLabel with:
const customType = (opt as ContextPadCompletion).typeLabel
```

### 2.3 Move Test File to Proper Location

**Problem**: Test file in production source directory.

**Solution**:
```bash
mkdir -p src/utils/__tests__
mv src/utils/codeBlockParams.test.ts src/utils/__tests__/codeBlockParams.test.ts
```

**Update to use Vitest**:
```typescript
import { describe, it, expect } from 'vitest'
import { parseCodeBlockParams } from '../codeBlockParams'

describe('CodeBlockParams', () => {
  it('should parse basic parameters', () => {
    const result = parseCodeBlockParams('lang="python" readonly')
    expect(result).toEqual({
      lang: 'python',
      readonly: true
    })
  })
})
```

**Add to package.json**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui"
  },
  "devDependencies": {
    "vitest": "^1.0.0"
  }
}
```

---

## 🧪 Phase 3: Testing with Vitest (Week 3)

### Priority: MEDIUM - Quality Assurance

### 3.1 Set Up Vitest Unit Test Suite

**Install dependencies**:
```bash
npm install --save-dev vitest @vitest/ui
```

**Create vitest.config.ts**:
```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts']
  }
})
```

### 3.2 Critical Unit Tests

**Create test files for core functionality**:

**`src/utils/__tests__/formulaParser.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest'
import { executeFormula, validateFormula } from '../formulaParser'

describe('FormulaParser', () => {
  describe('validateFormula', () => {
    it('should validate simple formula', () => {
      const result = validateFormula('UPPER("hello")')
      expect(result.valid).to.be.true
    })

    it('should reject invalid formula', () => {
      const result = validateFormula('INVALID("hello")')
      expect(result.valid).to.be.false
      expect(result.error).to.exist
    })

    it('should handle nested formulas', () => {
      const result = validateFormula('UPPER(TRIM("  hello  "))')
      expect(result.valid).to.be.true
    })
  })

  describe('executeFormula', () => {
    it('should execute text transformation', () => {
      const result = executeFormula('UPPER("hello")')
      expect(result.success).to.be.true
      expect(result.value).to.equal('HELLO')
    })

    it('should handle nested formulas', () => {
      const result = executeFormula('UPPER(TRIM("  hello  "))')
      expect(result.success).to.be.true
      expect(result.value).to.equal('HELLO')
    })

    it('should handle position-based functions', () => {
      const result = executeFormula('LINE()')
      expect(result.success).to.be.true
      expect(result.value).to.be.a('string')
    })
  })
})
```

**`src/utils/__tests__/templateVariables.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest'
import { extractTemplateVariables, processTemplateVariables } from '../templateVariables'

describe('TemplateVariables', () => {
  describe('extractTemplateVariables', () => {
    it('should extract simple variables', () => {
      const result = extractTemplateVariables('Hello {{name}}, welcome to {{place}}')
      expect(result).to.include('name')
      expect(result).to.include('place')
    })

    it('should handle nested braces', () => {
      const result = extractTemplateVariables('{{outer {{inner}}}}')
      expect(result).to.include('outer {{inner')
    })

    it('should handle empty result', () => {
      const result = extractTemplateVariables('No variables here')
      expect(result).to.have.lengthOf(0)
    })
  })

  describe('processTemplateVariables', () => {
    it('should replace variables with selection', () => {
      const result = processTemplateVariables('Hello {{selection}}', 'World')
      expect(result.content).to.equal('Hello World')
    })

    it('should handle missing variables', () => {
      const result = processTemplateVariables('Hello {{name}}', '')
      expect(result.content).to.equal('Hello ')
    })

    it('should handle cursor positioning', () => {
      const result = processTemplateVariables('Hello {{selection}}|', 'World')
      expect(result.cursorOffset).to.equal(12) // After "Hello World"
    })
  })
})
```

**`src/utils/__tests__/codeBlockParams.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest'
import { parseCodeBlockParams, extractCodeBlockInfo } from '../codeBlockParams'

describe('CodeBlockParams', () => {
  describe('parseCodeBlockParams', () => {
    it('should parse basic parameters', () => {
      const result = parseCodeBlockParams('lang="python" readonly')
      expect(result).toEqual({
        lang: 'python',
        readonly: true
      })
    })

    it('should handle boolean values', () => {
      const result = parseCodeBlockParams('enabled=true disabled=false')
      expect(result.enabled).to.be.true
      expect(result.disabled).to.be.false
    })

    it('should handle numeric values', () => {
      const result = parseCodeBlockParams('timeout=5000')
      expect(result.timeout).to.equal(5000)
    })
  })

  describe('extractCodeBlockInfo', () => {
    it('should extract language and parameters', () => {
      const result = extractCodeBlockInfo('```python {lang="python" readonly}')
      expect(result.language).to.equal('python')
      expect(result.parameters.readonly).to.be.true
    })

    it('should handle missing parameters', () => {
      const result = extractCodeBlockInfo('```javascript')
      expect(result.language).to.equal('javascript')
      expect(result.parameters).to.deep.equal({})
    })
  })
})
```

**`src/services/__tests__/tokenEstimator.test.ts`**:
```typescript
import { describe, it, expect } from 'vitest'
import { TokenEstimatorService } from '../tokenEstimator/TokenEstimatorService'

describe('TokenEstimatorService', () => {
  it('should estimate tokens for simple text', async () => {
    const service = new TokenEstimatorService()
    const result = await service.estimateTokens('Hello world', 'gpt-4')
    expect(result.tokenCount).to.be.greaterThan(0)
  })

  it('should handle empty text', async () => {
    const service = new TokenEstimatorService()
    const result = await service.estimateTokens('', 'gpt-4')
    expect(result.tokenCount).to.equal(0)
  })

  it('should calculate cost correctly', async () => {
    const service = new TokenEstimatorService()
    const result = await service.estimateTokens('Hello world', 'gpt-4')
    expect(result.cost).to.be.greaterThan(0)
  })
})
```

### 3.3 Component Testing with React Testing Library

**Install dependencies**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

**Example component test**:
```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateManager } from '../../components/Sidebar/TemplateManager'

describe('TemplateManager', () => {
  it('should render template list', () => {
    render(<TemplateManager />)
    expect(screen.getByText('Templates')).to.exist
  })

  it('should add new template', async () => {
    const user = userEvent.setup()
    render(<TemplateManager />)
    
    await user.click(screen.getByText('Add Template'))
    expect(screen.getByPlaceholderText('Template name')).to.exist
  })
})
```

---

## 🏗️ Phase 4: Architecture Polish (Week 4)

### Priority: MEDIUM - Long-term Maintainability

### 4.1 Harmonize Preview Server CORS Port

**Problem**: `preview_server.rs` allows `localhost:1420` instead of `localhost:5173`.

**File**: `src-tauri/src/preview_server.rs`

**Solution**:
```rust
// Current (line 46):
.allow_origin("http://localhost:1420".parse::<axum::http::HeaderValue>().unwrap())

// Fixed:
.allow_origin("http://localhost:5173".parse::<axum::http::HeaderValue>().unwrap())
```

**Alternative**: Make it configurable via environment variable:
```rust
let preview_origin = std::env::var("PREVIEW_ORIGIN")
    .unwrap_or_else(|_| "http://localhost:5173".to_string());

let cors = CorsLayer::new()
    .allow_origin(preview_origin.parse::<axum::http::HeaderValue>().unwrap())
    .allow_methods(tower_http::cors::Any);
```

### 4.2 Implement Basic Logging System

**Problem**: 100+ console.log statements in production code.

**Solution**: Simple logger without over-engineering:

**Create `src/utils/logger.ts`**:
```typescript
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel = LogLevel.INFO

  constructor() {
    if (import.meta.env.DEV) {
      this.level = LogLevel.DEBUG
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.level
  }

  debug(...args: any[]) {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug('[ContextPad]', ...args)
    }
  }

  error(...args: any[]) {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error('[ContextPad]', ...args)
    }
  }
}

export const logger = new Logger()
```

**Replace critical console.error calls** (not all 100+, just the important ones):
- IndexedDBStorage errors
- Action execution errors
- File operation errors

### 4.3 Simplified Debounce Utility

**Problem**: Multiple debounce implementations across codebase.

**Solution**: Simple shared utility without UI configuration:

**Create `src/utils/debounce.ts`**:
```typescript
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function(this: any, ...args: Parameters<T>) {
    const context = this
    clearTimeout(timeout)
    timeout = setTimeout(() => func.apply(context, args), wait)
  }
}

// Pre-configured for common use cases
export const debounceEditor = (fn: any) => debounce(fn, 150)
export const debouncePreview = (fn: any) => debounce(fn, 150)
export const debounceMetadata = (fn: any) => debounce(fn, 500)
```

**Update usage in existing files**:
- `src/hooks/useEditorExtensions.ts`
- `src/hooks/usePreviewSync.ts`
- `src/components/LeftSidebar/MarkdownOutline.tsx`

### 4.4 Basic Error Handling

**Problem**: Generic error handling without user-friendly messages.

**Solution**: Simple error handler without over-engineering:

**Create `src/utils/errorHandler.ts`**:
```typescript
export function handleFileError(error: unknown, operation: string): string {
  console.error(`[${operation}]`, error)
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase()
    
    if (message.includes('enoent') || message.includes('file not found')) {
      return `File not found. It may have been moved or deleted.`
    }
    
    if (message.includes('permission') || message.includes('eacces')) {
      return `Permission denied. You don't have access to this file.`
    }
    
    return error.message
  }
  
  return `An error occurred during ${operation.toLowerCase()}.`
}
```

**Update file operations to use this handler**:
```typescript
try {
  const content = await invoke('read_file', { path })
  // ... success logic
} catch (error) {
  const userMessage = handleFileError(error, 'Open File')
  addNotification({
    type: 'error',
    title: 'File Error',
    message: userMessage
  })
}
```

---

## 📅 Revised Timeline

### Week 1: Critical Bug Fixes
- **Days 1-2**: Connect File Explorer, fix path separators
- **Days 3-4**: Fix action validator, remove hardcoded paths
- **Day 5**: Memory cleanup and testing

### Week 2: Types & Code Cleanliness
- **Days 1-2**: Add missing type definitions
- **Days 3-4**: Reduce `as any` usage, move test file
- **Day 5**: TypeScript validation

### Week 3: Testing with Vitest
- **Days 1-2**: Set up Vitest, write core unit tests
- **Days 3-4**: Component testing with React Testing Library
- **Day 5**: Integration with CI/CD

### Week 4: Architecture Polish
- **Days 1-2**: Fix preview server CORS, implement logging
- **Days 3-4**: Simplified debounce utility, error handling
- **Day 5**: Final testing and documentation

---

## 📊 Success Metrics

### Critical Metrics
- **File Explorer**: Orphaned → Connected and functional
- **Path Handling**: Windows-only → Cross-platform compatible
- **Action Validator**: Over-restrictive → Allows valid JavaScript
- **Memory Leaks**: 3 known leaks → 0

### Quality Metrics
- **Type Safety**: 14 `as any` usages → <5 (only where truly necessary)
- **Test Coverage**: ~5% → 60%+ for critical paths
- **Console Logs**: 100+ debug logs → <20 (errors only)

### Performance Metrics
- **Autocomplete**: Current → Optimized single-pass algorithm
- **Debounce**: 5 implementations → 1 shared utility
- **Preview Server**: Wrong port → Correct port (5173)

---

## 🛠️ Resource Requirements

### Development Resources
- **Developer Time**: 4 weeks (1 developer)
- **Testing**: Basic local testing, no complex CI/CD needed

### Tools & Dependencies
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "@testing-library/user-event": "^14.0.0",
    "typescript": "^5.5.0"
  }
}
```

---

## 🎯 Risk Assessment

### Low Risk
- **Type Safety Changes**: TypeScript will catch issues at compile time
- **Test Addition**: Vitest is well-established and stable
- **Bug Fixes**: Targeted changes with clear testing

### Medium Risk
- **File Explorer Connection**: May affect existing sidebar behavior
- **Action Validator Relaxation**: Could allow more code (but still safe)
- **Preview Server Port**: May break existing preview functionality

### Mitigation
- Test each change individually
- Keep changes reversible
- Monitor for user feedback

---

## 📝 Implementation Checklist

### Phase 1: Critical Bug Fixes
- [ ] Connect File Explorer to Left Sidebar
- [ ] Fix cross-platform path separators in Breadcrumb
- [ ] Fix action code validator regex
- [ ] Remove hardcoded path migrations
- [ ] Implement memory & listener cleanup
- [ ] Test all fixes on multiple platforms

### Phase 2: Types & Code Cleanliness
- [ ] Add react-window type definitions
- [ ] Add marked extension type definitions
- [ ] Reduce `as any` usage in critical files
- [ ] Move test file to proper location
- [ ] Run TypeScript compiler validation

### Phase 3: Testing with Vitest
- [ ] Set up Vitest configuration
- [ ] Write formula parser tests
- [ ] Write template variable tests
- [ ] Write code block params tests
- [ ] Write token estimator tests
- [ ] Add basic component tests
- [ ] Configure test scripts

### Phase 4: Architecture Polish
- [ ] Fix preview server CORS port
- [ ] Implement basic logging system
- [ ] Create simplified debounce utility
- [ ] Add basic error handling
- [ ] Update debounced functions to use shared utility
- [ ] Final integration testing

---

## 🚀 Next Steps

1. **Immediate**: Start with Phase 1 critical bug fixes
2. **Testing**: Set up Vitest early in Week 2
3. **Validation**: Test each phase before moving to next
4. **Documentation**: Update README with new testing approach
5. **Monitoring**: Watch for user feedback on changes

---

## 📞 Key Differences from Original Plan

| Aspect | Original Plan | Revised Plan |
|--------|--------------|--------------|
| **Timeline** | 8 weeks | 4 weeks |
| **Testing** | Cucumber/Gherkin BDD | Vitest + React Testing Library |
| **Null Safety** | Custom utility module | Native TypeScript 5.5+ features |
| **Debounce** | User-configurable UI | Shared utility with constants |
| **Scope** | Broad optimization | Focused on actual issues |
| **Complexity** | High over-engineering | Pragmatic solutions |
| **Value** | Theoretical improvements | Addresses real user problems |

---

**Document Status**: Ready for Implementation  
**Last Updated**: 2026-08-22  
**Based On**: User feedback addressing over-engineering and missing critical issues
