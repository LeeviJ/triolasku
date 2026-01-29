/**
 * Formatting utilities for TrioLasku
 * Removes trailing zeros from decimals for cleaner display
 */

/**
 * Format price - removes unnecessary trailing zeros
 * Examples:
 *   100.00 -> "100"
 *   25.50  -> "25,5"
 *   19.99  -> "19,99"
 *
 * @param {number|string} price - The price to format
 * @param {string} decimalSeparator - Decimal separator (default ',')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, decimalSeparator = ',') => {
  const num = parseFloat(price) || 0
  // Round to 2 decimal places first
  const rounded = Math.round(num * 100) / 100
  // Convert to string, which automatically removes trailing zeros
  const formatted = rounded.toString()
  // Replace decimal point with desired separator
  return formatted.replace('.', decimalSeparator)
}

/**
 * Format VAT rate - removes unnecessary trailing zeros
 * Examples:
 *   25.50 -> "25,5"
 *   24.00 -> "24"
 *   10.25 -> "10,25"
 *
 * @param {number|string} rate - The VAT rate to format
 * @param {string} decimalSeparator - Decimal separator (default ',')
 * @returns {string} Formatted VAT rate string
 */
export const formatVatRate = (rate, decimalSeparator = ',') => {
  const num = parseFloat(rate) || 0
  // Round to 2 decimal places first
  const rounded = Math.round(num * 100) / 100
  // Convert to string, which automatically removes trailing zeros
  const formatted = rounded.toString()
  // Replace decimal point with desired separator
  return formatted.replace('.', decimalSeparator)
}

/**
 * Format number with specific decimal places, removing trailing zeros
 *
 * @param {number|string} value - The number to format
 * @param {number} maxDecimals - Maximum decimal places (default 2)
 * @param {string} decimalSeparator - Decimal separator (default ',')
 * @returns {string} Formatted number string
 */
export const formatNumber = (value, maxDecimals = 2, decimalSeparator = ',') => {
  const num = parseFloat(value) || 0
  const multiplier = Math.pow(10, maxDecimals)
  const rounded = Math.round(num * multiplier) / multiplier
  const formatted = rounded.toString()
  return formatted.replace('.', decimalSeparator)
}

/**
 * Calculate gross price from net price and VAT rate
 *
 * @param {number|string} netPrice - Net price
 * @param {number|string} vatRate - VAT rate percentage
 * @returns {number} Gross price rounded to 2 decimals
 */
export const calculateGrossPrice = (netPrice, vatRate) => {
  const net = parseFloat(netPrice) || 0
  const vat = parseFloat(vatRate) || 0
  return Math.round(net * (1 + vat / 100) * 100) / 100
}

/**
 * Calculate net price from gross price and VAT rate
 *
 * @param {number|string} grossPrice - Gross price
 * @param {number|string} vatRate - VAT rate percentage
 * @returns {number} Net price rounded to 2 decimals
 */
export const calculateNetPrice = (grossPrice, vatRate) => {
  const gross = parseFloat(grossPrice) || 0
  const vat = parseFloat(vatRate) || 0
  return Math.round((gross / (1 + vat / 100)) * 100) / 100
}

/**
 * Calculate VAT amount from net price and VAT rate
 *
 * @param {number|string} netPrice - Net price
 * @param {number|string} vatRate - VAT rate percentage
 * @returns {number} VAT amount rounded to 2 decimals
 */
export const calculateVatAmount = (netPrice, vatRate) => {
  const net = parseFloat(netPrice) || 0
  const vat = parseFloat(vatRate) || 0
  return Math.round(net * (vat / 100) * 100) / 100
}
