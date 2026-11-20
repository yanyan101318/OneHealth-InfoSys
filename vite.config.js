import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 525,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/@mui/x-data-grid/')) return 'mui-data-grid'
          if (id.includes('/node_modules/@mui/')) return 'mui-core'
          if (id.includes('/node_modules/@emotion/')) return 'emotion'
          if (id.includes('/node_modules/recharts/es6/')) {
            const rechartsModule = id.split('/node_modules/recharts/es6/')[1].split('/')[0]
            if (['cartesian', 'component', 'context', 'container', 'shape', 'util'].includes(rechartsModule)) {
              return 'recharts-engine'
            }
            if (rechartsModule === 'index.js') return
            return `recharts-${rechartsModule}`
          }
          if (id.includes('/node_modules/recharts/')) return 'recharts-core'
          if (id.includes('/node_modules/@firebase/firestore/')) return 'firebase-firestore'
          if (id.includes('/node_modules/@firebase/auth/')) return 'firebase-auth'
          if (id.includes('/node_modules/@firebase/')) return 'firebase-core'
          if (id.includes('/node_modules/firebase/')) return 'firebase'
        },
      },
    },
  },
})
