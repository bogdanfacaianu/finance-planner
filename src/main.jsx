import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

console.log('main.jsx loaded')
console.log('Root element found:', !!document.getElementById('root'))

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('Root element not found!')
  document.body.innerHTML = '<div style="padding:20px;color:red;"><h1>Root element missing!</h1></div>'
} else {
  console.log('Creating React root...')
  try {
    const root = createRoot(rootElement)
    console.log('Rendering App...')
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    )
    console.log('App rendered successfully')
  } catch (error) {
    console.error('React render error:', error)
    document.body.innerHTML = `<div style="padding:20px;color:red;"><h1>React Error</h1><p>${error.message}</p></div>`
  }
}