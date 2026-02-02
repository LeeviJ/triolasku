import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  const num = invoice.invoiceNumber ?? '-'
  const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
  const customerName = invoice._customerName || 'Tuntematon asiakas'
  const companyName = invoice._companyName || appName
  const invoiceDate = invoice.invoiceDate || invoice.createdAt?.slice(0, 10) || '-'

  const data = JSON.stringify({ numero: num, pvm: invoiceDate, summa: amount, asiakas: customerName })
  const content = data || 'Varmuuskopiointi epäonnistui - data puuttuu'
  const sizeKb = (new TextEncoder().encode(content).length / 1024).toFixed(1)

  // Build params object, then assign sisältö key explicitly
  const templateParams = Object.create(null)
  templateParams['to_email'] = email
  templateParams['nimi'] = companyName
  templateParams['title'] = 'Laskun varmuuskopio: #' + num + ' - ' + amount + '\u20ac'
  // Assign with literal Unicode key - this is the key EmailJS template {{sisältö}} expects
  templateParams['sis\u00e4lt\u00f6'] = content

  console.log('[EmailJS] templateParams:', JSON.stringify(templateParams))
  console.log('[EmailJS] size:', sizeKb, 'kt')

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
