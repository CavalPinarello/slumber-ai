// App configuration
export const APP_ID = process.env.NEXT_PUBLIC_APP_ID || ''
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || ''
export const APP_INFO = {
  title: 'Chat App',
  description: 'A simple chat application',
  default_language: 'en',
  copyright: 'All rights reserved',
  icon: '🤖',
}
export const isShowPrompt = true
export const promptTemplate = 'You are a helpful assistant.'
