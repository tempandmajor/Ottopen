'use client'

import Image, { ImageProps } from 'next/image'
import { useState, useCallback } from 'react'
import { cn } from '@/src/lib/utils'

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string
  className?: string
  containerClassName?: string
  showLoadingSpinner?: boolean
  onLoadComplete?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  fallback = '/images/placeholder.jpg',
  className,
  containerClassName,
  showLoadingSpinner = true,
  onLoadComplete,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoadComplete?.()
  }, [onLoadComplete])

  const handleError = useCallback(() => {
    setHasError(true)
    setIsLoading(false)
    setCurrentSrc(fallback)
    onError?.()
  }, [fallback, onError])

  return (
    <div className={cn('relative overflow-hidden', containerClassName)}>
      {isLoading && showLoadingSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}
      <Image
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          hasError ? 'opacity-75' : '',
          className
        )}
        {...props}
      />
    </div>
  )
}

// Progressive image component that loads low quality first
interface ProgressiveImageProps extends OptimizedImageProps {
  lowQualitySrc?: string
}

export function ProgressiveImage({
  src,
  lowQualitySrc,
  alt,
  className,
  ...props
}: ProgressiveImageProps) {
  const [isHighResLoaded, setIsHighResLoaded] = useState(false)

  return (
    <div className="relative">
      {lowQualitySrc && (
        <Image
          src={lowQualitySrc}
          alt={alt}
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            isHighResLoaded ? 'opacity-0' : 'opacity-100 blur-sm',
            className
          )}
          {...props}
        />
      )}
      <OptimizedImage
        src={src}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isHighResLoaded ? 'opacity-100' : 'opacity-0',
          className
        )}
        onLoadComplete={() => setIsHighResLoaded(true)}
        {...props}
      />
    </div>
  )
}

// Avatar component with optimizations
interface OptimizedAvatarProps {
  src?: string
  alt: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallbackText?: string
  className?: string
}

export function OptimizedAvatar({
  src,
  alt,
  size = 'md',
  fallbackText,
  className,
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false)

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  const fallbackInitials = fallbackText
    ?.split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground',
          sizeClasses[size],
          className
        )}
      >
        {fallbackInitials}
      </div>
    )
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
      height={size === 'xl' ? 64 : size === 'lg' ? 48 : size === 'md' ? 40 : 32}
      className={cn('rounded-full object-cover', sizeClasses[size], className)}
      onError={() => setHasError(true)}
      showLoadingSpinner={false}
    />
  )
}