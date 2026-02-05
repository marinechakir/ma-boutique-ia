/**
 * Search CJ for specific shapewear products
 */

require('dotenv').config({ path: '.env.local' })

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_API_KEY = process.env.CJ_API_KEY

async function getAccessToken(): Promise<string> {
  const response = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey: CJ_API_KEY }),
  })
  const data = await response.json()
  if (!data.result) throw new Error(`CJ Auth failed: ${data.message}`)
  return data.data.accessToken
}

async function getProductDetails(token: string, pid: string) {
  const response = await fetch(`${CJ_BASE_URL}/product/query?pid=${pid}`, {
    headers: {
      'Content-Type': 'application/json',
      'CJ-Access-Token': token,
    },
  })
  return response.json()
}

async function searchProducts(token: string, keyword: string, pageSize = 20) {
  const response = await fetch(
    `${CJ_BASE_URL}/product/list?pageNum=1&pageSize=${pageSize}&productNameEn=${encodeURIComponent(keyword)}`,
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
  console.log('Searching CJ for shapewear products...\n')

  const token = await getAccessToken()

  // Search for the specific shapewear bodysuit we found
  const specificSearches = [
    'waist cinching bodysuit',
    'shapewear body',
    'body shaping underwear',
    'corset bodysuit',
    'slimming body shaper',
    'fajas bodysuit',
    'usb blender',
    'juice blender portable',
    'HD projector portable',
    'magsafe charger stand'
  ]

  const goodProducts: any[] = []

  for (const keyword of specificSearches) {
    console.log(`\n--- Searching: "${keyword}" ---`)
    const result = await searchProducts(token, keyword, 15)

    if (result.result && result.data?.list?.length > 0) {
      for (const product of result.data.list) {
        const name = (product.productNameEn || product.productName || '').toLowerCase()

        // Filter for relevant products
        if (
          name.includes('bodysuit') ||
          name.includes('shaper') ||
          name.includes('shapewear') ||
          name.includes('blender') ||
          name.includes('projector') ||
          name.includes('charger')
        ) {
          // Get full details
          const details = await getProductDetails(token, product.pid)

          if (details.result && details.data) {
            const p = details.data
            console.log(`\nPRODUCT: ${p.productNameEn || p.productName}`)
            console.log(`PID: ${p.pid}`)
            console.log(`Price: $${p.sellPrice}`)
            console.log(`Image: ${p.productImage}`)

            if (p.productImageSet?.length > 0) {
              console.log(`Images: ${p.productImageSet.length} photos`)
              p.productImageSet.slice(0, 3).forEach((img: string, i: number) => {
                console.log(`  [${i + 1}] ${img}`)
              })
            }

            if (p.variants?.length > 0) {
              console.log(`Variants: ${p.variants.length}`)
              p.variants.slice(0, 3).forEach((v: any) => {
                console.log(`  - ${v.variantNameEn || v.variantName}`)
                console.log(`    VID: ${v.vid}, SKU: ${v.variantSku}, Price: $${v.variantSellPrice}`)
              })

              goodProducts.push({
                name: p.productNameEn || p.productName,
                pid: p.pid,
                price: p.sellPrice,
                image: p.productImage,
                images: p.productImageSet || [p.productImage],
                variants: p.variants.map((v: any) => ({
                  vid: v.vid,
                  name: v.variantNameEn || v.variantName,
                  sku: v.variantSku,
                  price: v.variantSellPrice,
                })),
              })
            }
          }
        }
      }
    }

    await new Promise(r => setTimeout(r, 300))
  }

  // Output final mapping
  console.log('\n\n========================================')
  console.log('FINAL PRODUCT MAPPING FOR cj-client.ts')
  console.log('========================================\n')

  // Select best products for each category
  const shapewearProducts = goodProducts.filter(p =>
    p.name.toLowerCase().includes('bodysuit') ||
    p.name.toLowerCase().includes('shaper') ||
    p.name.toLowerCase().includes('shapewear')
  )

  const techProducts = goodProducts.filter(p =>
    p.name.toLowerCase().includes('blender') ||
    p.name.toLowerCase().includes('projector') ||
    p.name.toLowerCase().includes('charger')
  )

  console.log('SHAPEWEAR PRODUCTS:')
  shapewearProducts.slice(0, 5).forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`)
    console.log(`   PID: ${p.pid}`)
    console.log(`   Price: $${p.price}`)
    console.log(`   VID (first): ${p.variants[0]?.vid}`)
    console.log(`   SKU: ${p.variants[0]?.sku}`)
    console.log(`   Image: ${p.image}`)
  })

  console.log('\n\nTECH PRODUCTS:')
  techProducts.slice(0, 5).forEach((p, i) => {
    console.log(`\n${i + 1}. ${p.name}`)
    console.log(`   PID: ${p.pid}`)
    console.log(`   Price: $${p.price}`)
    console.log(`   VID (first): ${p.variants[0]?.vid}`)
    console.log(`   SKU: ${p.variants[0]?.sku}`)
    console.log(`   Image: ${p.image}`)
  })

  // Generate code
  console.log('\n\n// Copy to cj-client.ts:\n')
  console.log('export const PRODUCT_CJ_MAPPING = {')

  const allSelected = [...shapewearProducts.slice(0, 3), ...techProducts.slice(0, 3)]
  const productIds = [
    'body-sculptant-premium',
    'body-seamless-vneck',
    'body-manches-longues',
    'mini-projector-2025',
    'portable-blender-usb',
    'wireless-charger-3in1'
  ]

  allSelected.forEach((p, i) => {
    if (productIds[i]) {
      console.log(`  '${productIds[i]}': {`)
      console.log(`    vid: '${p.variants[0]?.vid}',`)
      console.log(`    cjProductId: '${p.pid}',`)
      console.log(`    sku: '${p.variants[0]?.sku}',`)
      console.log(`  },`)
    }
  })

  console.log('}')
}

main().catch(console.error)
