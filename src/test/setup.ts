/**
 * Vitest test setup file
 * Configures the testing environment and global utilities
 */

import '@testing-library/jest-dom'

// Mock Tauri API for testing
(global as any).__TAURI__ = {
  invoke: async (cmd: string, _args?: any) => {
    // Return mock data for common commands
    switch (cmd) {
      case 'read_file':
        return 'mock file content'
      case 'write_file':
        return null
      case 'get_file_name':
        return 'test.md'
      case 'detect_language_from_path':
        return 'markdown'
      default:
        return null
    }
  }
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  // Keep errors but suppress info/debug in tests
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: () => {},
  debug: () => {},
}

// Setup matchMedia for React components that use media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
