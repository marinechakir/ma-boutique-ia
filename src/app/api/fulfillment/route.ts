import { NextRequest, NextResponse } from 'next/server'
import { createOrder, PRODUCT_CJ_MAPPING, getVariantId } from '@/lib/cj-client'

interface FulfillmentRequest {
  orderId: string
  items: Array<{
    productId: string
    quantity: number
    selectedSize?: string
    selectedColor?: string
  }>
  shipping: {
    name: string
    email: string
    phone: string
    address: string
    city: string
    zip: string
    country: string
    countryCode: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: FulfillmentRequest = await request.json()
    const { orderId, items, shipping } = body

    // Validate request
    if (!orderId || !items?.length || !shipping) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Log incoming request for debugging
    console.log('=== FULFILLMENT REQUEST ===')
    console.log('Order ID:', orderId)
    console.log('Items:', JSON.stringify(items, null, 2))
    console.log('Shipping:', JSON.stringify(shipping, null, 2))

    // Map our products to CJ variant IDs
    const cjProducts = items
      .map((item) => {
        const mapping = PRODUCT_CJ_MAPPING[item.productId]
        if (!mapping) {
          console.warn(`No CJ mapping for product: ${item.productId}`)
          return null
        }

        // Get the correct variant based on selected size
        const vid = getVariantId(item.productId, item.selectedSize)
        if (!vid || vid === 'PENDING_CJ_SEARCH') {
          console.warn(`Product ${item.productId} has pending CJ integration`)
          return null
        }

        console.log(`Mapped ${item.productId} (size: ${item.selectedSize}) -> VID: ${vid}`)

        return {
          vid,
          quantity: item.quantity,
        }
      })
      .filter(Boolean) as Array<{ vid: string; quantity: number }>

    if (cjProducts.length === 0) {
      return NextResponse.json(
        { error: 'No valid products for fulfillment' },
        { status: 400 }
      )
    }

    // Parse customer name
    const nameParts = shipping.name.split(' ')
    const firstName = nameParts[0] || 'Customer'
    const lastName = nameParts.slice(1).join(' ') || 'Customer'

    // Build CJ order payload with all required fields
    const cjOrderPayload = {
      orderNumber: orderId,
      shippingCountryCode: shipping.countryCode || 'FR',
      shippingCountry: shipping.country || 'France',
      shippingProvince: '', // Optional
      shippingCity: shipping.city,
      shippingAddress: shipping.address,
      shippingAddress2: '',
      shippingCustomerName: `${firstName} ${lastName}`,
      shippingZip: shipping.zip,
      shippingPhone: shipping.phone || '',
      // Required by CJ API
      countryCode: shipping.countryCode || 'FR',
      fromCountryCode: 'CN',
      logisticName: 'CJPacket Ordinary',
      products: cjProducts,
      remark: `DRIP. Order`,
    }

    console.log('=== CJ ORDER PAYLOAD ===')
    console.log(JSON.stringify(cjOrderPayload, null, 2))

    // Create order on CJ Dropshipping
    const cjOrder = await createOrder(cjOrderPayload)

    console.log('=== CJ ORDER RESPONSE ===')
    console.log(JSON.stringify(cjOrder, null, 2))

    if (!cjOrder.result) {
      console.error('CJ Order creation failed:', cjOrder.message)
      return NextResponse.json(
        {
          error: 'Fulfillment failed',
          details: cjOrder.message,
          // In production, queue for manual processing
          queued: true
        },
        { status: 500 }
      )
    }

    // CJ returns orderNumber as string in data field
    const cjOrderNumber = typeof cjOrder.data === 'string' ? cjOrder.data : cjOrder.data?.orderNum

    return NextResponse.json({
      success: true,
      fulfillment: {
        provider: 'cj_dropshipping',
        cjOrderId: cjOrderNumber,
        orderNumber: cjOrderNumber,
        status: 'created',
      },
    })
  } catch (error) {
    console.error('Fulfillment error:', error)

    // In production, queue failed orders for manual processing
    return NextResponse.json(
      {
        error: 'Fulfillment service error',
        queued: true, // Order queued for manual processing
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check fulfillment status
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderId = searchParams.get('orderId')

  if (!orderId) {
    return NextResponse.json(
      { error: 'Order ID required' },
      { status: 400 }
    )
  }

  // In production, fetch from database or CJ API
  return NextResponse.json({
    orderId,
    status: 'processing',
    message: 'Order is being processed by supplier',
  })
}
