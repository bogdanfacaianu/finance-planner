import { useState } from 'react'
import { supabase } from '../services/supabase'

function SupabaseTest() {
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('nonexistent_table')
        .select('*')
        .limit(1)

      if (error) {
        if (error.message.includes('relation') || error.message.includes('does not exist')) {
          setResult('✅ Supabase connection working! (Table not found is expected)')
        } else {
          setResult(`❌ Connection error: ${error.message}`)
        }
      } else {
        setResult('✅ Supabase connected successfully!')
      }
    } catch (err) {
      setResult(`❌ Connection failed: ${err.message}`)
    }
    setLoading(false)
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Supabase Connection Test</h3>
      <button
        onClick={testConnection}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test Connection'}
      </button>
      {result && (
        <div className="mt-2 p-2 bg-white rounded text-sm">
          {result}
        </div>
      )}
    </div>
  )
}

export default SupabaseTest