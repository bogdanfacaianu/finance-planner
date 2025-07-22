import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import App from './App.jsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Root element missing!</h1></div>'
} else {
  try {
    const root = createRoot(rootElement)
    root.render(
      <StrictMode>
        <MantineProvider 
          theme={{
            colorScheme: 'dark',
            primaryColor: 'navy',
            colors: {
              // Navy blue with purple shades theme - dark optimized
              navy: ['#1a1b2e', '#16213e', '#162447', '#0f3460', '#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe'],
              purple: ['#1a0d26', '#2d1b69', '#3730a3', '#4338ca', '#5b21b6', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'],
              accent: ['#0f0f23', '#1e1b4b', '#312e81', '#3730a3', '#4338ca', '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff'],
              success: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399', '#6ee7b7', '#9decdb', '#a7f3d0', '#d1fae5'],
              warning: ['#451a03', '#78350f', '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7'],
              expense: ['#4c0519', '#7c2d12', '#991b1b', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fed7d7', '#fee2e2']
            },
            fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            headings: {
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
            },
            defaultRadius: 'md',
            other: {
              bodyBg: '#0f0f23'
            },
          components: {
            Button: {
              styles: {
                root: {
                  borderRadius: '8px',
                }
              }
            },
            Card: {
              styles: {
                root: {
                  borderRadius: '12px',
                }
              }
            },
          }
        }}>
          <Notifications />
          <App />
        </MantineProvider>
      </StrictMode>
    )
  } catch (error) {
    document.body.innerHTML = `<div style="padding:20px;color:red;"><h1>React Error</h1><p>${error.message}</p></div>`
  }
}