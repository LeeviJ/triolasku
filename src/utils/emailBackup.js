import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

// Cache for email content - ensures data is preserved even if PDF generation consumes memory
let cachedEmailContent = null

/**
 * Pre-cache email content BEFORE any heavy operations (PDF generation).
 * Call this first to ensure email data is safe in memory.
 */
export function cacheEmailContent(invoice, appName = 'TrioLasku') {
  if (!invoice || !invoice.invoiceNumber) {
    cachedEmailContent = {
      text: 'Varmuuskopiodata puuttuu',
      companyName: appName
    }
    return cachedEmailContent
  }

  const num = invoice.invoiceNumber
  const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
  const customer = invoice._customerName || 'Tuntematon asiakas'
  const date = invoice.invoiceDate || ''

  cachedEmailContent = {
    text: `Lasku nro: ${num}, Pvm: ${date}, Summa: ${amount} EUR, Asiakas: ${customer}`,
    companyName: (invoice && invoice._companyName) || appName,
    invoiceNumber: num,
    amount: amount,
    customer: customer,
    date: date
  }

  console.log('[EmailBackup] Content cached:', cachedEmailContent.text)
  return cachedEmailContent
}

/**
 * Get cached content or build from invoice
 */
export function getCachedContent(invoice, appName = 'TrioLasku') {
  if (cachedEmailContent) {
    return cachedEmailContent
  }
  return cacheEmailContent(invoice, appName)
}

/**
 * Open Gmail web compose with pre-filled data.
 * This bypasses Windows mailto: Outlook forcing.
 */
export function openGmailCompose(email, subject, body) {
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
  window.open(gmailUrl, '_blank')
}

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  // CRITICAL: Cache content FIRST before any async operations
  const content = getCachedContent(invoice, appName)
  const text = content.text
  const companyName = content.companyName

  // Use a hidden form with <textarea> elements for UTF-8 name support
  const form = document.createElement('form')
  form.style.display = 'none'

  const addField = (name, value) => {
    const ta = document.createElement('textarea')
    ta.name = name
    ta.textContent = value
    form.appendChild(ta)
  }

  addField('to_email', email)
  addField('nimi', companyName)
  addField('title', 'Varmuuskopio')
  // The exact field name the EmailJS template uses: {{sisältö}}
  addField('sisältö', text)

  document.body.appendChild(form)

  console.log('[EmailJS] Sending:', { nimi: companyName, title: 'Varmuuskopio', 'sisältö': text })

  return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY).then(
    (res) => {
      document.body.removeChild(form)
      console.log('[EmailJS] OK', res.status)
      // Clear cache after successful send
      cachedEmailContent = null
      return { response: res, sizeKb: '0.1' }
    },
    (err) => {
      document.body.removeChild(form)
      console.error('[EmailJS] FAILED', err?.status, err?.text || err)
      // Return error with cached content for Gmail fallback
      err.cachedContent = content
      throw err
    }
  )
}
