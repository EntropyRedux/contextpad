import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
  build: {
    target: ['es2021', 'chrome100', 'safari13'],
    minify: !process.env.TAURI_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_DEBUG,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            if (id.includes('/src/services/tokenEstimator/')) return 'token-estimator'
            if (id.includes('/src/utils/markdownRenderer')) return 'markdown-rendering'
            if (id.includes('/src/themes/')) return 'theme-support'
            return undefined
          }

          if (id.includes('react') || id.includes('react-dom') || id.includes('scheduler')) {
            return 'react-vendor'
          }

          if (id.includes('@codemirror') || id.includes('@lezer') || id.includes('codemirror')) {
            return 'codemirror'
          }

          if (id.includes('js-tiktoken')) {
            return 'token-estimator'
          }

          if (id.includes('marked')) {
            return 'markdown-rendering'
          }

          if (id.includes('lucide-react')) {
            return 'icons'
          }

          if (id.includes('react-window')) {
            return 'virtualized'
          }

          if (id.includes('zustand')) {
            return 'state'
          }

          if (id.includes('@tauri-apps')) {
            return 'tauri'
          }

          return 'vendor'
        }
      }
    }
  },
})
