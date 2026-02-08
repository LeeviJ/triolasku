// Netlify Function: Gemini AI proxy
// Uses server-side GEMINI_API_KEY environment variable set in Netlify dashboard
// Client calls: POST /.netlify/functions/gemini-proxy (or /api/gemini-proxy via redirect)

export async function handler(event) {
  // Only allow POST
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
    const { prompt, model } = JSON.parse(event.body || '{}')

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt' }) }
    }

    const geminiModel = model || 'gemini-2.0-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
