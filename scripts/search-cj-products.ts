/**
 * Search CJ Dropshipping for real products
 * Run: npx tsx scripts/search-cj-products.ts
 */

require('dotenv').config({ path: '.env.local' })

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_API_KEY = process.env.CJ_API_KEY

interface CJAuthResponse {
  code: number
  result: boolean
  message: string
  data: {
    accessToken: string
    accessTokenExpiryDate: string
  }
}

interface CJProduct {
  pid: string
  productName: string
  productNameEn: string
  productImage: string
  sellPrice: number
  categoryId: string
  variants?: CJVariant[]
}

interface CJVariant {
  vid: string
  variantName: string
  variantNameEn: string
  variantImage: string
  variantSellPrice: number
  variantSku: string
}

async function getAccessToken(): Promise<string> {
  console.log('Getting CJ access token...')

  const response = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  })

  const data: CJAuthResponse = await response.json()

  if (!data.result) {
    throw new Error(`CJ Auth failed: ${data.message}`)
  }

  console.log('Access token obtained!')
  return data.data.accessToken
}

async function searchProducts(token: string, keyword: string): Promise<CJProduct[]> {
  console.log(`\nSearching for: "${keyword}"...`)

  const response = await fetch(
    `${CJ_BASE_URL}/product/list?pageNum=1&pageSize=10&productNameEn=${encodeURIComponent(keyword)}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
    }
  )

  const data = await response.json()

  if (!data.result) {
    console.log(`Search failed: ${data.message}`)
    return []
  }

  return data.data?.list || []
}

async function getProductDetails(token: string, pid: string): Promise<any> {
  const response = await fetch(
    `${CJ_BASE_URL}/product/query?pid=${pid}`,
    {
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
      },
    }
  )

  return response.json()
}

async function main() {
  console.log('========================================')
  console.log('   CJ Dropshipping Product Search')
  console.log('========================================\n')

  if (!CJ_API_KEY) {
    console.error('ERROR: CJ_API_KEY not configured')
    process.exit(1)
  }

  try {
    const token = await getAccessToken()

    // Search for shapewear products
    const searches = [
      'shapewear bodysuit',
      'body shaper women',
      'tummy control bodysuit',
      'seamless bodysuit',
      'compression bodysuit',
      'slimming bodysuit',
      'portable blender',
      'mini projector',
      'wireless charger 3 in 1'
    ]

    const allProducts: Map<string, any> = new Map()

    for (const keyword of searches) {
      const products = await searchProducts(token, keyword)

      if (products.length > 0) {
        console.log(`Found ${products.length} products for "${keyword}":\n`)

        for (const product of products.slice(0, 3)) {
          console.log(`  Product: ${product.productNameEn || product.productName}`)
          console.log(`  PID: ${product.pid}`)
          console.log(`  Price: $${product.sellPrice}`)
          console.log(`  Image: ${product.productImage}`)

          // Get detailed info with variants
          const details = await getProductDetails(token, product.pid)

          if (details.result && details.data?.variants?.length > 0) {
            console.log(`  Variants (${details.data.variants.length}):`)

            for (const variant of details.data.variants.slice(0, 5)) {
              console.log(`    - VID: ${variant.vid}`)
              console.log(`      Name: ${variant.variantNameEn || variant.variantName}`)
              console.log(`      SKU: ${variant.variantSku}`)
              console.log(`      Price: $${variant.variantSellPrice}`)

              if (!allProducts.has(product.pid)) {
                allProducts.set(product.pid, {
                  ...product,
                  variants: details.data.variants
                })
              }
            }
          }

          console.log('')
        }
      } else {
        console.log(`No products found for "${keyword}"\n`)
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    // Output mapping code
    console.log('\n========================================')
    console.log('   SUGGESTED PRODUCT MAPPING')
    console.log('========================================\n')
    console.log('Copy this to src/lib/cj-client.ts:\n')
    console.log('export const PRODUCT_CJ_MAPPING: Record<string, { vid: string; cjProductId: string; sku: string }> = {')

    let count = 0
    for (const [pid, product] of allProducts) {
      if (count >= 6) break
      const variant = product.variants?.[0]
      if (variant) {
        const productId = product.productNameEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30) || `product-${count}`
        console.log(`  '${productId}': {`)
        console.log(`    vid: '${variant.vid}',`)
        console.log(`    cjProductId: '${pid}',`)
        console.log(`    sku: '${variant.variantSku}',`)
        console.log(`  },`)
        count++
      }
    }

    console.log('}')

  } catch (error) {
    console.error('Error:', error)
  }
}

main()
