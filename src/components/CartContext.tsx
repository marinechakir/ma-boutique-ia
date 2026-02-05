'use client'

import { createContext, useContext, useState, ReactNode } from 'react'
import { Product, CartItem } from '@/types/product'

interface CartContextType {
  items: CartItem[]
  addToCart: (product: Product & { selectedSize?: string; selectedColor?: string }) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  totalItems: number
  totalPrice: number
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  const addToCart = (product: Product & { selectedSize?: string; selectedColor?: string }) => {
    setItems(current => {
      const itemKey = `${product.id}-${product.selectedSize || ''}-${product.selectedColor || ''}`
      const existing = current.find(item =>
        `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}` === itemKey
      )
      if (existing) {
        return current.map(item =>
          `${item.id}-${item.selectedSize || ''}-${item.selectedColor || ''}` === itemKey
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...current, { ...product, quantity: 1 }]
    })
  }

  const removeFromCart = (productId: string) => {
    setItems(current => current.filter(item => item.id !== productId))
  }

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId)
      return
    }
    setItems(current =>
      current.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }

  const clearCart = () => setItems([])

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <CartContext.Provider value={{
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      isOpen,
      setIsOpen
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
