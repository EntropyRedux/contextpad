/**
 * Token Estimator Service - Main orchestrator for token calculations
 *
 * Features:
 * - Event-based state management (subscribe pattern)
 * - Debounced calculations with maxWait
 * - Request deduplication
 * - Cache integration
 * - Large document handling with local fallback
 * - Proper error propagation
 */

import { MODEL_REGISTRY, getModelById, calculateCost, getDefaultModelId } from './models'
import type { ModelDefinition } from './models'
import { tokenCache } from './TokenCache'
import { localEstimator } from './estimators/LocalEstimator'
import { anthropicEstimator } from './estimators/AnthropicEstimator'
import { googleEstimator } from './estimators/GoogleEstimator'
import { customEstimator } from './estimators/CustomEstimator'
import { EstimatorError } from './estimators/types'
import type { IEstimator, EstimatorResult } from './estimators/types'
import { useSettingsStore } from '../../store/settingsStore'

// ============================================
// Debounce Utility
// ============================================

interface DebouncedFunction<T extends (...args: any[]) => any> {
  (...args: Parameters<T>): void
  cancel: () => void
}

/**
 * Creates a debounced function with maxWait support
 */
function createDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  maxWait: number
): DebouncedFunction<T> {
  let timeout: ReturnType<typeof setTimeout> | null = null
  let maxTimeout: ReturnType<typeof setTimeout> | null = null
  let lastArgs: Parameters<T> | null = null

  const clearTimeouts = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
    if (maxTimeout) {
      clearTimeout(maxTimeout)
      maxTimeout = null
    }
  }

  const invoke = () => {
    // Clear timeouts first
    clearTimeouts()

    // Then invoke with saved args
    if (lastArgs) {
      const args = lastArgs
      lastArgs = null
      func(...args)
    }
  }

  const cancel = () => {
    clearTimeouts()
    lastArgs = null
  }

  const debounced = (...args: Parameters<T>) => {
    lastArgs = args

    // Clear existing wait timeout (but keep maxWait running)
    if (timeout) {
      clearTimeout(timeout)
    }

    // Set new wait timeout
    timeout = setTimeout(invoke, wait)

    // Set maxWait timeout if not already set
    if (!maxTimeout) {
      maxTimeout = setTimeout(invoke, maxWait)
    }
  }

  debounced.cancel = cancel

  return debounced
}

// ============================================
// Types
// ============================================

export type EstimatorStatus = 'idle' | 'calculating' | 'ready' | 'error'

export interface TokenEstimatorState {
  status: EstimatorStatus
  tokens: number | null
  cost: number | null
  method: 'local' | 'online' | null
  cached: boolean
  error: string | null
  model: string | null
  isApproximate: boolean
}

export type TokenEstimatorListener = (state: TokenEstimatorState) => void

// ============================================
// Service Class
// ============================================

export class TokenEstimatorService {
  private state: TokenEstimatorState
  private listeners = new Set<TokenEstimatorListener>()
  private currentRequestId = 0
  private abortController: AbortController | null = null
  private debouncedCalculate: DebouncedFunction<(content: string, modelId: string, indexingScope: 'performance' | 'thorough') => void>

  // Estimator instances
  private estimators: IEstimator[] = [
    localEstimator,
    anthropicEstimator,
    googleEstimator,
    customEstimator
  ]

  constructor() {
    this.state = {
      status: 'idle',
      tokens: null,
      cost: null,
      method: null,
      cached: false,
      error: null,
      model: null,
      isApproximate: false
    }

    // Create debounced function
    this.debouncedCalculate = createDebounce(
      this.calculateInternal.bind(this),
      1000, // Wait 1s after last call
      5000  // Force calculation after 5s of continuous typing
    )
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Subscribe to state changes
   * @returns Unsubscribe function
   */
  subscribe(listener: TokenEstimatorListener): () => void {
    this.listeners.add(listener)
    // Immediately call with current state
    listener(this.state)
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current state (for non-reactive access)
   */
  getState(): TokenEstimatorState {
    return { ...this.state }
  }

  /**
   * Calculate tokens for the given content
   * This is debounced - rapid calls will be batched
   */
  calculate(
    content: string,
    modelId: string,
    indexingScope: 'performance' | 'thorough' = 'performance'
  ): void {
    // Emit calculating state immediately
    this.emit({ status: 'calculating', error: null })

    // Call debounced internal calculation
    this.debouncedCalculate(content, modelId, indexingScope)
  }

  /**
   * Force immediate calculation (bypasses debounce)
   * Use sparingly - mainly for model changes
   */
  calculateImmediate(
    content: string,
    modelId: string,
    indexingScope: 'performance' | 'thorough' = 'performance'
  ): void {
    // Cancel any pending debounced calls
    this.debouncedCalculate.cancel()

    // Emit calculating state
    this.emit({ status: 'calculating', error: null })

    // Run calculation immediately
    this.calculateInternal(content, modelId, indexingScope)
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    tokenCache.clear()
  }

  /**
   * Reset state to idle
   */
  reset(): void {
    this.debouncedCalculate.cancel()
    this.abortCurrentRequest()
    this.emit({
      status: 'idle',
      tokens: null,
      cost: null,
      method: null,
      cached: false,
      error: null,
      model: null,
      isApproximate: false
    })
  }

  // ============================================
  // Private Methods
  // ============================================

  /**
   * Internal calculation logic
   */
  private async calculateInternal(
    content: string,
    modelId: string,
    indexingScope: 'performance' | 'thorough'
  ): Promise<void> {
    // Increment request ID to track the latest request
    const requestId = ++this.currentRequestId

    // Abort any in-flight request
    this.abortCurrentRequest()
    this.abortController = new AbortController()

    try {
      // Validate model
      let model = getModelById(modelId)
      
      // If not in standard registry, check custom models
      if (!model) {
        const customModels = useSettingsStore.getState().customModels
        const custom = customModels.find(m => m.id === modelId)
        if (custom) {
          model = custom as unknown as ModelDefinition
        }
      }

      if (!model) {
        console.warn(`Invalid model ID: ${modelId}, falling back to default`)
        model = getModelById(getDefaultModelId())!
      }

      // Check cache first
      const cached = tokenCache.get(content, model.id)
      if (cached) {
        // Verify this is still the latest request
        if (requestId !== this.currentRequestId) return

        this.emit({
          status: 'ready',
          tokens: cached.tokens,
          cost: cached.cost,
          method: cached.method,
          cached: true,
          error: null,
          model: model.id,
          isApproximate: false
        })
        return
      }

      // Determine character limit based on indexing scope
      const charLimit = indexingScope === 'performance' ? 50000 : Infinity

      // Handle large documents
      if (content.length > charLimit && model.method === 'online') {
        // Use local approximation for large documents when online is required
        const result = await this.calculateWithLocalFallback(content, model, charLimit)

        // Verify this is still the latest request
        if (requestId !== this.currentRequestId) return

        this.emit(result)
        return
      }

      // Find appropriate estimator
      const estimator = this.estimators.find(e => e.canHandle(model!))
      if (!estimator) {
        throw new EstimatorError(
          'UNKNOWN_ERROR',
          `No estimator available for model: ${model.id}`
        )
      }

      // Perform calculation
      const result = await estimator.estimate(content, model)

      // Verify this is still the latest request
      if (requestId !== this.currentRequestId) return

      // Calculate cost
      const cost = calculateCost(result.tokens, model)

      // Cache the result
      tokenCache.set(content, model.id, {
        tokens: result.tokens,
        method: result.method,
        model: result.model,
        cost
      })

      // Emit success
      this.emit({
        status: 'ready',
        tokens: result.tokens,
        cost,
        method: result.method,
        cached: false,
        error: null,
        model: model.id,
        isApproximate: false
      })
    } catch (error) {
      // Verify this is still the latest request
      if (requestId !== this.currentRequestId) return

      // Handle errors
      const errorMessage = error instanceof EstimatorError
        ? error.getUserMessage()
        : 'Calculation failed'

      console.error('Token estimation error:', error)

      this.emit({
        status: 'error',
        tokens: null,
        cost: null,
        method: null,
        cached: false,
        error: errorMessage,
        model: modelId,
        isApproximate: false
      })
    }
  }

  /**
   * Calculate using local estimation for large documents
   * Extrapolates from a sample when content exceeds the limit
   */
  private async calculateWithLocalFallback(
    content: string,
    model: ModelDefinition,
    charLimit: number
  ): Promise<Partial<TokenEstimatorState>> {
    // Take a sample of the content
    const sample = content.slice(0, charLimit)

    // Use local estimator with the model's preferred encoding or default
    const sampleTokens = await localEstimator.estimatePartial(sample, 'o200k_base')

    // Extrapolate to full document
    const ratio = content.length / charLimit
    const estimatedTokens = Math.round(sampleTokens * ratio)

    // Calculate cost based on estimated tokens
    const cost = calculateCost(estimatedTokens, model)

    // Cache the approximation
    tokenCache.set(content, model.id, {
      tokens: estimatedTokens,
      method: 'local',
      model: model.id,
      cost
    })

    return {
      status: 'ready',
      tokens: estimatedTokens,
      cost,
      method: 'local',
      cached: false,
      error: null,
      model: model.id,
      isApproximate: true
    }
  }

  /**
   * Get all available models (Standard + Custom)
   */
  getAllModels(): ModelDefinition[] {
    const standard = Object.values(MODEL_REGISTRY)
    const custom = useSettingsStore.getState().customModels as unknown as ModelDefinition[]
    return [...standard, ...custom]
  }

  /**
   * Abort the current in-flight request
   */
  private abortCurrentRequest(): void {
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Emit state change to all listeners
   */
  private emit(partialState: Partial<TokenEstimatorState>): void {
    this.state = { ...this.state, ...partialState }
    this.listeners.forEach(listener => listener(this.state))
  }
}

// ============================================
// Singleton Instance
// ============================================

export const tokenEstimatorService = new TokenEstimatorService()
