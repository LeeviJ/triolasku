import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  let textContent = 'HUOM: Laskun tiedot olivat tyhjät sovelluksen muistissa'

  if (invoice && invoice.invoiceNumber) {
    const num = invoice.invoiceNumber
    const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
    const customerName = invoice._customerName || 'Tuntematon asiakas'
    const invoiceDate = invoice.invoiceDate || invoice.createdAt?.slice(0, 10) || '-'
    textContent = 'Lasku #' + num + ' | ' + invoiceDate + ' | ' + amount + ' EUR | ' + customerName
  }

  const companyName = (invoice && invoice._companyName) || appName
  const sizeKb = (new TextEncoder().encode(textContent).length / 1024).toFixed(1)

  // Plain object literal - key "sisältö" written directly in source
  const p = {
    'to_email': email,
    'nimi': companyName,
    'title': 'Varmuuskopio',
    'sisältö': textContent,
    'sisalto': textContent,
    'message': textContent,
  }

  console.log('[EmailJS] send() with PUBLIC_KEY as 4th arg')
  console.log('[EmailJS] params:', JSON.stringify(p))
  console.log('[EmailJS] size:', sizeKb, 'kt')

  // Pass PUBLIC_KEY directly instead of relying on init()
  return emailjs.send(SERVICE_ID, TEMPLATE_ID, p, PUBLIC_KEY).then(
    (res) => {
      console.log('[EmailJS] OK', res.status)
      return { response: res, sizeKb }
    },
    (err) => {
      console.error('[EmailJS] FAILED', err?.status, err?.text || err)
      throw err
    }
  )
}
