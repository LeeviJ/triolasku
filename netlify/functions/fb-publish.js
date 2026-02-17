import { supabaseHeaders, SUPABASE_URL } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { licenseKey, message } = JSON.parse(event.body || '{}')

    if (!licenseKey || !message) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing licenseKey or message' }) }
    }

    // Get page token from Supabase
    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/fb_connections?license_key=eq.${encodeURIComponent(licenseKey)}&select=page_id,page_token,page_name`,
      { headers: supabaseHeaders() }
    )
    const rows = await res.json()

    if (!rows.length) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Facebook not connected' }) }
    }

    const { page_id, page_token } = rows[0]

    // Publish to Facebook
    const fbRes = await fetch(
      `https://graph.facebook.com/v21.0/${page_id}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          access_token: page_token,
        }),
      }
    )
    const fbData = await fbRes.json()

    if (fbData.error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: fbData.error.message }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, postId: fbData.id }),
    }
  } catch (err) {
    console.error('FB publish error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Publishing failed', message: err.message }),
    }
  }
}
