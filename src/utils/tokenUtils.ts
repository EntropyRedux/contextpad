import { TokenSettings, CustomModel } from '../store/settingsStore'
import { ModelDefinition, getDefaultModel, getModelById } from '../services/tokenEstimator'

/**
 * Resolves the active model definition, handling standard and custom models.
 */
export function resolveModel(
  modelId: string, 
  customModels: CustomModel[]
): ModelDefinition {
  const standard = getModelById(modelId)
  if (standard) return standard
  
  const custom = customModels.find(m => m.id === modelId)
  if (custom) return custom as unknown as ModelDefinition
  
  return getDefaultModel()
}

export interface UsageStats {
  percentage: number
  limit: number
  limitLabel: string
  color: string
  isOverLimit: boolean
}

/**
 * Calculates usage percentage and color status based on settings and current stats.
 */
export function calculateUsageStats(
  currentTokens: number,
  currentCost: number | undefined,
  settings: TokenSettings,
  model: ModelDefinition
): UsageStats {
  let percentage = 0
  let limit = 0
  let limitLabel = ''

  // Determine limit and percentage based on mode
  switch (settings.limitMode) {
    case 'custom_token':
      limit = settings.customTokenLimit
      limitLabel = `${limit.toLocaleString()} tokens`
      percentage = (currentTokens / limit) * 100
      break
      
    case 'cost_budget':
      limit = settings.costBudget
      limitLabel = `$${limit.toFixed(2)}`
      percentage = ((currentCost || 0) / limit) * 100
      break
      
    case 'model_max':
    default:
      limit = model.maxContext
      limitLabel = `${limit.toLocaleString()} tokens`
      percentage = (currentTokens / limit) * 100
      break
  }

  // Determine color
  let color = '#10b981' // Green (Safe)
  
  // Normalize percentage for threshold check (0.0 - 1.0)
  const ratio = percentage / 100
  
  if (ratio >= settings.colorThresholds.danger) {
    color = '#ef4444' // Red (Danger)
  } else if (ratio >= settings.colorThresholds.warning) {
    color = '#f59e0b' // Orange (Warning)
  }

  return {
    percentage,
    limit,
    limitLabel,
    color,
    isOverLimit: ratio >= 1.0
  }
}
