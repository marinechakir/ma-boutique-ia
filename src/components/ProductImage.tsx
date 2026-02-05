'use client'

interface ProductImageProps {
  productId: string
  className?: string
}

export default function ProductImage({ productId, className = '' }: ProductImageProps) {
  const images: Record<string, JSX.Element> = {
    'mini-projector-2025': <ProjectorSVG />,
    'portable-blender-usb': <BlenderSVG />,
    'wireless-charger-3in1': <ChargerSVG />,
  }

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      {images[productId] || <DefaultSVG />}
    </div>
  )
}

function ProjectorSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-lg">
      <defs>
        <linearGradient id="projectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1e1e" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </linearGradient>
        <linearGradient id="lensGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      {/* Body */}
      <rect x="40" y="70" width="120" height="70" rx="12" fill="url(#projectorGrad)" />
      {/* Top detail */}
      <rect x="50" y="75" width="100" height="4" rx="2" fill="#4a4a4a" />
      {/* Lens */}
      <circle cx="100" cy="105" r="28" fill="url(#lensGrad)" filter="url(#glow)" />
      <circle cx="100" cy="105" r="20" fill="#1e3a5f" />
      <circle cx="100" cy="105" r="12" fill="#60a5fa" opacity="0.8" />
      <circle cx="94" cy="99" r="4" fill="white" opacity="0.6" />
      {/* Vents */}
      <rect x="135" y="85" width="15" height="2" rx="1" fill="#4a4a4a" />
      <rect x="135" y="92" width="15" height="2" rx="1" fill="#4a4a4a" />
      <rect x="135" y="99" width="15" height="2" rx="1" fill="#4a4a4a" />
      {/* Stand */}
      <rect x="60" y="140" width="8" height="15" rx="2" fill="#2a2a2a" />
      <rect x="132" y="140" width="8" height="15" rx="2" fill="#2a2a2a" />
      {/* Light beam */}
      <path d="M72 105 L20 60 L20 150 Z" fill="url(#lensGrad)" opacity="0.15" />
    </svg>
  )
}

function BlenderSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-lg">
      <defs>
        <linearGradient id="blenderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="liquidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="baseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1e1e" />
          <stop offset="100%" stopColor="#3a3a3a" />
        </linearGradient>
      </defs>
      {/* Cup */}
      <path d="M65 40 L60 140 Q60 150 70 150 L130 150 Q140 150 140 140 L135 40 Z"
            fill="url(#blenderGrad)" stroke="#cbd5e1" strokeWidth="2" />
      {/* Liquid */}
      <path d="M68 70 L63 135 Q63 143 72 143 L128 143 Q137 143 137 135 L132 70 Z"
            fill="url(#liquidGrad)" opacity="0.9" />
      {/* Bubbles */}
      <circle cx="85" cy="100" r="5" fill="white" opacity="0.4" />
      <circle cx="110" cy="85" r="4" fill="white" opacity="0.3" />
      <circle cx="95" cy="120" r="3" fill="white" opacity="0.5" />
      <circle cx="115" cy="110" r="6" fill="white" opacity="0.3" />
      {/* Lid */}
      <rect x="58" y="32" width="84" height="12" rx="4" fill="url(#baseGrad)" />
      <rect x="90" y="20" width="20" height="16" rx="4" fill="url(#baseGrad)" />
      {/* Base */}
      <rect x="55" y="150" width="90" height="25" rx="8" fill="url(#baseGrad)" />
      {/* USB-C port */}
      <rect x="95" y="162" width="12" height="4" rx="1" fill="#4a4a4a" />
      {/* LED indicator */}
      <circle cx="75" cy="162" r="3" fill="#4ade80" />
      {/* Measurement lines */}
      <line x1="130" y1="80" x2="125" y2="80" stroke="#94a3b8" strokeWidth="1" />
      <line x1="131" y1="100" x2="125" y2="100" stroke="#94a3b8" strokeWidth="1" />
      <line x1="132" y1="120" x2="125" y2="120" stroke="#94a3b8" strokeWidth="1" />
    </svg>
  )
}

function ChargerSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32 drop-shadow-lg">
      <defs>
        <linearGradient id="chargerBase" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="100%" stopColor="#e2e8f0" />
        </linearGradient>
        <linearGradient id="phoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e1e1e" />
          <stop offset="100%" stopColor="#2a2a2a" />
        </linearGradient>
        <linearGradient id="screenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="watchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="100%" stopColor="#1f2937" />
        </linearGradient>
      </defs>
      {/* Base platform */}
      <ellipse cx="100" cy="170" rx="70" ry="12" fill="#e2e8f0" />
      <rect x="30" y="155" width="140" height="15" rx="4" fill="url(#chargerBase)" />
      {/* Phone stand */}
      <rect x="55" y="60" width="50" height="95" rx="6" fill="url(#phoneGrad)" />
      <rect x="59" y="65" width="42" height="80" rx="3" fill="url(#screenGrad)" />
      {/* Phone notch */}
      <rect x="72" y="67" width="16" height="4" rx="2" fill="#1e1e1e" />
      {/* MagSafe ring */}
      <circle cx="80" cy="105" r="18" fill="none" stroke="white" strokeWidth="2" opacity="0.3" />
      {/* Charging indicator */}
      <path d="M76 100 L80 95 L78 103 L84 103 L80 112 L82 104 L76 104 Z" fill="#4ade80" />
      {/* Apple Watch */}
      <rect x="115" y="85" width="35" height="42" rx="8" fill="url(#watchGrad)" />
      <rect x="119" y="90" width="27" height="32" rx="5" fill="#111827" />
      <circle cx="132" cy="106" r="10" fill="none" stroke="#4ade80" strokeWidth="2" />
      <path d="M129 106 L131 108 L136 103" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" />
      {/* Watch band hints */}
      <rect x="122" y="75" width="22" height="10" rx="3" fill="#374151" />
      <rect x="122" y="127" width="22" height="10" rx="3" fill="#374151" />
      {/* AirPods case */}
      <rect x="65" y="158" width="30" height="22" rx="6" fill="white" stroke="#e5e7eb" strokeWidth="1" />
      <ellipse cx="80" cy="165" rx="8" ry="4" fill="#f3f4f6" />
      {/* LED on base */}
      <circle cx="100" cy="162" r="2" fill="#4ade80" />
    </svg>
  )
}

function DefaultSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-32 h-32">
      <rect x="50" y="50" width="100" height="100" rx="12" fill="#e5e7eb" />
      <text x="100" y="105" textAnchor="middle" fill="#9ca3af" fontSize="14">Image</text>
    </svg>
  )
}
