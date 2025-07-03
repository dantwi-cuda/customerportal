import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5211', // Your backend API URL
        changeOrigin: true,
        // secure: false, // If your backend uses HTTPS with a self-signed certificate
        // rewrite: (path) => path.replace(/^\/api/, '') // If your backend doesn't expect /api prefix
      }
    }
  }
})
