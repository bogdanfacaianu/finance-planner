import { useState } from 'react'
import { supabase } from '../services/supabase'

function SupabaseDebug() {
  const [testResult, setTestResult] = useState('')

  const testConnection = async () => {
    try {
      setTestResult('Testing connection...')
      
      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setTestResult(`❌ Connection Error: ${error.message}`)
      } else {
        setTestResult(`✅ Connection OK. Current session: ${data.session ? 'Logged in' : 'Not logged in'}`)
      }
    } catch (err) {
      setTestResult(`❌ Test Failed: ${err.message}`)
    }
  }

  const testSignup = async () => {
    try {
      setTestResult('Testing signup with dummy email...')
      
      const { data, error } = await supabase.auth.signUp({
        email: 'test-' + Date.now() + '@example.com',
        password: 'testpass123'
      })
      
      if (error) {
        setTestResult(`Signup test result: ${error.message}`)
      } else {
        setTestResult(`✅ Signup works. User would be: ${data.user?.email || 'created'}`)
      }
    } catch (err) {
      setTestResult(`❌ Signup test failed: ${err.message}`)
    }
  }

  return (
    <div style={{margin: '20px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
      <h3>🔧 Supabase Debug Panel</h3>
      <div style={{marginBottom: '10px'}}>
        <button 
          onClick={testConnection}
          style={{marginRight: '10px', padding: '8px 16px', backgroundColor: '#007cba', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Test Connection
        </button>
        <button 
          onClick={testSignup}
          style={{padding: '8px 16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px'}}
        >
          Test Signup
        </button>
      </div>
      {testResult && (
        <div style={{padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px', fontSize: '14px'}}>
          {testResult}
        </div>
      )}
    </div>
  )
}

export default SupabaseDebug