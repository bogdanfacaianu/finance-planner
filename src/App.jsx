import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
  
  // Handle redirects from 404.html
  const urlParams = new URLSearchParams(window.location.search);
  const redirect = urlParams.get('redirect');
  if (redirect) {
    console.log('Processing redirect to:', redirect);
    // Remove the redirect parameter and update the URL
    window.history.replaceState(null, null, window.location.pathname + redirect);
  }
  
  return (
    <div>
      <div style={{padding: '10px', backgroundColor: '#e3f2fd', borderBottom: '2px solid #1976d2'}}>
        <h1 style={{margin: '0', color: '#1976d2'}}>🏦 Financial Planner - WORKING VERSION</h1>
        <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Build: {new Date().toISOString()}</p>
      </div>
      
      <BrowserRouter>
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