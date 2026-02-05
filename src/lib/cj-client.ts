/**
 * CJ Dropshipping API Client
 * Documentation: https://developers.cjdropshipping.com/
 *
 * IMPORTANT: CJ has a rate limit of 1 auth request per 300 seconds (5 min)
 * Token is cached to file to persist across server restarts
 */

import * as fs from 'fs'
import * as path from 'path'

const CJ_BASE_URL = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_API_KEY = process.env.CJ_API_KEY || ''

// Token cache file path
const TOKEN_CACHE_FILE = path.join(process.cwd(), '.cj-token-cache.json')

interface CJAuthResponse {
  code: number
  result: boolean
  message: string
  data: {
    accessToken: string
    accessTokenExpiryDate: string
    refreshToken: string
    refreshTokenExpiryDate: string
  }
}

interface TokenCache {
  accessToken: string
  expiryDate: string
  createdAt: string
}

interface CJOrderItem {
  vid: string
  quantity: number
}

interface CJCreateOrderRequest {
  orderNumber: string
  shippingCountryCode: string
  shippingCountry: string
  shippingProvince: string
  shippingCity: string
  shippingAddress: string
  shippingAddress2?: string
  shippingCustomerName: string
  shippingZip: string
  shippingPhone: string
  countryCode: string // Required by CJ API
  fromCountryCode?: string
  logisticName?: string
  products: CJOrderItem[]
  remark?: string
}

interface CJOrderResponse {
  code: number
  result: boolean
  message: string
  data: {
    orderId: string
    orderNum: string
    cjOrderId: string
    shippingCountryCode: string
    orderStatus: string
  }
}

/**
 * Read cached token from file
 */
function readCachedToken(): TokenCache | null {
  try {
    if (fs.existsSync(TOKEN_CACHE_FILE)) {
      const data = fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('[CJ] No cached token found or invalid cache')
  }
  return null
}

/**
 * Save token to cache file
 */
function saveCachedToken(token: string, expiryDate: string): void {
  const cache: TokenCache = {
    accessToken: token,
    expiryDate,
    createdAt: new Date().toISOString(),
  }
  try {
    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2))
    console.log('[CJ] Token cached to file')
  } catch (error) {
    console.error('[CJ] Failed to cache token:', error)
  }
}

/**
 * Check if cached token is still valid
 */
function isTokenValid(cache: TokenCache): boolean {
  const expiry = new Date(cache.expiryDate)
  const now = new Date()
  // Add 5 minute buffer before expiry
  const bufferMs = 5 * 60 * 1000
  return now.getTime() < (expiry.getTime() - bufferMs)
}

/**
 * Get access token using API key with file-based caching
 */
export async function getAccessTokenByApiKey(): Promise<string> {
  // Check file cache first
  const cached = readCachedToken()
  if (cached && isTokenValid(cached)) {
    console.log('[CJ] Using cached token (expires:', cached.expiryDate, ')')
    return cached.accessToken
  }

  console.log('[CJ] Requesting new access token...')

  const response = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: CJ_API_KEY,
    }),
  })

  const data: CJAuthResponse = await response.json()

  if (!data.result) {
    // If rate limited, check if we have an old token that might still work
    if (data.message.includes('Too Many Requests') && cached) {
      console.log('[CJ] Rate limited but have cached token, trying it anyway...')
      return cached.accessToken
    }
    throw new Error(`CJ Auth failed: ${data.message}`)
  }

  // Save to file cache
  saveCachedToken(data.data.accessToken, data.data.accessTokenExpiryDate)

  return data.data.accessToken
}

/**
 * Search products on CJ
 */
export async function searchProducts(keyword: string, pageNum = 1, pageSize = 20) {
  const token = await getAccessTokenByApiKey()

  const response = await fetch(
    `${CJ_BASE_URL}/product/list?pageNum=${pageNum}&pageSize=${pageSize}&productNameEn=${encodeURIComponent(keyword)}`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
    }
  )

  return response.json()
}

/**
 * Get product details by ID
 */
export async function getProductById(pid: string) {
  const token = await getAccessTokenByApiKey()

  const response = await fetch(`${CJ_BASE_URL}/product/query?pid=${pid}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  })

  return response.json()
}

/**
 * Calculate shipping cost
 */
export async function calculateShipping(
  startCountryCode: string,
  endCountryCode: string,
  products: { quantity: number; vid: string }[]
) {
  const token = await getAccessTokenByApiKey()

  const response = await fetch(`${CJ_BASE_URL}/logistic/freightCalculate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify({
      startCountryCode,
      endCountryCode,
      products,
    }),
  })

  return response.json()
}

/**
 * Create order on CJ Dropshipping
 */
export async function createOrder(orderData: CJCreateOrderRequest): Promise<CJOrderResponse> {
  const token = await getAccessTokenByApiKey()

  console.log('[CJ] Creating order with token:', token.slice(0, 20) + '...')
  console.log('[CJ] Order data:', JSON.stringify(orderData, null, 2))

  const response = await fetch(`${CJ_BASE_URL}/shopping/order/createOrder`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
    body: JSON.stringify(orderData),
  })

  const result = await response.json()
  console.log('[CJ] Order response:', JSON.stringify(result, null, 2))

  return result
}

/**
 * Get order details
 */
export async function getOrderById(orderId: string) {
  const token = await getAccessTokenByApiKey()

  const response = await fetch(`${CJ_BASE_URL}/shopping/order/getOrderDetail?orderId=${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  })

  return response.json()
}

/**
 * Get tracking info
 */
export async function getTracking(orderNumber: string) {
  const token = await getAccessTokenByApiKey()

  const response = await fetch(`${CJ_BASE_URL}/logistic/getTrackInfo?orderNum=${orderNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  })

  return response.json()
}

// Product mapping - map our product IDs to CJ variant IDs
// Updated from CJ Dropshipping URLs on 2026-02-05
export const PRODUCT_CJ_MAPPING: Record<string, {
  vid: string
  cjProductId: string
  sku: string
  spu: string
  variants?: Record<string, { vid: string; sku: string }>
}> = {
  // === TECH PRODUCTS ===

  // Mini Projecteur HD 4K - Ultra Short Focus Hy300
  'mini-projector-2025': {
    vid: '',
    cjProductId: '2504250205361610700',
    sku: 'CJYD2362075',
    spu: 'CJYD2362075',
  },

  // Blender Portable USB - 350ML Electric Juicer
  'portable-blender-usb': {
    vid: '',
    cjProductId: '1392009095543918592',
    sku: 'CJJD1123188',
    spu: 'CJJD1123188',
  },

  // Station de Charge 3-en-1 - 3 In 1 Magnetic Foldable Wireless Charger
  'wireless-charger-3in1': {
    vid: '',
    cjProductId: '1619525256841015296',
    sku: 'CJCD1670287',
    spu: 'CJCD1670287',
  },

  // === SHAPEWEAR PRODUCTS ===

  // Body Sculptant Premium - Butt Lifting Tummy Control Pants
  'body-sculptant-premium': {
    vid: '2602050719171622300',
    cjProductId: '2602050719171622000',
    sku: 'CJJS275496801AZ',
    spu: 'CJJS2754968',
    variants: {
      'M': { vid: '2602050719171622300', sku: 'CJJS275496801AZ' },
      'L': { vid: '2602050719171622900', sku: 'CJJS275496802BY' },
      'XL': { vid: '2602050719171623300', sku: 'CJJS275496803CX' },
      'XXL': { vid: '2602050719171623900', sku: 'CJJS275496804DW' },
      'M-Chocolat': { vid: '2602050719171624200', sku: 'CJJS275496805EV' },
      'L-Chocolat': { vid: '2602050719171624600', sku: 'CJJS275496806FU' },
      'M-Nude': { vid: '2602050719171626100', sku: 'CJJS275496809IR' },
      'L-Nude': { vid: '2602050719171626300', sku: 'CJJS275496810JQ' },
    }
  },

  // Body Seamless Bretelles - Women's Suspender Jumpsuit
  'body-seamless-bretelles': {
    vid: '',
    cjProductId: '1735207991432982528',
    sku: 'CJYD1920929',
    spu: 'CJYD1920929',
  },

  // Short Gainant Post-Partum - SEAMLESS Postpartum Shapewear
  'shapewear-short-postpartum': {
    vid: '',
    cjProductId: '1866761878916452352',
    sku: 'CJLS2240658',
    spu: 'CJLS2240658',
  },
}

/**
 * Get the correct VID based on selected size and color
 */
export function getVariantId(productId: string, selectedSize?: string, selectedColor?: string): string | null {
  const mapping = PRODUCT_CJ_MAPPING[productId]
  if (!mapping) return null

  if (selectedSize && mapping.variants) {
    // Try with color suffix first (e.g., "M-Chocolat")
    if (selectedColor) {
      const keyWithColor = `${selectedSize}-${selectedColor}`
      if (mapping.variants[keyWithColor]) {
        return mapping.variants[keyWithColor].vid
      }
    }
    // Fall back to size only
    if (mapping.variants[selectedSize]) {
      return mapping.variants[selectedSize].vid
    }
  }

  return mapping.vid
}

/**
 * Get variant info (VID + SKU) based on selected size and color
 */
export function getVariantInfo(productId: string, selectedSize?: string, selectedColor?: string): { vid: string; sku: string } | null {
  const mapping = PRODUCT_CJ_MAPPING[productId]
  if (!mapping) return null

  if (selectedSize && mapping.variants) {
    // Try with color suffix first
    if (selectedColor) {
      const keyWithColor = `${selectedSize}-${selectedColor}`
      if (mapping.variants[keyWithColor]) {
        return mapping.variants[keyWithColor]
      }
    }
    // Fall back to size only
    if (mapping.variants[selectedSize]) {
      return mapping.variants[selectedSize]
    }
  }

  return { vid: mapping.vid, sku: mapping.sku }
}
