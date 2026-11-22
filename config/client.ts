// Client-safe configuration that can be used in the browser
// This file ensures environment variables are accessible in production builds

export const getClientConfig = () => {
  // In production, Next.js replaces process.env.NEXT_PUBLIC_* at build time
  // We need to access them in a way that works both in dev and production
  
  if (typeof window === 'undefined') {
    // Server-side: Direct access
    return {
      APP_ID: process.env.NEXT_PUBLIC_APP_ID || '',
      API_KEY: process.env.NEXT_PUBLIC_APP_KEY || '',
      API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    }
  }
  
  // Client-side: These values are injected at build time
  // If they're missing, it means the build didn't have the env vars
  return {
    APP_ID: process.env.NEXT_PUBLIC_APP_ID || '',
    API_KEY: process.env.NEXT_PUBLIC_APP_KEY || '',
    API_URL: process.env.NEXT_PUBLIC_API_URL || '',
  }
}

export const isConfigValid = () => {
  const config = getClientConfig()
  return !!(config.APP_ID && config.API_KEY && config.API_URL)
}