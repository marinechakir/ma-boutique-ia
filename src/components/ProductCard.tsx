'use client'

import { useState } from 'react'
import { Product } from '@/types/product'
import { useCart } from './CartContext'
import { ProductPremiumImage } from './PremiumImage'
import ProductDetailModal from './ProductDetailModal'

interface ProductCardProps {
  product: Product
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const isExternalImage = product.image.startsWith('http')

  return (
    <div className="group">
      <div
        className="relative aspect-square bg-gradient-to-br from-gray-50 via-white to-gray-100 rounded-3xl overflow-hidden mb-4 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Valentine Gift Badge */}
        {product.valentineGift && (
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-wider flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Cadeau Ideal
            </span>
          </div>
        )}

        {/* Trending Badge */}
        {product.trending && !product.valentineGift && (
          <div className="absolute top-4 left-4 z-20">
            <span className="px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-wider">
              Viral
            </span>
          </div>
        )}

        {/* Category Badge */}
        <div className="absolute top-4 right-4 z-20">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-md text-gray-700 text-[10px] font-semibold rounded-full shadow-sm uppercase tracking-wider border border-gray-100">
            {product.category}
          </span>
        </div>

        {/* Product Image - Premium Enhanced */}
        <div className="absolute inset-0 group-hover:scale-[1.02] transition-transform duration-700 ease-out">
          {isExternalImage ? (
            <ProductPremiumImage
              src={product.image}
              alt={product.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-gray-100 to-gray-200">
              {product.image}
            </div>
          )}
        </div>

        {/* Subtle overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10" />

        {/* Quick Add Button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            addToCart(product)
          }}
          className="absolute bottom-4 right-4 w-11 h-11 bg-white text-gray-900 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-gray-900 hover:text-white hover:scale-110 shadow-xl z-20"
          aria-label="Ajouter au panier"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Product Info */}
      <div className="px-1">
        <h3
          className="font-semibold text-gray-900 mb-1 line-clamp-1 text-[15px] cursor-pointer hover:text-blue-600 transition-colors"
          onClick={() => setIsModalOpen(true)}
        >
          {product.name}
        </h3>

        <p className="text-sm text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {product.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-0.5">
            <span className="text-2xl font-black text-gray-900 tracking-tight">
              {Math.floor(product.price)}
            </span>
            <span className="text-sm font-bold text-gray-900">
              ,{((product.price % 1) * 100).toFixed(0).padStart(2, '0')}€
            </span>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-blue-600 transition-all duration-200 hover:scale-105"
          >
            Ajouter
          </button>
        </div>

        {/* Trust indicators */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100/80">
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            En stock
          </span>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
              <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2v5a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1v-5a1 1 0 00-.293-.707l-3-3A1 1 0 0015 6h-2V5a1 1 0 00-1-1H3z" />
            </svg>
            7-10 jours
          </span>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={product}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  )
}
