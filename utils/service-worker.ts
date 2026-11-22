// Service worker registration and management utilities

import React from 'react'

/**
 * Service worker registration with update handling
 */
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('Service workers not supported')
    return null
  }

  try {
    console.log('Registering service worker...')

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    console.log('Service worker registered successfully:', registration)

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing

      if (newWorker) {
        console.log('New service worker found, installing...')

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New service worker installed, waiting for activation')

            // Notify user about update
            notifyUserOfUpdate(registration)
          }
        })
      }
    })

    // Handle controller change
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      console.log('Service worker controller changed, reloading page')
      window.location.reload()
    })

    return registration
  }
  catch (error) {
    console.error('Service worker registration failed:', error)
    return null
  }
}

/**
 * Notify user of service worker update
 */
const notifyUserOfUpdate = (registration: ServiceWorkerRegistration) => {
  // In a real app, you might show a toast or modal
  const shouldUpdate = confirm(
    'A new version of the app is available. Would you like to update now?',
  )

  if (shouldUpdate && registration.waiting)
    registration.waiting.postMessage({ type: 'SKIP_WAITING' })
}

/**
 * Check if app is running offline
 */
export const isOnline = (): boolean => {
  return navigator.onLine
}

/**
 * Service worker messaging utilities
 */
export class ServiceWorkerMessenger {
  private registration: ServiceWorkerRegistration | null = null

  constructor(registration?: ServiceWorkerRegistration) {
    this.registration = registration || null
  }

  /**
   * Send message to service worker
   */
  async sendMessage(message: any): Promise<any> {
    if (!this.registration || !this.registration.active)
      throw new Error('Service worker not available')

    return new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel()

      messageChannel.port1.onmessage = (event) => {
        if (event.data.error)
          reject(new Error(event.data.error))
        else
          resolve(event.data)
      }

      this.registration!.active!.postMessage(message, [messageChannel.port2])
    })
  }

  /**
   * Cache chat message for offline access
   */
  async cacheChatMessage(messageData: any): Promise<void> {
    try {
      await this.sendMessage({
        type: 'CACHE_CHAT_MESSAGE',
        data: messageData,
      })
    }
    catch (error) {
      console.error('Failed to cache chat message:', error)
    }
  }

  /**
   * Get cache status
   */
  async getCacheStatus(): Promise<any> {
    try {
      return await this.sendMessage({ type: 'GET_CACHE_STATUS' })
    }
    catch (error) {
      console.error('Failed to get cache status:', error)
      return null
    }
  }
}

/**
 * Offline detection and handling
 */
export class OfflineManager {
  private onlineCallbacks: (() => void)[] = []
  private offlineCallbacks: (() => void)[] = []
  private isCurrentlyOnline: boolean = navigator.onLine

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('online', this.handleOnline.bind(this))
    window.addEventListener('offline', this.handleOffline.bind(this))
  }

  private handleOnline() {
    if (!this.isCurrentlyOnline) {
      console.log('App is back online')
      this.isCurrentlyOnline = true
      this.onlineCallbacks.forEach(callback => callback())

      // Trigger background sync if available
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
          return registration.sync.register('chat-messages')
        }).catch((error) => {
          console.error('Background sync registration failed:', error)
        })
      }
    }
  }

  private handleOffline() {
    if (this.isCurrentlyOnline) {
      console.log('App is offline')
      this.isCurrentlyOnline = false
      this.offlineCallbacks.forEach(callback => callback())
    }
  }

  onOnline(callback: () => void) {
    this.onlineCallbacks.push(callback)
  }

  onOffline(callback: () => void) {
    this.offlineCallbacks.push(callback)
  }

  removeOnlineListener(callback: () => void) {
    this.onlineCallbacks = this.onlineCallbacks.filter(cb => cb !== callback)
  }

  removeOfflineListener(callback: () => void) {
    this.offlineCallbacks = this.offlineCallbacks.filter(cb => cb !== callback)
  }

  get isOnline(): boolean {
    return this.isCurrentlyOnline
  }

  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this))
    window.removeEventListener('offline', this.handleOffline.bind(this))
    this.onlineCallbacks = []
    this.offlineCallbacks = []
  }
}

/**
 * React hook for service worker
 */
export const useServiceWorker = () => {
  const [registration, setRegistration] = React.useState<ServiceWorkerRegistration | null>(null)
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)
  const [updateAvailable, setUpdateAvailable] = React.useState(false)

  React.useEffect(() => {
    registerServiceWorker().then(setRegistration)

    const offlineManager = new OfflineManager()

    offlineManager.onOnline(() => setIsOnline(true))
    offlineManager.onOffline(() => setIsOnline(false))

    return () => {
      offlineManager.destroy()
    }
  }, [])

  const updateApp = React.useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
      setUpdateAvailable(false)
    }
  }, [registration])

  const messenger = React.useMemo(() => {
    return registration ? new ServiceWorkerMessenger(registration) : null
  }, [registration])

  return {
    registration,
    isOnline,
    updateAvailable,
    updateApp,
    messenger,
  }
}

/**
 * React hook for offline status
 */
export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine)

  React.useEffect(() => {
    const offlineManager = new OfflineManager()

    offlineManager.onOnline(() => setIsOnline(true))
    offlineManager.onOffline(() => setIsOnline(false))

    return () => {
      offlineManager.destroy()
    }
  }, [])

  return { isOnline, isOffline: !isOnline }
}

/**
 * Push notification utilities
 */
export class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null

  constructor(registration: ServiceWorkerRegistration) {
    this.registration = registration
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window))
      throw new Error('Notifications not supported')

    return await Notification.requestPermission()
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(vapidPublicKey: string): Promise<PushSubscription | null> {
    if (!this.registration)
      throw new Error('Service worker not registered')

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
      })

      return subscription
    }
    catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.registration)
      return false

    try {
      const subscription = await this.registration.pushManager.getSubscription()
      if (subscription)
        return await subscription.unsubscribe()

      return true
    }
    catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i)
      outputArray[i] = rawData.charCodeAt(i)

    return outputArray
  }
}

export default {
  registerServiceWorker,
  ServiceWorkerMessenger,
  OfflineManager,
  PushNotificationManager,
  useServiceWorker,
  useOfflineStatus,
  isOnline,
}
