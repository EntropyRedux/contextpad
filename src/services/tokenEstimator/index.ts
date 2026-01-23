/**
 * Token Estimator - Public API
 *
 * Usage:
 *
 * ```typescript
 * import { tokenEstimator } from './services/tokenEstimator'
 *
 * // Subscribe to state changes (React component)
 * useEffect(() => {
 *   const unsubscribe = tokenEstimator.subscribe((state) => {
 *     setTokenState(state)
 *   })
 *   return unsubscribe
 * }, [])
 *
 * // Trigger calculation (debounced)
 * tokenEstimator.calculate(content, 'gpt-4o', 'performance')
 *
 * // Force immediate calculation (use sparingly)
 * tokenEstimator.calculateImmediate(content, 'claude-sonnet-4-5-20250929', 'thorough')
 * ```
 */

// Re-export the service instance
export { tokenEstimatorService as tokenEstimator } from './TokenEstimatorService'

// Re-export types
export type {
  TokenEstimatorState,
  TokenEstimatorListener,
  EstimatorStatus
} from './TokenEstimatorService'

// Re-export model utilities
export {
  MODEL_REGISTRY,
  getModelById,
  getDefaultModel,
  getDefaultModelId,
  isValidModelId,
  getModelsByProvider,
  getLocalModels,
  getOnlineModels,
  getAllModelIds,
  getModelsGroupedByProvider,
  calculateCost
} from './models'

export type {
  ModelDefinition,
  ModelProvider,
  EstimationMethod
} from './models'

// Re-export error types
export { EstimatorError } from './estimators/types'
export type { EstimatorErrorCode, EstimatorResult } from './estimators/types'

// Re-export cache for advanced usage
export { tokenCache } from './TokenCache'
