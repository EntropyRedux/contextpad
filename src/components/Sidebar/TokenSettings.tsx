import React, { useState, useEffect } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { Eye, EyeOff, Save, Trash2, AlertCircle, Plus, Edit, ChevronDown, ChevronRight } from 'lucide-react'
import { useSettingsStore, CustomModel } from '../../store/settingsStore'
import {
  MODEL_REGISTRY,
  getModelById,
  getModelsByProvider,
  ModelDefinition
} from '../../services/tokenEstimator'
import { CustomModelModal } from '../Modals/CustomModelModal'
import styles from './TokenSettings.module.css'

interface SubSectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function SubSection({ title, defaultOpen = false, children }: SubSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  return (
    <div className={styles.subSection}>
      <button className={styles.subSectionHeader} onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{title}</span>
      </button>
      {isOpen && <div className={styles.subSectionContent}>{children}</div>}
    </div>
  )
}

export const TokenSettings: React.FC = () => {
  const {
    tokenSettings,
    setSelectedModel,
    setEnableOnlineCalculation,
    customModels,
    deleteCustomModel
  } = useSettingsStore()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modelToEdit, setModelToEdit] = useState<CustomModel | null>(null)

  const [apiKeys, setApiKeys] = useState({
    anthropic: '',
    google: ''
  })

  const [showKeys, setShowKeys] = useState({
    anthropic: false,
    google: false
  })

  const [hasStoredKeys, setHasStoredKeys] = useState({
    anthropic: false,
    google: false
  })

  const [saveStatus, setSaveStatus] = useState<string | null>(null)

  useEffect(() => {
    checkStoredKeys()
  }, [])

  const checkStoredKeys = async () => {
    try {
      const anthropicExists = await invoke<boolean>('has_api_key', { provider: 'anthropic' })
      const googleExists = await invoke<boolean>('has_api_key', { provider: 'google' })
      setHasStoredKeys({ anthropic: anthropicExists, google: googleExists })
    } catch (error) {
      console.error('Failed to check API keys:', error)
    }
  }

  const handleSaveApiKey = async (provider: 'anthropic' | 'google') => {
    const key = apiKeys[provider]
    if (!key.trim()) {
      setSaveStatus(`${provider} key is empty`)
      return
    }
    try {
      await invoke('store_api_key', { provider, key })
      setSaveStatus(`${provider} key saved`)
      setApiKeys(prev => ({ ...prev, [provider]: '' }))
      await checkStoredKeys()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      setSaveStatus(`Failed: ${error}`)
    }
  }

  const handleDeleteApiKey = async (provider: 'anthropic' | 'google') => {
    try {
      await invoke('delete_api_key', { provider })
      setSaveStatus(`${provider} key deleted`)
      await checkStoredKeys()
      setTimeout(() => setSaveStatus(null), 3000)
    } catch (error) {
      setSaveStatus(`Failed: ${error}`)
    }
  }

  const gptModels = getModelsByProvider('openai')
  const claudeModels = getModelsByProvider('anthropic')
  const geminiModels = getModelsByProvider('google')

  const isModelDisabled = (modelId: string) => {
    const model = getModelById(modelId)
    return model?.method === 'online' && !tokenSettings.enableOnlineCalculation
  }

  const getActiveModel = (id: string): ModelDefinition | null => {
    const standard = getModelById(id)
    if (standard) return standard
    const custom = customModels.find(m => m.id === id)
    return custom ? (custom as unknown as ModelDefinition) : null
  }

  const currentModel = getActiveModel(tokenSettings.selectedModel)

  const handleEditCustom = (model: CustomModel) => {
    setModelToEdit(model)
    setIsModalOpen(true)
  }

  const handleDeleteCustom = (id: string) => {
    if (confirm('Delete this model?')) {
      deleteCustomModel(id)
    }
  }

  const openNewModelModal = () => {
    setModelToEdit(null)
    setIsModalOpen(true)
  }

  return (
    <div className={styles.tokenSettings}>
      {/* Online Toggle */}
      <label className={styles.toggleLabel}>
        <input
          type="checkbox"
          checked={tokenSettings.enableOnlineCalculation}
          onChange={(e) => setEnableOnlineCalculation(e.target.checked)}
        />
        <span>Online Calculation</span>
      </label>
      <p className={styles.hint}>Required for Claude and Gemini models</p>

      {/* Model Selection */}
      <div className={styles.controlRow}>
        <label className={styles.label}>Model</label>
        <select
          value={tokenSettings.selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className={styles.select}
        >
          <optgroup label="OpenAI (Local)">
            {gptModels.map((model) => (
              <option key={model.id} value={model.id}>{model.name}</option>
            ))}
          </optgroup>
          <optgroup label="Anthropic (Online)">
            {claudeModels.map((model) => (
              <option key={model.id} value={model.id} disabled={isModelDisabled(model.id)}>
                {model.name}
              </option>
            ))}
          </optgroup>
          <optgroup label="Google (Online)">
            {geminiModels.map((model) => (
              <option key={model.id} value={model.id} disabled={isModelDisabled(model.id)}>
                {model.name}
              </option>
            ))}
          </optgroup>
          {customModels.length > 0 && (
            <optgroup label="Custom">
              {customModels.map((model) => (
                <option key={model.id} value={model.id}>{model.name}</option>
              ))}
            </optgroup>
          )}
        </select>
      </div>

      {/* Model Info - Compact */}
      {currentModel && (
        <div className={styles.modelInfo}>
          <span>{currentModel.maxContext.toLocaleString()} tokens</span>
          <span className={styles.separator}>|</span>
          <span>${currentModel.pricing.input}/1M</span>
          <span className={styles.separator}>|</span>
          <span>{currentModel.method === 'online' ? 'Online' : 'Local'}</span>
        </div>
      )}

      {/* Custom Models */}
      <SubSection title="Custom Models">
        {customModels.length > 0 ? (
          <div className={styles.customModelList}>
            {customModels.map(model => (
              <div key={model.id} className={styles.customModelItem}>
                <span>{model.name}</span>
                <div className={styles.modelActions}>
                  <button onClick={() => handleEditCustom(model)} title="Edit"><Edit size={12} /></button>
                  <button onClick={() => handleDeleteCustom(model.id)} title="Delete"><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={styles.hint}>No custom models</p>
        )}
        <button className={styles.addBtn} onClick={openNewModelModal}>
          <Plus size={12} /> Add Model
        </button>
      </SubSection>

      {/* Budget & Limits */}
      <SubSection title="Budget & Limits">
        <div className={styles.controlRow}>
          <label className={styles.label}>Limit Mode</label>
          <select
            className={styles.select}
            value={tokenSettings.limitMode}
            onChange={(e) => useSettingsStore.getState().setTokenSettings({
              limitMode: e.target.value as any
            })}
          >
            <option value="model_max">Model Max</option>
            <option value="custom_token">Custom Tokens</option>
            <option value="cost_budget">Cost Budget</option>
          </select>
        </div>

        {tokenSettings.limitMode === 'custom_token' && (
          <div className={styles.controlRow}>
            <label className={styles.label}>Max Tokens</label>
            <input
              type="number"
              className={styles.input}
              value={tokenSettings.customTokenLimit}
              onChange={(e) => useSettingsStore.getState().setTokenSettings({
                customTokenLimit: Math.max(1, parseInt(e.target.value) || 0)
              })}
            />
          </div>
        )}

        {tokenSettings.limitMode === 'cost_budget' && (
          <div className={styles.controlRow}>
            <label className={styles.label}>Budget ($)</label>
            <input
              type="number"
              className={styles.input}
              value={tokenSettings.costBudget}
              step="0.01"
              onChange={(e) => useSettingsStore.getState().setTokenSettings({
                costBudget: Math.max(0, parseFloat(e.target.value) || 0)
              })}
            />
          </div>
        )}

        <div className={styles.thresholdRow}>
          <div className={styles.thresholdItem}>
            <label>Warning %</label>
            <input
              type="number"
              value={Math.round(tokenSettings.colorThresholds.warning * 100)}
              onChange={(e) => useSettingsStore.getState().setTokenSettings({
                colorThresholds: {
                  ...tokenSettings.colorThresholds,
                  warning: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) / 100
                }
              })}
            />
          </div>
          <div className={styles.thresholdItem}>
            <label>Danger %</label>
            <input
              type="number"
              value={Math.round(tokenSettings.colorThresholds.danger * 100)}
              onChange={(e) => useSettingsStore.getState().setTokenSettings({
                colorThresholds: {
                  ...tokenSettings.colorThresholds,
                  danger: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) / 100
                }
              })}
            />
          </div>
        </div>
      </SubSection>

      {/* API Keys */}
      {tokenSettings.enableOnlineCalculation && (
        <SubSection title="API Keys" defaultOpen={true}>
          <p className={styles.hint}>Stored in system keychain</p>

          {/* Anthropic */}
          <div className={styles.apiKeyRow}>
            <label>Anthropic</label>
            <div className={styles.keyInputGroup}>
              <input
                type={showKeys.anthropic ? 'text' : 'password'}
                value={apiKeys.anthropic}
                onChange={(e) => setApiKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                placeholder={hasStoredKeys.anthropic ? '••••••••' : 'sk-ant-...'}
              />
              <button onClick={() => setShowKeys(prev => ({ ...prev, anthropic: !prev.anthropic }))}>
                {showKeys.anthropic ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={() => handleSaveApiKey('anthropic')} disabled={!apiKeys.anthropic.trim()}>
                <Save size={14} />
              </button>
              {hasStoredKeys.anthropic && (
                <button onClick={() => handleDeleteApiKey('anthropic')}><Trash2 size={14} /></button>
              )}
            </div>
            {hasStoredKeys.anthropic && <span className={styles.keyStatus}>Saved</span>}
          </div>

          {/* Google */}
          <div className={styles.apiKeyRow}>
            <label>Google</label>
            <div className={styles.keyInputGroup}>
              <input
                type={showKeys.google ? 'text' : 'password'}
                value={apiKeys.google}
                onChange={(e) => setApiKeys(prev => ({ ...prev, google: e.target.value }))}
                placeholder={hasStoredKeys.google ? '••••••••' : 'AIza...'}
              />
              <button onClick={() => setShowKeys(prev => ({ ...prev, google: !prev.google }))}>
                {showKeys.google ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={() => handleSaveApiKey('google')} disabled={!apiKeys.google.trim()}>
                <Save size={14} />
              </button>
              {hasStoredKeys.google && (
                <button onClick={() => handleDeleteApiKey('google')}><Trash2 size={14} /></button>
              )}
            </div>
            {hasStoredKeys.google && <span className={styles.keyStatus}>Saved</span>}
          </div>

          {saveStatus && (
            <div className={styles.statusMessage}>
              <AlertCircle size={12} />
              <span>{saveStatus}</span>
            </div>
          )}
        </SubSection>
      )}

      <CustomModelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        modelToEdit={modelToEdit}
      />
    </div>
  )
}
