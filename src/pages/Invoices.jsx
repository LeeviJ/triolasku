import { useState } from 'react'
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Eye,
  Search,
  Building2,
  User,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData } from '../context/DataContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatPrice, formatDateFI } from '../utils/formatters'
import InvoiceForm from '../components/invoices/InvoiceForm'
import InvoicePreview from '../components/invoices/InvoicePreview'

export default function Invoices() {
  const { t } = useLanguage()
  const { invoices, companies, customers, deleteInvoice } = useData()

  const [showForm, setShowForm] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [previewInvoice, setPreviewInvoice] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and sort invoices (newest first)
  const filteredInvoices = invoices
    .filter((invoice) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      const customer = customers.find((c) => c.id === invoice.customerId)
      const company = companies.find((c) => c.id === invoice.companyId)
      return (
        invoice.invoiceNumber?.toString().includes(query) ||
        customer?.name?.toLowerCase().includes(query) ||
        company?.name?.toLowerCase().includes(query)
      )
    })
    .sort((a, b) => {
      const dateCompare = (b.invoiceDate || '').localeCompare(a.invoiceDate || '')
      if (dateCompare !== 0) return dateCompare
      return (parseInt(b.invoiceNumber, 10) || 0) - (parseInt(a.invoiceNumber, 10) || 0)
    })

  const handleCreate = () => {
    setEditingInvoice(null)
    setShowForm(true)
  }

  const handleEdit = (invoice) => {
    setEditingInvoice(invoice)
    setShowForm(true)
  }

  const handlePreview = (invoice) => {
    setPreviewInvoice(invoice)
    setShowPreview(true)
  }

  const handleDelete = (id) => {
    deleteInvoice(id)
    setDeleteConfirm(null)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingInvoice(null)
  }

  const handleDuplicateAndEdit = (sourceInvoice) => {
    const today = new Date().toISOString().split('T')[0]
    // Deep copy: strip identity fields, deep-clone rows
    const { id, invoiceNumber, createdAt, updatedAt, ...data } = sourceInvoice
    const template = {
      ...data,
      invoiceDate: today,
      dueDate: '',
      status: 'draft',
      rows: (sourceInvoice.rows || []).map(row => ({ ...row })),
    }
    setShowPreview(false)
    setPreviewInvoice(null)
    setEditingInvoice(template)
    setShowForm(true)
  }

  // Get company name - use snapshot if company was deleted
  const getCompanyName = (invoice) => {
    const company = companies.find((c) => c.id === invoice.companyId)
    if (company) return company.name
    // Use snapshot data
    return invoice._companyName || '-'
  }

  // Get customer name - use snapshot if customer was deleted
  const getCustomerName = (invoice) => {
    const customer = customers.find((c) => c.id === invoice.customerId)
    if (customer) return customer.name
    // Use snapshot data (customer was deleted but data preserved)
    return invoice._customerName || '-'
  }

  // Check if we can create invoices
  const canCreateInvoice = companies.length > 0 && customers.length > 0

  if (showForm) {
    return (
      <InvoiceForm
        invoice={editingInvoice}
        onClose={handleFormClose}
        onPreview={(invoice) => {
          setPreviewInvoice(invoice)
          setShowPreview(true)
        }}
      />
    )
  }

  if (showPreview && previewInvoice) {
    return (
      <InvoicePreview
        invoice={previewInvoice}
        onClose={() => {
          setShowPreview(false)
          setPreviewInvoice(null)
        }}
        onDuplicate={handleDuplicateAndEdit}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('invoices.title')}
          </h1>
          <p className="mt-1 text-gray-500">{t('invoices.subtitle')}</p>
        </div>
        <Button onClick={handleCreate} disabled={!canCreateInvoice}>
          <Plus className="w-4 h-4" />
          {t('invoices.createInvoice')}
        </Button>
      </div>

      {/* Warning if missing data */}
      {!canCreateInvoice && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-start gap-3">
            <div className="text-amber-600">
              {companies.length === 0 ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <p className="text-amber-800 text-sm">
              {companies.length === 0
                ? t('invoices.noCompanySelected')
                : t('invoices.noCustomerSelected')}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Search */}
      {invoices.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Status legend */}
      {invoices.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-gray-400"></span>
            <span>{t('invoices.statusDraft')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-purple-500"></span>
            <span>{t('invoices.statusReady')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            <span>{t('invoices.statusSent')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            <span>{t('invoices.statusPaid')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            <span>{t('invoices.statusOverdue')}</span>
          </div>
        </div>
      )}

      {/* Invoice list */}
      {invoices.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h2>
            <p className="text-gray-500 mb-6">{t('invoices.subtitle')}</p>
            {canCreateInvoice && (
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4" />
                {t('invoices.createInvoice')}
              </Button>
            )}
          </CardBody>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoices.invoiceDate')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {t('invoices.sender')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('invoices.recipient')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {t('invoices.total')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => {
                  const status = invoice.status || 'draft'
                  const borderColors = {
                    draft: 'border-l-gray-400',
                    ready: 'border-l-purple-500',
                    sent: 'border-l-blue-500',
                    paid: 'border-l-green-500',
                    overdue: 'border-l-red-500',
                  }
                  return (
                  <tr key={invoice.id} className={`hover:bg-gray-50 border-l-4 ${borderColors[status]}`}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {invoice.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDateFI(invoice.invoiceDate)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {getCompanyName(invoice)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {getCustomerName(invoice)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right hidden sm:table-cell">
                      {formatPrice(invoice.totalGross)} {t('invoices.currency')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(invoice)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(invoice)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {deleteConfirm === invoice.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(invoice.id)}
                            >
                              {t('common.yes')}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setDeleteConfirm(null)}
                            >
                              {t('common.no')}
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeleteConfirm(invoice.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredInvoices.length === 0 && searchQuery && (
            <CardBody className="text-center py-8">
              <p className="text-gray-500">{t('common.noData')}</p>
            </CardBody>
          )}
        </Card>
      )}
    </div>
  )
}
