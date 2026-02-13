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
  'price_1T04k1RlDDEGqPN1D1PTvtz8': '1kk',
  'price_1T04Q5RlDDEGqPN1rOa8NI1C': '12kk',
  'price_1T04jORlDDEGqPN162NEJG6d': '6kk',
}
