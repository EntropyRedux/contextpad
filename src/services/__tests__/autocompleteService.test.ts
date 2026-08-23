import { describe, it, expect } from 'vitest'
import { autocompleteService } from '../autocompleteService'

describe('AutocompleteService', () => {
  it('should create an extension with default config', () => {
    const config = {
      activateOnTyping: true,
      maxRenderedOptions: 10,
      minCharacters: 2,
      enableMarkdownSnippets: true,
      enableCodeBlockSnippets: false,
      useDocumentWords: true,
      useDictionary: false
    }

    const extension = autocompleteService.createExtension(config, 'performance')
    expect(extension).toBeDefined()
  })
})
