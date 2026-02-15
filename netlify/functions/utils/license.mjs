const CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function generateLicenseKey() {
  const segment = () =>
    Array.from({ length: 4 }, () => CHARS[Math.floor(Math.random() * CHARS.length)]).join('')
  return `TRIO-${segment()}-${segment()}-${segment()}`
}

export function supabaseHeaders() {
  return {
    'apikey': process.env.SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  }
}

export const SUPABASE_URL = () => process.env.SUPABASE_URL

export const PLAN_DURATIONS = {
  '1kk': 30,
  '6kk': 183,
  '12kk': 365,
}

export const PRICE_ID_TO_PLAN = {
  [process.env.STRIPE_PRICE_ID_1MO]: '1kk',
  [process.env.STRIPE_PRICE_ID_12MO]: '12kk',
  [process.env.STRIPE_PRICE_ID_6MO]: '6kk',
}

// Prices including VAT 25.5% (launch prices with -40% discount)
export const PLAN_PRICES = {
  '1kk':  { gross: 10.00, label: '1 kuukausi' },
  '6kk':  { gross: 50.00, label: '6 kuukautta' },
  '12kk': { gross: 90.00, label: '12 kuukautta' },
}

const VAT_RATE = 25.5

export function vatBreakdown(gross) {
  const net = gross / (1 + VAT_RATE / 100)
  const vat = gross - net
  return {
    net: net.toFixed(2),
    vat: vat.toFixed(2),
    gross: gross.toFixed(2),
    vatRate: VAT_RATE,
  }
}

// Prices including VAT 25.5%
export const PLAN_PRICES = {
  '1kk':  { gross: 12.00,  label: '1 kuukausi' },
  '6kk':  { gross: 65.00,  label: '6 kuukautta' },
  '12kk': { gross: 120.00, label: '12 kuukautta' },
}

const VAT_RATE = 25.5

export function vatBreakdown(gross) {
  const net = gross / (1 + VAT_RATE / 100)
  const vat = gross - net
  return {
    net: net.toFixed(2),
    vat: vat.toFixed(2),
    gross: gross.toFixed(2),
    vatRate: VAT_RATE,
  }
}
