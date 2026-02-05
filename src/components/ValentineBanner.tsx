'use client'

import { useState } from 'react'

export default function ValentineBanner() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div className="bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 border-b border-rose-100 relative z-40">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-2 text-sm relative">
        <span className="text-rose-400">
          <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </span>
        <span className="text-gray-700 font-medium">
          Offre Saint-Valentin : <span className="text-rose-600 font-semibold">Livraison Express Garantie avant le 14 Fevrier !</span>
        </span>
        <span className="text-rose-400">
          <svg className="w-4 h-4 inline" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
        </span>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 text-rose-300 hover:text-rose-500 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}
