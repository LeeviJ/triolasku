import nodemailer from 'nodemailer'
import { generateLicenseKey, supabaseHeaders, SUPABASE_URL, PLAN_DURATIONS } from './utils/license.js'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const authHeader = event.headers['x-admin-secret']
  if (authHeader !== process.env.ADMIN_SECRET) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const { email, plan, tier, sendEmail } = JSON.parse(event.body || '{}')
    if (!email || !plan) {
      return { statusCode: 400, body: JSON.stringify({ error: 'email and plan required' }) }
    }
    const licenseTier = tier || 'standard'

    const days = PLAN_DURATIONS[plan]
    if (!days) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid plan. Use: 1kk, 6kk, 12kk' }) }
    }

    const licenseKey = generateLicenseKey()
    const now = new Date()
    const expiresAt = new Date(now.getTime() + days * 86400000)

    const res = await fetch(`${SUPABASE_URL()}/rest/v1/licenses`, {
      method: 'POST',
      headers: supabaseHeaders(),
      body: JSON.stringify({
        license_key: licenseKey,
        email,
        plan,
        tier: licenseTier,
        status: 'active',
        activated_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return { statusCode: 500, body: JSON.stringify({ error: 'DB insert failed', details: err }) }
    }

    if (sendEmail !== false) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      await transporter.sendMail({
        from: `"TrioTools" <${process.env.SMTP_USER}>`,
        envelope: { from: process.env.SMTP_USER, to: [email, 'trio.tools6@gmail.com'] },
        to: email,
        bcc: 'trio.tools6@gmail.com',
        replyTo: 'trio.tools6@gmail.com',
        subject: 'TrioLasku — Lisenssiavaimesi',
        text: [
          'Kiitos tilauksestasi!',
          '',
          `Lisenssiavain: ${licenseKey}`,
          `Tilaus: ${plan}`,
          `Voimassa: ${expiresAt.toLocaleDateString('fi-FI')} asti`,
          '',
          'Syötä avain sovelluksessa osoitteessa https://triotools.fi/dashboard',
          '',
          'Ystävällisin terveisin,',
          'TrioTools',
        ].join('\n'),
      })
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey, email, plan, tier: licenseTier, expires_at: expiresAt.toISOString() }),
    }
  } catch (err) {
    console.error('Admin license error:', err.message)
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed', message: err.message }) }
  }
}
