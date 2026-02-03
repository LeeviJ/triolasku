import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

/**
 * Send email backup via EmailJS
 * Uses ONLY 'message' field with rich content
 */
export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Invalid email'))
  }

  // Build product list: "Kahvi 2 kpl 5€, Pulla 1 kpl 2€"
  const products = (invoice?.rows || [])
    .filter(row => row.description)
    .map(row => row.description + ' ' + row.quantity + ' kpl ' + row.priceNet + '€')
    .join(', ')

  // Build rich message with customer name (from snapshot)
  const customerName = invoice?._customerName || ''
  const invoiceNum = String(invoice?.invoiceNumber || '')
  const total = String(invoice?.totalGross || '0')

  // Format: "Lasku 17 | Asiakas: Firma Oy | Tuotteet: Kahvi 2 kpl 5€ | Yhteensä: 12€"
  let message = 'Lasku ' + invoiceNum
  if (customerName) message += ' | Asiakas: ' + customerName
  if (products) message += ' | Tuotteet: ' + products
  message += ' | Yhteensä: ' + total + ' EUR'

  const nimi = String(invoice?._companyName || appName)

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, {
    to_email: email,
    nimi: nimi,
    title: 'Varmuuskopio',
    message: message
  }, PUBLIC_KEY)
}
