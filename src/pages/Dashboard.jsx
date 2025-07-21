import { Link } from 'react-router-dom'
import SupabaseDebug from '../components/SupabaseDebug'

function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Financial Planner</h1>
            </div>
            <div className="flex items-center space-x-4">
              {/* Navigation items will go here */}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96">
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Welcome to Financial Planner
                </h2>
                <p className="text-gray-600 mb-6">
                  Track your expenses, manage budgets, and share costs with ease.
                </p>
                {/* Main dashboard content will go here */}
              </div>
            </div>
          </div>
        </div>
        
        <SupabaseDebug />
      </main>
    </div>
  )
}

export default Dashboard