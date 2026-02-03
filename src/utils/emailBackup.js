import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

/**
 * Open Gmail compose - bypasses Outlook
 */
export function openGmailCompose(email, subject, body) {
  const url = 'https://mail.google.com/mail/?view=cm&fs=1' +
    '&to=' + encodeURIComponent(email) +
    '&su=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body)
  window.open(url, '_blank')
}

/**
 * Send email backup via EmailJS
 * Uses ONLY 'message' field
 */
export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Invalid email'))
  }

  // Build message: "Lasku nro: X | Summa: Y EUR"
  const message = 'Lasku nro: ' + String(invoice?.invoiceNumber || '') + ' | Summa: ' + String(invoice?.totalGross || '0') + ' EUR'
  const nimi = String(invoice?._companyName || appName)

  console.log('[EmailJS] message:', message)

  // Send with ONLY 'message' field
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: email,
    nimi: nimi,
    title: 'Varmuuskopio',
    message: message
  }, PUBLIC_KEY).then(
    (res) => {
      console.log('[EmailJS] OK')
      return { response: res, message: message }
    },
    (err) => {
      console.error('[EmailJS] FAIL:', err)
      throw err
    }
  )
}
