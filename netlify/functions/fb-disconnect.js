import { supabaseHeaders, SUPABASE_URL } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { licenseKey } = JSON.parse(event.body || '{}')

    if (!licenseKey) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing licenseKey' }) }
    }

    await fetch(
      `${SUPABASE_URL()}/rest/v1/fb_connections?license_key=eq.${encodeURIComponent(licenseKey)}`,
      { method: 'DELETE', headers: supabaseHeaders() }
    )

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    console.error('FB disconnect error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Disconnect failed', message: err.message }),
    }
  }
}
