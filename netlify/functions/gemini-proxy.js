const TONE_INSTRUCTIONS = {
  professional: {
    fi: 'Käytä asiallista ja ammattimaista sävyä.',
    en: 'Use a professional and formal tone.',
  },
  casual: {
    fi: 'Käytä rentoa ja helposti lähestyttävää sävyä.',
    en: 'Use a casual and approachable tone.',
  },
  sales: {
    fi: 'Käytä myyvää ja houkuttelevaa sävyä. Korosta hyötyjä ja luo kiireellisyyden tunnetta.',
    en: 'Use a persuasive and compelling sales tone. Highlight benefits and create urgency.',
  },
  informative: {
    fi: 'Käytä informatiivista ja opettavaista sävyä. Keskity faktoihin ja hyötyihin.',
    en: 'Use an informative and educational tone. Focus on facts and benefits.',
  },
}

// Models to try in order — fallback to lighter model on rate limit
const MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
]

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000] // ms

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callGemini(apiKey, model, promptText) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }],
    }),
  })
  return response
}

async function callWithRetryAndFallback(apiKey, promptText, preferredModel) {
  // Try preferred model first, then fallbacks
  const modelsToTry = preferredModel
    ? [preferredModel, ...MODELS.filter((m) => m !== preferredModel)]
    : MODELS

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const response = await callGemini(apiKey, model, promptText)

      if (response.ok) {
        return { response, model }
      }

      // On 429 (rate limit) or 503 (overloaded): retry with delay, then try next model
      if (response.status === 429 || response.status === 503) {
        if (attempt < MAX_RETRIES - 1) {
          await sleep(RETRY_DELAYS[attempt])
          continue
        }
        // Exhausted retries for this model, try next
        break
      }

      // Other errors: return immediately
      return { response, model }
    }
  }

  // All models and retries exhausted
  return { response: null, model: null }
}

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
    const { prompt, product, audience, tone, model } = body

    let finalPrompt
    let isMarketingMode = false

    if (product && audience) {
      isMarketingMode = true
      const toneInstruction = TONE_INSTRUCTIONS[tone]?.fi || TONE_INSTRUCTIONS.professional.fi

      finalPrompt = `Olet markkinointiasiantuntija. ${toneInstruction}

Luo markkinointisisältöä tuotteelle/palvelulle: "${product}"
Kohdeyleisö: "${audience}"

Vastaa TÄSMÄLLEEN tässä JSON-muodossa (ei muuta tekstiä, vain JSON):
{
  "facebook": "Facebook-postaus (2-3 lausetta, emoji ok)",
  "instagram": "Instagram-caption (lyhyt, hashtagit mukaan, emoji ok)",
  "linkedin": "LinkedIn-postaus (ammattimainen, 2-3 lausetta)",
  "email": "Sähköpostin aihe: [aihe]\\n\\n[sisältö, 3-5 lausetta]",
  "googleAds": "Otsikko (max 30 merkkiä)\\n\\nKuvaus 1 (max 90 merkkiä)\\nKuvaus 2 (max 90 merkkiä)",
  "blog": "Blogiotsikko\\n\\n[Artikkelin alku / tiivistelmä, 4-6 lausetta]"
}`
    } else if (prompt) {
      finalPrompt = prompt
    } else {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing prompt or product/audience' }) }
    }

    const { response, model: usedModel } = await callWithRetryAndFallback(apiKey, finalPrompt, model)

    if (!response) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: 'Kaikki mallit ylikuormitettuja. Yritä hetken kuluttua uudelleen.' }),
      }
    }

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
          body: JSON.stringify({ results: parsed, model: usedModel }),
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
              googleAds: text,
              blog: text,
            },
            model: usedModel,
          }),
        }
      }
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ result: text, model: usedModel }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy error', message: err.message }),
    }
  }
}
