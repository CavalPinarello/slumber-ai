'use client'

import { useEffect, useState } from 'react'

export default function TestBasic() {
  const [status, setStatus] = useState('Checking environment...')
  const [apiData, setApiData] = useState<any>(null)
  
  useEffect(() => {
    // Test if environment variables are available
    const envCheck = {
      APP_ID: process.env.NEXT_PUBLIC_APP_ID ? 'SET' : 'NOT SET',
      API_KEY: process.env.NEXT_PUBLIC_APP_KEY ? 'SET' : 'NOT SET',
      API_URL: process.env.NEXT_PUBLIC_API_URL ? 'SET' : 'NOT SET',
    }
    
    setStatus(`Environment: ${JSON.stringify(envCheck)}`)
    
    // Test basic API call
    fetch('/api/site')
      .then(res => res.json())
      .then(data => {
        setApiData(data)
        setStatus('API call successful!')
      })
      .catch(err => {
        setStatus(`API error: ${err.message}`)
      })
  }, [])
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Basic Test Page</h1>
      <p className="mb-4">Status: {status}</p>
      {apiData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">API Response:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(apiData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  )
}