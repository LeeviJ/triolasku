import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

export function sendEmailBackup(email, invoice, appName = 'TrioLasku') {
  if (!email || !email.includes('@')) {
    return Promise.reject(new Error('Sähköpostiosoite puuttuu tai on virheellinen.'))
  }

  const now = new Date()
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  const num = invoice.invoiceNumber ?? '-'
  const amount = Number(invoice.totalGross ?? invoice.total ?? 0).toFixed(2).replace('.', ',')
  const customerName = invoice._customerName || 'Tuntematon asiakas'
  const companyName = invoice._companyName || appName
  const invoiceDate = invoice.invoiceDate || invoice.createdAt?.slice(0, 10) || '-'

  const body = [
    `${appName} \u2014 varmuuskopio ${date}`,
    '',
    `Lasku #${num}`,
    `Asiakas: ${customerName}`,
    `P\u00e4iv\u00e4m\u00e4\u00e4r\u00e4: ${invoiceDate}`,
    `Summa: ${amount} \u20ac`,
    '',
    '--- JSON ---',
    JSON.stringify({ n: num, d: invoiceDate, s: amount, c: customerName }),
  ].join('\n')

  const sizeKb = (new TextEncoder().encode(body).length / 1024).toFixed(1)

  // Send under every possible key spelling so the template finds it
  const params = {
    to_email: email,
    nimi: companyName,
    title: `Laskun varmuuskopio: #${num} - ${amount}\u20ac`,
  }
  // Cover both sisalto and sisältö - one of them will match the template
  params.sisalto = body
  params[decodeURIComponent('sis%C3%A4lt%C3%B6')] = body

  console.log(`[EmailJS] Sending (${sizeKb} kt)`, { to: email, nimi: params.nimi, title: params.title })
  console.log('[EmailJS] Param keys:', Object.keys(params))

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, params).then(
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
