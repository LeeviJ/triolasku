import Stripe from 'stripe'

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  try {
    const { priceId } = JSON.parse(event.body || '{}')

    if (!priceId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing priceId' }) }
    }

    const origin = event.headers.origin || 'https://triotools.fi'

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/#pricing`,
    })

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: session.url }),
    }
  } catch (err) {
    console.error('Stripe error:', err.message)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Checkout session creation failed', message: err.message }),
    }
  }
}
