import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Use '/finance-planner' for GitHub Pages, '/' for Cloudflare Pages
  const base = mode === 'github' ? '/finance-planner' : '/'
  
  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        'src': path.resolve(__dirname, './src')
      }
    }
  }
})