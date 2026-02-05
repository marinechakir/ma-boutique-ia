import { NextRequest, NextResponse } from 'next/server'
import { searchProducts, getAccessTokenByApiKey } from '@/lib/cj-client'

const CJ_BASE_URL = process.env.CJ_API_BASE_URL || 'https://developers.cjdropshipping.com/api2.0/v1'

interface CJProductListItem {
  pid: string
  productNameEn: string
  productSku: string
  productImage: string
  sellPrice: number
  categoryName: string
}

// Search by keyword
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const keyword = searchParams.get('keyword')
  const sku = searchParams.get('sku')

  try {
    const token = await getAccessTokenByApiKey()

    if (sku) {
      // Search by SKU directly using variant query
      const response = await fetch(
        `${CJ_BASE_URL}/product/variant/query?vid=&variantSku=${encodeURIComponent(sku)}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'CJ-Access-Token': token,
          },
        }
      )
      const data = await response.json()

      if (data.result && data.data) {
        return NextResponse.json({
          success: true,
          searchType: 'sku',
          sku,
          variant: data.data,
        })
      }

      return NextResponse.json({
        success: false,
        message: data.message || 'Variant not found',
        raw: data,
      })
    }

    if (keyword) {
      const result = await searchProducts(keyword, 1, 10)

      if (!result.result) {
        return NextResponse.json({ error: result.message }, { status: 400 })
      }

      const products = (result.data?.list || []).map((p: CJProductListItem) => ({
        pid: p.pid,
        name: p.productNameEn,
        sku: p.productSku,
        image: p.productImage,
        price: p.sellPrice,
        category: p.categoryName,
      }))

      return NextResponse.json({
        success: true,
        searchType: 'keyword',
        keyword,
        count: products.length,
        products,
      })
    }

    return NextResponse.json({ error: 'Missing keyword or sku parameter' }, { status: 400 })
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}

// Bulk search by multiple SKUs
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { skus } = body

    if (!skus || !Array.isArray(skus)) {
      return NextResponse.json({ error: 'Missing skus array' }, { status: 400 })
    }

    const token = await getAccessTokenByApiKey()
    const results: Record<string, unknown> = {}

    for (const sku of skus) {
      try {
        const response = await fetch(
          `${CJ_BASE_URL}/product/variant/query?vid=&variantSku=${encodeURIComponent(sku)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'CJ-Access-Token': token,
            },
          }
        )
        const data = await response.json()

        if (data.result && data.data) {
          results[sku] = {
            found: true,
            pid: data.data.pid,
            vid: data.data.vid,
            name: data.data.variantNameEn,
            image: data.data.variantImage,
            price: data.data.variantSellPrice,
          }
        } else {
          results[sku] = { found: false, message: data.message }
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        results[sku] = { found: false, error: String(err) }
      }
    }

    return NextResponse.json({
      success: true,
      results,
    })
  } catch (error) {
    console.error('Bulk search error:', error)
    return NextResponse.json({ error: 'Bulk search failed' }, { status: 500 })
  }
}
