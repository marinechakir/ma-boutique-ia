export interface Product {
  id: string
  name: string
  price: number
  description: string
  image: string
  images?: string[] // Multiple images for carousel
  category: string
  trending: boolean
  // Extended product info
  longDescription?: string
  sizes?: string[]
  colors?: { name: string; hex: string }[]
  sizeGuide?: {
    sizes: string[]
    measurements: { size: string; bust: string; waist: string; hips: string }[]
  }
  // CJ Dropshipping
  cj_sku?: string
  cj_vid?: string
  // Valentine's Day
  valentineGift?: boolean
  valentineDescription?: string
}

export interface CartItem extends Product {
  quantity: number
  selectedSize?: string
  selectedColor?: string
}
