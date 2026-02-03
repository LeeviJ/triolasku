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
    additionalInfoStart: invoice?.additionalInfoStart || '',
    additionalInfoEnd: invoice?.additionalInfoEnd || '',
    status: invoice?.status || 'draft',
    paymentMethod: invoice?.paymentMethod || 'invoice',
    rows: invoice?.rows?.length > 0 ? invoice.rows : [{ ...EMPTY_ROW }],
  })

  const [errors, setErrors] = useState({})
  const [saved, setSaved] = useState(false)

  const isReceipt = formData.paymentMethod !== 'invoice'

  // Update invoice number when company changes (new invoices only)
  useEffect(() => {
    if (!invoice && formData.companyId) {
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

    // STEP 2: Build invoice with FORCED status 'ready' + full customer/company snapshot
    const invoiceData = {
      ...formData,
      invoiceNumber: parseInt(formData.invoiceNumber, 10) || formData.invoiceNumber,
      // FORCED STATUS - this MUST happen regardless of PDF/Email
      status: 'ready',
      ...totals,
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

    // STEP 3: SAVE NOW - synchronous, immediate, no waiting
    console.log('[InvoiceForm] SAVING with status:', invoiceData.status)
    if (invoice) {
      updateInvoice(invoice.id, invoiceData)
    } else {
      addInvoice(invoiceData)
    }
    console.log('[InvoiceForm] SAVED - status is now ready')

    // PDF/Email run in background via DataContext useEffect - we don't wait

    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 1000)
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
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {invoice ? t('invoices.editInvoice') : isReceipt ? t('invoices.createReceipt') : t('invoices.createInvoice')}
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
        {/* Document type: Invoice vs Receipt */}
        <div className="flex gap-4 mb-6">
          <button
            type="button"
            onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'invoice' }))}
            className={`flex-1 py-4 px-6 rounded-xl border-2 text-lg font-bold transition-colors ${
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
            className={`flex-1 py-4 px-6 rounded-xl border-2 text-lg font-bold transition-colors ${
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
          <Card className="mb-6">
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.invoiceDate')} & {t('invoices.paymentTerms')}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

        {/* Additional info start */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.additionalInfoStart')}
            </h2>
          </CardHeader>
          <CardBody>
            <textarea
              name="additionalInfoStart"
              value={formData.additionalInfoStart}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('invoices.additionalInfo')}
            />
          </CardBody>
        </Card>

        {/* Invoice rows */}
        <Card className="mb-6">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.invoiceRows')}
            </h2>
            <Button type="button" variant="secondary" size="sm" onClick={addRow}>
              <Plus className="w-4 h-4" />
              {t('invoices.addRow')}
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {errors.rows && (
              <p className="text-sm text-red-600">{errors.rows}</p>
            )}
            {formData.rows.map((row, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {t('invoices.invoiceRows')} #{index + 1}
                  </span>
                  {formData.rows.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRow(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                  {/* Product selector */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.product')}
                    </label>
                    <select
                      value={row.productId}
                      onChange={(e) =>
                        handleRowChange(index, 'productId', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">{t('invoices.selectProduct')}</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name} - {formatPrice(product.priceNet)} EUR
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.description')}
                    </label>
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) =>
                        handleRowChange(index, 'description', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.quantity')}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.quantity}
                      onChange={(e) =>
                        handleRowChange(index, 'quantity', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* Unit */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.unit')}
                    </label>
                    <select
                      value={row.unit}
                      onChange={(e) =>
                        handleRowChange(index, 'unit', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {getUnitName(unit.id)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  {/* Unit price */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.unitPrice')} (EUR)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.priceNet}
                      onChange={(e) =>
                        handleRowChange(index, 'priceNet', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {/* VAT rate */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.vatRate')}
                    </label>
                    <select
                      value={row.vatRate}
                      onChange={(e) =>
                        handleRowChange(index, 'vatRate', e.target.value)
                      }
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {vatRates.map((rate) => (
                        <option key={rate} value={rate}>
                          {formatVatRate(rate)} %
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row total */}
                  <div className="col-span-2 text-right">
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {t('invoices.rowTotal')}
                    </label>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatPrice(calculateRowGross(row))} EUR
                    </div>
                    <div className="text-xs text-gray-500">
                      ({formatPrice(calculateRowTotal(row))} + ALV)
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* Additional info end */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('invoices.additionalInfoEnd')}
            </h2>
          </CardHeader>
          <CardBody>
            <textarea
              name="additionalInfoEnd"
              value={formData.additionalInfoEnd}
              onChange={handleChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={t('invoices.additionalInfo')}
            />
          </CardBody>
        </Card>

        {/* Totals */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex flex-col items-end gap-2">
              <div className="flex justify-between w-full max-w-xs text-sm">
                <span className="text-gray-600">{t('invoices.subtotal')}:</span>
                <span className="font-medium">
                  {formatPrice(totals.totalNet)} EUR
                </span>
              </div>
              <div className="flex justify-between w-full max-w-xs text-sm">
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
