import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2020',
    assetsInlineLimit: 2048,
    // Some sandboxes guard bulk/recursive deletes. Never empty the output dir;
    // optional cleanup lives in scripts/clean_dist.mjs and is opt-in.
    emptyOutDir: false,
  },
})
