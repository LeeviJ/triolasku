import emailjs from '@emailjs/browser'

const SERVICE_ID = 'service_ntldw1a'
const TEMPLATE_ID = 'template_57uxo1s'
const PUBLIC_KEY = 'lg6qe5VWQC2tML2zo'

emailjs.init(PUBLIC_KEY)

function toUltraLight(data) {
  const invoices = Array.isArray(data.invoices)
    ? data.invoices
    : Array.isArray(data[Object.keys(data).find((k) => k.includes('invoices'))])
      ? data[Object.keys(data).find((k) => k.includes('invoices'))]
      : []

  const customers = Array.isArray(data.customers)
    ? data.customers
    : Array.isArray(data[Object.keys(data).find((k) => k.includes('customers'))])
      ? data[Object.keys(data).find((k) => k.includes('customers'))]
      : []

  const last5 = invoices.slice(-5)

  return last5.map((inv) => {
    const customer = customers.find((c) => c.id === inv.customerId)
    return {
      n: inv.invoiceNumber,
      d: inv.invoiceDate || inv.createdAt?.slice(0, 10),
      s: inv.totalGross ?? inv.total ?? null,
      c: customer?.name || null,
    }
  })
}

export function sendEmailBackup(email, jsonData, appName = 'TrioLasku') {
  const now = new Date()
  const date = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`

  const payload = JSON.stringify(toUltraLight(jsonData))

  const templateParams = {
    to_email: email,
    subject: `${appName} Varmuuskopio ${date}`,
    backup_data: payload,
    app_name: appName,
    date,
  }

  console.log('[EmailJS] Sending ultra-light backup...', { service: SERVICE_ID, template: TEMPLATE_ID, to: email, size: payload.length })

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams).then(
    (response) => {
      console.log('[EmailJS] OK', response.status, response.text)
      return response
    },
    (error) => {
      console.error('[EmailJS] FAILED', error?.status, error?.text || error)
      throw error
    }
  )
}
