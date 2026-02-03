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

  // COPY-PASTE FROM GMAIL BUTTON - THIS EXACT CODE WORKS:
  // const sisalto = 'Lasku nro: ' + String(latest.invoiceNumber || '') + ' | Summa: ' + String(latest.totalGross || '0')
  const sisalto = 'Lasku nro: ' + String(invoice?.invoiceNumber || '') + ' | Summa: ' + String(invoice?.totalGross || '0')

  // Company name for email header
  const nimi = String(invoice?._companyName || appName)

  // DEBUG: Log everything
  console.log('=== EMAILJS DEBUG START ===')
  console.log('invoice object:', invoice)
  console.log('invoice.invoiceNumber:', invoice?.invoiceNumber)
  console.log('invoice.totalGross:', invoice?.totalGross)
  console.log('FINAL sisalto:', sisalto)
  console.log('FINAL nimi:', nimi)
  console.log('=== EMAILJS DEBUG END ===')

  // Send with exact template field names
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: email,
    nimi: nimi,
    title: 'Varmuuskopio',
    sisalto: sisalto
  }, PUBLIC_KEY).then(
    (res) => {
      console.log('[EmailJS] SUCCESS - sisalto was:', sisalto)
      return { response: res, sisalto: sisalto }
    },
    (err) => {
      console.error('[EmailJS] FAILED:', err)
      throw err
    }
  )
}

// Export for direct use
export { buildEmailBody }
