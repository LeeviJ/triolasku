import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

const FALLBACK = 'TESTI: Sovellus ei löytänyt laskun tietoja muistista'

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  let sisaltoValue = FALLBACK

  if (invoice && invoice.invoiceNumber) {
    const num = invoice.invoiceNumber
    const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
    const customerName = invoice._customerName || 'Tuntematon asiakas'
    const invoiceDate = invoice.invoiceDate || invoice.createdAt?.slice(0, 10) || '-'
    sisaltoValue = 'Lasku #' + num + ' | ' + invoiceDate + ' | ' + amount + ' EUR | ' + customerName
  }

  const companyName = (invoice && invoice._companyName) || appName
  const sizeKb = (new TextEncoder().encode(sisaltoValue).length / 1024).toFixed(1)

  const templateParams = {}
  templateParams.to_email = email
  templateParams.nimi = companyName
  templateParams.title = 'Varmuuskopio'
  templateParams[`sis\u00E4lt\u00F6`] = sisaltoValue
  templateParams.sisalto = sisaltoValue
  templateParams.message = sisaltoValue

  console.log('[EmailJS] PARAMS:', JSON.stringify(templateParams, null, 2))
  console.log('[EmailJS] Keys:', Object.keys(templateParams).join(', '))
  console.log('[EmailJS] sisältö value length:', sisaltoValue.length, '(' + sizeKb + ' kt)')

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams).then(
    (response) => {
      console.log('[EmailJS] OK', response.status)
      return { response, sizeKb }
    },
    (error) => {
      console.error('[EmailJS] FAILED', error?.status, error?.text || error)
      throw error
    }
  )
}
