import { NextRequest, NextResponse } from 'next/server'
import { getProductById } from '@/lib/cj-client'
import * as fs from 'fs'
import * as path from 'path'

const PRODUCTS_FILE = path.join(process.cwd(), 'src/data/products.json')

interface CJProduct {
  pid: string
  productNameEn: string
  productImage: string
  productImageSet?: string[]
  categoryName: string
  sellPrice: number
  variants?: Array<{
    vid: string
    variantSku: string
    variantNameEn: string
    variantImage?: string
  }>
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const pid = searchParams.get('pid')
  const sku = searchParams.get('sku')

  if (!pid) {
    return NextResponse.json({ error: 'Missing pid parameter' }, { status: 400 })
  }

  try {
    const result = await getProductById(pid)

    if (!result.result) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    const product: CJProduct = result.data

    // Find variant by SKU if provided
    let matchedVariant = null
    if (sku && product.variants) {
      matchedVariant = product.variants.find(v => v.variantSku === sku)
    }

    return NextResponse.json({
      success: true,
      product: {
        pid: product.pid,
        name: product.productNameEn,
        mainImage: product.productImage,
        images: product.productImageSet || [product.productImage],
        category: product.categoryName,
        price: product.sellPrice,
      },
      matchedVariant,
      allVariants: product.variants?.slice(0, 10), // First 10 variants
    })
  } catch (error) {
    console.error('CJ API error:', error)
    return NextResponse.json({ error: 'Failed to fetch product' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pid, sku, localProductId, price, name, description } = body

    if (!pid || !localProductId) {
      return NextResponse.json({ error: 'Missing pid or localProductId' }, { status: 400 })
    }

    // Fetch product from CJ
    const result = await getProductById(pid)

    if (!result.result) {
      return NextResponse.json({ error: result.message }, { status: 400 })
    }

    const cjProduct: CJProduct = result.data

    // Find variant
    let vid = ''
    if (sku && cjProduct.variants) {
      const variant = cjProduct.variants.find(v => v.variantSku === sku)
      if (variant) {
        vid = variant.vid
      }
    }
    if (!vid && cjProduct.variants && cjProduct.variants.length > 0) {
      vid = cjProduct.variants[0].vid
    }

    // Read current products
    const productsData = fs.readFileSync(PRODUCTS_FILE, 'utf-8')
    const products = JSON.parse(productsData)

    // Find and update existing product or create new
    const existingIndex = products.findIndex((p: { id: string }) => p.id === localProductId)

    const productData = {
      id: localProductId,
      name: name || cjProduct.productNameEn,
      price: price || cjProduct.sellPrice,
      description: description || cjProduct.productNameEn,
      image: cjProduct.productImage,
      images: cjProduct.productImageSet || [cjProduct.productImage],
      imageSource: 'cj_dropshipping',
      imageAuditStatus: 'verified',
      category: 'shapewear',
      trending: true,
      cj_sku: sku || '',
      cj_vid: vid,
      cj_product_id: pid,
    }

    if (existingIndex >= 0) {
      // Update existing - merge with existing data
      products[existingIndex] = {
        ...products[existingIndex],
        image: productData.image,
        images: productData.images,
        imageSource: productData.imageSource,
        imageAuditStatus: productData.imageAuditStatus,
        cj_sku: productData.cj_sku,
        cj_vid: productData.cj_vid,
        cj_product_id: productData.cj_product_id,
      }
    } else {
      // Add new product
      products.push(productData)
    }

    // Save
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2))

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Product updated' : 'Product added',
      product: existingIndex >= 0 ? products[existingIndex] : productData,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json({ error: 'Failed to sync product' }, { status: 500 })
  }
}
