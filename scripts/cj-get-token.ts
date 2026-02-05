/**
 * CJ Dropshipping - Get and Save Token
 *
 * Run this script ONCE to get a token that will be cached for subsequent API calls.
 * The token is saved to .cj-token-cache.json and lasts for several hours.
 *
 * Usage: npx tsx scripts/cj-get-token.ts
 *
 * After running this, you can test orders without hitting rate limits.
 */

import * as fs from 'fs'
import * as path from 'path'

require('dotenv').config({ path: '.env.local' })

const CJ_BASE_URL = 'https://developers.cjdropshipping.com/api2.0/v1'
const CJ_API_KEY = process.env.CJ_API_KEY
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

async function getAndSaveToken() {
  console.log('='.repeat(50))
  console.log('CJ Dropshipping - Token Generator')
  console.log('='.repeat(50))
  console.log('')

  if (!CJ_API_KEY) {
    console.error('ERROR: CJ_API_KEY not found in .env.local')
    process.exit(1)
  }

  console.log('API Key:', CJ_API_KEY.slice(0, 20) + '...')
  console.log('')

  // Check existing token
  if (fs.existsSync(TOKEN_CACHE_FILE)) {
    const existing = JSON.parse(fs.readFileSync(TOKEN_CACHE_FILE, 'utf-8'))
    const expiry = new Date(existing.expiryDate)
    const now = new Date()

    if (now < expiry) {
      console.log('EXISTING TOKEN FOUND!')
      console.log('Token:', existing.accessToken.slice(0, 30) + '...')
      console.log('Expires:', existing.expiryDate)
      console.log('Created:', existing.createdAt)
      console.log('')
      console.log('Token is still valid. No need to request a new one.')
      console.log('')
      console.log('To force a new token, delete .cj-token-cache.json and wait 5 minutes.')
      return
    } else {
      console.log('Existing token has expired. Requesting new one...')
    }
  }

  console.log('Requesting new access token from CJ...')
  console.log('')

  try {
    const response = await fetch(`${CJ_BASE_URL}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: CJ_API_KEY }),
    })

    const data: CJAuthResponse = await response.json()

    if (!data.result) {
      console.error('FAILED:', data.message)
      console.log('')
      if (data.message.includes('Too Many Requests')) {
        console.log('You hit the rate limit (1 request per 5 minutes).')
        console.log('Wait 5 minutes and try again.')
      }
      process.exit(1)
    }

    // Save token
    const cache = {
      accessToken: data.data.accessToken,
      expiryDate: data.data.accessTokenExpiryDate,
      createdAt: new Date().toISOString(),
    }

    fs.writeFileSync(TOKEN_CACHE_FILE, JSON.stringify(cache, null, 2))

    console.log('SUCCESS! Token obtained and saved.')
    console.log('')
    console.log('Token:', data.data.accessToken.slice(0, 30) + '...')
    console.log('Expires:', data.data.accessTokenExpiryDate)
    console.log('Saved to:', TOKEN_CACHE_FILE)
    console.log('')
    console.log('You can now run test orders without rate limit issues.')
    console.log('The token will be automatically used by the server.')

  } catch (error) {
    console.error('Request failed:', error)
    process.exit(1)
  }
}

getAndSaveToken()
