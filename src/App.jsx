import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  return (
    <div>
      <div style={{padding: '10px', backgroundColor: '#e3f2fd', borderBottom: '2px solid #1976d2'}}>
        <h1 style={{margin: '0', color: '#1976d2'}}>🏦 Financial Planner - WORKING VERSION</h1>
        <p style={{margin: '5px 0 0 0', fontSize: '14px'}}>Build: {new Date().toISOString()}</p>
      </div>
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App