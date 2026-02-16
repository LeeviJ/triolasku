import Stripe from 'stripe'
import nodemailer from 'nodemailer'
import { generateLicenseKey, supabaseHeaders, SUPABASE_URL, PLAN_DURATIONS, PRICE_ID_TO_PLAN, PLAN_PRICES, vatBreakdown } from './utils/license.js'

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

    try {
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      const priceId = sub.items.data[0]?.price.id
      const planInfo = PRICE_ID_TO_PLAN[priceId] || { plan: '1kk', tier: 'standard' }
      const plan = planInfo.plan
      const tier = planInfo.tier
      const days = PLAN_DURATIONS[plan] || 30

      const licenseKey = generateLicenseKey()
      const now = new Date()
      const expiresAt = new Date(now.getTime() + days * 86400000)

      await fetch(`${SUPABASE_URL()}/rest/v1/licenses`, {
        method: 'POST',
        headers: supabaseHeaders(),
        body: JSON.stringify({
          license_key: licenseKey,
          email,
          plan,
          tier,
          status: 'active',
          stripe_subscription_id: subscriptionId,
          activated_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        }),
      })

      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })

      const priceInfo = PLAN_PRICES[tier]?.[plan] || PLAN_PRICES.standard[plan] || { gross: 0, label: plan }
      const vat = vatBreakdown(priceInfo.gross)
      const productName = tier === 'promote' ? 'TrioLasku + Promote' : 'TrioLasku'

      await transporter.sendMail({
        from: process.env.SMTP_USER,
        envelope: { from: process.env.SMTP_USER, to: email },
        to: email,
        subject: 'TrioLasku — Tilausvahvistus ja lisenssiavain',
        text: [
          'Kiitos tilauksestasi!',
          '',
          '─── TILAUSVAHVISTUS ───',
          '',
          `Tuote:          ${productName} – ${priceInfo.label}`,
          `Hinta (alv 0%): ${vat.net} €`,
          `ALV ${vat.vatRate} %:    ${vat.vat} €`,
          `Yhteensä:       ${vat.gross} €`,
          '',
          '─── LISENSSIAVAIN ───',
          '',
          `Avain:     ${licenseKey}`,
          `Voimassa:  ${expiresAt.toLocaleDateString('fi-FI')} asti`,
          '',
          'Syötä avain sovelluksessa osoitteessa https://triotools.fi/dashboard',
          '',
          '─── MYYJÄN TIEDOT ───',
          '',
          'Kyyränkoski Tmi',
          'Y-tunnus: 1437272-9',
          'Kylänpääntie 54, 61450 Kylänpää',
          'trio.tools6@gmail.com',
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
