/**
 * Token Types - Shared type definitions
 *
 * NOTE: Model definitions have been moved to services/tokenEstimator/models.ts
 * Import model utilities from there:
 *
 * import { MODEL_REGISTRY, getModelById } from '../services/tokenEstimator'
 */

export type TokenMethod = 'local' | 'online'

export type ModelProvider = 'openai' | 'anthropic' | 'google'

export type EstimatorStatus = 'idle' | 'calculating' | 'ready' | 'error'

/**
 * Configuration for token calculation
 */
export interface TokenConfig {
  method: TokenMethod
  selectedModel: string
  enableOnlineCalculation: boolean
}

/**
 * Settings for token calculation stored in settings store
 */
export interface TokenSettings {
  method: TokenMethod
  selectedModel: string
  enableOnlineCalculation: boolean
  colorThresholds: {
    safe: number    // 0-1, ratio of tokens to max context
    warning: number // 0-1
    danger: number  // 0-1
  }
}

/**
 * Result from a token calculation (legacy - use TokenEstimatorState instead)
 * @deprecated Use TokenEstimatorState from services/tokenEstimator
 */
export interface TokenResult {
  tokens: number
  method: 'local' | 'online'
  model: string
  cached: boolean
  cost?: number
  timestamp?: number
}

/**
 * State of the token estimator (new event-based state)
 */
export interface TokenEstimatorState {
  status: EstimatorStatus
  tokens: number | null
  cost: number | null
  method: TokenMethod | null
  cached: boolean
  error: string | null
  model: string | null
  isApproximate: boolean  // True when using local fallback for large docs
}

/**
 * @deprecated SUPPORTED_MODELS has been moved to services/tokenEstimator/models.ts
 * Use MODEL_REGISTRY from that module instead.
 *
 * This export is kept temporarily for backward compatibility but will be removed.
 */
export const SUPPORTED_MODELS: Record<string, any> = {}
