import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature') || ''

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    )
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session

      console.log('Payment successful for session:', session.id)

      // Extract order data
      const orderItems = session.metadata?.order_items
        ? JSON.parse(session.metadata.order_items)
        : []

      const shippingDetails = session.shipping_details

      if (shippingDetails && orderItems.length > 0) {
        // Trigger fulfillment
        try {
          const fulfillmentResponse = await fetch(
            `${process.env.NEXT_PUBLIC_APP_URL}/api/fulfillment`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: session.id,
                items: orderItems.map((item: { id: string; qty: number; size?: string; color?: string }) => ({
                  productId: item.id,
                  quantity: item.qty,
                  selectedSize: item.size,
                  selectedColor: item.color,
                })),
                shipping: {
                  name: shippingDetails.name || '',
                  email: session.customer_email || '',
                  phone: shippingDetails.phone || '',
                  address: shippingDetails.address?.line1 || '',
                  city: shippingDetails.address?.city || '',
                  zip: shippingDetails.address?.postal_code || '',
                  country: shippingDetails.address?.country || 'France',
                  countryCode: shippingDetails.address?.country || 'FR',
                },
              }),
            }
          )

          const fulfillmentResult = await fulfillmentResponse.json()
          console.log('Fulfillment triggered:', fulfillmentResult)

          // In production: save order to database, send confirmation email
        } catch (fulfillmentError) {
          console.error('Fulfillment trigger failed:', fulfillmentError)
          // Queue for manual processing
        }
      }

      break
    }

    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('PaymentIntent succeeded:', paymentIntent.id)
      break
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent
      console.log('Payment failed:', paymentIntent.id)
      // In production: notify customer, log error
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Disable body parsing for webhook (needed for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}
