// Keyboard shortcuts and accessibility utilities

import React from 'react'

/**
 * Keyboard shortcut configuration
 */
export type ShortcutConfig = {
  key: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  meta?: boolean
  description: string
  action: () => void
  global?: boolean
  preventDefault?: boolean
}

/**
 * Keyboard shortcut manager
 */
export class KeyboardShortcutManager {
  private shortcuts: Map<string, ShortcutConfig> = new Map()
  private listeners: Map<HTMLElement | Document, (e: KeyboardEvent) => void> = new Map()

  constructor() {
    this.setupGlobalListeners()
  }

  /**
   * Register a keyboard shortcut
   */
  register(config: ShortcutConfig): () => void {
    const key = this.createKey(config)
    this.shortcuts.set(key, config)

    return () => {
      this.shortcuts.delete(key)
    }
  }

  /**
   * Register multiple shortcuts
   */
  registerMany(configs: ShortcutConfig[]): () => void {
    const unregisterFns = configs.map(config => this.register(config))

    return () => {
      unregisterFns.forEach(fn => fn())
    }
  }

  /**
   * Handle keydown event
   */
  private handleKeyDown = (event: KeyboardEvent) => {
    const activeElement = document.activeElement

    // Skip if user is typing in input/textarea
    if (
      activeElement
      && (activeElement.tagName === 'INPUT'
       || activeElement.tagName === 'TEXTAREA'
       || activeElement.getAttribute('contenteditable') === 'true')
    )
      return

    for (const [key, config] of this.shortcuts) {
      if (this.matchesShortcut(event, config)) {
        if (config.preventDefault !== false)
          event.preventDefault()

        config.action()
        break
      }
    }
  }

  /**
   * Check if event matches shortcut config
   */
  private matchesShortcut(event: KeyboardEvent, config: ShortcutConfig): boolean {
    const key = event.key.toLowerCase()
    const configKey = config.key.toLowerCase()

    return (
      key === configKey
      && !!event.ctrlKey === !!config.ctrl
      && !!event.altKey === !!config.alt
      && !!event.shiftKey === !!config.shift
      && !!event.metaKey === !!config.meta
    )
  }

  /**
   * Create unique key for shortcut
   */
  private createKey(config: ShortcutConfig): string {
    const modifiers = []
    if (config.ctrl)
      modifiers.push('ctrl')
    if (config.alt)
      modifiers.push('alt')
    if (config.shift)
      modifiers.push('shift')
    if (config.meta)
      modifiers.push('meta')

    return `${modifiers.join('+')}-${config.key.toLowerCase()}`
  }

  /**
   * Setup global keyboard listeners
   */
  private setupGlobalListeners() {
    document.addEventListener('keydown', this.handleKeyDown)
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values())
  }

  /**
   * Format shortcut for display
   */
  formatShortcut(config: ShortcutConfig): string {
    const parts = []

    if (config.meta)
      parts.push('⌘')
    if (config.ctrl)
      parts.push('Ctrl')
    if (config.alt)
      parts.push('Alt')
    if (config.shift)
      parts.push('⇧')

    parts.push(config.key.toUpperCase())

    return parts.join(' + ')
  }

  /**
   * Cleanup
   */
  destroy() {
    document.removeEventListener('keydown', this.handleKeyDown)
    this.shortcuts.clear()
    this.listeners.clear()
  }
}

/**
 * Global shortcut manager instance
 */
export const shortcutManager = new KeyboardShortcutManager()

/**
 * React hook for keyboard shortcuts
 */
export const useKeyboardShortcuts = (shortcuts: ShortcutConfig[]) => {
  React.useEffect(() => {
    const unregister = shortcutManager.registerMany(shortcuts)
    return unregister
  }, [shortcuts])
}

/**
 * React hook for single keyboard shortcut
 */
export const useKeyboardShortcut = (config: ShortcutConfig) => {
  React.useEffect(() => {
    const unregister = shortcutManager.register(config)
    return unregister
  }, [config])
}

/**
 * Common keyboard shortcuts for chat application
 */
export const createChatShortcuts = (actions: {
  newConversation: () => void
  sendMessage: () => void
  focusInput: () => void
  openSettings: () => void
  openHelp: () => void
  toggleSidebar: () => void
  searchConversations: () => void
  clearInput: () => void
}) => {
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().includes('MAC')
  const cmdKey = isMac ? 'meta' : 'ctrl'

  return [
    {
      key: 'n',
      [cmdKey]: true,
      description: 'New conversation',
      action: actions.newConversation,
    },
    {
      key: 'Enter',
      [cmdKey]: true,
      description: 'Send message',
      action: actions.sendMessage,
    },
    {
      key: '/',
      [cmdKey]: true,
      description: 'Focus message input',
      action: actions.focusInput,
    },
    {
      key: ',',
      [cmdKey]: true,
      description: 'Open settings',
      action: actions.openSettings,
    },
    {
      key: '/',
      [cmdKey]: true,
      shift: true,
      description: 'Show keyboard shortcuts',
      action: actions.openHelp,
    },
    {
      key: 'b',
      [cmdKey]: true,
      description: 'Toggle sidebar',
      action: actions.toggleSidebar,
    },
    {
      key: 'k',
      [cmdKey]: true,
      description: 'Search conversations',
      action: actions.searchConversations,
    },
    {
      key: 'Escape',
      description: 'Clear input',
      action: actions.clearInput,
    },
  ] as ShortcutConfig[]
}

/**
 * Accessibility utilities
 */
export class AccessibilityManager {
  private announcer: HTMLElement | null = null

  constructor() {
    this.setupAnnouncer()
  }

  /**
   * Setup screen reader announcer
   */
  private setupAnnouncer() {
    if (typeof window === 'undefined')
      return

    this.announcer = document.createElement('div')
    this.announcer.setAttribute('aria-live', 'polite')
    this.announcer.setAttribute('aria-atomic', 'true')
    this.announcer.style.position = 'absolute'
    this.announcer.style.left = '-10000px'
    this.announcer.style.width = '1px'
    this.announcer.style.height = '1px'
    this.announcer.style.overflow = 'hidden'

    document.body.appendChild(this.announcer)
  }

  /**
   * Announce text to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.announcer)
      return

    this.announcer.setAttribute('aria-live', priority)
    this.announcer.textContent = message

    // Clear after announcement
    setTimeout(() => {
      if (this.announcer)
        this.announcer.textContent = ''
    }, 1000)
  }

  /**
   * Focus management utilities
   */
  focusFirst(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0)
      focusableElements[0].focus()
  }

  focusLast(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length > 0)
      focusableElements[focusableElements.length - 1].focus()
  }

  /**
   * Get all focusable elements within a container
   */
  getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]',
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter((element) => {
        const style = window.getComputedStyle(element)
        return style.display !== 'none' && style.visibility !== 'hidden'
      }) as HTMLElement[]
  }

  /**
   * Trap focus within container
   */
  trapFocus(container: HTMLElement) {
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0)
      return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab')
        return

      if (event.shiftKey) {
        if (document.activeElement === firstElement) {
          event.preventDefault()
          lastElement.focus()
        }
      }
      else {
        if (document.activeElement === lastElement) {
          event.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)

    // Focus first element
    firstElement.focus()

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown)
    }
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.announcer) {
      document.body.removeChild(this.announcer)
      this.announcer = null
    }
  }
}

/**
 * Global accessibility manager instance
 */
export const accessibilityManager = new AccessibilityManager()

/**
 * React hook for accessibility features
 */
export const useAccessibility = () => {
  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    accessibilityManager.announce(message, priority)
  }, [])

  const trapFocus = React.useCallback((container: HTMLElement) => {
    return accessibilityManager.trapFocus(container)
  }, [])

  return {
    announce,
    trapFocus,
    focusFirst: accessibilityManager.focusFirst.bind(accessibilityManager),
    focusLast: accessibilityManager.focusLast.bind(accessibilityManager),
    getFocusableElements: accessibilityManager.getFocusableElements.bind(accessibilityManager),
  }
}

/**
 * Focus trap hook for modals and dialogs
 */
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!isActive || !containerRef.current)
      return

    const cleanup = accessibilityManager.trapFocus(containerRef.current)
    return cleanup
  }, [isActive])

  return containerRef
}

/**
 * Keyboard navigation hook for lists
 */
export const useKeyboardNavigation = <T extends HTMLElement>(
  items: T[],
  options: {
    orientation?: 'horizontal' | 'vertical'
    loop?: boolean
    onActivate?: (item: T, index: number) => void
  } = {},
) => {
  const { orientation = 'vertical', loop = true, onActivate } = options
  const [focusedIndex, setFocusedIndex] = React.useState(0)

  const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
    const { key } = event
    let nextIndex = focusedIndex

    if (orientation === 'vertical') {
      if (key === 'ArrowDown') {
        nextIndex = loop
          ? (focusedIndex + 1) % items.length
          : Math.min(focusedIndex + 1, items.length - 1)
      }
      else if (key === 'ArrowUp') {
        nextIndex = loop
          ? (focusedIndex - 1 + items.length) % items.length
          : Math.max(focusedIndex - 1, 0)
      }
    }
    else {
      if (key === 'ArrowRight') {
        nextIndex = loop
          ? (focusedIndex + 1) % items.length
          : Math.min(focusedIndex + 1, items.length - 1)
      }
      else if (key === 'ArrowLeft') {
        nextIndex = loop
          ? (focusedIndex - 1 + items.length) % items.length
          : Math.max(focusedIndex - 1, 0)
      }
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      onActivate?.(items[focusedIndex], focusedIndex)
      return
    }

    if (nextIndex !== focusedIndex) {
      event.preventDefault()
      setFocusedIndex(nextIndex)
      items[nextIndex]?.focus()
    }
  }, [focusedIndex, items, loop, onActivate, orientation])

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return {
    focusedIndex,
    setFocusedIndex,
  }
}

export default {
  KeyboardShortcutManager,
  AccessibilityManager,
  shortcutManager,
  accessibilityManager,
  useKeyboardShortcuts,
  useKeyboardShortcut,
  useAccessibility,
  useFocusTrap,
  useKeyboardNavigation,
  createChatShortcuts,
}
