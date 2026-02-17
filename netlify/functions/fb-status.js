import { supabaseHeaders, SUPABASE_URL } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const licenseKey = event.queryStringParameters?.licenseKey
  if (!licenseKey) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Missing licenseKey' }) }
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/fb_connections?license_key=eq.${encodeURIComponent(licenseKey)}&select=page_name`,
      { headers: supabaseHeaders() }
    )
    const rows = await res.json()

    if (rows.length) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connected: true, pageName: rows[0].page_name }),
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connected: false }),
    }
  } catch (err) {
    console.error('FB status error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Status check failed', message: err.message }),
    }
  }
}
