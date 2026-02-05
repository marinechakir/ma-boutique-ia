'use client'

import { useState } from 'react'
import { Product } from '@/types/product'
import ProductCard from './ProductCard'

interface ProductGridProps {
  products: Product[]
}

const categories = [
  { id: 'all', label: 'All' },
  { id: 'tech', label: 'Tech' },
  { id: 'shapewear', label: 'Body & Shape' },
  { id: 'kitchen', label: 'Kitchen' },
]

export default function ProductGrid({ products }: ProductGridProps) {
  const [activeCategory, setActiveCategory] = useState('all')

  const filteredProducts = activeCategory === 'all'
    ? products
    : products.filter(p => p.category === activeCategory)

  return (
    <section id="products" className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-blue-600 font-medium text-sm uppercase tracking-wider">
            #TikTokMadeMeBuyIt 2026
          </span>
          <h2 className="text-4xl md:text-5xl font-black tracking-tight mt-3 mb-4">
            The Drop
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto">
            Les produits les plus viraux. Testés. Approuvés. Livrés.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-2 mb-12 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                activeCategory === cat.id
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Aucun produit dans cette catégorie.
          </div>
        )}
      </div>
    </section>
  )
}
