import { useState, useEffect } from 'react'
import { useSettingsStore, CustomModel } from '../../store/settingsStore'
import { getAllModelIds } from '../../services/tokenEstimator/models'
import styles from './CustomModelModal.module.css'

interface CustomModelModalProps {
  isOpen: boolean
  onClose: () => void
  modelToEdit?: CustomModel | null
}

export function CustomModelModal({ isOpen, onClose, modelToEdit }: CustomModelModalProps) {
  const [name, setName] = useState('')
  const [calculationType, setCalculationType] = useState<'inherit' | 'char_ratio' | 'fixed_per_word'>('char_ratio')
  const [baseModelId, setBaseModelId] = useState('gpt-4o')
  const [ratio, setRatio] = useState(4)
  const [inputPrice, setInputPrice] = useState(0)
  const [outputPrice, setOutputPrice] = useState(0)
  const [maxContext, setMaxContext] = useState(128000)

  const { addCustomModel, updateCustomModel } = useSettingsStore()
  const standardModels = getAllModelIds()

  useEffect(() => {
    if (modelToEdit) {
      setName(modelToEdit.name)
      setCalculationType(modelToEdit.calculationType)
      setBaseModelId(modelToEdit.baseModelId || 'gpt-4o')
      setRatio(modelToEdit.ratio || 4)
      setInputPrice(modelToEdit.pricing.input)
      setOutputPrice(modelToEdit.pricing.output)
      setMaxContext(modelToEdit.maxContext)
    } else {
      // Defaults
      setName('')
      setCalculationType('char_ratio')
      setBaseModelId('gpt-4o')
      setRatio(4)
      setInputPrice(0)
      setOutputPrice(0)
      setMaxContext(128000)
    }
  }, [modelToEdit, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    if (!name.trim()) return

    const modelData: CustomModel = {
      id: modelToEdit ? modelToEdit.id : `custom-${Date.now()}`,
      name,
      provider: 'custom',
      method: 'custom',
      calculationType,
      pricing: { input: inputPrice, output: outputPrice },
      maxContext,
      baseModelId: calculationType === 'inherit' ? baseModelId : undefined,
      ratio: calculationType !== 'inherit' ? ratio : undefined
    }

    if (modelToEdit) {
      updateCustomModel(modelToEdit.id, modelData)
    } else {
      addCustomModel(modelData)
    }
    onClose()
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <span className={styles.title}>{modelToEdit ? 'Edit Custom Model' : 'New Custom Model'}</span>
          <button className={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div className={styles.content}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Model Name</label>
            <input 
              className={styles.input} 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. Llama 3 70B"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Calculation Strategy</label>
            <select 
              className={styles.select}
              value={calculationType}
              onChange={(e: any) => setCalculationType(e.target.value)}
            >
              <option value="char_ratio">Character Ratio (Fastest)</option>
              <option value="inherit">Inherit (Use Tiktoken)</option>
              <option value="fixed_per_word">Fixed per Word</option>
            </select>
          </div>

          {calculationType === 'inherit' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Base Model (Tiktoken)</label>
              <select 
                className={styles.select}
                value={baseModelId}
                onChange={e => setBaseModelId(e.target.value)}
              >
                {standardModels.map(id => (
                  <option key={id} value={id}>{id}</option>
                ))}
              </select>
              <p className={styles.helpText}>Uses the tokenizer of the selected OpenAI model.</p>
            </div>
          )}

          {calculationType === 'char_ratio' && (
            <div className={styles.formGroup}>
              <label className={styles.label}>Ratio (Characters per Token)</label>
              <input 
                type="number" 
                className={styles.input} 
                value={ratio} 
                onChange={e => setRatio(Number(e.target.value))}
                min="0.1"
                step="0.1"
              />
              <p className={styles.helpText}>Standard is ~4 characters per token.</p>
            </div>
          )}

          {calculationType === 'fixed_per_word' && (
             <div className={styles.formGroup}>
              <label className={styles.label}>Multiplier (Tokens per Word)</label>
              <input 
                type="number" 
                className={styles.input} 
                value={ratio} 
                onChange={e => setRatio(Number(e.target.value))}
                min="0.1"
                step="0.1"
              />
              <p className={styles.helpText}>Standard is ~0.75 words per token (or 1.33 tokens/word).</p>
            </div>
          )}

          <div className={styles.row}>
            <div className={styles.formGroup}>
               <div className={styles.col}>
                <label className={styles.label}>Input Price ($/1M)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={inputPrice} 
                  onChange={e => setInputPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className={styles.formGroup}>
              <div className={styles.col}>
                <label className={styles.label}>Output Price ($/1M)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={outputPrice} 
                  onChange={e => setOutputPrice(Number(e.target.value))}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Context Window (Tokens)</label>
             <input 
                type="number" 
                className={styles.input} 
                value={maxContext} 
                onChange={e => setMaxContext(Number(e.target.value))}
                min="1000"
              />
          </div>
        </div>

        <div className={styles.footer}>
          <button className={`${styles.btn} ${styles.cancelBtn}`} onClick={onClose}>Cancel</button>
          <button className={`${styles.btn} ${styles.saveBtn}`} onClick={handleSave} disabled={!name}>Save Model</button>
        </div>
      </div>
    </div>
  )
}
