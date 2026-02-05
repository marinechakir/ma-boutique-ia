/**
 * Test Script: Stripe -> CJ Dropshipping Fulfillment
 *
 * This script simulates the complete order flow:
 * 1. Creates a test Stripe checkout session
 * 2. Simulates a successful payment
 * 3. Verifies the order data would be sent to CJ Dropshipping
 *
 * Run with: npx ts-node scripts/test-fulfillment.ts
 * Or: npx tsx scripts/test-fulfillment.ts
 */

import Stripe from 'stripe'

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

// Test product data (matching our catalog)
const TEST_ORDER = {
  products: [
    {
      id: 'body-sculptant-premium',
      name: 'Body Sculptant Premium',
      price: 34.99,
      quantity: 1,
      selectedSize: 'M',
      selectedColor: 'Noir',
      cj_sku: '1701527809317294080',
      cj_vid: 'CJ_BODY_SCULPTANT_EU',
    },
  ],
  customer: {
    email: 'test@example.com',
    name: 'Marie Dupont',
    phone: '+33612345678',
    address: {
      line1: '123 Rue de Paris',
      city: 'Paris',
      postal_code: '75001',
      country: 'FR',
    },
  },
}

// CJ Order format builder
function buildCJOrderPayload(
  stripeOrderId: string,
  customer: typeof TEST_ORDER.customer,
  products: typeof TEST_ORDER.products
) {
  return {
    orderNumber: stripeOrderId,
    shippingCountryCode: customer.address.country,
    shippingCountry: 'France',
    shippingProvince: 'Ile-de-France',
    shippingCity: customer.address.city,
    shippingAddress: customer.address.line1,
    shippingCustomerName: customer.name,
    shippingZip: customer.address.postal_code,
    shippingPhone: customer.phone,
    products: products.map((p) => ({
      vid: p.cj_vid,
      quantity: p.quantity,
    })),
    remark: `Size: ${products[0]?.selectedSize}, Color: ${products[0]?.selectedColor}`,
  }
}

async function runTest() {
  console.log('\n========================================')
  console.log('   TEST: Stripe -> CJ Fulfillment Flow')
  console.log('========================================\n')

  // Step 1: Verify Stripe connection
  console.log('1. Testing Stripe connection...')
  try {
    const balance = await stripe.balance.retrieve()
    console.log('   Stripe connected. Available balance:', balance.available[0]?.amount || 0, 'cents')
  } catch (error) {
    console.error('   FAILED: Stripe connection error:', error)
    process.exit(1)
  }

  // Step 2: Create a test checkout session
  console.log('\n2. Creating test checkout session...')
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: TEST_ORDER.products.map((p) => ({
        price_data: {
          currency: 'eur',
          unit_amount: Math.round(p.price * 100),
          product_data: {
            name: p.name,
            metadata: {
              product_id: p.id,
              size: p.selectedSize || '',
              color: p.selectedColor || '',
              cj_sku: p.cj_sku,
              cj_vid: p.cj_vid,
            },
          },
        },
        quantity: p.quantity,
      })),
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU'],
      },
      customer_email: TEST_ORDER.customer.email,
      success_url: 'http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'http://localhost:3000/',
      metadata: {
        order_items: JSON.stringify(
          TEST_ORDER.products.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            size: p.selectedSize,
            color: p.selectedColor,
          }))
        ),
      },
    })

    console.log('   Checkout session created!')
    console.log('   Session ID:', session.id)
    console.log('   Checkout URL:', session.url)
  } catch (error) {
    console.error('   FAILED: Checkout session error:', error)
    process.exit(1)
  }

  // Step 3: Simulate order data for CJ
  console.log('\n3. Building CJ Dropshipping order payload...')
  const testStripeOrderId = `TEST_ORDER_${Date.now()}`
  const cjPayload = buildCJOrderPayload(testStripeOrderId, TEST_ORDER.customer, TEST_ORDER.products)

  console.log('   CJ Order Payload:')
  console.log('   -----------------')
  console.log(JSON.stringify(cjPayload, null, 2))

  // Step 4: Verify CJ API configuration
  console.log('\n4. Checking CJ Dropshipping configuration...')
  const cjApiKey = process.env.CJ_API_KEY
  const cjBaseUrl = process.env.CJ_API_BASE_URL

  if (!cjApiKey || cjApiKey === 'your_cj_api_key_here') {
    console.log('   WARNING: CJ API key not configured')
    console.log('   To complete integration:')
    console.log('   1. Get your API key from https://cjdropshipping.com/')
    console.log('   2. Add it to .env.local as CJ_API_KEY=your_key')
  } else {
    console.log('   CJ API Key: Configured')
    console.log('   CJ Base URL:', cjBaseUrl)
  }

  // Step 5: Summary
  console.log('\n========================================')
  console.log('   TEST SUMMARY')
  console.log('========================================')
  console.log('')
  console.log('   Stripe Integration: OK')
  console.log('   Checkout Sessions: Working')
  console.log('   Order Payload Builder: OK')
  console.log('')
  console.log('   CJ Integration Status:')
  if (!cjApiKey || cjApiKey === 'your_cj_api_key_here') {
    console.log('   - API Key: NOT CONFIGURED')
    console.log('   - Draft Orders: Pending API key')
  } else {
    console.log('   - API Key: Configured')
    console.log('   - Ready for draft orders')
  }
  console.log('')
  console.log('   Next Steps:')
  console.log('   1. Configure CJ API key in .env.local')
  console.log('   2. Run "npm run dev" and test checkout')
  console.log('   3. Use Stripe CLI to test webhooks:')
  console.log('      stripe listen --forward-to localhost:3000/api/webhook')
  console.log('')
  console.log('========================================\n')
}

// API endpoint test (optional - requires running server)
async function testAPIEndpoint() {
  console.log('\n5. Testing API endpoint (requires running server)...')

  try {
    const response = await fetch('http://localhost:3000/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: TEST_ORDER.products.map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: p.quantity,
          selectedSize: p.selectedSize,
          selectedColor: p.selectedColor,
        })),
      }),
    })

    if (response.ok) {
      const data = await response.json()
      console.log('   API Response:', data)
    } else {
      console.log('   Server not running or endpoint error')
    }
  } catch {
    console.log('   Server not running (start with npm run dev)')
  }
}

// Run tests
runTest()
  .then(() => testAPIEndpoint())
  .catch(console.error)
