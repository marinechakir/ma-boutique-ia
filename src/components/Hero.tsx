export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background gradient - Valentine's edition */}
      <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 via-white to-white" />

      {/* Floating elements - soft rose tones */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-rose-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-200/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/3 right-1/3 w-48 h-48 bg-red-100/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
        {/* Valentine's badge */}
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 rounded-full text-sm font-medium mb-6 border border-rose-200/50">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
          </svg>
          Special Saint-Valentin
        </span>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
          <span className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
            Get the
          </span>
          <br />
          <span className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 bg-clip-text text-transparent">
            DRIP.
          </span>
        </h1>

        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
          Les cadeaux parfaits pour la Saint-Valentin.
          <span className="text-rose-500 font-medium"> Livraison express garantie avant le 14.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="#products"
            className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:from-rose-600 hover:to-pink-600 transition-all hover:scale-105 shadow-lg shadow-rose-500/25"
          >
            Offrir maintenant
          </a>
          <a
            href="#products"
            className="px-8 py-4 bg-white text-gray-900 rounded-full font-bold border-2 border-rose-200 hover:border-rose-300 hover:bg-rose-50 transition-all hover:scale-105"
          >
            Voir les cadeaux
          </a>
        </div>

        {/* Stats - Valentine's themed */}
        <div className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto">
          <div>
            <div className="text-3xl font-black text-gray-900">50K+</div>
            <div className="text-sm text-gray-500">Cadeaux offerts</div>
          </div>
          <div>
            <div className="text-3xl font-black bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">100%</div>
            <div className="text-sm text-gray-500">Satisfaits</div>
          </div>
          <div>
            <div className="text-3xl font-black text-gray-900">J-9</div>
            <div className="text-sm text-rose-500 font-medium">Avant le 14 fev</div>
          </div>
        </div>
      </div>
    </section>
  )
}
