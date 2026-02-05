/**
 * Test endpoint to verify CJ Dropshipping connection
 * GET /api/test-cj - Test the connection
 * POST /api/test-cj - Create a test order
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAccessTokenByApiKey, createOrder, PRODUCT_CJ_MAPPING, getVariantId } from '@/lib/cj-client'

export async function GET() {
  console.log('=== CJ CONNECTION TEST ===')

  try {
    // Test 1: Get access token
    console.log('1. Testing authentication...')
    const token = await getAccessTokenByApiKey()
    console.log('   Token obtained:', token.slice(0, 20) + '...')

    // Test 2: Show product mapping
    console.log('\n2. Product mapping:')
    Object.entries(PRODUCT_CJ_MAPPING).forEach(([productId, mapping]) => {
      const status = mapping.vid === 'PENDING_CJ_SEARCH' ? 'PENDING' : 'OK'
      console.log(`   ${productId}: ${status}`)
      if (status === 'OK') {
        console.log(`     VID: ${mapping.vid}`)
        console.log(`     SKU: ${mapping.sku}`)
      }
    })

    return NextResponse.json({
      success: true,
      message: 'CJ connection successful',
      tokenPreview: token.slice(0, 20) + '...',
      productMapping: Object.entries(PRODUCT_CJ_MAPPING).map(([id, m]) => ({
        productId: id,
        vid: m.vid,
        status: m.vid === 'PENDING_CJ_SEARCH' ? 'pending' : 'ready',
      })),
    })
  } catch (error) {
    console.error('CJ connection test failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  console.log('=== CJ TEST ORDER ===')

  try {
    const body = await request.json()
    const { productId = 'body-sculptant-premium', size = 'M' } = body

    // Get variant ID
    const vid = getVariantId(productId, size)

    if (!vid || vid === 'PENDING_CJ_SEARCH') {
      return NextResponse.json(
        {
          success: false,
          error: `Product ${productId} is not configured for CJ`,
        },
        { status: 400 }
      )
    }

    console.log(`Creating test order for ${productId} (size: ${size})`)
    console.log(`VID: ${vid}`)

    // Create test order (draft mode - won't actually ship)
    const testOrderNumber = `TEST_DRIP_${Date.now()}`

    const orderPayload = {
      orderNumber: testOrderNumber,
      shippingCountryCode: 'FR',
      shippingCountry: 'France',
      shippingProvince: 'Ile-de-France',
      shippingCity: 'Paris',
      shippingAddress: '123 Rue de Test',
      shippingAddress2: '',
      shippingCustomerName: 'Test Client',
      shippingZip: '75001',
      shippingPhone: '+33600000000',
      // Required by CJ API
      countryCode: 'FR',
      fromCountryCode: 'CN',
      logisticName: 'CJPacket Ordinary',
      products: [{ vid, quantity: 1 }],
      remark: 'TEST ORDER - DO NOT SHIP',
    }

    console.log('Order payload:', JSON.stringify(orderPayload, null, 2))

    const result = await createOrder(orderPayload)

    console.log('CJ Response:', JSON.stringify(result, null, 2))

    if (result.result) {
      return NextResponse.json({
        success: true,
        message: 'Test order created on CJ!',
        orderNumber: testOrderNumber,
        cjOrderId: result.data?.cjOrderId,
        cjOrderNum: result.data?.orderNum,
        status: result.data?.orderStatus,
        note: 'Check CJ dashboard under "Imported Orders"',
      })
    } else {
      return NextResponse.json({
        success: false,
        error: result.message,
        code: result.code,
        details: 'Order creation failed on CJ side',
      })
    }
  } catch (error) {
    console.error('Test order failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
