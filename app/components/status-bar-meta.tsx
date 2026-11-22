'use client'

import { useEffect } from 'react'
import { useTheme } from 'next-themes'
import { useGlobalPublicStore } from '@/context/global-public-context'

export default function StatusBarMeta() {
  const { theme, systemTheme } = useTheme()
  const systemFeatures = useGlobalPublicStore(s => s.systemFeatures)
  const appData = useGlobalPublicStore(s => s.appData)

  useEffect(() => {
    // Determine the actual theme being used
    const currentTheme = theme === 'system' ? systemTheme : theme

    // Define colors for each theme
    const lightThemeColor = '#FFFFFF' // --color-background-default-burn (light)
    const darkThemeColor = '#222225' // --color-background-default-burn (dark)

    // Get the color based on current theme
    const themeColor = currentTheme === 'dark' ? darkThemeColor : lightThemeColor

    // Determine app title from various sources
    let appTitle = 'SlumberAI' // fallback
    let appDescription = 'AI-powered chat assistant for your daily conversations' // fallback

    if (systemFeatures?.branding?.enabled && systemFeatures?.branding?.application_title)
      appTitle = systemFeatures.branding.application_title
    else if (appData?.site?.title)
      appTitle = appData.site.title

    if (appData?.site?.description)
      appDescription = appData.site.description

    // Update meta tag for theme-color
    let themeColorMeta = document.querySelector('meta[name="theme-color"]')
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', themeColor)
    }
    else {
      themeColorMeta = document.createElement('meta')
      themeColorMeta.setAttribute('name', 'theme-color')
      themeColorMeta.setAttribute('content', themeColor)
      document.head.appendChild(themeColorMeta)
    }

    // Update meta tag for Apple mobile web app status bar style
    let statusBarMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]')
    if (statusBarMeta) {
      statusBarMeta.setAttribute('content', currentTheme === 'dark' ? 'black-translucent' : 'default')
    }
    else {
      statusBarMeta = document.createElement('meta')
      statusBarMeta.setAttribute('name', 'apple-mobile-web-app-status-bar-style')
      statusBarMeta.setAttribute('content', currentTheme === 'dark' ? 'black-translucent' : 'default')
      document.head.appendChild(statusBarMeta)
    }

    // Update meta tag for Apple mobile web app title
    let appTitleMeta = document.querySelector('meta[name="apple-mobile-web-app-title"]')
    if (appTitleMeta) {
      appTitleMeta.setAttribute('content', appTitle)
    }
    else {
      appTitleMeta = document.createElement('meta')
      appTitleMeta.setAttribute('name', 'apple-mobile-web-app-title')
      appTitleMeta.setAttribute('content', appTitle)
      document.head.appendChild(appTitleMeta)
    }

    // Update meta tag for description
    let descriptionMeta = document.querySelector('meta[name="description"]')
    if (descriptionMeta) {
      descriptionMeta.setAttribute('content', appDescription)
    }
    else {
      descriptionMeta = document.createElement('meta')
      descriptionMeta.setAttribute('name', 'description')
      descriptionMeta.setAttribute('content', appDescription)
      document.head.appendChild(descriptionMeta)
    }

    // For iOS Safari, also set the background color of the viewport meta tag
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    if (viewportMeta) {
      const currentContent = viewportMeta.getAttribute('content') || ''
      const hasViewportFit = currentContent.includes('viewport-fit')
      if (!hasViewportFit)
        viewportMeta.setAttribute('content', `${currentContent}, viewport-fit=cover`)
    }

    // Add CSS to ensure the body background matches the theme
    let statusBarStyle = document.getElementById('status-bar-style')
    if (statusBarStyle)
      statusBarStyle.remove()

    statusBarStyle = document.createElement('style')
    statusBarStyle.id = 'status-bar-style'
    statusBarStyle.innerHTML = `
      /* iOS status bar background fix */
      html, body {
        background-color: ${themeColor} !important;
      }
      
      /* PWA specific fixes for iOS - Simple safe area only */
      @media (display-mode: standalone) {
        /* Remove all bottom margins and paddings */
        body {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        
        #__next {
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        
        /* Main app container with proper safe area - top only */
        .bg-background-default-burn {
          padding-top: env(safe-area-inset-top) !important;
          padding-left: env(safe-area-inset-left) !important;
          padding-right: env(safe-area-inset-right) !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
        }
        
        /* Modal overlays - adjust for safe area - top only */
        .fixed.inset-0.z-50 {
          padding-top: env(safe-area-inset-top) !important;
          padding-left: env(safe-area-inset-left) !important;
          padding-right: env(safe-area-inset-right) !important;
          /* Remove padding for panels to extend to edges */
          padding: env(safe-area-inset-top) 0 0 0 !important;
        }
        
        /* Remove rounded corners and margins for panels in PWA */
        .fixed.inset-0.z-50 .rounded-xl {
          border-radius: 0 !important;
        }
        
        .fixed.inset-0.z-50 .rounded-t-2xl {
          border-radius: 0 !important;
        }
        
        /* Remove panel container padding/margins */
        .fixed.inset-0.z-50.bg-background-overlay {
          padding: 0 !important;
        }
        
        /* PWA Mobile Layout Fixes - Header and Chat Input */
        @media (max-width: 768px) {
          /* Ensure mobile header stays fixed at top */
          .flex.shrink-0.items-center.gap-1.px-2.py-3 {
            position: fixed !important;
            top: env(safe-area-inset-top) !important;
            left: 0 !important;
            right: 0 !important;
            z-index: 10 !important;
            background: ${themeColor} !important;
            border-bottom: 1px solid rgba(0,0,0,0.1) !important;
          }
          
          /* Adjust main content area to account for fixed header */
          .h-\\[calc\\(100\\%_-_56px\\)\\] {
            height: calc(100vh - 56px - env(safe-area-inset-top)) !important;
            margin-top: 56px !important;
          }
          
          /* Ensure chat container has proper height */
          .relative.flex.h-full.flex-col.overflow-hidden {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          
          /* Make chat content area scrollable */
          .flex-1.overflow-hidden {
            flex: 1 !important;
            overflow-y: auto !important;
            min-height: 0 !important;
          }
        }
        
        /* Ensure no bottom spacing on common elements */
        .rounded-t-2xl {
          margin-bottom: 0px !important;
        }
        
        .h-\\[calc\\(100\\%_-_56px\\)\\] {
          padding-bottom: 0 !important;
        }
      }
      
      /* Ensure safe area padding for iOS PWA - removed to prevent conflicts */
      
      /* Fix for iOS status bar area */
      @media only screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3),
             only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2),
             only screen and (device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 3),
             only screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3),
             only screen and (device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3) {
        .status-bar-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: env(safe-area-inset-top, 44px);
          background-color: ${themeColor};
          z-index: 9999;
          pointer-events: none;
        }
      }
    `
    document.head.appendChild(statusBarStyle)
  }, [theme, systemTheme, systemFeatures, appData])

  // Additional PWA-specific effects
  useEffect(() => {
    // Add global error handler for ResizeObserver
    const handleResizeObserverError = (e: ErrorEvent) => {
      if (e.message === 'ResizeObserver loop completed with undelivered notifications.')
        e.stopImmediatePropagation()
    }
    window.addEventListener('error', handleResizeObserverError)

    // Function to check if running as PWA
    const isPWA = () => {
      return window.matchMedia('(display-mode: standalone)').matches
        || (window.navigator as any).standalone
        || document.referrer.includes('android-app://')
    }

    // Function to fix viewport height on mobile
    const setViewportHeight = () => {
      if (isPWA()) {
        try {
          const vh = window.innerHeight * 0.01
          document.documentElement.style.setProperty('--vh', `${vh}px`)

          // Force height recalculation with safe area consideration
          const appContainer = document.querySelector('.bg-background-default-burn') as HTMLElement
          if (appContainer) {
            // Don't override CSS, let CSS handle safe area
            appContainer.style.removeProperty('height')
          }
        }
        catch (error) {
          // Silently handle viewport height errors
        }
      }
    }

    // Set initial height
    setViewportHeight()

    // Update height on resize
    window.addEventListener('resize', setViewportHeight)
    window.addEventListener('orientationchange', () => {
      setTimeout(setViewportHeight, 100) // Delay for orientation change
    })

    return () => {
      window.removeEventListener('resize', setViewportHeight)
      window.removeEventListener('orientationchange', setViewportHeight)
      window.removeEventListener('error', handleResizeObserverError)
    }
  }, [])

  return (
    <>
      {/* Status bar background div for iOS */}
      <div className="status-bar-bg" />
    </>
  )
}
