import { useState } from 'react'
import { useTabStore } from '../../store/tabStore'
import { THEMES } from '../../themes/themeRegistry'
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react'
import { TokenSettings } from './TokenSettings'
import styles from './SettingsPanel.module.css'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className={styles.collapsibleSection}>
      <button
        className={styles.sectionHeader}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
      </button>
      {isOpen && <div className={styles.sectionContent}>{children}</div>}
    </div>
  )
}

export function SettingsPanel() {
  const { viewSettings, setViewSettings } = useTabStore()
  const [newWord, setNewWord] = useState('')

  const FONT_FAMILIES = [
    'Consolas', 'Monaco', 'Fira Code', 'JetBrains Mono',
    'Source Code Pro', 'Roboto Mono', 'IBM Plex Mono',
    'Space Mono', 'Ubuntu Mono', 'Courier New',
  ]

  const updateAutocomplete = (updates: any) => {
    setViewSettings({ autocompleteConfig: { ...viewSettings.autocompleteConfig, ...updates } })
  }

  const updateSpellCheck = (updates: any) => {
    setViewSettings({ spellCheckConfig: { ...viewSettings.spellCheckConfig, ...updates } })
  }

  const updateCodeLint = (updates: any) => {
    setViewSettings({ codeLintConfig: { ...viewSettings.codeLintConfig, ...updates } })
  }

  const addWord = () => {
    if (newWord.trim()) {
      const word = newWord.trim().toLowerCase()
      if (!viewSettings.spellCheckConfig.customDictionary.includes(word)) {
        updateSpellCheck({
          customDictionary: [...viewSettings.spellCheckConfig.customDictionary, word]
        })
      }
      setNewWord('')
    }
  }

  const removeWord = (word: string) => {
    updateSpellCheck({
      customDictionary: viewSettings.spellCheckConfig.customDictionary.filter(w => w !== word)
    })
  }

  return (
    <div className={styles.panel}>
      {/* Appearance Section */}
      <CollapsibleSection title="Appearance">
        <div className={styles.controlRow}>
          <label className={styles.label}>Theme</label>
          <select
            className={styles.select}
            value={viewSettings.theme}
            onChange={(e) => setViewSettings({ theme: e.target.value })}
          >
            {THEMES.map((theme) => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.controlRow}>
          <label className={styles.label}>Font</label>
          <select
            className={styles.select}
            value={viewSettings.fontFamily}
            onChange={(e) => setViewSettings({ fontFamily: e.target.value })}
          >
            {FONT_FAMILIES.map((font) => (
              <option key={font} value={font}>{font}</option>
            ))}
          </select>
        </div>

        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.wordWrap}
              onChange={(e) => setViewSettings({ wordWrap: e.target.checked })}
            />
            <span>Word Wrap</span>
          </label>
        </div>
      </CollapsibleSection>

      {/* Editor Features Section */}
      <CollapsibleSection title="Editor Features">
        <div className={styles.controlRow}>
          <label className={styles.label}>Indexing Scope</label>
          <select
            className={styles.select}
            value={viewSettings.indexingScope}
            onChange={(e) => setViewSettings({ indexingScope: e.target.value as any })}
          >
            <option value="performance">Fast (50k chars)</option>
            <option value="thorough">Full Document</option>
          </select>
        </div>

        <div className={styles.toggleGrid}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableBracketMatching}
              onChange={(e) => setViewSettings({ enableBracketMatching: e.target.checked })}
            />
            <span>Bracket Matching</span>
          </label>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableFoldGutter}
              onChange={(e) => setViewSettings({ enableFoldGutter: e.target.checked })}
            />
            <span>Code Folding</span>
          </label>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableAutoIndent}
              onChange={(e) => setViewSettings({ enableAutoIndent: e.target.checked })}
            />
            <span>Auto Indent</span>
          </label>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableMarkdownRendering}
              onChange={(e) => setViewSettings({ enableMarkdownRendering: e.target.checked })}
            />
            <span>Markdown Rendering</span>
          </label>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.showTokenStats}
              onChange={(e) => setViewSettings({ showTokenStats: e.target.checked })}
            />
            <span>Token Stats</span>
          </label>
        </div>
      </CollapsibleSection>

      {/* Autocomplete Section */}
      <CollapsibleSection title="Autocomplete" defaultOpen={viewSettings.enableAutocomplete}>
        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableAutocomplete}
              onChange={(e) => setViewSettings({ enableAutocomplete: e.target.checked })}
            />
            <span>Enable Autocomplete</span>
          </label>
        </div>

        {viewSettings.enableAutocomplete && (
          <div className={styles.subOptions}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.autocompleteConfig.enableMarkdownSnippets}
                onChange={(e) => updateAutocomplete({ enableMarkdownSnippets: e.target.checked })}
              />
              <span>Markdown Snippets</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.autocompleteConfig.enableCodeBlockSnippets}
                onChange={(e) => updateAutocomplete({ enableCodeBlockSnippets: e.target.checked })}
              />
              <span>Code Block Snippets</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.autocompleteConfig.useDocumentWords}
                onChange={(e) => updateAutocomplete({ useDocumentWords: e.target.checked })}
              />
              <span>Document Words</span>
            </label>
          </div>
        )}
      </CollapsibleSection>

      {/* Spell Checker Section */}
      <CollapsibleSection title="Spell Checker" defaultOpen={viewSettings.enableSpellCheck}>
        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableSpellCheck}
              onChange={(e) => setViewSettings({ enableSpellCheck: e.target.checked })}
            />
            <span>Enable Spell Checker</span>
          </label>
        </div>

        {viewSettings.enableSpellCheck && (
          <div className={styles.subOptions}>
            {/* Spellcheck Mode Toggle */}
            <div className={styles.modeSelector}>
              <label className={styles.smallLabel}>Mode</label>
              <div className={styles.buttonGroup}>
                <button
                  className={`${styles.modeBtn} ${viewSettings.spellCheckMode === 'built-in' ? styles.active : ''}`}
                  onClick={() => setViewSettings({ spellCheckMode: 'built-in' })}
                  title="Custom spell checker with dictionary and suggestions"
                >
                  Built-in
                </button>
                <button
                  className={`${styles.modeBtn} ${viewSettings.spellCheckMode === 'browser' ? styles.active : ''}`}
                  onClick={() => setViewSettings({ spellCheckMode: 'browser' })}
                  title="Uses your OS dictionary - faster, no custom dictionary"
                >
                  Browser (Fast)
                </button>
              </div>
              <p className={styles.modeHint}>
                {viewSettings.spellCheckMode === 'browser'
                  ? 'Uses OS dictionary. Right-click misspelled words for suggestions.'
                  : 'Custom dictionary with lazy suggestions. Click underlined words for options.'}
              </p>
            </div>

            {/* Only show built-in options when built-in mode is selected */}
            {viewSettings.spellCheckMode === 'built-in' && (
              <>
                <div className={styles.toggleGrid}>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={viewSettings.spellCheckConfig.ignoreUppercase}
                      onChange={(e) => updateSpellCheck({ ignoreUppercase: e.target.checked })}
                    />
                    <span>Ignore UPPERCASE</span>
                  </label>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={viewSettings.spellCheckConfig.ignoreNumbers}
                      onChange={(e) => updateSpellCheck({ ignoreNumbers: e.target.checked })}
                    />
                    <span>Ignore Numbers</span>
                  </label>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={viewSettings.spellCheckConfig.ignoreTitleCase}
                      onChange={(e) => updateSpellCheck({ ignoreTitleCase: e.target.checked })}
                    />
                    <span>Ignore TitleCase</span>
                  </label>
                  <label className={styles.toggleLabel}>
                    <input
                      type="checkbox"
                      checked={viewSettings.spellCheckConfig.ignoreSnakeCase}
                      onChange={(e) => updateSpellCheck({ ignoreSnakeCase: e.target.checked })}
                    />
                    <span>Ignore snake_case</span>
                  </label>
                </div>

                <div className={styles.dictionarySection}>
                  <label className={styles.smallLabel}>Custom Dictionary</label>
                  <div className={styles.addWordRow}>
                    <input
                      type="text"
                      className={styles.miniInput}
                      value={newWord}
                      onChange={(e) => setNewWord(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addWord()}
                      placeholder="Add word..."
                    />
                    <button className={styles.miniBtn} onClick={addWord}><Plus size={14}/></button>
                  </div>
                  {viewSettings.spellCheckConfig.customDictionary.length > 0 && (
                    <div className={styles.wordList}>
                      {viewSettings.spellCheckConfig.customDictionary.map(word => (
                        <div key={word} className={styles.wordTag}>
                          {word} <X size={10} onClick={() => removeWord(word)} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </CollapsibleSection>

      {/* Code Linting Section */}
      <CollapsibleSection title="Code Linting" defaultOpen={viewSettings.enableCodeLinting}>
        <div className={styles.toggleRow}>
          <label className={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={viewSettings.enableCodeLinting}
              onChange={(e) => setViewSettings({ enableCodeLinting: e.target.checked })}
            />
            <span>Enable Code Linting</span>
          </label>
        </div>

        {viewSettings.enableCodeLinting && (
          <div className={styles.subOptions}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.codeLintConfig.enableJsonLint}
                onChange={(e) => updateCodeLint({ enableJsonLint: e.target.checked })}
              />
              <span>JSON Validation</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.codeLintConfig.enableYamlLint}
                onChange={(e) => updateCodeLint({ enableYamlLint: e.target.checked })}
              />
              <span>YAML Validation</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={viewSettings.codeLintConfig.enableJavaScriptLint}
                onChange={(e) => updateCodeLint({ enableJavaScriptLint: e.target.checked })}
              />
              <span>JS Syntax</span>
            </label>
          </div>
        )}
      </CollapsibleSection>

      {/* Token Calculation Section */}
      <CollapsibleSection title="Token Calculation" defaultOpen={false}>
        <TokenSettings />
      </CollapsibleSection>

      {/* Large File Optimization Section */}
      <CollapsibleSection title="Large Files" defaultOpen={false}>
        <div className={styles.controlRow}>
          <label className={styles.label}>Parser Mode</label>
          <select
            className={styles.select}
            value={viewSettings.parserMode || 'auto'}
            onChange={(e) => setViewSettings({ parserMode: e.target.value as any })}
          >
            <option value="auto">Auto (Smart)</option>
            <option value="ast">Force Highlighting</option>
            <option value="plain">Force Plain Text</option>
          </select>
        </div>

        <div className={styles.controlRow}>
          <label className={styles.label}>Threshold (lines)</label>
          <input
            type="number"
            className={styles.numberInput}
            value={viewSettings.largeFileThreshold}
            onChange={(e) => setViewSettings({ largeFileThreshold: parseInt(e.target.value) || 5000 })}
          />
        </div>
      </CollapsibleSection>
    </div>
  )
}
