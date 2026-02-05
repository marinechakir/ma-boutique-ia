'use client'

import Image from 'next/image'
import { useState } from 'react'

interface PremiumImageProps {
  src: string
  alt: string
  fill?: boolean
  width?: number
  height?: number
  className?: string
  priority?: boolean
  // Premium filter presets
  filter?: 'none' | 'premium' | 'bright' | 'contrast' | 'apple'
  // Cropping to remove logos/watermarks
  cropInset?: number // percentage to crop from edges (e.g., 5 = 5%)
}

// CSS filters for different looks
const FILTER_PRESETS = {
  none: '',
  premium: 'brightness(1.05) contrast(1.08) saturate(1.05)',
  bright: 'brightness(1.12) contrast(1.05) saturate(0.95)',
  contrast: 'brightness(1.02) contrast(1.15) saturate(1.02)',
  apple: 'brightness(1.08) contrast(1.1) saturate(0.92) drop-shadow(0 4px 12px rgba(0,0,0,0.08))',
}

// Shimmer placeholder
const shimmer = `
<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shimmer" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#f8f9fa">
        <animate attributeName="offset" values="-2; 1" dur="2s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" stop-color="#e9ecef">
        <animate attributeName="offset" values="-1; 2" dur="2s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="#f8f9fa">
        <animate attributeName="offset" values="0; 3" dur="2s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
  </defs>
  <rect fill="url(#shimmer)" width="100%" height="100%"/>
</svg>`

const toBase64 = (str: string) =>
  typeof window === 'undefined' ? Buffer.from(str).toString('base64') : window.btoa(str)

export default function PremiumImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  priority = false,
  filter = 'apple',
  cropInset = 0,
}: PremiumImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Calculate crop styling
  const cropStyle = cropInset > 0 ? {
    transform: `scale(${1 + (cropInset * 2) / 100})`,
  } : {}

  // Fallback placeholder
  if (hasError) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex items-center justify-center ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      >
        <div className="text-center p-4">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-gray-400">Image</span>
        </div>
      </div>
    )
  }

  const filterStyle = FILTER_PRESETS[filter]

  const imageComponent = (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? (width || 400) : undefined}
      height={!fill ? (height || 400) : undefined}
      priority={priority}
      quality={92}
      placeholder="blur"
      blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer)}`}
      className={`
        transition-all duration-700 ease-out
        ${isLoading ? 'scale-110 blur-xl opacity-0' : 'scale-100 blur-0 opacity-100'}
        ${className}
      `}
      style={{
        objectFit: 'cover',
        filter: filterStyle,
        ...cropStyle,
      }}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      sizes={fill ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" : undefined}
    />
  )

  // Wrapper for overflow hidden (for cropping effect)
  if (cropInset > 0 && fill) {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {imageComponent}
      </div>
    )
  }

  return imageComponent
}

// Utility component for product images specifically
export function ProductPremiumImage({
  src,
  alt,
  className = ''
}: {
  src: string
  alt: string
  className?: string
}) {
  return (
    <div className={`relative w-full h-full ${className}`}>
      <PremiumImage
        src={src}
        alt={alt}
        fill
        filter="apple"
        cropInset={2} // Slight crop to remove edge artifacts
        className="object-cover"
      />
      {/* Subtle vignette overlay for premium look */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.03) 100%)',
        }}
      />
    </div>
  )
}
