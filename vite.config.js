import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('lucide-react') || id.includes('@radix-ui')) {
              return 'ui';
            }
            return 'vendor-other';
          }
        }
      }
    },
    chunkSizeWarningLimit: 600,
  }
})
