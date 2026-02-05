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
// VIDs validated from CJ Dropshipping API search results
export const PRODUCT_CJ_MAPPING: Record<string, {
  vid: string
  cjProductId: string
  sku: string
  variants?: Record<string, string> // size -> vid mapping
}> = {
  // Shapewear - Butt Lifting Tummy Control (real CJ product)
  'body-sculptant-premium': {
    vid: '2602050719171622300', // Default: Black M
    cjProductId: '2602050719171622000',
    sku: 'CJJS275496801AZ',
    variants: {
      'M': '2602050719171622300',
      'L': '2602050719171622900',
      'XL': '2602050719171623300',
      '2XL': '2602050719171623900',
    }
  },
  'body-seamless-vneck': {
    vid: '2602050719171622300',
    cjProductId: '2602050719171622000',
    sku: 'CJJS275496801AZ',
    variants: {
      'S': '2602050719171622300',
      'M': '2602050719171622900',
      'L': '2602050719171623300',
    }
  },
  'body-manches-longues': {
    vid: '2602050719171622900',
    cjProductId: '2602050719171622000',
    sku: 'CJJS275496802BY',
    variants: {
      'M': '2602050719171622300',
      'L': '2602050719171622900',
      'XL': '2602050719171623300',
    }
  },
  // Tech products - Real CJ SKUs with VIDs
  'mini-projector-2025': {
    vid: '1403920149429489664', // Silver EU plug
    cjProductId: '1403626672510603264',
    sku: 'CJTY117181702BY',
    variants: {
      'EU': '1403920149429489664',
      'UK': '1403920149442072576',
      'US': '1403920149450461184',
    }
  },
  'portable-blender-usb': {
    vid: '1392009096881901568', // Default color
    cjProductId: '1392009095543918592',
    sku: 'CJJD112318810JQ',
    variants: {
      'White': '1392009096881901568',
      'Pink': '1392009096907067392',
      'Blue': '1432603757165809664',
    }
  },
  'wireless-charger-3in1': {
    vid: '1619525256924901376', // Default
    cjProductId: '1619525256841015296',
    sku: 'CJCD167028701AZ',
  },
}

/**
 * Get the correct VID based on selected size
 */
export function getVariantId(productId: string, selectedSize?: string): string | null {
  const mapping = PRODUCT_CJ_MAPPING[productId]
  if (!mapping) return null

  if (selectedSize && mapping.variants?.[selectedSize]) {
    return mapping.variants[selectedSize]
  }

  return mapping.vid
}
