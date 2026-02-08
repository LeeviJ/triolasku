// Netlify Function: Gemini AI proxy
// Uses server-side GEMINI_API_KEY environment variable set in Netlify dashboard
// Client calls: POST /.netlify/functions/gemini-proxy (or /api/gemini-proxy via redirect)
// Supports two formats:
//   1. { prompt } — returns { result: text }
//   2. { product, audience } — returns { results: { facebook, instagram, linkedin, email } }

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY not configured on server' }),
    }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { prompt, product, audience, model } = body

    let finalPrompt
    let isMarketingMode = false

    if (product && audience) {
      isMarketingMode = true
      finalPrompt = `Olet markkinointiasiantuntija. Luo markkinointisisältöä tuotteelle/palvelulle: "${product}" kohdeyleisölle: "${audience}".

Vastaa TÄSMÄLLEEN tässä JSON-muodossa (ei muuta tekstiä, vain JSON):
{
  "facebook": "Facebook-postaus tähän (2-3 lausetta, emoji ok)",
  "instagram": "Instagram-caption tähän (lyhyt, hashtagit mukaan)",
  "linkedin": "LinkedIn-postaus tähän (ammattimainen sävy, 2-3 lausetta)",
  "email": "Sähköpostin aihe: [aihe]\\n\\n[sähköpostin sisältö, 3-4 lausetta]"
}`
    } else if (prompt) {
      finalPrompt = prompt
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt or product/audience' }) }
    }

    const geminiModel = model || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: finalPrompt }] }],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Gemini API error: ${response.status}`, details: errorText }),
      }
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    if (isMarketingMode) {
      try {
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const parsed = JSON.parse(cleaned)
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results: parsed }),
        }
      } catch {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            results: {
              facebook: text,
              instagram: text,
              linkedin: text,
              email: text,
            },
          }),
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: text }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error', message: err.message }),
    }
  }
}
