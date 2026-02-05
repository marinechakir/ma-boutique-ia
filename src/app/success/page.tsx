'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SuccessContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

  useEffect(() => {
    if (sessionId) {
      // In production: verify session with Stripe
      setStatus('success')
    } else {
      setStatus('error')
    }
  }, [sessionId])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
          <p className="text-gray-500 mb-6">Impossible de confirmer votre commande.</p>
          <Link
            href="/"
            className="px-8 py-3 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
          >
            Retour à la boutique
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-20">
      <div className="text-center max-w-md">
        {/* Success Animation */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-3xl font-black mb-3">Commande confirmée !</h1>

        <p className="text-gray-500 mb-8">
          Merci pour votre achat. Vous recevrez un email de confirmation avec les détails de suivi.
        </p>

        {/* Order Info Card */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <h3 className="font-semibold mb-4">Prochaines étapes</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">1</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Confirmation</strong> - Email envoyé avec le récapitulatif
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">2</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Préparation</strong> - Votre commande est en cours de traitement
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-blue-600 text-xs font-bold">3</span>
              </div>
              <p className="text-sm text-gray-600">
                <strong>Expédition</strong> - Livraison sous 7-10 jours ouvrés
              </p>
            </div>
          </div>
        </div>

        {/* Tracking Note */}
        <div className="bg-blue-50 rounded-xl p-4 mb-8">
          <p className="text-sm text-blue-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2v5a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1v-5a1 1 0 00-.293-.707l-3-3A1 1 0 0015 6h-2V5a1 1 0 00-1-1H3z" />
            </svg>
            Numéro de suivi envoyé par email dès l'expédition
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="px-8 py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors"
          >
            Continuer mes achats
          </Link>
        </div>

        {/* Session ID for reference */}
        {sessionId && (
          <p className="mt-8 text-xs text-gray-400">
            Référence: {sessionId.slice(0, 20)}...
          </p>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  )
}
