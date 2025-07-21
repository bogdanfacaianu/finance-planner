import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { supabase } from './services/supabase'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import './App.css'

function RouteDebug() {
  const location = useLocation()
  console.log('Current route:', location.pathname)
  return (
    <div style={{backgroundColor: '#fff3cd', padding: '5px', fontSize: '12px', borderBottom: '1px solid #ffeaa7'}}>
      Current route: {location.pathname}
    </div>
  )
}

function App() {
  console.log('App rendering, current URL:', window.location.href)
  
  // Handle auth callback from Supabase
  useEffect(() => {
    const handleAuthCallback = async () => {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        console.log('Processing auth callback from hash:', hash)
        
        try {
          const { data, error } = await supabase.auth.getSession()
          if (error) {
            console.error('Auth callback error:', error)
          } else {
            console.log('Auth callback successful:', data)
            // Clear the hash and redirect to dashboard
            window.history.replaceState(null, null, '/finance-planner/')
            window.location.reload() // Refresh to update auth state
          }
        } catch (err) {
          console.error('Auth callback processing error:', err)
        }
      }
    }
    
    handleAuthCallback()
  }, [])
  
  // Handle redirects from 404.html
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');
  if (redirect) {
    console.log('Processing redirect to:', redirect);
    // Clean up the URL - remove redirect param and fix path
    const cleanPath = '/finance-planner' + redirect;
    window.history.replaceState(null, null, cleanPath);
  }
  
  return (
    <div>
      <div style={{padding: '10px', backgroundColor: '#e3f2fd', borderBottom: '2px solid #1976d2'}}>
        <h1 style={{margin: '0', color: '#1976d2'}}>🏦 Financial Planner - WORKING VERSION</h1>
        <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Build: {new Date().toISOString()}</p>
      </div>
      
      <BrowserRouter basename="/finance-planner">
        <RouteDebug />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={
            <div style={{padding: '20px', backgroundColor: '#f0f8ff', margin: '20px'}}>
              <h2 style={{color: '#0066cc'}}>🔐 LOGIN PAGE WORKING!</h2>
              <Login />
            </div>
          } />
          <Route path="/signup" element={
            <div style={{padding: '20px', backgroundColor: '#f0fff0', margin: '20px'}}>
              <h2 style={{color: '#006600'}}>✍️ SIGNUP PAGE WORKING!</h2>
              <Signup />
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App