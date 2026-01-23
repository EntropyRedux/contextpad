/**
 * Model Registry - Single source of truth for all supported LLM models
 *
 * IMPORTANT: Model IDs must match the exact strings expected by the APIs
 * - OpenAI: https://platform.openai.com/docs/models/
 * - Anthropic: https://docs.anthropic.com/en/docs/models-overview
 * - Google: https://ai.google.dev/gemini-api/docs/models
 */

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'custom'
export type EstimationMethod = 'local' | 'online' | 'custom'
export type TiktokenEncoding = 'o200k_base' | 'cl100k_base'

export interface ModelDefinition {
  id: string
  name: string
  provider: ModelProvider
  method: EstimationMethod
  encoding?: TiktokenEncoding  // Only for local models
  // Custom Strategy Fields
  calculationType?: 'inherit' | 'char_ratio' | 'fixed_per_word'
  baseModelId?: string
  ratio?: number
  pricing: {
    input: number   // $ per 1M tokens
    output: number  // $ per 1M tokens
  }
  maxContext: number
}

/**
 * Verified model IDs as of January 2026
 * Sources:
 * - OpenAI: https://platform.openai.com/docs/models/
 * - Anthropic: https://www.anthropic.com/news/claude-opus-4-5
 * - Google: https://ai.google.dev/gemini-api/docs/models
 */
export const MODEL_REGISTRY: Record<string, ModelDefinition> = {
  // ============================================
  // OpenAI Models - Local estimation (tiktoken)
  // ============================================
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    method: 'local',
    encoding: 'o200k_base',
    pricing: { input: 2.50, output: 10.00 },
    maxContext: 128000
  },
  'gpt-5.2': {
    id: 'gpt-5.2',
    name: 'GPT-5.2',
    provider: 'openai',
    method: 'local',
    encoding: 'o200k_base',
    pricing: { input: 5.00, output: 15.00 },
    maxContext: 256000
  },

  // ============================================
  // Anthropic Models - Online estimation (API)
  // ============================================
  'claude-sonnet-4-5-20250929': {
    id: 'claude-sonnet-4-5-20250929',
    name: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    method: 'online',
    pricing: { input: 3.00, output: 15.00 },
    maxContext: 200000
  },
  'claude-opus-4-5-20251101': {
    id: 'claude-opus-4-5-20251101',
    name: 'Claude Opus 4.5',
    provider: 'anthropic',
    method: 'online',
    pricing: { input: 5.00, output: 25.00 },
    maxContext: 200000
  },

  // ============================================
  // Google Models - Online estimation (API)
  // ============================================
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    method: 'online',
    pricing: { input: 0.075, output: 0.30 },
    maxContext: 1000000
  },
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    method: 'online',
    pricing: { input: 1.25, output: 5.00 },
    maxContext: 2000000
  }
} as const

// ============================================
// Helper Functions
// ============================================

/**
 * Get a model by ID with validation
 */
export function getModelById(modelId: string): ModelDefinition | null {
  return MODEL_REGISTRY[modelId] || null
}

/**
 * Get the default model (local, no API key required)
 */
export function getDefaultModel(): ModelDefinition {
  return MODEL_REGISTRY['gpt-4o']
}

/**
 * Get default model ID
 */
export function getDefaultModelId(): string {
  return 'gpt-4o'
}

/**
 * Check if a model ID is valid
 */
export function isValidModelId(modelId: string): boolean {
  return modelId in MODEL_REGISTRY
}

/**
 * Get all models for a specific provider
 */
export function getModelsByProvider(provider: ModelProvider): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter(m => m.provider === provider)
}

/**
 * Get all local models (no API key required)
 */
export function getLocalModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter(m => m.method === 'local')
}

/**
 * Get all online models (API key required)
 */
export function getOnlineModels(): ModelDefinition[] {
  return Object.values(MODEL_REGISTRY).filter(m => m.method === 'online')
}

/**
 * Get all model IDs as array
 */
export function getAllModelIds(): string[] {
  return Object.keys(MODEL_REGISTRY)
}

/**
 * Get models grouped by provider for UI rendering
 */
export function getModelsGroupedByProvider(): Record<ModelProvider, ModelDefinition[]> {
  return {
    openai: getModelsByProvider('openai'),
    anthropic: getModelsByProvider('anthropic'),
    google: getModelsByProvider('google')
  }
}

/**
 * Calculate cost for a given token count
 */
export function calculateCost(tokens: number, modelOrId: string | ModelDefinition): number {
  const model = typeof modelOrId === 'string' ? getModelById(modelOrId) : modelOrId
  if (!model) return 0

  const rawCost = (tokens / 1_000_000) * model.pricing.input
  // Round to 6 decimal places to avoid floating point errors
  return Math.round(rawCost * 1_000_000) / 1_000_000
}
