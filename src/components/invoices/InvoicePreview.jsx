import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Printer, Download, Share2, Check } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import JsBarcode from 'jsbarcode'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import Button from '../ui/Button'
import { formatPrice, formatVatRate, calculateGrossPrice, formatDateFI } from '../../utils/formatters'

export default function InvoicePreview({ invoice, onClose }) {
  const { t, language } = useLanguage()
  const { companies, customers, units, updateInvoice } = useData()
  const invoiceRef = useRef(null)
  const barcodeRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [statusNotice, setStatusNotice] = useState(false)

  const company = invoice.company || companies.find((c) => c.id === invoice.companyId)
  const customer = invoice.customer || customers.find((c) => c.id === invoice.customerId)

  const isReceipt = invoice.paymentMethod && invoice.paymentMethod !== 'invoice'
  const docLabel = isReceipt
    ? (language === 'fi' ? 'Kuitti' : language === 'sv' ? 'Kvitto' : 'Receipt')
    : (language === 'fi' ? 'Lasku' : language === 'sv' ? 'Faktura' : 'Invoice')

  const getFileName = () => {
    const companyName = (company?.name || 'Yritys').replace(/[^a-zA-Z0-9äöåÄÖÅ]/g, '_')
    return `${docLabel}_${invoice.invoiceNumber}_${companyName}.pdf`
  }

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

  // Group VAT by rate for summary
  const vatSummary = {}
  invoice.rows?.forEach((row) => {
    const rowNet = calculateRowTotal(row)
    const rate = parseFloat(row.vatRate) || 0
    if (!vatSummary[rate]) {
      vatSummary[rate] = { net: 0, vat: 0 }
    }
    vatSummary[rate].net += rowNet
    vatSummary[rate].vat += rowNet * (rate / 100)
  })

  const handlePrint = () => {
    window.print()
  }

  // Generate Finnish reference number with check digit (modulo 10, weights 7-3-1)
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

  // Generate 54-character Finnish virtual barcode (version 4)
  const generateVirtualBarcode = () => {
    const iban = (company?.bankAccounts?.[0]?.iban || '').replace(/\s/g, '')
    const ibanDigits = iban.replace(/^FI/, '').padStart(16, '0')

    const totalCents = Math.round((parseFloat(invoice.totalGross) || 0) * 100)
    const amountStr = totalCents.toString().padStart(8, '0')

    const reserved = '000'

    const refNum = generateFinnishReferenceNumber().padStart(20, '0')

    // Due date as DDMMYY
    let dueDateStr = '000000'
    if (invoice.dueDate) {
      const parts = invoice.dueDate.split('-') // YYYY-MM-DD
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

  // Remove all stylesheets that contain oklch and force computed colors
  // as inline styles so html2canvas never encounters oklch()
  const fixColorsForHtml2Canvas = (clonedDoc, clonedElement) => {
    // Step 1: Remove/disable stylesheets containing oklch
    const sheets = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]')
    sheets.forEach((sheet) => {
      try {
        const text = sheet.textContent || ''
        if (text.includes('oklch') || text.includes('oklab')) {
          sheet.remove()
        }
      } catch (e) {
        // cross-origin stylesheet, ignore
      }
    })

    // Step 2: Force all computed colors as inline rgb() on every element
    // Also convert any oklch/oklab values that getComputedStyle may return
    const colorProps = [
      'color', 'background-color', 'border-color',
      'border-top-color', 'border-bottom-color', 'border-left-color', 'border-right-color',
      'box-shadow', 'outline-color', 'text-decoration-color',
    ]
    const allElements = clonedDoc.querySelectorAll('*')
    const win = clonedDoc.defaultView

    // Helper: convert any oklch/oklab value to a safe fallback
    const sanitizeColor = (value) => {
      if (!value || value === 'none' || value === 'transparent') return value
      if (value.includes('oklch') || value.includes('oklab')) return '#000000'
      return value
    }

    for (const el of allElements) {
      const computed = win.getComputedStyle(el)
      for (const prop of colorProps) {
        const resolved = computed.getPropertyValue(prop)
        if (resolved && resolved !== 'none') {
          el.style.setProperty(prop, sanitizeColor(resolved), 'important')
        }
      }
    }

    // Step 3: Ensure the invoice element is visible and properly positioned
    clonedElement.style.visibility = 'visible'
    clonedElement.style.position = 'static'
    clonedElement.style.display = 'block'
    clonedElement.style.backgroundColor = '#ffffff'
    clonedElement.style.boxShadow = 'none'
  }

  const generatePdf = async () => {
    const element = invoiceRef.current
    if (!element) {
      throw new Error('Invoice element not found')
    }

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      onclone: fixColorsForHtml2Canvas,
    })

    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pdfWidth = 210
    const pdfHeight = 297
    const imgWidth = canvas.width
    const imgHeight = canvas.height
    const ratio = pdfWidth / imgWidth
    const scaledHeight = imgHeight * ratio

    if (scaledHeight <= pdfHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, scaledHeight)
    } else {
      let y = 0
      const pageHeightPx = pdfHeight / ratio
      let pageIndex = 0
      while (y < imgHeight) {
        const sliceHeight = Math.min(pageHeightPx, imgHeight - y)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = imgWidth
        pageCanvas.height = sliceHeight
        const ctx = pageCanvas.getContext('2d')
        ctx.drawImage(canvas, 0, y, imgWidth, sliceHeight, 0, 0, imgWidth, sliceHeight)
        const pageImg = pageCanvas.toDataURL('image/jpeg', 0.95)
        if (pageIndex > 0) pdf.addPage()
        pdf.addImage(pageImg, 'JPEG', 0, 0, pdfWidth, sliceHeight * ratio)
        y += sliceHeight
        pageIndex++
      }
    }

    return pdf
  }

  const markAsSent = () => {
    if (invoice.id && (!invoice.status || invoice.status === 'draft')) {
      updateInvoice(invoice.id, { status: 'sent' })
      setStatusNotice(true)
      setTimeout(() => setStatusNotice(false), 3000)
    }
  }

  const handleDownloadPdf = async () => {
    markAsSent()
    setGenerating(true)
    try {
      const pdf = await generatePdf()
      pdf.save(getFileName())
    } catch (err) {
      console.error('PDF error:', err)
      alert(`PDF-generointi epäonnistui: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleShare = async () => {
    markAsSent()
    setGenerating(true)
    try {
      const pdf = await generatePdf()
      const blob = pdf.output('blob')
      const file = new File([blob], getFileName(), { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `${docLabel} ${invoice.invoiceNumber}`,
          files: [file],
        })
      } else {
        pdf.save(getFileName())
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Share/PDF error:', err)
        alert(`PDF-jako epäonnistui: ${err.message}`)
      }
    } finally {
      setGenerating(false)
    }
  }

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  return (
    <div className="max-w-5xl mx-auto">
      {/* Controls (hidden when printing) */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handlePrint}>
            <Printer className="w-4 h-4" />
            {t('invoices.print')}
          </Button>
          <Button onClick={handleDownloadPdf} disabled={generating}>
            <Download className="w-4 h-4" />
            {generating ? t('common.loading') : t('invoices.download')}
          </Button>
          {canShare && (
            <Button variant="secondary" onClick={handleShare} disabled={generating}>
              <Share2 className="w-4 h-4" />
              {language === 'fi' ? 'Jaa' : language === 'sv' ? 'Dela' : 'Share'}
            </Button>
          )}
        </div>
      </div>

      {/* Status notification */}
      {statusNotice && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm print:hidden">
          <Check className="w-4 h-4" />
          {t('invoices.markedAsSent')}
        </div>
      )}

      {/* A4 Invoice — 100% inline styles, zero Tailwind classes for html2canvas compatibility */}
      <div ref={invoiceRef} className="invoice-sheet" style={{ width: '210mm', minHeight: '297mm', padding: '15mm', backgroundColor: '#ffffff', color: '#111827', margin: '0 auto', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)', fontFamily: 'system-ui, -apple-system, sans-serif', fontSize: '14px', lineHeight: '1.5' }}>
        {/* Header with logo */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
          {/* Company logo and info */}
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
              <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>
                {company?.postalCode} {company?.city}
              </p>
              {company?.phone && (
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company.phone}</p>
              )}
              {company?.email && (
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{company.email}</p>
              )}
            </div>
          </div>

          {/* Invoice/Receipt title */}
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', textTransform: 'uppercase', margin: 0 }}>
              {invoice.paymentMethod && invoice.paymentMethod !== 'invoice'
                ? (language === 'fi' ? 'KUITTI' : language === 'sv' ? 'KVITTO' : 'RECEIPT')
                : (language === 'fi' ? 'LASKU' : language === 'sv' ? 'FAKTURA' : 'INVOICE')}
            </h2>
            {invoice.paymentMethod && invoice.paymentMethod !== 'invoice' && (
              <p style={{ fontSize: '0.875rem', color: '#4b5563', marginTop: '0.25rem' }}>
                {t('invoices.paidWith')}: {t(`invoices.paymentMethod${invoice.paymentMethod === 'cash' ? 'Cash' : invoice.paymentMethod === 'card' ? 'Card' : invoice.paymentMethod === 'mobilepay' ? 'MobilePay' : 'BankTransfer'}`)}
              </p>
            )}
          </div>
        </div>

        {/* Invoice details and recipient */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Recipient */}
          <div>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              {t('invoices.recipient')}
            </h3>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ fontWeight: 600, color: '#111827', margin: 0 }}>{customer?.name}</p>
              {customer?.contactPerson && (
                <p style={{ color: '#4b5563', margin: 0 }}>{customer.contactPerson}</p>
              )}
              <p style={{ color: '#4b5563', margin: 0 }}>{customer?.streetAddress}</p>
              <p style={{ color: '#4b5563', margin: 0 }}>
                {customer?.postalCode} {customer?.city}
              </p>
              {customer?.businessId && (
                <p style={{ color: '#4b5563', marginTop: '0.25rem' }}>
                  {language === 'fi' ? 'Y-tunnus' : language === 'sv' ? 'FO-nummer' : 'Business ID'}: {customer.businessId}
                </p>
              )}
            </div>
          </div>

          {/* Invoice details */}
          <div>
            <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.invoiceNumber')}:</td>
                  <td style={{ padding: '0.25rem 0', fontWeight: 600, textAlign: 'right' }}>{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.invoiceDate')}:</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{formatDateFI(invoice.invoiceDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.dueDate')}:</td>
                  <td style={{ padding: '0.25rem 0', fontWeight: 600, textAlign: 'right' }}>{formatDateFI(invoice.dueDate)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.paymentTerms')}:</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.paymentTermDays} {t('invoices.days')}</td>
                </tr>
                <tr>
                  <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.lateInterest')}:</td>
                  <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.lateInterest} %</td>
                </tr>
                {invoice.ourReference && (
                  <tr>
                    <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.ourReference')}:</td>
                    <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.ourReference}</td>
                  </tr>
                )}
                {invoice.yourReference && (
                  <tr>
                    <td style={{ padding: '0.25rem 0', color: '#4b5563' }}>{t('invoices.yourReference')}:</td>
                    <td style={{ padding: '0.25rem 0', textAlign: 'right' }}>{invoice.yourReference}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional info start */}
        {invoice.additionalInfoStart && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', color: '#374151', borderRadius: '4px', fontSize: '0.875rem' }}>
            {invoice.additionalInfoStart}
          </div>
        )}

        {/* Invoice rows */}
        <table style={{ width: '100%', fontSize: '0.875rem', marginBottom: '1.5rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #d1d5db' }}>
              <th style={{ padding: '0.5rem 0', textAlign: 'left', fontWeight: 600, color: '#374151' }}>
                {t('invoices.description')}
              </th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: '#374151', width: '5rem' }}>
                {t('invoices.quantity')}
              </th>
              <th style={{ padding: '0.5rem 0', textAlign: 'center', fontWeight: 600, color: '#374151', width: '4rem' }}>
                {t('invoices.unit')}
              </th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: '#374151', width: '6rem' }}>
                {t('invoices.unitPrice')}
              </th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: '#374151', width: '4rem' }}>
                {t('invoices.vatRate')}
              </th>
              <th style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 600, color: '#374151', width: '7rem' }}>
                {t('invoices.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.rows?.map((row, index) => (
              <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '0.5rem 0', color: '#111827' }}>{row.description}</td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#4b5563' }}>
                  {formatPrice(row.quantity)}
                </td>
                <td style={{ padding: '0.5rem 0', textAlign: 'center', color: '#4b5563' }}>
                  {getUnitName(row.unit)}
                </td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#4b5563' }}>
                  {formatPrice(row.priceNet)}
                </td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', color: '#4b5563' }}>
                  {formatVatRate(row.vatRate)} %
                </td>
                <td style={{ padding: '0.5rem 0', textAlign: 'right', fontWeight: 500, color: '#111827' }}>
                  {formatPrice(calculateRowTotal(row))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Additional info end */}
        {invoice.additionalInfoEnd && (
          <div style={{ marginBottom: '1.5rem', padding: '0.75rem', backgroundColor: '#f9fafb', color: '#374151', borderRadius: '4px', fontSize: '0.875rem' }}>
            {invoice.additionalInfoEnd}
          </div>
        )}

        {/* Totals */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
          <div style={{ width: '18rem' }}>
            {/* VAT breakdown */}
            {Object.entries(vatSummary).map(([rate, values]) => (
              <div key={rate} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
                <span style={{ color: '#4b5563' }}>
                  ALV {formatVatRate(rate)} % ({formatPrice(values.net)} EUR):
                </span>
                <span>{formatPrice(values.vat)} EUR</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0', borderTop: '1px solid #e5e7eb', marginTop: '0.5rem' }}>
              <span style={{ color: '#4b5563' }}>{t('invoices.subtotal')}:</span>
              <span>{formatPrice(invoice.totalNet)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', padding: '0.25rem 0' }}>
              <span style={{ color: '#4b5563' }}>{t('invoices.vatTotal')}:</span>
              <span>{formatPrice(invoice.totalVat)} EUR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.125rem', fontWeight: 700, padding: '0.5rem 0', borderTop: '2px solid #111827', marginTop: '0.5rem' }}>
              <span>{t('invoices.grandTotal')}:</span>
              <span>{formatPrice(invoice.totalGross)} EUR</span>
            </div>
          </div>
        </div>

        {/* Maksutiedot */}
        <div style={{ borderTop: '2px solid #d1d5db', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '0.75rem' }}>
            {language === 'fi' ? 'Maksutiedot' : language === 'sv' ? 'Betalningsuppgifter' : 'Payment Details'}
          </h3>
          <div>
            {company?.bankAccounts?.map((account, index) => (
              <div key={index} style={{ marginBottom: '0.75rem' }}>
                {account.bankName && (
                  <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{account.bankName}</p>
                )}
                <p style={{ color: '#111827', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '0.05em', margin: '0.25rem 0' }}>IBAN: {account.iban}</p>
                {account.bic && <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>BIC: {account.bic}</p>}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '2rem', marginTop: '0.75rem' }}>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{t('invoices.referenceNumber')}:</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0 }}>{referenceNumber}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{t('invoices.grandTotal')}:</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0 }}>{formatPrice(invoice.totalGross)} EUR</p>
              </div>
              <div>
                <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>{t('invoices.dueDate')}:</p>
                <p style={{ fontWeight: 700, fontSize: '1.25rem', color: '#111827', margin: 0 }}>{formatDateFI(invoice.dueDate)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '1.5rem', minHeight: '30mm' }}>
          <svg ref={barcodeRef}></svg>
          <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#374151', letterSpacing: '0.05em', marginTop: '0.5rem', marginBottom: '0.25rem', userSelect: 'all' }}>
            {virtualBarcode}
          </p>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
            {language === 'fi' ? 'VIRTUAALIVIIVAKOODI' : language === 'sv' ? 'VIRTUELL STRECKKOD' : 'VIRTUAL BARCODE'}
          </p>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
          {company?.name} | {company?.businessId && `${language === 'fi' ? 'Y-tunnus' : language === 'sv' ? 'FO-nummer' : 'Business ID'}: ${company.businessId}`}
          {company?.vatNumber && ` | ${company.vatNumber}`}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .invoice-sheet,
          .invoice-sheet * {
            visibility: visible;
          }
          .invoice-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 15mm;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
