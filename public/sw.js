// Service Worker for offline capabilities and caching strategies

const CACHE_NAME = 'chat-app-v1'
const STATIC_CACHE_NAME = 'chat-app-static-v1'
const DYNAMIC_CACHE_NAME = 'chat-app-dynamic-v1'

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/app-icon.png',
  '/app-icon.svg',
  // Core CSS and JS files will be added by Next.js automatically
]

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = {
  conversations: /\/api\/conversations/,
  messages: /\/api\/messages/,
  appInfo: /\/api\/info/,
  static: /\/api\/static/,
}

// Network-first patterns (always try network first)
const NETWORK_FIRST_PATTERNS = [
  /\/api\/chat-messages/, // Real-time chat
  /\/api\/sse/, // Server-sent events
  /\/api\/auth/, // Authentication
]

// Cache-first patterns (use cache if available)
const CACHE_FIRST_PATTERNS = [
  /\/static\//,
  /\/_next\/static\//,
  /\.(?:js|css|woff2?|png|jpg|jpeg|gif|svg|ico)$/,
]

/**
 * Install event - cache static assets
 */
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...')
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE_NAME).then(cache => {
        console.log('[SW] Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...')
  
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (
              cacheName !== CACHE_NAME &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      }),
      
      // Take control of all clients
      self.clients.claim()
    ])
  )
})

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other protocols
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  // Choose caching strategy based on request
  if (NETWORK_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(networkFirstStrategy(request))
  } else if (CACHE_FIRST_PATTERNS.some(pattern => pattern.test(url.pathname))) {
    event.respondWith(cacheFirstStrategy(request))
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(staleWhileRevalidateStrategy(request))
  } else {
    event.respondWith(networkFirstWithOfflineFallback(request))
  }
})

/**
 * Network-first strategy - try network, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url)
    
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline fallback for pages
    if (request.mode === 'navigate') {
      return caches.match('/offline')
    }
    
    throw error
  }
}

/**
 * Cache-first strategy - try cache, fallback to network
 */
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Cache and network failed:', request.url)
    throw error
  }
}

/**
 * Stale-while-revalidate strategy - return cache immediately, update in background
 */
async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME)
  const cachedResponse = await cache.match(request)
  
  // Fetch from network in background
  const networkResponsePromise = fetch(request).then(response => {
    if (response.ok) {
      cache.put(request, response.clone())
    }
    return response
  }).catch(error => {
    console.log('[SW] Background fetch failed:', request.url)
  })
  
  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }
  
  // If no cache, wait for network
  return networkResponsePromise
}

/**
 * Network-first with offline fallback for pages
 */
async function networkFirstWithOfflineFallback(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok && request.mode === 'navigate') {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    if (request.mode === 'navigate') {
      const cachedResponse = await caches.match(request)
      if (cachedResponse) {
        return cachedResponse
      }
      
      return caches.match('/offline')
    }
    
    throw error
  }
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', event => {
  console.log('[SW] Background sync triggered:', event.tag)
  
  if (event.tag === 'chat-messages') {
    event.waitUntil(syncChatMessages())
  }
})

/**
 * Sync failed chat messages when online
 */
async function syncChatMessages() {
  try {
    // Get failed messages from IndexedDB (if implemented)
    const failedMessages = await getFailedMessages()
    
    for (const message of failedMessages) {
      try {
        await fetch('/api/chat-messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(message.data)
        })
        
        // Remove from failed messages
        await removeFailedMessage(message.id)
        
        // Notify clients of successful sync
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'MESSAGE_SYNCED',
              messageId: message.id
            })
          })
        })
      } catch (error) {
        console.log('[SW] Failed to sync message:', message.id)
      }
    }
  } catch (error) {
    console.log('[SW] Background sync failed:', error)
  }
}

/**
 * Push notifications
 */
self.addEventListener('push', event => {
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'New message received',
      icon: '/app-icon.png',
      badge: '/app-icon.png',
      tag: data.tag || 'chat-notification',
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open Chat'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Chat App', options)
    )
  } catch (error) {
    console.log('[SW] Push notification error:', error)
  }
})

/**
 * Notification click handler
 */
self.addEventListener('notificationclick', event => {
  event.notification.close()
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        // Focus existing window if available
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            return client.focus()
          }
        }
        
        // Open new window
        return self.clients.openWindow('/')
      })
    )
  }
})

/**
 * Message handler for client communication
 */
self.addEventListener('message', event => {
  const { type, data } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_CHAT_MESSAGE':
      event.waitUntil(cacheChatMessage(data))
      break
      
    case 'GET_CACHE_STATUS':
      event.waitUntil(getCacheStatus().then(status => {
        event.ports[0].postMessage(status)
      }))
      break
      
    default:
      console.log('[SW] Unknown message type:', type)
  }
})

/**
 * Cache chat message for offline access
 */
async function cacheChatMessage(messageData) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE_NAME)
    const response = new Response(JSON.stringify(messageData), {
      headers: { 'Content-Type': 'application/json' }
    })
    
    await cache.put(`/api/messages/${messageData.conversationId}`, response)
  } catch (error) {
    console.log('[SW] Failed to cache message:', error)
  }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
  try {
    const cacheNames = await caches.keys()
    const cacheStatus = {}
    
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      cacheStatus[cacheName] = keys.length
    }
    
    return {
      caches: cacheStatus,
      totalCaches: cacheNames.length,
      isOnline: navigator.onLine
    }
  } catch (error) {
    return { error: error.message }
  }
}

/**
 * Placeholder functions for IndexedDB operations
 * (Would need to be implemented with idb library)
 */
async function getFailedMessages() {
  // Implementation would use IndexedDB to store failed requests
  return []
}

async function removeFailedMessage(id) {
  // Implementation would remove from IndexedDB
  return true
}

/**
 * Error handler
 */
self.addEventListener('error', event => {
  console.error('[SW] Service worker error:', event.error)
})

self.addEventListener('unhandledrejection', event => {
  console.error('[SW] Unhandled promise rejection:', event.reason)
})

console.log('[SW] Service worker loaded successfully')