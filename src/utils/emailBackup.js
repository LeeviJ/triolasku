import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

const FALLBACK_TEXT = 'HUOM: Laskun tiedot olivat tyhjät sovelluksen muistissa'

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  let content = FALLBACK_TEXT

  if (invoice && invoice.invoiceNumber) {
    const num = invoice.invoiceNumber
    const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
    const customerName = invoice._customerName || 'Tuntematon asiakas'
    const invoiceDate = invoice.invoiceDate || invoice.createdAt?.slice(0, 10) || '-'
    content = 'Lasku #' + num + ' | ' + invoiceDate + ' | ' + amount + ' EUR | ' + customerName
  }

  const companyName = (invoice && invoice._companyName) || appName
  const sizeKb = (new TextEncoder().encode(content).length / 1024).toFixed(1)

  // Use a hidden HTML form + emailjs.sendForm() so that
  // UTF-8 field names (like "sisältö") are preserved by the browser's
  // native FormData encoding instead of JS object key serialization.
  const form = document.createElement('form')
  form.style.display = 'none'

  const addField = (name, value) => {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  addField('to_email', email)
  addField('nimi', companyName)
  addField('title', 'Varmuuskopio')
  addField('sisältö', content)
  addField('sisalto', content)
  addField('message', content)

  document.body.appendChild(form)

  console.log('[EmailJS] sendForm() with fields: to_email, nimi, title, sisältö, sisalto, message')
  console.log('[EmailJS] content:', content)
  console.log('[EmailJS] size:', sizeKb, 'kt')

  return emailjs.sendForm(SERVICE_ID, TEMPLATE_ID, form, PUBLIC_KEY).then(
    (response) => {
      document.body.removeChild(form)
      console.log('[EmailJS] OK', response.status)
      return { response, sizeKb }
    },
    (error) => {
      document.body.removeChild(form)
      console.error('[EmailJS] FAILED', error?.status, error?.text || error)
      throw error
    }
  )
}
