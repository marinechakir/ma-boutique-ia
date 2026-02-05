'use client'

import { useCart } from './CartContext'
import Cart from './Cart'

export default function Navbar() {
  const { totalItems, setIsOpen, isOpen } = useCart()

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="/" className="text-2xl font-black tracking-tighter">
            DRIP<span className="text-blue-600">.</span>
          </a>

          <div className="flex items-center gap-8">
            <a href="#products" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              Produits
            </a>
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      <Cart isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
