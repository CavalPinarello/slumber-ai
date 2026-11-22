// Micro-interactions and UI animations for enhanced user experience

import React from 'react'
import { memoWithShallowCompare } from '@/components/performance/memoization'

/**
 * Animation configuration types
 */
export type AnimationConfig = {
  duration?: number
  easing?: string
  delay?: number
  iteration?: number | 'infinite'
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both'
}

/**
 * Spring animation parameters
 */
export type SpringConfig = {
  tension?: number
  friction?: number
  mass?: number
}

/**
 * Fade in animation hook
 */
export const useFadeIn = (isVisible: boolean, config: AnimationConfig = {}) => {
  const [opacity, setOpacity] = React.useState(isVisible ? 1 : 0)
  const [shouldRender, setShouldRender] = React.useState(isVisible)

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => setOpacity(1), 10)
      return () => clearTimeout(timer)
    }
 else {
      setOpacity(0)
      const timer = setTimeout(() => setShouldRender(false), config.duration || 200)
      return () => clearTimeout(timer)
    }
  }, [isVisible, config.duration])

  const style: React.CSSProperties = {
    opacity,
    transition: `opacity ${config.duration || 200}ms ${config.easing || 'ease-in-out'}`,
  }

  return { shouldRender, style }
}

/**
 * Slide animation hook
 */
export const useSlideAnimation = (
  isVisible: boolean,
  direction: 'up' | 'down' | 'left' | 'right' = 'up',
  config: AnimationConfig = {},
) => {
  const [transform, setTransform] = React.useState(() => {
    const hideTransforms = {
      up: 'translateY(20px)',
      down: 'translateY(-20px)',
      left: 'translateX(20px)',
      right: 'translateX(-20px)',
    }
    return isVisible ? 'translateY(0)' : hideTransforms[direction]
  })

  const [opacity, setOpacity] = React.useState(isVisible ? 1 : 0)
  const [shouldRender, setShouldRender] = React.useState(isVisible)

  React.useEffect(() => {
    if (isVisible) {
      setShouldRender(true)
      const timer = setTimeout(() => {
        setTransform('translate(0)')
        setOpacity(1)
      }, 10)
      return () => clearTimeout(timer)
    }
 else {
      const hideTransforms = {
        up: 'translateY(20px)',
        down: 'translateY(-20px)',
        left: 'translateX(20px)',
        right: 'translateX(-20px)',
      }
      setTransform(hideTransforms[direction])
      setOpacity(0)

      const timer = setTimeout(() => setShouldRender(false), config.duration || 200)
      return () => clearTimeout(timer)
    }
  }, [isVisible, direction, config.duration])

  const style: React.CSSProperties = {
    transform,
    opacity,
    transition: `all ${config.duration || 200}ms ${config.easing || 'ease-out'}`,
  }

  return { shouldRender, style }
}

/**
 * Scale animation hook
 */
export const useScaleAnimation = (isVisible: boolean, config: AnimationConfig = {}) => {
  const [scale, setScale] = React.useState(isVisible ? 1 : 0.95)
  const [opacity, setOpacity] = React.useState(isVisible ? 1 : 0)

  React.useEffect(() => {
    if (isVisible) {
      setScale(1)
      setOpacity(1)
    }
 else {
      setScale(0.95)
      setOpacity(0)
    }
  }, [isVisible])

  const style: React.CSSProperties = {
    transform: `scale(${scale})`,
    opacity,
    transition: `all ${config.duration || 150}ms ${config.easing || 'ease-out'}`,
  }

  return { style }
}

/**
 * Pulse animation component
 */
export const PulseAnimation = memoWithShallowCompare<{
  children: React.ReactNode
  isActive?: boolean
  intensity?: 'light' | 'medium' | 'strong'
  className?: string
}>(({ children, isActive = true, intensity = 'medium', className }) => {
  const intensityScale = {
    light: '1.02',
    medium: '1.05',
    strong: '1.1',
  }

  return (
    <div
      className={`${className || ''} ${isActive ? 'animate-pulse-scale' : ''}`}
      style={{
        '--pulse-scale': intensityScale[intensity],
      } as React.CSSProperties}
    >
      {children}
      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(var(--pulse-scale, 1.05)); }
        }
        .animate-pulse-scale {
          animation: pulse-scale 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  )
})

/**
 * Typing indicator animation
 */
export const TypingIndicator = memoWithShallowCompare<{
  isVisible: boolean
  className?: string
}>(({ isVisible, className }) => {
  const { shouldRender, style } = useFadeIn(isVisible)

  if (!shouldRender) 
return null

  return (
    <div className={`flex items-center space-x-1 ${className || ''}`} style={style}>
      <div className="flex space-x-1">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 bg-text-tertiary rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.1}s`,
              animationDuration: '0.6s',
            }}
          />
        ))}
      </div>
      <span className="text-sm text-text-tertiary ml-2">Typing...</span>
    </div>
  )
})

/**
 * Message appear animation
 */
export const MessageAppearAnimation = memoWithShallowCompare<{
  children: React.ReactNode
  delay?: number
  className?: string
}>(({ children, delay = 0, className }) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const { shouldRender, style } = useSlideAnimation(isVisible, 'up')

  React.useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
})

/**
 * Ripple effect hook and component
 */
export const useRippleEffect = () => {
  const [ripples, setRipples] = React.useState<Array<{
    x: number
    y: number
    id: number
  }>>([])

  const addRipple = React.useCallback((event: React.MouseEvent<HTMLElement>) => {
    const element = event.currentTarget
    const rect = element.getBoundingClientRect()

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const id = Date.now()

    setRipples(prev => [...prev, { x, y, id }])

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== id))
    }, 600)
  }, [])

  const RippleContainer = React.useMemo(() =>
    memoWithShallowCompare<{ className?: string }>(({ className }) => (
      <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className || ''}`}>
        {ripples.map(ripple => (
          <div
            key={ripple.id}
            className="absolute bg-white bg-opacity-30 rounded-full animate-ripple"
            style={{
              left: ripple.x - 10,
              top: ripple.y - 10,
              width: 20,
              height: 20,
            }}
          />
        ))}
        <style jsx>{`
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(4);
              opacity: 0;
            }
          }
          .animate-ripple {
            animation: ripple 0.6s ease-out;
          }
        `}</style>
      </div>
    )), [ripples],
  )

  return { addRipple, RippleContainer }
}

/**
 * Button with ripple effect
 */
export const RippleButton = memoWithShallowCompare<{
  children: React.ReactNode
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
  className?: string
  disabled?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>>({ 
  children, 
  onClick, 
  className, 
  disabled,
  ...props 
}) => {
  const { addRipple, RippleContainer } = useRippleEffect()

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      addRipple(event)
      onClick?.(event)
    }
  }

  return (
    <button
      {...props}
      className={`relative overflow-hidden ${className || ''}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {children}
      <RippleContainer />
    </button>
  )
}

/**
 * Shimmer loading animation
 */
export const ShimmerLoader = memoWithShallowCompare<{
  width?: string | number
  height?: string | number
  className?: string
  borderRadius?: string | number
}>(({ width = '100%', height = '20px', className, borderRadius = '4px' }) => (
  <div
    className={`bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer ${className || ''}`}
    style={{
      width,
      height,
      borderRadius,
    }}
  >
    <style jsx>{`
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      .animate-shimmer {
        animation: shimmer 1.5s ease-in-out infinite;
      }
    `}</style>
  </div>
))

/**
 * Floating action button with animations
 */
export const FloatingActionButton = memoWithShallowCompare<{
  children: React.ReactNode
  onClick?: () => void
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
  isVisible?: boolean
}>({ 
  children, 
  onClick, 
  position = 'bottom-right',
  className,
  isVisible = true 
}) => {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  }

  const { shouldRender, style: fadeStyle } = useFadeIn(isVisible)
  const { style: scaleStyle } = useScaleAnimation(isVisible)

  if (!shouldRender) return null

  return (
    <button
      onClick={onClick}
      className={`
        fixed w-14 h-14 bg-primary-500 hover:bg-primary-600 
        text-white rounded-full shadow-lg hover:shadow-xl
        transition-all duration-200 ease-out
        flex items-center justify-center
        transform hover:scale-110
        ${positionClasses[position]}
        ${className || ''}
      `}
      style={{ ...fadeStyle, ...scaleStyle }}
    >
      {children}
    </button>
  )
}

/**
 * Progress bar with smooth animation
 */
export const AnimatedProgressBar = memoWithShallowCompare<{
  progress: number // 0-100
  className?: string
  showLabel?: boolean
  color?: string
  height?: string | number
}>(({
  progress,
  className,
  showLabel = false,
  color = 'bg-primary-500',
  height = '8px', 
}) => {
  const [animatedProgress, setAnimatedProgress] = React.useState(0)

  React.useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 100)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className={`w-full ${className || ''}`}>
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm text-text-secondary">Progress</span>
          <span className="text-sm text-text-primary">{Math.round(progress)}%</span>
        </div>
      )}
      <div
        className="w-full bg-background-secondary rounded-full overflow-hidden"
        style={{ height }}
      >
        <div
          className={`h-full ${color} transition-all duration-500 ease-out`}
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  )
})

/**
 * Notification toast with slide animation
 */
export const AnimatedToast = memoWithShallowCompare<{
  isVisible: boolean
  message: string
  type?: 'success' | 'error' | 'warning' | 'info'
  onClose?: () => void
  duration?: number
}>({ 
  isVisible, 
  message, 
  type = 'info', 
  onClose,
  duration = 3000 
}) => {
  const { shouldRender, style } = useSlideAnimation(isVisible, 'down')

  React.useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => onClose?.(), duration)
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!shouldRender) return null

  const typeStyles = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  }

  return (
    <div
      className={`
        fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50
        ${typeStyles[type]}
      `}
      style={style}
    >
      <div className="flex items-center justify-between">
        <span>{message}</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 hover:opacity-80"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Count up animation hook
 */
export const useCountUp = (
  target: number,
  duration = 1000,
  startOnMount = true,
) => {
  const [current, setCurrent] = React.useState(0)
  const [isAnimating, setIsAnimating] = React.useState(false)

  const start = React.useCallback(() => {
    setIsAnimating(true)
    const startTime = Date.now()
    const startValue = current

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function (ease-out)
      const easeOut = 1 - (1 - progress)**3
      const value = Math.round(startValue + (target - startValue) * easeOut)

      setCurrent(value)

      if (progress < 1) 
        requestAnimationFrame(animate)
       else 
        setIsAnimating(false)
      
    }

    requestAnimationFrame(animate)
  }, [current, target, duration])

  React.useEffect(() => {
    if (startOnMount) 
      start()
    
  }, [startOnMount, start])

  return { current, start, isAnimating }
}

export default {
  useFadeIn,
  useSlideAnimation,
  useScaleAnimation,
  useRippleEffect,
  useCountUp,
  PulseAnimation,
  TypingIndicator,
  MessageAppearAnimation,
  RippleButton,
  ShimmerLoader,
  FloatingActionButton,
  AnimatedProgressBar,
  AnimatedToast,
}
