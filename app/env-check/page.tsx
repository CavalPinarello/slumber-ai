'use client'

import { useEffect, useState } from 'react'

export default function EnvCheck() {
  const [envInfo, setEnvInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    // Check client-side environment variables
    const clientEnv = {
      APP_ID: process.env.NEXT_PUBLIC_APP_ID || 'NOT SET',
      API_KEY: process.env.NEXT_PUBLIC_APP_KEY ? 'SET (hidden)' : 'NOT SET',
      API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
    }
    
    // Fetch server-side check
    fetch('/api/debug-env')
      .then(res => res.json())
      .then(data => {
        setEnvInfo({
          client: clientEnv,
          server: data,
        })
        setLoading(false)
      })
      .catch(err => {
        setEnvInfo({
          client: clientEnv,
          server: { error: err.message },
        })
        setLoading(false)
      })
  }, [])
  
  if (loading) {
    return <div className="p-8">Loading environment check...</div>
  }
  
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Debug</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Client-Side Environment</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(envInfo?.client, null, 2)}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Server-Side Environment</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(envInfo?.server, null, 2)}
        </pre>
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Instructions:</h3>
        <ol className="list-decimal list-inside space-y-2">
          <li>If variables show as "NOT SET" on both client and server, they're not configured in Vercel</li>
          <li>If they show on server but not client, there's a build issue</li>
          <li>If they show on client but the app doesn't work, there's a code issue</li>
        </ol>
      </div>
    </div>
  )
}