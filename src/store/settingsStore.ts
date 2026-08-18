import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { TokenMethod } from '../types/tokenTypes'
import { getDefaultModelId, getModelById } from '../services/tokenEstimator/models'

export interface CustomModel {
  id: string
  name: string
  provider: 'custom'
  method: 'custom'
  // Strategy
  calculationType: 'inherit' | 'char_ratio' | 'fixed_per_word'
  baseModelId?: string // For 'inherit'
  ratio?: number // Divisor for 'char_ratio' (chars/ratio), Multiplier for 'fixed_per_word'
  // Metadata
  pricing: { input: number; output: number }
  maxContext: number
}

export interface TokenSettings {
  method: TokenMethod
  selectedModel: string
  enableOnlineCalculation: boolean
  // Budget & Limits
  limitMode: 'model_max' | 'custom_token' | 'cost_budget'
  customTokenLimit: number
  costBudget: number
  // Visual Thresholds (0.0 - 1.0)
  colorThresholds: {
    safe: number // Unused in logic but kept for structure
    warning: number
    danger: number
  }
}

export type AppTheme = 'charcoal' | 'midnight' | 'dawn' | 'abyss' | 'olive'
export type AccentColor = 'emerald' | 'sapphire' | 'ruby' | 'amber' | 'garnet'

interface AppearanceSettings {
  appTheme: AppTheme
  accentColor: AccentColor
  accentOverridesHeadings: boolean
  applyEditorFontAppWide: boolean
}

interface SettingsState {
  tokenSettings: TokenSettings
  customModels: CustomModel[]
  appearance: AppearanceSettings

  setTokenMethod: (method: TokenMethod) => void
  setSelectedModel: (model: string) => void
  setEnableOnlineCalculation: (enabled: boolean) => void
  setTokenSettings: (settings: Partial<TokenSettings>) => void
  setAppTheme: (theme: AppTheme) => void
  setAccentColor: (accent: AccentColor) => void
  setAccentOverridesHeadings: (enabled: boolean) => void
  setApplyEditorFontAppWide: (enabled: boolean) => void

  // Custom Model Actions
  addCustomModel: (model: CustomModel) => void
  updateCustomModel: (id: string, updates: Partial<CustomModel>) => void
  deleteCustomModel: (id: string) => void
}

// Default token settings
const DEFAULT_TOKEN_SETTINGS: TokenSettings = {
  method: 'local',
  selectedModel: getDefaultModelId(), // 'gpt-4o'
  enableOnlineCalculation: false,
  limitMode: 'model_max',
  customTokenLimit: 4000,
  costBudget: 0.10, // $0.10
  colorThresholds: {
    safe: 0.7,    // < 75%
    warning: 0.75, // >= 75%
    danger: 0.9   // >= 90%
  }
}

const DEFAULT_APPEARANCE: AppearanceSettings = {
  appTheme: 'charcoal',
  accentColor: 'sapphire',
  accentOverridesHeadings: false,
  applyEditorFontAppWide: false,
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      tokenSettings: DEFAULT_TOKEN_SETTINGS,
      customModels: [],
      appearance: DEFAULT_APPEARANCE,

      setTokenMethod: (method) =>
        set((state) => ({ tokenSettings: { ...state.tokenSettings, method } })),

      setSelectedModel: (model) =>
        set((state) => ({ tokenSettings: { ...state.tokenSettings, selectedModel: model } })),

      setEnableOnlineCalculation: (enabled) =>
        set((state) => {
          if (!enabled) {
            const currentModel = getModelById(state.tokenSettings.selectedModel)
            if (currentModel?.method === 'online') {
              return {
                tokenSettings: {
                  ...state.tokenSettings,
                  enableOnlineCalculation: enabled,
                  selectedModel: getDefaultModelId()
                }
              }
            }
          }
          return { tokenSettings: { ...state.tokenSettings, enableOnlineCalculation: enabled } }
        }),

      setTokenSettings: (settings) =>
        set((state) => ({ tokenSettings: { ...state.tokenSettings, ...settings } })),

      setAppTheme: (appTheme) =>
        set((state) => ({ appearance: { ...state.appearance, appTheme } })),

      setAccentColor: (accentColor) =>
        set((state) => ({ appearance: { ...state.appearance, accentColor } })),

      setAccentOverridesHeadings: (accentOverridesHeadings) =>
        set((state) => ({ appearance: { ...state.appearance, accentOverridesHeadings } })),

      setApplyEditorFontAppWide: (applyEditorFontAppWide) =>
        set((state) => ({ appearance: { ...state.appearance, applyEditorFontAppWide } })),

      addCustomModel: (model) =>
        set((state) => ({ customModels: [...state.customModels, model] })),

      updateCustomModel: (id, updates) =>
        set((state) => ({
          customModels: state.customModels.map((m) => m.id === id ? { ...m, ...updates } : m)
        })),

      deleteCustomModel: (id) =>
        set((state) => ({
          customModels: state.customModels.filter((m) => m.id !== id),
          tokenSettings:
            state.tokenSettings.selectedModel === id
              ? { ...state.tokenSettings, selectedModel: getDefaultModelId() }
              : state.tokenSettings
        })),
    }),
    {
      name: 'contextpad-settings',
      version: 6,
      storage: createJSONStorage(() => localStorage),
      migrate: (persistedState: any, version: number) => {
        if (version < 2) { return persistedState }
        if (version < 3) { return { ...persistedState, customModels: [] } }
        if (version < 4) { return { ...persistedState, appearance: DEFAULT_APPEARANCE } }
        if (version < 5) { return { ...persistedState, appearance: { ...DEFAULT_APPEARANCE, ...persistedState.appearance, accentOverridesHeadings: false } } }
        if (version < 6) { return { ...persistedState, appearance: { ...DEFAULT_APPEARANCE, ...persistedState.appearance, applyEditorFontAppWide: false } } }
        return persistedState
      },
      partialize: (state) => ({
        tokenSettings: state.tokenSettings,
        customModels: state.customModels,
        appearance: state.appearance,
      })
    }
  )
)
