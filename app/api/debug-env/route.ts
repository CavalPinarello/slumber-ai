import { NextResponse } from 'next/server'

export async function GET() {
  // This endpoint will help us debug what environment variables are available
  const envVars = {
    // Check if the variables exist
    NEXT_PUBLIC_APP_ID_EXISTS: !!process.env.NEXT_PUBLIC_APP_ID,
    NEXT_PUBLIC_APP_KEY_EXISTS: !!process.env.NEXT_PUBLIC_APP_KEY,
    NEXT_PUBLIC_API_URL_EXISTS: !!process.env.NEXT_PUBLIC_API_URL,
    
    // Get the actual values (partially masked for security)
    NEXT_PUBLIC_APP_ID: process.env.NEXT_PUBLIC_APP_ID 
      ? `${process.env.NEXT_PUBLIC_APP_ID.substring(0, 8)}...` 
      : 'NOT SET',
    NEXT_PUBLIC_APP_KEY: process.env.NEXT_PUBLIC_APP_KEY 
      ? `${process.env.NEXT_PUBLIC_APP_KEY.substring(0, 8)}...` 
      : 'NOT SET',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'NOT SET',
    
    // Check Node environment
    NODE_ENV: process.env.NODE_ENV,
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    
    // Check if we're in production
    IS_PRODUCTION: process.env.NODE_ENV === 'production',
    IS_VERCEL: !!process.env.VERCEL,
  }
  
  return NextResponse.json(envVars)
}