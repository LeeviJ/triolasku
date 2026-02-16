import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Printer, Download, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useLicense } from '../context/LicenseContext'
import Button from './ui/Button'
import { generatePdfFromElement } from '../utils/pdfGenerator'

const STORAGE_KEY = 'triolasku_receipt_buyer'

const VAT_RATE = 25.5

const PLAN_PRICES = {
  standard: {
    '1kk': { gross: 10.0 },
    '6kk': { gross: 50.0 },
    '12kk': { gross: 90.0 },
  },
  promote: {
    '1kk': { gross: 15.0 },
    '6kk': { gross: 80.0 },
    '12kk': { gross: 150.0 },
  },
}

const SELLER = {
  name: 'Kyyränkoski Tmi',
  businessId: '1437272-9',
  address: 'Kylänpääntie 54\n61450 Kylänpää',
  email: 'trio.tools6@gmail.com',
}

function vatBreakdown(gross) {
  const net = gross / (1 + VAT_RATE / 100)
  const vat = gross - net
  return { net, vat, gross, vatRate: VAT_RATE }
}

function loadBuyerInfo() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return { companyName: '', businessId: '', address: '', contactPerson: '' }
}

function saveBuyerInfo(info) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(info))
}

function MultilineText({ text }) {
  if (!text) return null
  return text.split('\n').map((line, i) => <p key={i} style={{ margin: 0 }}>{line}</p>)
}

export default function SubscriptionReceipt({ onClose }) {
  const { t } = useLanguage()
  const { licenseKey, licenseInfo } = useLicense()
  const [buyer, setBuyer] = useState(loadBuyerInfo)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [printMode, setPrintMode] = useState(false)
  const receiptRef = useRef(null)

  const plan = licenseInfo?.plan || '1kk'
  const tier = licenseInfo?.tier || 'standard'
  const tierPrices = PLAN_PRICES[tier] || PLAN_PRICES.standard
  const price = tierPrices[plan] || tierPrices['1kk']
  const breakdown = vatBreakdown(price.gross)

  const planLabel = tier === 'promote'
    ? t(`subscriptionReceipt.planPromote${plan}`)
    : t(`subscriptionReceipt.plan${plan}`)
  const expiresAt = licenseInfo?.expires_at
    ? new Date(licenseInfo.expires_at).toLocaleDateString('fi-FI')
    : '-'
  const today = new Date().toLocaleDateString('fi-FI')

  const handleBuyerChange = (field, value) => {
    const updated = { ...buyer, [field]: value }
    setBuyer(updated)
    saveBuyerInfo(updated)
    setSaved(false)
  }

  const handleSaveBuyer = () => {
    saveBuyerInfo(buyer)
    setSaved(true)
  }

  const handlePrint = () => {
    setPrintMode(true)
  }

  // When printMode activates, wait for render then print
  useEffect(() => {
    if (!printMode) return
    const timer = setTimeout(() => {
      window.print()
      setPrintMode(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [printMode])

  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return
    setPdfLoading(true)
    try {
      const pdf = await generatePdfFromElement(receiptRef.current)
      pdf.save(`tilauksen_kuitti_${today.replace(/\./g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setPdfLoading(false)
    }
  }

  const receiptContent = (
    <div
      ref={printMode ? undefined : receiptRef}
      className="subscription-receipt-sheet bg-white"
      style={{
        fontFamily: 'Arial, Helvetica, sans-serif',
        fontSize: '12px',
        color: '#111',
        padding: printMode ? '0' : '24px',
        maxWidth: '180mm',
        margin: '0 auto',
        border: printMode ? 'none' : '1px solid #e5e7eb',
        borderRadius: printMode ? '0' : '8px',
      }}
    >
      {/* Title */}
      <h1 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px', textAlign: 'center' }}>
        {t('subscriptionReceipt.title')}
      </h1>

      {/* Date */}
      <p style={{ textAlign: 'right', marginBottom: '16px', fontSize: '11px', color: '#555' }}>
        {t('subscriptionReceipt.date')}: {today}
      </p>

      {/* Seller & Buyer side by side */}
      <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
        {/* Seller */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>
            {t('subscriptionReceipt.seller')}
          </h2>
          <p style={{ fontWeight: 'bold', margin: 0 }}>{SELLER.name}</p>
          <p style={{ margin: 0 }}>{t('subscriptionReceipt.businessId')}: {SELLER.businessId}</p>
          <MultilineText text={SELLER.address} />
          <p style={{ margin: 0 }}>{SELLER.email}</p>
        </div>
        {/* Buyer */}
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>
            {t('subscriptionReceipt.buyer')}
          </h2>
          {buyer.companyName && <p style={{ fontWeight: 'bold', margin: 0 }}>{buyer.companyName}</p>}
          {buyer.businessId && <p style={{ margin: 0 }}>{t('subscriptionReceipt.businessId')}: {buyer.businessId}</p>}
          {buyer.address && <MultilineText text={buyer.address} />}
          {buyer.contactPerson && <p style={{ margin: 0 }}>{buyer.contactPerson}</p>}
        </div>
      </div>

      {/* Order details table */}
      <h2 style={{ fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', color: '#555', marginBottom: '6px', letterSpacing: '0.5px' }}>
        {t('subscriptionReceipt.orderDetails')}
      </h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            <th style={{ textAlign: 'left', padding: '6px 4px', fontSize: '10px', color: '#555' }}>
              {t('subscriptionReceipt.product')}
            </th>
            <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '10px', color: '#555' }}>
              {t('subscriptionReceipt.priceExclVat')}
            </th>
            <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '10px', color: '#555' }}>
              {t('subscriptionReceipt.vatAmount')} {breakdown.vatRate} %
            </th>
            <th style={{ textAlign: 'right', padding: '6px 4px', fontSize: '10px', color: '#555' }}>
              {t('subscriptionReceipt.totalInclVat')}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
            <td style={{ padding: '8px 4px' }}>{planLabel}</td>
            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{breakdown.net.toFixed(2)} €</td>
            <td style={{ padding: '8px 4px', textAlign: 'right' }}>{breakdown.vat.toFixed(2)} €</td>
            <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: 'bold' }}>{breakdown.gross.toFixed(2)} €</td>
          </tr>
        </tbody>
      </table>

      {/* License info */}
      <div style={{ marginBottom: '16px', padding: '10px 12px', backgroundColor: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', fontSize: '11px' }}>
          <div>
            <span style={{ color: '#555' }}>{t('subscriptionReceipt.licenseKey')}: </span>
            <span style={{ fontWeight: 'bold', fontFamily: 'monospace' }}>{licenseKey || '-'}</span>
          </div>
          <div>
            <span style={{ color: '#555' }}>{t('subscriptionReceipt.validUntil')}: </span>
            <span style={{ fontWeight: 'bold' }}>{expiresAt}</span>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p style={{ fontSize: '10px', color: '#888', textAlign: 'center', margin: 0 }}>
        ALV-velvollisuus rekisteröity 1.2.2026 alkaen
      </p>
    </div>
  )

  return (
    <>
      {/* Print-only: receipt rendered as direct child of body via portal */}
      {printMode && createPortal(
        <div className="subscription-receipt-print" style={{ padding: '10mm 15mm' }}>
          {receiptContent}
        </div>,
        document.body
      )}

      {/* Modal backdrop - hidden when printing */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto p-4 print:hidden">
        <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('subscriptionReceipt.title')}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Buyer form */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              {t('subscriptionReceipt.buyer')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t('subscriptionReceipt.companyName')}
                </label>
                <input
                  type="text"
                  value={buyer.companyName}
                  onChange={(e) => handleBuyerChange('companyName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t('subscriptionReceipt.businessId')}
                </label>
                <input
                  type="text"
                  value={buyer.businessId}
                  onChange={(e) => handleBuyerChange('businessId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t('subscriptionReceipt.address')}
                </label>
                <textarea
                  rows={2}
                  value={buyer.address}
                  onChange={(e) => handleBuyerChange('address', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Katuosoite&#10;Postinumero Kaupunki"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  {t('subscriptionReceipt.contactPerson')}
                </label>
                <input
                  type="text"
                  value={buyer.contactPerson}
                  onChange={(e) => handleBuyerChange('contactPerson', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={handleSaveBuyer}>
                {t('subscriptionReceipt.saveBuyerInfo')}
              </Button>
              {saved && (
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Tallennettu
                </span>
              )}
            </div>
          </div>

          {/* Receipt preview */}
          <div className="px-6 py-4 overflow-x-auto">
            {receiptContent}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 px-6 py-4 border-t border-gray-200">
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="w-4 h-4" />
              {t('subscriptionReceipt.print')}
            </Button>
            <Button variant="secondary" onClick={handleDownloadPdf} disabled={pdfLoading}>
              <Download className="w-4 h-4" />
              {pdfLoading ? '...' : t('subscriptionReceipt.downloadPdf')}
            </Button>
            <div className="flex-1" />
            <Button variant="ghost" onClick={onClose}>
              {t('common.cancel')}
            </Button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(.subscription-receipt-print) {
            display: none !important;
          }
          .subscription-receipt-print {
            display: block !important;
          }
          .subscription-receipt-print .subscription-receipt-sheet {
            border: none !important;
            box-shadow: none !important;
          }
        }
        @media not print {
          .subscription-receipt-print {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
