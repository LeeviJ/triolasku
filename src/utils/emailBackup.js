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

  const sisältö = JSON.stringify({ numero: num, pvm: invoiceDate, summa: amount, asiakas: customerName })
  const sizeKb = (new TextEncoder().encode(sisältö).length / 1024).toFixed(1)

  const templateParams = {
    to_email: email,
    nimi: companyName,
    title: `Laskun varmuuskopio: #${num} - ${amount}€`,
    sisältö: sisältö,
  }

  console.log(`[EmailJS] Sending (${sizeKb} kt)`, templateParams)

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
