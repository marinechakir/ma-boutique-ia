import Hero from '@/components/Hero'
import ProductGrid from '@/components/ProductGrid'
import products from '@/data/products.json'

export default function Home() {
  return (
    <>
      <Hero />
      <ProductGrid products={products} />

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-2xl font-black tracking-tighter mb-2">
            DRIP<span className="text-blue-600">.</span>
          </p>
          <p className="text-gray-500 text-sm">
            © 2026 DRIP. Tous droits réservés.
          </p>
        </div>
      </footer>
    </>
  )
}
