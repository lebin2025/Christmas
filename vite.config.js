import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // GitHub Pages project-site deployment (https://<user>.github.io/Christmas/).
  // A repo-root deployment would use base: '/'. The assets map in
  // src/assets/assets.js builds every URL from import.meta.env.BASE_URL, so
  // toggling this single value redeploys the whole site correctly.
  base: '/Christmas/',
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
