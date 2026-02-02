import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  const now = new Date()
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  const minimal = {
    n: invoice.invoiceNumber,
    d: invoice.invoiceDate || invoice.createdAt?.slice(0, 10),
    s: invoice.totalGross ?? invoice.total ?? null,
    c: invoice._customerName || null,
  }
  const payload = JSON.stringify(minimal)
  const sizeKb = (new TextEncoder().encode(payload).length / 1024).toFixed(1)

  const templateParams = {
    to_email: email,
    email_to: email,
    email: email,
    recipient: email,
    subject: `${appName} Varmuuskopio ${date}`,
    backup_data: payload,
    app_name: appName,
    date,
  }

  console.log(`[EmailJS] Sending single invoice backup (${sizeKb} kt)`, { to: email, params: Object.keys(templateParams) })

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams).then(
    (response) => {
      console.log('[EmailJS] OK', response.status, response.text)
      return { response, sizeKb }
    },
    (error) => {
      console.error('[EmailJS] FAILED', error?.status, error?.text || error)
      throw error
    }
  )
}
