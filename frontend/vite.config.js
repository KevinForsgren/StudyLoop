import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// envDir: '..' points Vite at the single repository-root .env so the
// frontend and backend share one config file instead of duplicating it.
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    port: 3000,
    // Proxy API calls to the backend so authentication stays same-origin.
    // The browser talks to :3000 and the HttpOnly session cookie (set by the
    // backend, relayed through this proxy) works without CORS.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        // Keep the original Host so any backend redirect (e.g. trailing-slash)
        // stays same-origin and the session cookie is preserved by the browser.
        changeOrigin: false,
      },
    },
  },
})