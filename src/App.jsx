import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import LoginPage from './domains/authentication/components/LoginPage'
import DashboardPage from './app/pages/DashboardPage'
import BudgetPage from './app/pages/BudgetPage'
import './App.css'

function App() {
  // App rendering
  
  return (
    <BrowserRouter basename="/finance-planner">
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App