/**
 * Type definitions for marked
 * Provides proper TypeScript support for marked markdown extensions
 */

import { MarkedExtension } from 'marked'

/**
 * Action button token structure
 */
interface ActionButtonToken {
  type: 'actionButton'
  raw: string
  id: string
  text: string
}

/**
 * Action button extension interface
 * Defines the structure for the custom action button extension
 */
interface ActionButtonExtension {
  name: 'actionButton'
  level: 'inline'
  start: (src: string) => number | void
  tokenizer: (src: string) => ActionButtonToken | undefined
  renderer: (token: ActionButtonToken) => string
}

/**
 * Custom extension type for marked
 */
interface CustomMarkedExtension extends MarkedExtension {
  name: string
  level: 'inline' | 'block'
  start?: (src: string) => number | void
  tokenizer?: (src: string) => any
  renderer?: (token: any) => string
}

// Extend the marked module to include our custom extension
declare module 'marked' {
  // Extend the MarkedExtension type to include our custom extension
  interface MarkedExtension {
    name?: string
    level?: 'inline' | 'block'
    start?: (src: string) => number | void
    tokenizer?: (src: string) => any
    renderer?: (token: any) => string
    childTokens?: string[]
  }

  // Extend the use function to accept our custom extension
  function use(extension: CustomMarkedExtension | CustomMarkedExtension[]): void
  
  // Extend the extension function to accept our custom extension
  function extension(extension: CustomMarkedExtension): void
}

// Export the action button extension interface for use in the codebase
export type { ActionButtonExtension, ActionButtonToken, CustomMarkedExtension }
