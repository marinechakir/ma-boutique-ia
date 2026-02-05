import type { Metadata } from 'next'
import './globals.css'
import { CartProvider } from '@/components/CartContext'
import Navbar from '@/components/Navbar'
import ValentineBanner from '@/components/ValentineBanner'

export const metadata: Metadata = {
  title: 'DRIP. | Gadgets & Style Viraux',
  description: 'Les produits les plus viraux de TikTok. Tech, Beauty, Lifestyle. Livraison 24h.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className="antialiased">
        <CartProvider>
          <ValentineBanner />
          <Navbar />
          <main>{children}</main>
        </CartProvider>
      </body>
    </html>
  )
}
