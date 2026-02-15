import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import { generateLicenseKey, supabaseHeaders, SUPABASE_URL, PLAN_DURATIONS, PRICE_ID_TO_PLAN } from './utils/license.js'

export async function handler(event) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const sig = event.headers['stripe-signature']

  let stripeEvent
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature failed:', err.message)
    return { statusCode: 400, body: `Webhook signature failed: ${err.message}` }
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object
    const email = session.customer_details?.email
    const subscriptionId = session.subscription
    const customerId = session.customer

    try {
      // Determine plan from subscription price
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = sub.items.data[0]?.price.id
      const plan = PRICE_ID_TO_PLAN[priceId] || '1kk'
      const days = PLAN_DURATIONS[plan] || 30

      const licenseKey = generateLicenseKey()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + days * 86400000)

      // Insert into Supabase
      await fetch(`${SUPABASE_URL()}/rest/v1/licenses`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({
          license_key: licenseKey,
          email,
          plan,
          status: 'active',
          stripe_subscription_id: subscriptionId,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }),
      })

      // Email the license key
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        envelope: { from: process.env.SMTP_USER, to: email },
        to: email,
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

      console.log(`License created for ${email}: ${licenseKey}`)
    } catch (err) {
      console.error('License creation failed:', err.message)
    }
  }

  return { statusCode: 200, body: 'ok' }
}
