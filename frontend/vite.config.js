import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// envDir: '..' points Vite at the single repository-root .env so the
// frontend and backend share one config file instead of duplicating it.
export default defineConfig({
  plugins: [react()],
  envDir: '..',
  server: {
    port: 3000,
  },
})