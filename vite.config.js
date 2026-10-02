import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const WP = 'https://react-store.ddev.site'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // WooCommerce Store API
      "/woo-api": {
        target: WP,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/woo-api/, "/wp-json/wc/store/v1")
      },
      // WordPress core REST API (pages, media, ...)
      "/wp-api": {
        target: WP,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/wp-api/, "/wp-json")
      }
    }
  }
})
