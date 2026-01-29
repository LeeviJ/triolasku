import { useState } from 'react'
import { Users, Plus, Pencil, Trash2, X, Search, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData } from '../context/DataContext'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const EMPTY_CUSTOMER = {
  name: '',
  contactPerson: '',
  businessId: '',
  vatNumber: '',
  streetAddress: '',
  postalCode: '',
  city: '',
  country: 'Suomi',
  phone: '',
  email: '',
}

export default function Customers() {
  const { t } = useLanguage()
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useData()

  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_CUSTOMER })
  const [errors, setErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saved, setSaved] = useState(false)

  // Filter customers based on search
  const filteredCustomers = customers.filter((customer) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      customer.name?.toLowerCase().includes(query) ||
      customer.customerNumber?.toString().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.businessId?.toLowerCase().includes(query)
    )
  })

  const handleOpenForm = (customer = null) => {
    if (customer) {
      setEditingCustomer(customer)
      setFormData({
        name: customer.name || '',
        contactPerson: customer.contactPerson || '',
        businessId: customer.businessId || '',
        vatNumber: customer.vatNumber || '',
        streetAddress: customer.streetAddress || '',
        postalCode: customer.postalCode || '',
        city: customer.city || '',
        country: customer.country || 'Suomi',
        phone: customer.phone || '',
        email: customer.email || '',
      })
    } else {
      setEditingCustomer(null)
      setFormData({ ...EMPTY_CUSTOMER })
    }
    setErrors({})
    setSaved(false)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCustomer(null)
    setFormData({ ...EMPTY_CUSTOMER })
    setErrors({})
    setSaved(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = t('customers.nameRequired')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleAddCustomer = (e) => {
    e.preventDefault()
    if (!validate()) return

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, formData)
    } else {
      addCustomer(formData)
    }

    setSaved(true)
    setTimeout(() => {
      handleCloseForm()
    }, 1000)
  }

  const handleDelete = (id) => {
    deleteCustomer(id)
    setDeleteConfirm(null)
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('customers.title')}
          </h1>
          <p className="mt-1 text-gray-500">{t('customers.subtitle')}</p>
        </div>
        <Button onClick={() => handleOpenForm()}>
          <Plus className="w-4 h-4" />
          {t('customers.addCustomer')}
        </Button>
      </div>

      {/* Search */}
      {customers.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('customers.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Customer list / table */}
      {customers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h2>
            <p className="text-gray-500 mb-6">{t('customers.subtitle')}</p>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4" />
              {t('customers.addCustomer')}
            </Button>
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
                    {t('customers.customerName')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {t('customers.businessId')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    {t('customers.city')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {t('customers.phone')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    {t('customers.email')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {customer.customerNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {customer.name}
                      </div>
                      {customer.contactPerson && (
                        <div className="text-sm text-gray-500">
                          {customer.contactPerson}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                      {customer.businessId || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {customer.city || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {customer.phone || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 hidden lg:table-cell">
                      {customer.email || '-'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(customer)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {deleteConfirm === customer.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(customer.id)}
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
                            onClick={() => setDeleteConfirm(customer.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredCustomers.length === 0 && searchQuery && (
            <CardBody className="text-center py-8">
              <p className="text-gray-500">{t('common.noData')}</p>
            </CardBody>
          )}
        </Card>
      )}

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCustomer
                  ? t('customers.editCustomer')
                  : t('customers.addCustomer')}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleAddCustomer}>
              <div className="px-6 py-4 space-y-4">
                {/* Customer number (read-only for editing) */}
                {editingCustomer && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-500">
                      {t('customers.customerNumber')}:
                    </span>{' '}
                    <span className="font-medium">
                      {editingCustomer.customerNumber}
                    </span>
                  </div>
                )}

                {/* Name */}
                <Input
                  label={t('customers.customerName')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  autoFocus
                />

                {/* Contact person */}
                <Input
                  label={t('customers.contactPerson')}
                  name="contactPerson"
                  value={formData.contactPerson}
                  onChange={handleChange}
                />

                {/* Business ID and VAT */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('customers.businessId')}
                    name="businessId"
                    value={formData.businessId}
                    onChange={handleChange}
                    placeholder="1234567-8"
                  />
                  <Input
                    label={t('customers.vatNumber')}
                    name="vatNumber"
                    value={formData.vatNumber}
                    onChange={handleChange}
                    placeholder="FI12345678"
                  />
                </div>

                {/* Address */}
                <Input
                  label={t('customers.streetAddress')}
                  name="streetAddress"
                  value={formData.streetAddress}
                  onChange={handleChange}
                />

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <Input
                    label={t('customers.postalCode')}
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                  />
                  <Input
                    label={t('customers.city')}
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="col-span-1 sm:col-span-2"
                  />
                </div>

                <Input
                  label={t('customers.country')}
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="sm:w-1/2"
                />

                {/* Contact info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label={t('customers.phone')}
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                  <Input
                    label={t('customers.email')}
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                <Button type="button" variant="secondary" onClick={handleCloseForm}>
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={saved}>
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t('customers.savedSuccess')}
                    </>
                  ) : (
                    t('common.save')
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
