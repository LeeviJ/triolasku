import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

function stripLogo(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripLogo)
  const out = {}
  for (const [k, v] of Object.entries(obj)) {
    if (k === 'businessLogo') continue
    out[k] = stripLogo(v)
  }
  return out
}

const MAX_PAYLOAD_BYTES = 40_000

export function sendEmailBackup(email, jsonData, appName = 'TrioLasku') {
  const now = new Date()
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  let cleaned = stripLogo(jsonData)
  let payload = JSON.stringify(cleaned)

  // If still too large, keep only the 10 most recent invoices
  if (payload.length > MAX_PAYLOAD_BYTES && cleaned.invoices && cleaned.invoices.length > 10) {
    cleaned = { ...cleaned, invoices: cleaned.invoices.slice(-10) }
    payload = JSON.stringify(cleaned)
  }

  const templateParams = {
    to_email: email,
    subject: `${appName} Varmuuskopio ${date}`,
    backup_data: payload,
    app_name: appName,
    date,
  }

  console.log('[EmailJS] Sending backup...', { service: SERVICE_ID, template: TEMPLATE_ID, to: email })

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams).then(
    (response) => {
      console.log('[EmailJS] OK', response.status, response.text)
      return response
    },
    (error) => {
      console.error('[EmailJS] FAILED', error?.status, error?.text || error)
      throw error
    }
  )
}
