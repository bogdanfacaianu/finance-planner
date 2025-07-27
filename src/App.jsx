import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LoginPage from './domains/authentication/components/LoginPage'
import DashboardPage from './app/pages/DashboardPage'
import BudgetPage from './app/pages/BudgetPage'
import CategoryManagementPage from './app/pages/CategoryManagementPage'
import FinancialOverviewPage from './app/pages/FinancialOverviewPage'
import RecurringTransactionsPage from './app/pages/RecurringTransactionsPage'
import SettingsPage from './app/pages/SettingsPage'
import InsightsPage from './app/pages/InsightsPage'
import './App.css'

function App() {
  // App rendering
  
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/categories" element={<CategoryManagementPage />} />
        <Route path="/overview" element={<FinancialOverviewPage />} />
        <Route path="/recurring" element={<RecurringTransactionsPage />} />
        <Route path="/insights" element={<InsightsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App