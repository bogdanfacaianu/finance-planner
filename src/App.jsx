import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import './App.css'

function App() {
  console.log('App component rendering')
  
  try {
    return (
      <BrowserRouter>
        <div>
          <h1 style={{color: 'red', padding: '20px'}}>
            🏦 Finance Planner Debug Mode
          </h1>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
          </Routes>
        </div>
      </BrowserRouter>
    )
  } catch (error) {
    console.error('App render error:', error)
    return (
      <div style={{padding: '20px', color: 'red'}}>
        <h1>App Error</h1>
        <p>Error: {error.message}</p>
      </div>
    )
  }
}

export default App