import { supabaseHeaders, SUPABASE_URL } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const { code, state, error: fbError } = event.queryStringParameters || {}

  if (fbError) {
    return {
      statusCode: 302,
      headers: { Location: '/triopromote?fb=error' },
      body: '',
    }
  }

  if (!code || !state) {
    return {
      statusCode: 302,
      headers: { Location: '/triopromote?fb=error' },
      body: '',
    }
  }

  let licenseKey
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    licenseKey = decoded.licenseKey
  } catch {
    return {
      statusCode: 302,
      headers: { Location: '/triopromote?fb=error' },
      body: '',
    }
  }

  const appId = process.env.FB_APP_ID
  const appSecret = process.env.FB_APP_SECRET
  const redirectUri = 'https://triotools.fi/.netlify/functions/fb-callback'

  try {
    // 1. Exchange code for short-lived user token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    )
    const tokenData = await tokenRes.json()
    if (tokenData.error) throw new Error(tokenData.error.message)

    const shortToken = tokenData.access_token

    // 2. Exchange for long-lived user token
    const longRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortToken}`
    )
    const longData = await longRes.json()
    if (longData.error) throw new Error(longData.error.message)

    const longToken = longData.access_token

    // 3. Get page token (never-expiring) via /me/accounts
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`
    )
    const pagesData = await pagesRes.json()
    if (pagesData.error) throw new Error(pagesData.error.message)

    if (!pagesData.data || pagesData.data.length === 0) {
      return {
        statusCode: 302,
        headers: { Location: '/triopromote?fb=no_pages' },
        body: '',
      }
    }

    const page = pagesData.data[0]

    // 4. Upsert into Supabase fb_connections (delete old + insert new)
    await fetch(
      `${SUPABASE_URL()}/rest/v1/fb_connections?license_key=eq.${encodeURIComponent(licenseKey)}`,
      { method: 'DELETE', headers: supabaseHeaders() }
    )

    const insertRes = await fetch(
      `${SUPABASE_URL()}/rest/v1/fb_connections`,
      {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({
          license_key: licenseKey,
          page_id: page.id,
          page_name: page.name,
          page_token: page.access_token,
        }),
      }
    )

    if (!insertRes.ok) {
      const errText = await insertRes.text()
      throw new Error(`Supabase insert failed: ${errText}`)
    }

    return {
      statusCode: 302,
      headers: { Location: '/triopromote?fb=connected' },
      body: '',
    }
  } catch (err) {
    console.error('FB callback error:', err.message)
    return {
      statusCode: 302,
      headers: { Location: '/triopromote?fb=error' },
      body: '',
    }
  }
}
