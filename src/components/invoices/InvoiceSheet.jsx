import { useRef, useEffect } from 'react'
import JsBarcode from 'jsbarcode'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import { formatPrice, formatVatRate, formatDateFI } from '../../utils/formatters'

export default function InvoiceSheet({ invoice, invoiceRef, scale = 1 }) {
  const { language } = useLanguage()
  const { companies, customers, units } = useData()
  const barcodeRef = useRef(null)

  const liveCompany = companies.find((c) => c.id === invoice.companyId)
  const liveCustomer = customers.find((c) => c.id === invoice.customerId)

  const company = invoice.company || liveCompany || {
    name: invoice._companyName || '',
    businessId: invoice._companyBusinessId || '',
    vatNumber: invoice._companyVatNumber || '',
    streetAddress: invoice._companyAddress || '',
    postalCode: invoice._companyPostalCode || '',
    city: invoice._companyCity || '',
    phone: invoice._companyPhone || '',
    email: invoice._companyEmail || '',
    bankAccounts: invoice.company?.bankAccounts || [],
  }

  const customer = invoice.customer || liveCustomer || {
    name: invoice._customerName || '',
    businessId: invoice._customerBusinessId || '',
    streetAddress: invoice._customerAddress || '',
    postalCode: invoice._customerPostalCode || '',
    city: invoice._customerCity || '',
    contactPerson: invoice._customerContactPerson || '',
  }

  const isCreditNote = invoice.isCreditNote === true
  const isReceipt = invoice.paymentMethod && invoice.paymentMethod !== 'invoice'

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return unitId
    return language === 'fi' ? unit.name : unit.nameEn
  }

  const calculateRowTotal = (row) => {
    const qty = parseFloat(row.quantity) || 0
    const price = parseFloat(row.priceNet) || 0
    return qty * price
  }

  const vatSummary = {}
  invoice.rows?.forEach((row) => {
    const rowNet = calculateRowTotal(row)
    const rate = parseFloat(row.vatRate) || 0
    if (!vatSummary[rate]) vatSummary[rate] = { net: 0, vat: 0 }
    vatSummary[rate].net += rowNet
    vatSummary[rate].vat += rowNet * (rate / 100)
  })

  const rowCount = invoice.rows?.length || 0
  const density = rowCount > 20 ? 'ultra' : rowCount > 10 ? 'compact' : 'normal'
  const rowFont = density === 'ultra' ? '0.7rem' : density === 'compact' ? '0.8rem' : '0.875rem'
  const rowPad = density === 'ultra' ? '0.15rem 0' : density === 'compact' ? '0.3rem 0' : '0.5rem 0'
  const sectionGap = density === 'ultra' ? '0.75rem' : density === 'compact' ? '1rem' : '1.5rem'
  const headerGap = density === 'ultra' ? '1rem' : density === 'compact' ? '1.5rem' : '2rem'
  const totalsFont = density === 'ultra' ? '0.75rem' : density === 'compact' ? '0.8rem' : '0.875rem'
  const grandTotalFont = density === 'ultra' ? '0.95rem' : density === 'compact' ? '1rem' : '1.125rem'
  const paymentFont = density === 'ultra' ? '1rem' : density === 'compact' ? '1.1rem' : '1.25rem'

  // Finnish reference number with check digit (modulo 10, weights 7-3-1)
  const generateFinnishReferenceNumber = () => {
    const base = `${invoice.invoiceNumber || 1}`.padStart(4, '0')
    const weights = [7, 3, 1]
    let sum = 0
    for (let i = base.length - 1, w = 0; i >= 0; i--, w++) {
      sum += parseInt(base[i], 10) * weights[w % 3]
    }
    const checkDigit = (10 - (sum % 10)) % 10
    return `${base}${checkDigit}`
  }

  // 54-character Finnish virtual barcode (version 4)
  const generateVirtualBarcode = () => {
    const iban = (company?.bankAccounts?.[0]?.iban || '').replace(/\s/g, '')
    const ibanDigits = iban.replace(/^FI/, '').padStart(16, '0')
    const totalCents = Math.round((parseFloat(invoice.totalGross) || 0) * 100)
    const amountStr = totalCents.toString().padStart(8, '0')
    const reserved = '000'
    const refNum = generateFinnishReferenceNumber().padStart(20, '0')
    let dueDateStr = '000000'
    if (invoice.dueDate) {
      const parts = invoice.dueDate.split('-')
      if (parts.length === 3) {
        dueDateStr = `${parts[2]}${parts[1]}${parts[0].slice(2)}`
      }
    }
    return `4${ibanDigits}${amountStr}${reserved}${refNum}${dueDateStr}`
  }

  const referenceNumber = generateFinnishReferenceNumber()
  const virtualBarcode = generateVirtualBarcode()

  useEffect(() => {
    if (barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, virtualBarcode, {
          format: 'CODE128',
          width: 1.5,
          height: 50,
          displayValue: false,
          margin: 0,
        })
      } catch (e) {
        // barcode generation failed silently
      }
    }
  }, [virtualBarcode])

  return (
    <div ref={invoiceRef} className="invoice-sheet" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: '#ffffff', color: '#111827', margin: '0 auto', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', lineHeight: '1.5', boxSizing: 'border-box', ...(scale < 1 ? { transform: `scale(${scale})`, transformOrigin: 'top left' } : {}) }}>
      {/* Header with logo */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: headerGap }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
          {company?.logo ? (
            <img
              src={company.logo.startsWith('data:') ? company.logo : `data:image/png;base64,${company.logo}`}
              alt={company.name}
              style={{ height: '100px', width: 'auto', objectFit: 'contain' }}
            />
          ) : (
            <div style={{ width: '100px', height: '100px', backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '0.75rem', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              LOGO
            </div>
          )}
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#111827', margin: 0 }}>{company?.name}</h1>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company?.streetAddress}</p>
            <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company?.postalCode} {company?.city}</p>
            {company?.phone && <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company.phone}</p>}
            {company?.email && <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company.email}</p>}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', textTransform: 'uppercase', margin: 0 }}>
            {isCreditNote
              ? (language === 'fi' ? 'HYVITYSLASKU' : 'CREDIT NOTE')
              : isReceipt
                ? (language === 'fi' ? 'KUITTI' : language === 'sv' ? 'KVITTO' : 'RECEIPT')
                : (language === 'fi' ? 'LASKU' : language === 'sv' ? 'FAKTURA' : 'INVOICE')}
          </h2>
          {isCreditNote && invoice.creditedInvoiceNumber && (
            <p style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 600 }}>
              Hyvitys laskuun {invoice.creditedInvoiceNumber}
            </p>
          )}
          {isReceipt && !isCreditNote && (
            <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
              {language === 'fi' ? 'Maksettu' : 'Paid'}: {invoice.paymentMethod}
            </p>
          )}
        </div>
      </div>

      {/* Invoice details and recipient */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: headerGap, marginBottom: headerGap }}>
        <div>
          <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
            {language === 'fi' ? 'Vastaanottaja' : 'Recipient'}
          </h3>
          <div style={{ fontSize: '0.875rem' }}>
            <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{customer?.name}</p>
            {customer?.contactPerson && <p style={{ color: '#4b5563', margin: 0 }}>{customer.contactPerson}</p>}
            <p style={{ color: '#4b5563', margin: 0 }}>{customer?.streetAddress}</p>
            <p style={{ color: '#4b5563', margin: 0 }}>{customer?.postalCode} {customer?.city}</p>
            {customer?.businessId && (
              <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>
                {language === 'fi' ? 'Y-tunnus' : 'Business ID'}: {customer.businessId}
              </p>
            )}
          </div>
        </div>

        <div>
          <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
            <tbody>
              <tr>
                <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Laskun numero' : 'Invoice number'}:</td>
                <td style={{ padding: '0.25rem 0', fontWeight: 600, textAlign: 'right' }}>{invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Laskun päivä' : 'Invoice date'}:</td>
                <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{formatDateFI(invoice.invoiceDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Eräpäivä' : 'Due date'}:</td>
                <td style={{ padding: '0.25rem 0', fontWeight: 600, textAlign: 'right' }}>{formatDateFI(invoice.dueDate)}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Maksuehto' : 'Payment terms'}:</td>
                <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.paymentTermDays} {language === 'fi' ? 'pv' : 'days'}</td>
              </tr>
              <tr>
                <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Viivästyskorko' : 'Late interest'}:</td>
                <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.lateInterest} %</td>
              </tr>
              {invoice.ourReference && (
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Viitteemme' : 'Our reference'}:</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.ourReference}</td>
                </tr>
              )}
              {invoice.yourReference && (
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{language === 'fi' ? 'Viitteenne' : 'Your reference'}:</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.yourReference}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional info start */}
      {invoice.additionalInfoStart && (
        <div style={{ marginBottom: sectionGap, padding: '0.75rem', backgroundColor: '#f9fafb', color: '#374151', borderRadius: '4px', fontSize: rowFont }}>
          {invoice.additionalInfoStart}
        </div>
      )}

      {/* Invoice rows */}
      <table style={{ width: '100%', fontSize: rowFont, marginBottom: sectionGap, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #d1d5db' }}>
            <th style={{ padding: rowPad, textAlign: 'left', fontWeight: 600, color: '#374151' }}>{language === 'fi' ? 'Kuvaus' : 'Description'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '4rem' }}>{language === 'fi' ? 'Määrä' : 'Qty'}</th>
            <th style={{ padding: rowPad, textAlign: 'center', fontWeight: 600, color: '#374151', width: '3rem' }}>{language === 'fi' ? 'Yks.' : 'Unit'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '5rem' }}>{language === 'fi' ? 'á netto' : 'Unit net'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '5rem' }}>{language === 'fi' ? 'Netto' : 'Net'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '3.5rem' }}>{language === 'fi' ? 'ALV %' : 'VAT %'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '5rem' }}>{language === 'fi' ? 'ALV €' : 'VAT €'}</th>
            <th style={{ padding: rowPad, textAlign: 'right', fontWeight: 600, color: '#374151', width: '5.5rem' }}>{language === 'fi' ? 'Yhteensä' : 'Total'}</th>
          </tr>
        </thead>
        <tbody>
          {invoice.rows?.map((row, index) => {
            const rowNet = calculateRowTotal(row)
            const rowVatAmount = rowNet * (parseFloat(row.vatRate) || 0) / 100
            const rowGross = rowNet + rowVatAmount
            return (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: rowPad, color: '#111827' }}>{row.description}</td>
                <td style={{ padding: rowPad, textAlign: 'right', color: '#4b5563' }}>{formatPrice(row.quantity)}</td>
                <td style={{ padding: rowPad, textAlign: 'center', color: '#4b5563' }}>{getUnitName(row.unit)}</td>
                <td style={{ padding: rowPad, textAlign: 'right', color: '#4b5563' }}>{formatPrice(row.priceNet)}</td>
                <td style={{ padding: rowPad, textAlign: 'right', color: '#4b5563' }}>{formatPrice(rowNet)}</td>
                <td style={{ padding: rowPad, textAlign: 'right', color: '#4b5563' }}>{formatVatRate(row.vatRate)} %</td>
                <td style={{ padding: rowPad, textAlign: 'right', color: '#4b5563' }}>{formatPrice(Math.round(rowVatAmount * 100) / 100)}</td>
                <td style={{ padding: rowPad, textAlign: 'right', fontWeight: 500, color: '#111827' }}>{formatPrice(Math.round(rowGross * 100) / 100)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Additional info end */}
      {invoice.additionalInfoEnd && (
        <div style={{ marginBottom: sectionGap, padding: '0.75rem', backgroundColor: '#f9fafb', color: '#374151', borderRadius: '4px', fontSize: rowFont }}>
          {invoice.additionalInfoEnd}
        </div>
      )}

      {/* Totals */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: headerGap }}>
        <div style={{ width: '22rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: totalsFont, padding: '0.25rem 0' }}>
            <span style={{ color: '#4b5563' }}>{language === 'fi' ? 'Veroton yhteensä (ALV 0 %)' : 'Subtotal (excl. VAT)'}:</span>
            <span>{formatPrice(invoice.totalNet)} EUR</span>
          </div>
          {Object.entries(vatSummary)
            .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
            .map(([rate, values]) => (
            <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: totalsFont, padding: '0.25rem 0' }}>
              <span style={{ color: '#4b5563' }}>
                ALV {formatVatRate(rate)} % ({language === 'fi' ? 'perusteesta' : 'of'} {formatPrice(Math.round(values.net * 100) / 100)} €):
              </span>
              <span>{formatPrice(Math.round(values.vat * 100) / 100)} EUR</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: totalsFont, padding: '0.25rem 0', borderTop: '1px solid #e5e7eb', marginTop: '0.25rem' }}>
            <span style={{ color: '#4b5563' }}>{language === 'fi' ? 'ALV yhteensä' : 'VAT total'}:</span>
            <span>{formatPrice(invoice.totalVat)} EUR</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: grandTotalFont, fontWeight: 700, padding: '0.5rem 0', borderTop: '2px solid #111827', marginTop: '0.5rem' }}>
            <span>{language === 'fi' ? 'Maksettava yhteensä' : 'Grand total'}:</span>
            <span>{formatPrice(invoice.totalGross)} EUR</span>
          </div>
        </div>
      </div>

      {/* Payment details */}
      <div style={{ borderTop: '2px solid #d1d5db', paddingTop: sectionGap }}>
        <h3 style={{ fontSize: totalsFont, fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
          {language === 'fi' ? 'Maksutiedot' : 'Payment Details'}
        </h3>
        <div>
          {company?.bankAccounts?.map((account, index) => (
            <div key={index} style={{ marginBottom: '0.75rem' }}>
              {account.bankName && <p style={{ fontSize: totalsFont, color: '#4b5563', margin: 0 }}>{account.bankName}</p>}
              <p style={{ color: '#111827', fontWeight: 700, fontSize: paymentFont, letterSpacing: '0.05em', margin: '0.25rem 0' }}>IBAN: {account.iban}</p>
              {account.bic && <p style={{ fontSize: totalsFont, color: '#4b5563', margin: 0 }}>BIC: {account.bic}</p>}
            </div>
          ))}
          <div style={{ display: 'flex', gap: headerGap, marginTop: '0.75rem' }}>
            <div>
              <p style={{ fontSize: totalsFont, color: '#4b5563', margin: 0 }}>{language === 'fi' ? 'Viitenumero' : 'Reference'}:</p>
              <p style={{ fontWeight: 700, fontSize: paymentFont, color: '#111827', margin: 0 }}>{referenceNumber}</p>
            </div>
            <div>
              <p style={{ fontSize: totalsFont, color: '#4b5563', margin: 0 }}>{language === 'fi' ? 'Maksettava yhteensä' : 'Grand total'}:</p>
              <p style={{ fontWeight: 700, fontSize: paymentFont, color: '#111827', margin: 0 }}>{formatPrice(invoice.totalGross)} EUR</p>
            </div>
            <div>
              <p style={{ fontSize: totalsFont, color: '#4b5563', margin: 0 }}>{language === 'fi' ? 'Eräpäivä' : 'Due date'}:</p>
              <p style={{ fontWeight: 700, fontSize: paymentFont, color: '#111827', margin: 0 }}>{formatDateFI(invoice.dueDate)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: sectionGap, minHeight: '30mm' }}>
        <svg ref={barcodeRef}></svg>
        <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#374151', letterSpacing: '0.05em', marginTop: '0.5rem', marginBottom: '0.25rem', userSelect: 'all' }}>
          {virtualBarcode}
        </p>
        <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
          {language === 'fi' ? 'VIRTUAALIVIIVAKOODI' : 'VIRTUAL BARCODE'}
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        <div>
          {company?.name} | {company?.businessId && `${language === 'fi' ? 'Y-tunnus' : 'Business ID'}: ${company.businessId}`}
          {company?.vatNumber && ` | ${company.vatNumber}`}
          {company?.streetAddress && ` | ${company.streetAddress}`}
        </div>
        <div style={{ marginTop: '0.25rem', fontSize: '0.7rem' }}>
          {language === 'fi' ? 'ALV-velvollisuus rekisteröity 1.2.2026 alkaen' : 'VAT liability registered from 1 Feb 2026'}
        </div>
      </div>
    </div>
  )
}
