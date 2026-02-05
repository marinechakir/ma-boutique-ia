'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useCart } from './CartContext'
import CheckoutModal from './CheckoutModal'

interface CartProps {
  isOpen: boolean
  onClose: () => void
}

export default function Cart({ isOpen, onClose }: CartProps) {
  const { items, removeFromCart, updateQuantity, totalPrice, clearCart } = useCart()
  const [showCheckout, setShowCheckout] = useState(false)

  if (!isOpen) return null

  const handleCheckout = () => {
    setShowCheckout(true)
  }

  const handleCheckoutClose = () => {
    setShowCheckout(false)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50">
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />

        <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Votre Panier</h2>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p>Votre panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                      <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl overflow-hidden flex-shrink-0">
                        {item.image.startsWith('http') ? (
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            {item.image}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                        <p className="text-blue-600 font-semibold mt-1">{item.price.toFixed(2)} €</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 rounded-full bg-white border flex items-center justify-center text-sm hover:bg-gray-100"
                          >
                            -
                          </button>
                          <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 rounded-full bg-white border flex items-center justify-center text-sm hover:bg-gray-100"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="ml-auto text-red-500 text-sm hover:text-red-600"
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {items.length > 0 && (
              <div className="p-6 border-t bg-gray-50">
                <div className="flex justify-between mb-4">
                  <span className="text-gray-600">Total</span>
                  <span className="text-xl font-bold">{totalPrice.toFixed(2)} €</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-colors"
                >
                  Commander
                </button>
                <button
                  onClick={clearCart}
                  className="w-full mt-2 py-2 text-gray-500 text-sm hover:text-gray-700"
                >
                  Vider le panier
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <CheckoutModal isOpen={showCheckout} onClose={handleCheckoutClose} />
    </>
  )
}
