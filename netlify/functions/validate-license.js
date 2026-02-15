import { supabaseHeaders, SUPABASE_URL } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    const { licenseKey } = JSON.parse(event.body || '{}')
    if (!licenseKey) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'missing_key' }) }
    }

    const res = await fetch(
      `${SUPABASE_URL()}/rest/v1/licenses?license_key=eq.${encodeURIComponent(licenseKey)}&select=*`,
      { headers: supabaseHeaders() }
    )
    const rows = await res.json()

    if (!rows.length) {
      return { statusCode: 200, body: JSON.stringify({ valid: false, error: 'not_found' }) }
    }

    const license = rows[0]
    const now = new Date()
    const expired = new Date(license.expires_at) < now
    const revoked = license.status === 'revoked'

    if (expired || revoked) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          valid: false,
          error: expired ? 'expired' : 'revoked',
          expires_at: license.expires_at,
        }),
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        valid: true,
        plan: license.plan,
        expires_at: license.expires_at,
        email: license.email,
      }),
    }
  } catch (err) {
    console.error('License validation error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ valid: false, error: 'server_error' }) }
  }
}
