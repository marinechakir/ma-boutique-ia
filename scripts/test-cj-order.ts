/**
 * Test CJ Dropshipping Order Creation
 *
 * This script manually sends a test order to CJ Dropshipping
 * to verify the API connection is working.
 *
 * PREREQUISITE: Run `npx tsx scripts/cj-get-token.ts` first to get a token
 *
 * Usage: npx tsx scripts/test-cj-order.ts
 */

import * as fs from 'fs'
import * as path from 'path'

require('dotenv').config({ path: '.env.local' })

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1'
const TOKEN_CACHE_FILE = path.join(process.cwd(), '.cj-token-cache.json')

// Test order data with REAL CJ variant ID
// CJ API v2.0 required fields for createOrder
const TEST_ORDER = {
  orderNumber: `DRIP_TEST_${Date.now()}`,
  // Shipping info - all required
  shippingCountryCode: 'FR',
  shippingCountry: 'France',
  shippingProvince: 'Ile-de-France',
  shippingCity: 'Paris',
  shippingAddress: '123 Rue de Test',
  shippingAddress2: '',
  shippingCustomerName: 'Test Client DRIP',
  shippingZip: '75001',
  shippingPhone: '+33600000000',
  // Additional required fields
  countryCode: 'FR',
  logisticName: 'CJPacket Ordinary',
  fromCountryCode: 'CN',
  // Products
  products: [
    {
      vid: '2602050719171622300', // Real VID: Butt Lifting Tummy Control Black M
      quantity: 1,
    }
  ],
  remark: 'TEST ORDER FROM DRIP STORE',
}

async function testOrder() {
  console.log('='.repeat(50))
  console.log('CJ Dropshipping - Test Order')
  console.log('='.repeat(50))
  console.log('')

  // Check for cached token
  if (!fs.existsSync(TOKEN_CACHE_FILE)) {
    console.error('ERROR: No token found!')
    console.log('Run this first: npx tsx scripts/cj-get-token.ts')
    process.exit(1)
  }

  const cache = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'))
  const expiry = new Date(cache.expiryDate)
  const now = new Date()

  if (now >= expiry) {
    console.error('ERROR: Token has expired!')
    console.log('Run this first: npx tsx scripts/cj-get-token.ts')
    process.exit(1)
  }

  console.log('Using cached token (expires:', cache.expiryDate, ')')
  console.log('')

  console.log('Order Details:')
  console.log('-'.repeat(40))
  console.log('Order Number:', TEST_ORDER.orderNumber)
  console.log('Customer:', TEST_ORDER.shippingCustomerName)
  console.log('Address:', TEST_ORDER.shippingAddress, TEST_ORDER.shippingCity)
  console.log('Product VID:', TEST_ORDER.products[0].vid)
  console.log('Quantity:', TEST_ORDER.products[0].quantity)
  console.log('')

  console.log('Sending order to CJ Dropshipping...')
  console.log('')

  try {
    const response = await fetch(`${CJ_BASE_URL}/shopping/order/createOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': cache.accessToken,
      },
      body: JSON.stringify(TEST_ORDER),
    })

    const result = await response.json()

    console.log('CJ Response:')
    console.log('-'.repeat(40))
    console.log(JSON.stringify(result, null, 2))
    console.log('')

    if (result.result) {
      console.log('SUCCESS! Order created on CJ!')
      console.log('')
      console.log('CJ Order ID:', result.data?.cjOrderId)
      console.log('Order Number:', result.data?.orderNum)
      console.log('Status:', result.data?.orderStatus)
      console.log('')
      console.log('Check your CJ Dashboard > Imported Orders')
      console.log('URL: https://app.cjdropshipping.com/myOrder')
    } else {
      console.log('FAILED: Order not created')
      console.log('Error:', result.message)
      console.log('')

      // Common error handling
      if (result.message?.includes('variant')) {
        console.log('HINT: The variant ID might be invalid.')
        console.log('Try searching for products to get valid VIDs.')
      } else if (result.message?.includes('token')) {
        console.log('HINT: Token might be invalid. Get a new one.')
      }
    }

  } catch (error) {
    console.error('Request failed:', error)
  }
}

testOrder()
