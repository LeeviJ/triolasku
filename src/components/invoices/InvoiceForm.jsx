import { useState, useEffect } from 'react'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Eye,
  Check,
  Building2,
  User,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import Card, { CardBody, CardHeader, CardFooter } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import {
  formatPrice,
  formatVatRate,
  calculateGrossPrice,
  calculateVatAmount,
} from '../../utils/formatters'

const EMPTY_ROW = {
  productId: '',
  description: '',
  quantity: 1,
  unit: 'kpl',
  priceNet: 0,
  vatRate: 25.5,
}

const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const addDays = (dateStr, days) => {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export default function InvoiceForm({ invoice, onClose, onPreview }) {
  const { t, language } = useLanguage()
  const {
    companies,
    customers,
    products,
    units,
    vatRates,
    addInvoice,
    updateInvoice,
    getNextInvoiceNumberForCompany,
    invoices: savedInvoices,
  } = useData()

  const today = formatDateForInput(new Date())

  const initialCompanyId = invoice?.companyId || companies[0]?.id || ''

  const [formData, setFormData] = useState({
    companyId: initialCompanyId,
    customerId: invoice?.customerId || '',
    invoiceNumber: invoice?.invoiceNumber || getNextInvoiceNumberForCompany(initialCompanyId),
    invoiceDate: invoice?.invoiceDate || today,
    paymentTermDays: invoice?.paymentTermDays || 14,
    dueDate: invoice?.dueDate || addDays(today, 14),
    lateInterest: invoice?.lateInterest || 8,
    reminderDays: invoice?.reminderDays || 14,
    ourReference: invoice?.ourReference || '',
    yourReference: invoice?.yourReference || '',
    // Combined additional info field with position selector
    additionalInfo: invoice?.additionalInfo || invoice?.additionalInfoStart || invoice?.additionalInfoEnd || '',
    additionalInfoPosition: invoice?.additionalInfoPosition || (invoice?.additionalInfoEnd ? 'end' : 'start'),
    status: invoice?.status || 'draft',
    paymentMethod: invoice?.paymentMethod || 'invoice',
    isCreditNote: invoice?.isCreditNote || false,
    creditedInvoiceNumber: invoice?.creditedInvoiceNumber || '',
    rows: invoice?.rows?.length > 0 ? invoice.rows : [{ ...EMPTY_ROW }],
  })

  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)
  const [productSearch, setProductSearch] = useState({})
  const [activeProductRow, setActiveProductRow] = useState(null)
  const [activeVatRow, setActiveVatRow] = useState(null)

  // Close dropdowns on outside click
  useEffect(() => {
    if (activeProductRow === null && activeVatRow === null) return
    const handle = (e) => {
      if (activeProductRow !== null && !e.target.closest('[data-product-dropdown]')) {
        setActiveProductRow(null)
      }
      if (activeVatRow !== null && !e.target.closest('[data-vat-dropdown]')) {
        setActiveVatRow(null)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [activeProductRow, activeVatRow])

  const getFilteredProducts = (query) => {
    if (!query) return products
    const q = query.toLowerCase()
    return products.filter((p) =>
      p.name.toLowerCase().includes(q) || p.productNumber?.toString().includes(q)
    )
  }

  const isReceipt = formData.paymentMethod !== 'invoice'

  // Update invoice number when company changes (new invoices only)
  useEffect(() => {
    if (!invoice?.id && formData.companyId) {
      setFormData((prev) => ({
        ...prev,
        invoiceNumber: getNextInvoiceNumberForCompany(formData.companyId),
      }))
    }
  }, [formData.companyId, savedInvoices])

  // Update due date when invoice date or payment terms change
  useEffect(() => {
    if (formData.invoiceDate && formData.paymentTermDays) {
      const newDueDate = addDays(formData.invoiceDate, formData.paymentTermDays)
      setFormData((prev) => ({ ...prev, dueDate: newDueDate }))
    }
  }, [formData.invoiceDate, formData.paymentTermDays])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleRowChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => {
        if (i !== index) return row

        const updated = { ...row, [field]: value }

        // If product is selected, fill in product data
        if (field === 'productId' && value) {
          const product = products.find((p) => p.id === value)
          if (product) {
            updated.description = product.name
            updated.priceNet = product.priceNet
            updated.vatRate = product.vatRate
            updated.unit = product.unit
          }
        }

        return updated
      }),
    }))
  }

  const selectProduct = (index, productId) => {
    handleRowChange(index, 'productId', productId)
    setActiveProductRow(null)
    setProductSearch((prev) => ({ ...prev, [index]: '' }))
    if (productId) {
      setTimeout(() => {
        document.querySelectorAll(`[data-qty-row="${index}"]`).forEach((el) => el.focus())
      }, 0)
    }
  }

  const addRow = () => {
    setFormData((prev) => ({
      ...prev,
      rows: [...prev.rows, { ...EMPTY_ROW, vatRate: vatRates[0] || 25.5 }],
    }))
  }

  const removeRow = (index) => {
    setFormData((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== index),
    }))
  }

  const calculateRowTotal = (row) => {
    const qty = parseFloat(row.quantity) || 0
    const price = parseFloat(row.priceNet) || 0
    return qty * price
  }

  const calculateRowGross = (row) => {
    const net = calculateRowTotal(row)
    return calculateGrossPrice(net, row.vatRate)
  }

  const calculateTotals = () => {
    let totalNet = 0
    let totalVat = 0

    formData.rows.forEach((row) => {
      const rowNet = calculateRowTotal(row)
      totalNet += rowNet
      totalVat += calculateVatAmount(rowNet, row.vatRate)
    })

    return {
      totalNet: Math.round(totalNet * 100) / 100,
      totalVat: Math.round(totalVat * 100) / 100,
      totalGross: Math.round((totalNet + totalVat) * 100) / 100,
    }
  }

  const totals = calculateTotals()

  const validate = () => {
    const newErrors = {}
    if (!formData.companyId) {
      newErrors.companyId = t('invoices.noCompanySelected')
    }
    if (!formData.customerId) {
      newErrors.customerId = t('invoices.noCustomerSelected')
    }
    if (formData.rows.length === 0 || formData.rows.every((r) => !r.description)) {
      newErrors.rows = t('invoices.noRowsAdded')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const buildInvoiceData = () => {
    const company = companies.find((c) => c.id === formData.companyId)
    const customer = customers.find((c) => c.id === formData.customerId)

    return {
      ...formData,
      ...totals,
      company,
      customer,
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    // STEP 1: Get customer and company snapshots
    const customer = customers.find((c) => c.id === formData.customerId)
    const company = companies.find((c) => c.id === formData.companyId)

    // Build invoice with status 'ready' + full customer/company snapshot
    const invoiceData = {
      ...formData,
      invoiceNumber: parseInt(formData.invoiceNumber, 10) || formData.invoiceNumber,
      status: 'ready',
      ...totals,
      // Convert combined additionalInfo to start/end format for preview
      additionalInfoStart: formData.additionalInfoPosition === 'start' ? formData.additionalInfo : '',
      additionalInfoEnd: formData.additionalInfoPosition === 'end' ? formData.additionalInfo : '',
      // FULL CUSTOMER SNAPSHOT (survives deletion)
      _customerName: customer?.name || '',
      _customerBusinessId: customer?.businessId || '',
      _customerVatNumber: customer?.vatNumber || '',
      _customerAddress: customer?.streetAddress || '',
      _customerPostalCode: customer?.postalCode || '',
      _customerCity: customer?.city || '',
      _customerCountry: customer?.country || '',
      _customerPhone: customer?.phone || '',
      _customerEmail: customer?.email || '',
      _customerContactPerson: customer?.contactPerson || '',
      // FULL COMPANY SNAPSHOT (survives deletion)
      _companyName: company?.name || '',
      _companyBusinessId: company?.businessId || '',
      _companyVatNumber: company?.vatNumber || '',
      _companyAddress: company?.streetAddress || '',
      _companyPostalCode: company?.postalCode || '',
      _companyCity: company?.city || '',
      _companyCountry: company?.country || '',
      _companyPhone: company?.phone || '',
      _companyEmail: company?.email || '',
      _companyWebsite: company?.website || '',
      _companyBankAccounts: company?.bankAccounts || [],
      _companyLogo: company?.logo || '',
    }

    // SAVE NOW - synchronous, immediate
    let savedInvoice
    if (invoice?.id) {
      updateInvoice(invoice.id, invoiceData)
      savedInvoice = { ...invoiceData, id: invoice.id }
    } else {
      const result = addInvoice(invoiceData)
      savedInvoice = result.invoice
    }

    // Navigate to preview with auto-PDF download
    onPreview({ ...savedInvoice, _autoPdf: true })
  }

  const handlePreview = () => {
    if (!validate()) return
    onPreview(buildInvoiceData())
  }

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return unitId
    return language === 'fi' ? unit.name : unit.nameEn
  }

  const selectedCompany = companies.find((c) => c.id === formData.companyId)
  const selectedCustomer = customers.find((c) => c.id === formData.customerId)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            {invoice?.id ? t('invoices.editInvoice') : formData.isCreditNote ? (language === 'fi' ? 'Hyvityslasku' : 'Credit Note') : isReceipt ? t('invoices.createReceipt') : t('invoices.createInvoice')}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm text-gray-500">{t('invoices.invoiceNumber')}:</span>
            <input
              type="number"
              name="invoiceNumber"
              value={formData.invoiceNumber}
              onChange={handleChange}
              className="w-24 px-2 py-0.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-400">{t('invoices.invoiceNumberEdit')}</span>
          </div>
        </div>
        <Button variant="secondary" onClick={handlePreview}>
          <Eye className="w-4 h-4" />
          {t('invoices.preview')}
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Credit note banner */}
        {formData.isCreditNote && (
          <div className="mb-4 px-4 py-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm">
            <strong>{language === 'fi' ? 'Hyvityslasku' : 'Credit Note'}</strong>
            {formData.creditedInvoiceNumber && (
              <span> — {language === 'fi' ? 'Hyvitys laskuun' : 'Credit for invoice'} #{formData.creditedInvoiceNumber}</span>
            )}
            <p className="mt-1 text-xs text-orange-600">
              {language === 'fi' ? 'Tarkista ja muokkaa rivit ennen tallennusta.' : 'Review and edit rows before saving.'}
            </p>
          </div>
        )}

        {/* Document type: Invoice vs Receipt */}
        <div className="flex gap-3 mb-4">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'invoice' }))}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-bold transition-colors ${
              !isReceipt
                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
            }`}
          >
            {t('invoices.invoice')}
          </button>
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'cash' }))}
            className={`flex-1 py-3 px-4 rounded-xl border-2 text-base font-bold transition-colors ${
              isReceipt
                ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                : 'border-gray-300 bg-white text-gray-500 hover:border-gray-400'
            }`}
          >
            {t('invoices.receipt')}
          </button>
        </div>

        {/* Payment method (shown only for receipts) */}
        {isReceipt && (
          <Card className="mb-4">
            <CardBody>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('invoices.paymentMethod')}
              </label>
              <select
                name="paymentMethod"
                value={formData.paymentMethod}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 md:w-64"
              >
                <option value="cash">{t('invoices.paymentMethodCash')}</option>
                <option value="card">{t('invoices.paymentMethodCard')}</option>
                <option value="mobilepay">{t('invoices.paymentMethodMobilePay')}</option>
                <option value="bank_transfer">{t('invoices.paymentMethodBankTransfer')}</option>
              </select>
            </CardBody>
          </Card>
        )}

        {/* Sender & Recipient */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Sender */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('invoices.sender')}
              </h2>
            </CardHeader>
            <CardBody>
              <select
                name="companyId"
                value={formData.companyId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.companyId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('invoices.selectCompany')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              {errors.companyId && (
                <p className="mt-1 text-sm text-red-600">{errors.companyId}</p>
              )}
              {selectedCompany && (
                <div className="mt-3 text-sm text-gray-600">
                  <p>{selectedCompany.streetAddress}</p>
                  <p>
                    {selectedCompany.postalCode} {selectedCompany.city}
                  </p>
                  {selectedCompany.businessId && (
                    <p className="mt-1">Y-tunnus: {selectedCompany.businessId}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recipient */}
          <Card>
            <CardHeader className="flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">
                {t('invoices.recipient')}
              </h2>
            </CardHeader>
            <CardBody>
              <select
                name="customerId"
                value={formData.customerId}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.customerId ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{t('invoices.selectCustomer')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-600">{errors.customerId}</p>
              )}
              {selectedCustomer && (
                <div className="mt-3 text-sm text-gray-600">
                  <p>{selectedCustomer.streetAddress}</p>
                  <p>
                    {selectedCustomer.postalCode} {selectedCustomer.city}
                  </p>
                  {selectedCustomer.businessId && (
                    <p className="mt-1">Y-tunnus: {selectedCustomer.businessId}</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Invoice details */}
        <Card className="mb-4">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.invoiceDate')} & {t('invoices.paymentTerms')}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Input
                label={t('invoices.invoiceDate')}
                name="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={handleChange}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('invoices.paymentTerms')}
                </label>
                <select
                  name="paymentTermDays"
                  value={formData.paymentTermDays}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="7">7 {t('invoices.paymentTermDays')}</option>
                  <option value="14">14 {t('invoices.paymentTermDays')}</option>
                  <option value="21">21 {t('invoices.paymentTermDays')}</option>
                  <option value="30">30 {t('invoices.paymentTermDays')}</option>
                  <option value="45">45 {t('invoices.paymentTermDays')}</option>
                  <option value="60">60 {t('invoices.paymentTermDays')}</option>
                </select>
              </div>
              <Input
                label={t('invoices.dueDate')}
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
              <Input
                label={`${t('invoices.lateInterest')} (%)`}
                name="lateInterest"
                type="number"
                step="0.1"
                min="0"
                value={formData.lateInterest}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label={t('invoices.ourReference')}
                name="ourReference"
                value={formData.ourReference}
                onChange={handleChange}
              />
              <Input
                label={t('invoices.yourReference')}
                name="yourReference"
                value={formData.yourReference}
                onChange={handleChange}
              />
            </div>
          </CardBody>
        </Card>

        {/* Additional info - combined with position selector */}
        <Card className="mb-4">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.additionalInfo')}
            </h2>
            <select
              name="additionalInfoPosition"
              value={formData.additionalInfoPosition}
              onChange={handleChange}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="start">{language === 'fi' ? 'Ennen rivejä' : 'Before rows'}</option>
              <option value="end">{language === 'fi' ? 'Rivien jälkeen' : 'After rows'}</option>
            </select>
          </CardHeader>
          <CardBody>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('invoices.additionalInfo')}
            />
          </CardBody>
        </Card>

        {/* Invoice rows – compact table */}
        <Card className="mb-4">
          <CardHeader className="py-2">
            <h2 className="text-base font-semibold text-gray-900">
              {t('invoices.invoiceRows')}
            </h2>
          </CardHeader>
          <div>
            {errors.rows && (
              <p className="text-xs text-red-600 px-4 pb-2">{errors.rows}</p>
            )}
            {/* Desktop: table header */}
            <div className="hidden md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_4rem_4rem_5rem_4.5rem_5.5rem_1.5rem] gap-1.5 px-3 py-1.5 bg-gray-100 border-y border-gray-200 text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
              <span>{t('invoices.product')}</span>
              <span>{t('invoices.description')}</span>
              <span>{t('invoices.quantity')}</span>
              <span>{t('invoices.unit')}</span>
              <span>{t('invoices.unitPrice')}</span>
              <span>{t('invoices.vatRate')}</span>
              <span className="text-right">{t('invoices.total')}</span>
              <span></span>
            </div>
            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {formData.rows.map((row, index) => (
                <div key={index} className="px-3 py-1.5">
                  {/* Desktop: single compact row */}
                  <div className="hidden md:grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)_4rem_4rem_5rem_4.5rem_5.5rem_1.5rem] gap-1.5 items-center">
                    <div className="relative" data-product-dropdown>
                      <input
                        type="text"
                        value={activeProductRow === index ? (productSearch[index] ?? '') : (products.find(p => p.id === row.productId)?.name || '')}
                        onChange={(e) => { setProductSearch(prev => ({ ...prev, [index]: e.target.value })); setActiveProductRow(index) }}
                        onFocus={() => setActiveProductRow(index)}
                        placeholder="—"
                        className="w-full px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white truncate"
                      />
                      {activeProductRow === index && (
                        <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                          <button type="button" onClick={() => selectProduct(index, '')} className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50">—</button>
                          {getFilteredProducts(productSearch[index] || '').map(p => (
                            <button type="button" key={p.id} onClick={() => selectProduct(index, p.id)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 truncate">
                              {p.productNumber ? `${p.productNumber} – ` : ''}{p.name}
                            </button>
                          ))}
                          {getFilteredProducts(productSearch[index] || '').length === 0 && (
                            <div className="px-2 py-1.5 text-xs text-gray-400">{t('common.noResults') || 'Ei tuloksia'}</div>
                          )}
                        </div>
                      )}
                    </div>
                    <input type="text" value={row.description} onChange={(e) => handleRowChange(index, 'description', e.target.value)} className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                    <input type="number" step="0.01" min="0" value={row.quantity} onChange={(e) => handleRowChange(index, 'quantity', e.target.value)} data-qty-row={index} className="w-full px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                    <select value={row.unit} onChange={(e) => handleRowChange(index, 'unit', e.target.value)} className="w-full px-0.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                      {units.map((u) => <option key={u.id} value={u.id}>{getUnitName(u.id)}</option>)}
                    </select>
                    <input type="number" step="0.01" value={row.priceNet} onChange={(e) => handleRowChange(index, 'priceNet', e.target.value)} className="w-full px-1 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                    <div className="relative" data-vat-dropdown>
                      <input type="number" step="0.1" min="0" max="100" value={row.vatRate} onChange={(e) => handleRowChange(index, 'vatRate', e.target.value)} onFocus={() => setActiveVatRow(index)} className="w-full px-0.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                      {activeVatRow === index && (
                        <div className="absolute z-50 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg p-1 flex flex-wrap gap-1 min-w-[8rem]">
                          {vatRates.map((rate) => (
                            <button key={rate} type="button" onClick={() => { handleRowChange(index, 'vatRate', rate); setActiveVatRow(null) }} className={`px-2 py-1 text-xs rounded transition-colors ${parseFloat(row.vatRate) === rate ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                              {formatVatRate(rate)}%
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-semibold text-gray-900 text-right whitespace-nowrap">{formatPrice(calculateRowGross(row))}</span>
                    {formData.rows.length > 1 ? (
                      <button type="button" onClick={() => removeRow(index)} className="p-0.5 text-red-400 hover:text-red-600 flex justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                    ) : <span />}
                  </div>
                  {/* Mobile: compact two-line layout */}
                  <div className="md:hidden space-y-1">
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 min-w-0 relative" data-product-dropdown>
                        <input
                          type="text"
                          value={activeProductRow === index ? (productSearch[index] ?? '') : (products.find(p => p.id === row.productId)?.name || '')}
                          onChange={(e) => { setProductSearch(prev => ({ ...prev, [index]: e.target.value })); setActiveProductRow(index) }}
                          onFocus={() => setActiveProductRow(index)}
                          placeholder={t('invoices.selectProduct')}
                          className="w-full px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                        />
                        {activeProductRow === index && (
                          <div className="absolute z-50 left-0 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg max-h-40 overflow-y-auto">
                            <button type="button" onClick={() => selectProduct(index, '')} className="w-full text-left px-2 py-1.5 text-xs text-gray-400 hover:bg-gray-50">—</button>
                            {getFilteredProducts(productSearch[index] || '').map(p => (
                              <button type="button" key={p.id} onClick={() => selectProduct(index, p.id)} className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 truncate">
                                {p.name} – {formatPrice(p.priceNet)}
                              </button>
                            ))}
                            {getFilteredProducts(productSearch[index] || '').length === 0 && (
                              <div className="px-2 py-1.5 text-xs text-gray-400">{t('common.noResults') || 'Ei tuloksia'}</div>
                            )}
                          </div>
                        )}
                      </div>
                      <input type="text" value={row.description} onChange={(e) => handleRowChange(index, 'description', e.target.value)} placeholder={t('invoices.description')} className="flex-[2] min-w-0 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500" />
                      {formData.rows.length > 1 && (
                        <button type="button" onClick={() => removeRow(index)} className="p-0.5 text-red-400 hover:text-red-600 flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="number" step="0.01" min="0" value={row.quantity} onChange={(e) => handleRowChange(index, 'quantity', e.target.value)} data-qty-row={index} className="w-14 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-center" />
                      <select value={row.unit} onChange={(e) => handleRowChange(index, 'unit', e.target.value)} className="w-14 px-0.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white">
                        {units.map((u) => <option key={u.id} value={u.id}>{getUnitName(u.id)}</option>)}
                      </select>
                      <input type="number" step="0.01" value={row.priceNet} onChange={(e) => handleRowChange(index, 'priceNet', e.target.value)} className="w-20 px-1.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                      <div className="w-16 relative" data-vat-dropdown>
                        <input type="number" step="0.1" min="0" max="100" value={row.vatRate} onChange={(e) => handleRowChange(index, 'vatRate', e.target.value)} onFocus={() => setActiveVatRow(index)} className="w-full px-0.5 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-right" />
                        {activeVatRow === index && (
                          <div className="absolute z-50 right-0 top-full mt-0.5 bg-white border border-gray-200 rounded shadow-lg p-1 flex flex-wrap gap-1 min-w-[8rem]">
                            {vatRates.map((rate) => (
                              <button key={rate} type="button" onClick={() => { handleRowChange(index, 'vatRate', rate); setActiveVatRow(null) }} className={`px-2 py-1 text-xs rounded transition-colors ${parseFloat(row.vatRate) === rate ? 'bg-blue-100 text-blue-700 font-semibold' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                                {formatVatRate(rate)}%
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="flex-1 text-right text-xs font-semibold text-gray-900 whitespace-nowrap">{formatPrice(calculateRowGross(row))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-3 py-2 border-t border-gray-100">
            <Button type="button" variant="ghost" size="sm" onClick={addRow} className="w-full text-blue-600 hover:bg-blue-50">
              <Plus className="w-3.5 h-3.5" />
              {t('invoices.addRow')}
            </Button>
          </div>
        </Card>

        {/* Totals with VAT breakdown */}
        <Card className="mb-4">
          <CardBody>
            <div className="flex flex-col items-end gap-2">
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-gray-600">{t('invoices.subtotal')} (veroton):</span>
                <span className="font-medium">
                  {formatPrice(totals.totalNet)} EUR
                </span>
              </div>
              {/* Per-rate VAT breakdown */}
              {(() => {
                const vatByRate = {}
                formData.rows.forEach((row) => {
                  const rate = parseFloat(row.vatRate) || 0
                  const rowNet = (parseFloat(row.quantity) || 0) * (parseFloat(row.priceNet) || 0)
                  const rowVat = calculateVatAmount(rowNet, rate)
                  if (!vatByRate[rate]) vatByRate[rate] = 0
                  vatByRate[rate] += rowVat
                })
                return Object.entries(vatByRate)
                  .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
                  .map(([rate, amount]) => (
                    <div key={rate} className="flex justify-between w-full max-w-xs text-sm">
                      <span className="text-gray-500">ALV {formatVatRate(parseFloat(rate))} %:</span>
                      <span className="text-gray-600">{formatPrice(Math.round(amount * 100) / 100)} EUR</span>
                    </div>
                  ))
              })()}
              <div className="flex justify-between w-full max-w-xs text-sm border-t pt-1">
                <span className="text-gray-600">{t('invoices.vatTotal')}:</span>
                <span className="font-medium">
                  {formatPrice(totals.totalVat)} EUR
                </span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-lg border-t pt-2 mt-2">
                <span className="font-semibold text-gray-900">
                  {t('invoices.grandTotal')}:
                </span>
                <span className="font-bold text-gray-900">
                  {formatPrice(totals.totalGross)} EUR
                </span>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Actions */}
        <Card>
          <CardFooter className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={saved}>
              {saved ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('invoices.savedSuccess')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  )
}
