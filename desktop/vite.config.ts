import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Development server config
  server: {
    port: 5174, // Different from web to avoid conflict
    strictPort: true,
  },

  // Build config
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },

  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../web/src'), // Point to web src for shared components
      '@shared': path.resolve(__dirname, '../shared'),
      '@desktop': path.resolve(__dirname, 'src/renderer'),
    },
  },

  // Base URL for assets
  base: './',
})
