import { useRef, useState } from 'react'
import { ArrowLeft, Printer, Download, Share2 } from 'lucide-react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import Button from '../ui/Button'
import { formatPrice, formatVatRate, calculateGrossPrice } from '../../utils/formatters'

export default function InvoicePreview({ invoice, onClose }) {
  const { t, language } = useLanguage()
  const { companies, customers, units } = useData()
  const invoiceRef = useRef(null)
  const [generating, setGenerating] = useState(false)

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

  // Generate a simple reference number
  const generateReferenceNumber = () => {
    const base = `${invoice.invoiceNumber || 1}`.padStart(4, '0')
    return `${base}1`
  }

  const generatePdf = async () => {
    console.log('Generoidaan PDF...')
    const element = invoiceRef.current
    if (!element) {
      console.error('PDF: invoiceRef.current is null')
      throw new Error('Invoice element not found')
    }

    console.log('PDF: Capturing element with html2canvas...')
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    })
    console.log('PDF: Canvas created', canvas.width, 'x', canvas.height)

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

    console.log('PDF: Generated successfully')
    return pdf
  }

  const handleDownloadPdf = async () => {
    console.log('PDF download clicked')
    setGenerating(true)
    try {
      const pdf = await generatePdf()
      const fileName = getFileName()
      console.log('PDF: Saving as', fileName)
      pdf.save(fileName)
      console.log('PDF: Save triggered')
    } catch (err) {
      console.error('PDF generation failed:', err)
      alert(`PDF-generointi epäonnistui: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleShare = async () => {
    console.log('Share clicked')
    setGenerating(true)
    try {
      const pdf = await generatePdf()
      const blob = pdf.output('blob')
      const file = new File([blob], getFileName(), { type: 'application/pdf' })

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        console.log('PDF: Sharing via navigator.share...')
        await navigator.share({
          title: `${docLabel} ${invoice.invoiceNumber}`,
          files: [file],
        })
        console.log('PDF: Shared successfully')
      } else {
        console.log('PDF: navigator.share not supported for files, falling back to download')
        pdf.save(getFileName())
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        console.log('PDF: Share cancelled by user')
      } else {
        console.error('Share failed:', err)
        // Fallback to download
        try {
          const pdf = await generatePdf()
          pdf.save(getFileName())
        } catch (downloadErr) {
          alert(`PDF-jako epäonnistui: ${err.message}`)
        }
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

      {/* A4 Invoice */}
      <div ref={invoiceRef} className="bg-white shadow-lg print:shadow-none mx-auto" style={{ width: '210mm', minHeight: '297mm', padding: '15mm' }}>
        {/* Header with logo */}
        <div className="flex justify-between items-start mb-8">
          {/* Company logo and info */}
          <div className="flex items-start gap-4">
            {company?.logo ? (
              <img
                src={company.logo.startsWith('data:') ? company.logo : `data:image/png;base64,${company.logo}`}
                alt={company.name}
                style={{ height: '100px', width: 'auto' }}
                className="object-contain"
              />
            ) : (
              <div className="bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs" style={{ width: '100px', height: '100px' }}>
                LOGO
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-gray-900">{company?.name}</h1>
              <p className="text-sm text-gray-600">{company?.streetAddress}</p>
              <p className="text-sm text-gray-600">
                {company?.postalCode} {company?.city}
              </p>
              {company?.phone && (
                <p className="text-sm text-gray-600">{company.phone}</p>
              )}
              {company?.email && (
                <p className="text-sm text-gray-600">{company.email}</p>
              )}
            </div>
          </div>

          {/* Invoice/Receipt title */}
          <div className="text-right">
            <h2 className="text-2xl font-bold text-gray-900 uppercase">
              {invoice.paymentMethod && invoice.paymentMethod !== 'invoice'
                ? (language === 'fi' ? 'KUITTI' : language === 'sv' ? 'KVITTO' : 'RECEIPT')
                : (language === 'fi' ? 'LASKU' : language === 'sv' ? 'FAKTURA' : 'INVOICE')}
            </h2>
            {invoice.paymentMethod && invoice.paymentMethod !== 'invoice' && (
              <p className="text-sm text-gray-600 mt-1">
                {t('invoices.paidWith')}: {t(`invoices.paymentMethod${invoice.paymentMethod === 'cash' ? 'Cash' : invoice.paymentMethod === 'card' ? 'Card' : invoice.paymentMethod === 'mobilepay' ? 'MobilePay' : 'BankTransfer'}`)}
              </p>
            )}
          </div>
        </div>

        {/* Invoice details and recipient */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          {/* Recipient */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
              {t('invoices.recipient')}
            </h3>
            <div className="text-sm">
              <p className="font-semibold text-gray-900">{customer?.name}</p>
              {customer?.contactPerson && (
                <p className="text-gray-600">{customer.contactPerson}</p>
              )}
              <p className="text-gray-600">{customer?.streetAddress}</p>
              <p className="text-gray-600">
                {customer?.postalCode} {customer?.city}
              </p>
              {customer?.businessId && (
                <p className="text-gray-600 mt-1">
                  {language === 'fi' ? 'Y-tunnus' : language === 'sv' ? 'FO-nummer' : 'Business ID'}: {customer.businessId}
                </p>
              )}
            </div>
          </div>

          {/* Invoice details */}
          <div>
            <table className="w-full text-sm">
              <tbody>
                <tr>
                  <td className="py-1 text-gray-600">{t('invoices.invoiceNumber')}:</td>
                  <td className="py-1 font-semibold text-right">{invoice.invoiceNumber}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">{t('invoices.invoiceDate')}:</td>
                  <td className="py-1 text-right">{invoice.invoiceDate}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">{t('invoices.dueDate')}:</td>
                  <td className="py-1 font-semibold text-right">{invoice.dueDate}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">{t('invoices.paymentTerms')}:</td>
                  <td className="py-1 text-right">{invoice.paymentTermDays} {t('invoices.days')}</td>
                </tr>
                <tr>
                  <td className="py-1 text-gray-600">{t('invoices.lateInterest')}:</td>
                  <td className="py-1 text-right">{invoice.lateInterest} %</td>
                </tr>
                {invoice.ourReference && (
                  <tr>
                    <td className="py-1 text-gray-600">{t('invoices.ourReference')}:</td>
                    <td className="py-1 text-right">{invoice.ourReference}</td>
                  </tr>
                )}
                {invoice.yourReference && (
                  <tr>
                    <td className="py-1 text-gray-600">{t('invoices.yourReference')}:</td>
                    <td className="py-1 text-right">{invoice.yourReference}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional info start */}
        {invoice.additionalInfoStart && (
          <div className="mb-6 p-3 bg-gray-50 rounded text-sm text-gray-700">
            {invoice.additionalInfoStart}
          </div>
        )}

        {/* Invoice rows */}
        <table className="w-full mb-6 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-300">
              <th className="py-2 text-left font-semibold text-gray-700">
                {t('invoices.description')}
              </th>
              <th className="py-2 text-right font-semibold text-gray-700 w-20">
                {t('invoices.quantity')}
              </th>
              <th className="py-2 text-center font-semibold text-gray-700 w-16">
                {t('invoices.unit')}
              </th>
              <th className="py-2 text-right font-semibold text-gray-700 w-24">
                {t('invoices.unitPrice')}
              </th>
              <th className="py-2 text-right font-semibold text-gray-700 w-16">
                {t('invoices.vatRate')}
              </th>
              <th className="py-2 text-right font-semibold text-gray-700 w-28">
                {t('invoices.total')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoice.rows?.map((row, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2 text-gray-900">{row.description}</td>
                <td className="py-2 text-right text-gray-600">
                  {formatPrice(row.quantity)}
                </td>
                <td className="py-2 text-center text-gray-600">
                  {getUnitName(row.unit)}
                </td>
                <td className="py-2 text-right text-gray-600">
                  {formatPrice(row.priceNet)}
                </td>
                <td className="py-2 text-right text-gray-600">
                  {formatVatRate(row.vatRate)} %
                </td>
                <td className="py-2 text-right font-medium text-gray-900">
                  {formatPrice(calculateRowTotal(row))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Additional info end */}
        {invoice.additionalInfoEnd && (
          <div className="mb-6 p-3 bg-gray-50 rounded text-sm text-gray-700">
            {invoice.additionalInfoEnd}
          </div>
        )}

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-72">
            {/* VAT breakdown */}
            {Object.entries(vatSummary).map(([rate, values]) => (
              <div key={rate} className="flex justify-between text-sm py-1">
                <span className="text-gray-600">
                  ALV {formatVatRate(rate)} % ({formatPrice(values.net)} EUR):
                </span>
                <span>{formatPrice(values.vat)} EUR</span>
              </div>
            ))}
            <div className="flex justify-between text-sm py-1 border-t border-gray-200 mt-2">
              <span className="text-gray-600">{t('invoices.subtotal')}:</span>
              <span>{formatPrice(invoice.totalNet)} EUR</span>
            </div>
            <div className="flex justify-between text-sm py-1">
              <span className="text-gray-600">{t('invoices.vatTotal')}:</span>
              <span>{formatPrice(invoice.totalVat)} EUR</span>
            </div>
            <div className="flex justify-between text-lg font-bold py-2 border-t-2 border-gray-900 mt-2">
              <span>{t('invoices.grandTotal')}:</span>
              <span>{formatPrice(invoice.totalGross)} EUR</span>
            </div>
          </div>
        </div>

        {/* Payment details */}
        <div className="border-t-2 border-gray-300 pt-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {t('invoices.bankDetails')}
          </h3>
          <div>
            {company?.bankAccounts?.map((account, index) => (
              <div key={index} className="mb-3">
                {account.bankName && (
                  <p className="text-sm text-gray-600">{account.bankName}</p>
                )}
                <p className="font-bold text-2xl tracking-wide">IBAN: {account.iban}</p>
                {account.bic && <p className="text-sm text-gray-600">BIC: {account.bic}</p>}
              </div>
            ))}
            <div className="flex gap-8 mt-3">
              <div>
                <p className="text-sm text-gray-600">{t('invoices.referenceNumber')}:</p>
                <p className="font-bold text-xl">{generateReferenceNumber()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('invoices.grandTotal')}:</p>
                <p className="font-bold text-xl">{formatPrice(invoice.totalGross)} EUR</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{t('invoices.dueDate')}:</p>
                <p className="font-bold text-xl">{invoice.dueDate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Barcode area */}
        <div className="border-2 border-dashed border-gray-300 mt-6 flex flex-col items-center justify-center" style={{ minHeight: '30mm' }}>
          <div className="w-full max-w-md bg-gray-50 flex items-center justify-center py-3">
            <span className="text-sm text-gray-400 font-mono tracking-widest">
              |||| |||| |||| |||| |||| |||| |||| |||| ||||
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1 mb-2">
            {language === 'fi' ? 'VIRTUAALIVIIVAKOODI' : language === 'sv' ? 'VIRTUELL STRECKKOD' : 'VIRTUAL BARCODE'}
            {' / '}
            {language === 'fi' ? 'STRECKKOD' : language === 'sv' ? 'VIIVAKOODI' : 'BARCODE'}
          </p>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500 text-center">
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
          .bg-white.shadow-lg,
          .bg-white.shadow-lg * {
            visibility: visible;
          }
          .bg-white.shadow-lg {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            margin: 0;
            padding: 15mm;
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  )
}
