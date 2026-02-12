import { useRef, useState, useEffect } from 'react'
import { ArrowLeft, Printer, Download, Check, Camera, CheckCircle, Copy, AlertTriangle } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import Button from '../ui/Button'
import InvoiceSheet from './InvoiceSheet'
import { generatePdfFromElement } from '../../utils/pdfGenerator'

export default function InvoicePreview({ invoice, onClose, onDuplicate, onCreditNote }) {
  const { t, language } = useLanguage()
  const { companies, customers, updateInvoice } = useData()
  const invoiceRef = useRef(null)
  const [generating, setGenerating] = useState(false)
  const [statusNotice, setStatusNotice] = useState(false)
  const [paidNotice, setPaidNotice] = useState(false)
  const [duplicateError, setDuplicateError] = useState(false)
  const [screenshotMode, setScreenshotMode] = useState(false)
  const [previewScale, setPreviewScale] = useState(1)
  const wrapperRef = useRef(null)
  const autoPdfDone = useRef(false)

  // Scale invoice to fit available width
  useEffect(() => {
    const update = () => {
      const invoicePx = 793
      if (screenshotMode) {
        setPreviewScale(window.innerWidth < invoicePx ? window.innerWidth / invoicePx : 1)
      } else if (wrapperRef.current) {
        const available = wrapperRef.current.clientWidth
        setPreviewScale(available < invoicePx ? available / invoicePx : 1)
      }
    }
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [screenshotMode])

  const liveCompany = companies.find((c) => c.id === invoice.companyId)
  const company = invoice.company || liveCompany || {
    name: invoice._companyName || '',
  }

  const isCreditNote = invoice.isCreditNote === true
  const isReceipt = invoice.paymentMethod && invoice.paymentMethod !== 'invoice'
  const docLabel = isCreditNote
    ? (language === 'fi' ? 'Hyvityslasku' : 'Credit Note')
    : isReceipt
      ? (language === 'fi' ? 'Kuitti' : language === 'sv' ? 'Kvitto' : 'Receipt')
      : (language === 'fi' ? 'Lasku' : language === 'sv' ? 'Faktura' : 'Invoice')

  const getFileName = () => {
    const companyName = (company?.name || invoice._companyName || 'Yritys').replace(/[^a-zA-Z0-9äöåÄÖÅ]/g, '_')
    return `${docLabel}_${invoice.invoiceNumber}_${companyName}.pdf`
  }

  const handlePrint = () => {
    window.print()
  }

  const markAsSent = () => {
    if (invoice.id && (!invoice.status || invoice.status === 'draft' || invoice.status === 'ready')) {
      updateInvoice(invoice.id, { status: 'sent' })
      setStatusNotice(true)
      setTimeout(() => setStatusNotice(false), 3000)
    }
  }

  const handleMarkAsPaid = () => {
    if (invoice.id && invoice.status !== 'paid') {
      updateInvoice(invoice.id, { status: 'paid' })
      setPaidNotice(true)
      setTimeout(() => setPaidNotice(false), 3000)
    }
  }

  const handleDuplicate = () => {
    const customerExists = customers.find((c) => c.id === invoice.customerId)
    if (!customerExists) {
      setDuplicateError(true)
      setTimeout(() => setDuplicateError(false), 6000)
      return
    }
    onDuplicate(invoice)
  }

  const handleDownloadPdf = async () => {
    setGenerating(true)
    try {
      const pdf = await generatePdfFromElement(invoiceRef.current)
      pdf.save(getFileName())
      markAsSent()
    } catch (err) {
      console.error('PDF error:', err)
      alert(`PDF-generointi epäonnistui: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  // Auto-download PDF when opened with _autoPdf flag
  useEffect(() => {
    if (invoice._autoPdf && invoiceRef.current && !generating && !autoPdfDone.current) {
      autoPdfDone.current = true
      const timer = setTimeout(() => {
        handleDownloadPdf()
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [invoice._autoPdf])

  return (
    <div
      className={screenshotMode ? '' : 'max-w-5xl mx-auto'}
      style={screenshotMode ? { position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#ffffff', overflow: 'hidden', zIndex: 9999, margin: 0, padding: 0 } : {}}
      onClick={screenshotMode ? () => setScreenshotMode(false) : undefined}
    >
      {/* Controls */}
      {!screenshotMode && (
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 print:hidden">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="w-4 h-4" />
            {t('common.back')}
          </Button>
          <div className="flex flex-wrap gap-2">
            {invoice.status !== 'paid' && (
              <Button variant="secondary" onClick={handleMarkAsPaid}>
                <CheckCircle className="w-4 h-4" />
                {t('invoices.markAsPaid')}
              </Button>
            )}
            {onDuplicate && (
              <Button variant="secondary" onClick={handleDuplicate}>
                <Copy className="w-4 h-4" />
                {t('invoices.duplicateToNew')}
              </Button>
            )}
            {onCreditNote && !invoice.isCreditNote && (
              <Button variant="secondary" onClick={() => onCreditNote(invoice)}>
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                {language === 'fi' ? 'Hyvityslasku' : 'Credit Note'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => setScreenshotMode(true)}>
              <Camera className="w-4 h-4" />
              {t('invoices.screenshotMode')}
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              {t('invoices.print')}
            </Button>
            <Button onClick={handleDownloadPdf} disabled={generating}>
              <Download className="w-4 h-4" />
              {generating ? t('common.loading') : t('invoices.download')}
            </Button>
          </div>
        </div>
      )}

      {/* Status notification */}
      {statusNotice && !screenshotMode && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm print:hidden">
          <Check className="w-4 h-4" />
          {t('invoices.markedAsSent')}
        </div>
      )}

      {/* Paid notification */}
      {paidNotice && !screenshotMode && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800 text-sm print:hidden">
          <CheckCircle className="w-4 h-4" />
          {t('invoices.markedAsPaid')}
        </div>
      )}

      {/* Duplicate error notification */}
      {duplicateError && !screenshotMode && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2 text-amber-800 text-sm print:hidden">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {t('invoices.customerDeletedCannotDuplicate')}
        </div>
      )}

      {/* Auto-download notification */}
      {invoice._autoPdf && generating && !screenshotMode && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2 text-blue-800 text-sm print:hidden">
          <Download className="w-4 h-4" />
          PDF ladataan automaattisesti...
        </div>
      )}

      {/* A4 Invoice */}
      <div ref={wrapperRef} style={{ maxWidth: '100%', overflowX: 'hidden' }}>
        <InvoiceSheet
          invoice={invoice}
          invoiceRef={invoiceRef}
          scale={previewScale}
        />
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
            transform: none !important;
          }
        }
      `}</style>
    </div>
  )
}
