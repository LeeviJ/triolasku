import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

/**
 * Build email body as simple string - "Lasku nro: X | Summa: Y"
 */
function buildEmailBody(invoice) {
  const invoiceNumber = String(invoice?.invoiceNumber || '???')
  const totalAmount = String(invoice?.totalGross || invoice?.total || '0')

  // Simple format: "Lasku nro: X | Summa: Y"
  const sisalto = 'Lasku nro: ' + invoiceNumber + ' | Summa: ' + totalAmount

  console.log('[EmailBackup] sisalto:', sisalto)
  return sisalto
}

/**
 * Open Gmail web compose with pre-filled data.
 * This bypasses Windows mailto: Outlook forcing completely.
 * URL format: https://mail.google.com/mail/?view=cm&fs=1&to=EMAIL&su=SUBJECT&body=BODY
 */
export function openGmailCompose(email, subject, body) {
  const url = 'https://mail.google.com/mail/?view=cm&fs=1' +
    '&to=' + encodeURIComponent(email) +
    '&su=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body)

  console.log('[Gmail] Opening URL:', url)
  window.open(url, '_blank')
}

/**
 * Build Gmail URL for direct sharing - returns the URL string
 */
export function buildGmailUrl(email, invoice) {
  const body = buildEmailBody(invoice)
  const subject = 'Varmuuskopio - Lasku ' + String(invoice?.invoiceNumber || '')

  return 'https://mail.google.com/mail/?view=cm&fs=1' +
    '&to=' + encodeURIComponent(email) +
    '&su=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body)
}

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  // Build simple content: "Lasku nro: X | Summa: Y"
  const invoiceNumber = String(invoice?.invoiceNumber || '')
  const totalAmount = String(invoice?.totalGross || '0')
  const sisalto = 'Lasku nro: ' + invoiceNumber + ' | Summa: ' + totalAmount
  const companyName = String(invoice?._companyName || appName)

  console.log('[EmailJS] sisalto:', sisalto)
  console.log('[EmailJS] companyName:', companyName)

  // Create form with textarea elements
  const form = document.createElement('form')
  form.style.display = 'none'

  const addField = (name, value) => {
    const ta = document.createElement('textarea')
    ta.name = name
    ta.textContent = String(value) // Force string
    form.appendChild(ta)
  }

  addField('to_email', email)
  addField('nimi', companyName)
  addField('title', 'Varmuuskopio')
  addField('sisalto', sisalto) // Simple string: "Lasku nro: X | Summa: Y"

  document.body.appendChild(form)

  console.log('[EmailJS] Form fields set, sending...')

  return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY).then(
    (res) => {
      document.body.removeChild(form)
      console.log('[EmailJS] SUCCESS:', res.status)
      return { response: res, sizeKb: '0.1', sisalto: sisalto }
    },
    (err) => {
      document.body.removeChild(form)
      console.error('[EmailJS] FAILED:', err?.status, err?.text || err)
      err.sisalto = sisalto
      throw err
    }
  )
}

// Export for direct use
export { buildEmailBody }
