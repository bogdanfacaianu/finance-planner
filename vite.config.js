import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(() => {
  // Use root path for Cloudflare Pages deployment
  const base = '/'
  
  return {
    plugins: [react()],
    base,
    resolve: {
      alias: {
        'src': path.resolve(__dirname, './src')
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // Separate vendor libraries into their own chunks
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'mantine-vendor': [
              '@mantine/core', 
              '@mantine/hooks', 
              '@mantine/notifications', 
              '@mantine/dates',
              '@mantine/modals'
            ],
            'charts-vendor': ['recharts'],
            'supabase-vendor': ['@supabase/supabase-js'],
            'icons-vendor': ['@tabler/icons-react'],
            'utils-vendor': ['dayjs']
          }
        }
      },
      // Increase chunk size warning limit to reduce noise
      chunkSizeWarningLimit: 1000
    }
  }
})