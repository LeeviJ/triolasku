import { useState, useEffect, useRef } from 'react'
import JSZip from 'jszip'
import { useData } from '../../context/DataContext'
import { useLanguage } from '../../context/LanguageContext'
import InvoiceSheet from './InvoiceSheet'
import { generatePdfFromElement } from '../../utils/pdfGenerator'
import Button from '../ui/Button'

const STORAGE_KEYS = {
  invoices: 'triolasku_invoices',
  companies: 'triolasku_companies',
  customers: 'triolasku_customers',
  products: 'triolasku_products',
  invoiceCounter: 'triolasku_invoice_counter',
  settings: 'triolasku_settings',
}

export default function BackupExport({ onClose }) {
  const { invoices, companies } = useData()
  const { language } = useLanguage()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [phase, setPhase] = useState('rendering') // 'rendering' | 'zipping' | 'done' | 'error'
  const [errorMsg, setErrorMsg] = useState('')
  const invoiceRef = useRef(null)
  const zipRef = useRef(new JSZip())
  const processedCount = useRef(0)
  const processingRef = useRef(false)

  const currentInvoice = invoices[currentIndex]

  const getFileName = (inv) => {
    const liveCompany = companies.find((c) => c.id === inv.companyId)
    const companyName = (liveCompany?.name || inv._companyName || 'Yritys').replace(/[^a-zA-Z0-9äöåÄÖÅ]/g, '_')
    const isCreditNote = inv.isCreditNote === true
    const isReceipt = inv.paymentMethod && inv.paymentMethod !== 'invoice'
    const docLabel = isCreditNote
      ? (language === 'fi' ? 'Hyvityslasku' : 'Credit_Note')
      : isReceipt
        ? (language === 'fi' ? 'Kuitti' : 'Receipt')
        : (language === 'fi' ? 'Lasku' : 'Invoice')
    return `${docLabel}_${inv.invoiceNumber}_${companyName}.pdf`
  }

  // Process each invoice one at a time
  useEffect(() => {
    if (phase !== 'rendering' || !invoiceRef.current || processingRef.current) return

    processingRef.current = true
    const timer = setTimeout(async () => {
      try {
        const pdf = await generatePdfFromElement(invoiceRef.current)
        const pdfBytes = pdf.output('arraybuffer')
        zipRef.current.file(getFileName(currentInvoice), pdfBytes)
      } catch (err) {
        console.error('PDF generation failed for invoice', currentInvoice.invoiceNumber, err)
      }

      processedCount.current++
      processingRef.current = false

      if (currentIndex + 1 < invoices.length) {
        setCurrentIndex(prev => prev + 1)
      } else {
        setPhase('zipping')
      }
    }, 700)

    return () => clearTimeout(timer)
  }, [currentIndex, phase])

  // Finalize ZIP
  useEffect(() => {
    if (phase !== 'zipping') return

    const finalize = async () => {
      try {
        // Add JSON backup of all data
        const backup = {}
        Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
          const data = localStorage.getItem(storageKey)
          if (data) {
            try { backup[storageKey] = JSON.parse(data) } catch { backup[storageKey] = data }
          }
        })
        zipRef.current.file('triolasku_backup.json', JSON.stringify(backup, null, 2))

        const blob = await zipRef.current.generateAsync({ type: 'blob' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `triolasku_varmuuskopio_${new Date().toISOString().split('T')[0]}.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setPhase('done')
      } catch (err) {
        console.error('ZIP creation failed:', err)
        setErrorMsg(err.message)
        setPhase('error')
      }
    }
    finalize()
  }, [phase])

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
        {phase === 'rendering' && (
          <>
            <p className="text-lg font-semibold">Luodaan PDF-tiedostoja...</p>
            <p className="text-gray-500">{processedCount.current + 1} / {invoices.length}</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${((processedCount.current + 1) / invoices.length) * 100}%` }}
              />
            </div>
          </>
        )}

        {phase === 'zipping' && (
          <p className="text-lg font-semibold">Pakataan ZIP-tiedostoa...</p>
        )}

        {phase === 'done' && (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">✓</div>
            <p className="text-lg font-semibold text-green-700">Valmis!</p>
            <p className="text-sm text-gray-500">{invoices.length} laskua + varmuuskopio pakattu.</p>
            <Button onClick={onClose}>Sulje</Button>
          </>
        )}

        {phase === 'error' && (
          <>
            <p className="text-lg font-semibold text-red-600">Virhe</p>
            <p className="text-sm text-gray-500">{errorMsg}</p>
            <Button onClick={onClose}>Sulje</Button>
          </>
        )}
      </div>

      {/* Off-screen invoice renderer */}
      {phase === 'rendering' && currentInvoice && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
          <InvoiceSheet
            key={currentInvoice.id}
            invoice={currentInvoice}
            invoiceRef={invoiceRef}
          />
        </div>
      )}
    </div>
  )
}
