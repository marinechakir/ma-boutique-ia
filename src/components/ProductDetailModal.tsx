'use client'

import { useState } from 'react'
import { Product } from '@/types/product'
import { useCart } from './CartContext'
import { ProductPremiumImage } from './PremiumImage'

interface ProductDetailModalProps {
  product: Product
  isOpen: boolean
  onClose: () => void
}

export default function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart()
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState<string | undefined>(product.sizes?.[0])
  const [selectedColor, setSelectedColor] = useState<string | undefined>(product.colors?.[0]?.name)

  const images = product.images || [product.image]

  const handleAddToCart = () => {
    addToCart({
      ...product,
      selectedSize,
      selectedColor,
    })
    onClose()
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-3xl max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-lg"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Carousel */}
          <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
            <ProductPremiumImage
              src={images[currentImageIndex]}
              alt={product.name}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                >
                  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Image Dots */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? 'bg-gray-900 w-6'
                        : 'bg-gray-400 hover:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="absolute bottom-16 left-4 right-4 flex gap-2 justify-center">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-gray-900 shadow-lg'
                        : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="p-8 overflow-y-auto max-h-[90vh] md:max-h-none">
            {/* Category Badge */}
            <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full uppercase tracking-wider mb-4">
              {product.category}
            </span>

            {/* Product Name */}
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-3xl font-black text-gray-900">
                {Math.floor(product.price)}
              </span>
              <span className="text-lg font-bold text-gray-900">
                ,{((product.price % 1) * 100).toFixed(0).padStart(2, '0')}
              </span>
              <span className="text-lg font-bold text-gray-900">EUR</span>
            </div>

            {/* Long Description */}
            <p className="text-gray-600 leading-relaxed mb-6">
              {product.longDescription || product.description}
            </p>

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Couleur: <span className="font-normal text-gray-600">{selectedColor}</span>
                </h3>
                <div className="flex gap-3">
                  {product.colors.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color.name)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === color.name
                          ? 'border-gray-900 scale-110 shadow-lg'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      style={{ backgroundColor: color.hex }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Taille: <span className="font-normal text-gray-600">{selectedSize}</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-semibold transition-all ${
                        selectedSize === size
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Guide */}
            {product.sizeGuide && (
              <details className="mb-6 group">
                <summary className="flex items-center gap-2 cursor-pointer text-sm font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  <svg className="w-4 h-4 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Guide des tailles (cm)
                </summary>
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-2 px-3 text-left font-semibold text-gray-900">Taille</th>
                        <th className="py-2 px-3 text-left font-semibold text-gray-900">Poitrine</th>
                        <th className="py-2 px-3 text-left font-semibold text-gray-900">Taille</th>
                        <th className="py-2 px-3 text-left font-semibold text-gray-900">Hanches</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.sizeGuide.measurements.map((m) => (
                        <tr
                          key={m.size}
                          className={`border-b border-gray-100 ${
                            selectedSize === m.size ? 'bg-blue-50' : ''
                          }`}
                        >
                          <td className="py-2 px-3 font-semibold text-gray-900">{m.size}</td>
                          <td className="py-2 px-3 text-gray-600">{m.bust}</td>
                          <td className="py-2 px-3 text-gray-600">{m.waist}</td>
                          <td className="py-2 px-3 text-gray-600">{m.hips}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}

            {/* Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-4 bg-gray-900 text-white font-semibold rounded-full hover:bg-blue-600 transition-all duration-200 hover:scale-[1.02] shadow-lg"
            >
              Ajouter au panier
            </button>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-gray-100">
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                En stock
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-5h2v5a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H18a1 1 0 001-1v-5a1 1 0 00-.293-.707l-3-3A1 1 0 0015 6h-2V5a1 1 0 00-1-1H3z" />
                </svg>
                Livraison 7-10 jours
              </span>
              <span className="text-xs text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Retours 30 jours
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
