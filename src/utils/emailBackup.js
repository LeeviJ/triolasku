import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  // Build a simple plain text string — no JSON, no objects
  let text = 'Varmuuskopiodata puuttuu'
  if (invoice && invoice.invoiceNumber) {
    const num = invoice.invoiceNumber
    const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
    const customer = invoice._customerName || 'Tuntematon asiakas'
    text = 'Lasku nro: ' + num + ', Summa: ' + amount + 'EUR, Asiakas: ' + customer
  }

  const companyName = (invoice && invoice._companyName) || appName

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
      return { response: res, sizeKb: '0.1' }
    },
    (err) => {
      document.body.removeChild(form)
      console.error('[EmailJS] FAILED', err?.status, err?.text || err)
      throw err
    }
  )
}
