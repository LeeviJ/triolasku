import { useState } from 'react'
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  X,
  Search,
  Check,
  Settings,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData } from '../context/DataContext'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  formatPrice,
  formatVatRate,
  calculateGrossPrice,
  calculateNetPrice,
} from '../utils/formatters'

const EMPTY_PRODUCT = {
  name: '',
  description: '',
  priceNet: '',
  priceGross: '',
  vatRate: 25.5,
  unit: 'kpl',
  priceInputType: 'net', // 'net' or 'gross'
}

export default function Products() {
  const { t, language } = useLanguage()
  const {
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    vatRates,
    addVatRate,
    removeVatRate,
    units,
    addUnit,
    removeUnit,
  } = useData()

  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({ ...EMPTY_PRODUCT })
  const [errors, setErrors] = useState({})
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [saved, setSaved] = useState(false)

  // Settings state
  const [newVatRate, setNewVatRate] = useState('')
  const [newUnitName, setNewUnitName] = useState('')

  // Filter products based on search
  const filteredProducts = products.filter((product) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      product.name?.toLowerCase().includes(query) ||
      product.productNumber?.toString().includes(query) ||
      product.description?.toLowerCase().includes(query)
    )
  })

  const handleOpenForm = (product = null) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name || '',
        description: product.description || '',
        priceNet: product.priceNet?.toString() || '',
        priceGross: product.priceGross?.toString() || '',
        vatRate: product.vatRate ?? 25.5,
        unit: product.unit || 'kpl',
        priceInputType: 'net',
      })
    } else {
      setEditingProduct(null)
      setFormData({ ...EMPTY_PRODUCT, vatRate: vatRates[0] || 25.5 })
    }
    setErrors({})
    setSaved(false)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingProduct(null)
    setFormData({ ...EMPTY_PRODUCT })
    setErrors({})
    setSaved(false)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const updated = { ...prev, [name]: value }

      // Auto-calculate prices
      if (name === 'priceNet' && prev.priceInputType === 'net') {
        updated.priceGross = calculateGrossPrice(value, prev.vatRate).toString()
      } else if (name === 'priceGross' && prev.priceInputType === 'gross') {
        updated.priceNet = calculateNetPrice(value, prev.vatRate).toString()
      } else if (name === 'vatRate') {
        // Recalculate based on input type
        if (prev.priceInputType === 'net' && prev.priceNet) {
          updated.priceGross = calculateGrossPrice(prev.priceNet, value).toString()
        } else if (prev.priceInputType === 'gross' && prev.priceGross) {
          updated.priceNet = calculateNetPrice(prev.priceGross, value).toString()
        }
      } else if (name === 'priceInputType') {
        // When switching input type, recalculate
        if (value === 'net' && prev.priceGross) {
          updated.priceNet = calculateNetPrice(prev.priceGross, prev.vatRate).toString()
        } else if (value === 'gross' && prev.priceNet) {
          updated.priceGross = calculateGrossPrice(prev.priceNet, prev.vatRate).toString()
        }
      }

      return updated
    })

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = t('products.nameRequired')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    const productData = {
      name: formData.name,
      description: formData.description,
      priceNet: parseFloat(formData.priceNet) || 0,
      priceGross: parseFloat(formData.priceGross) || 0,
      vatRate: parseFloat(formData.vatRate),
      unit: formData.unit,
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, productData)
    } else {
      addProduct(productData)
    }

    setSaved(true)
    setTimeout(() => {
      handleCloseForm()
    }, 1000)
  }

  const handleDelete = (id) => {
    deleteProduct(id)
    setDeleteConfirm(null)
  }

  const handleAddVatRate = () => {
    const rate = parseFloat(newVatRate.replace(',', '.'))
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      addVatRate(rate)
      setNewVatRate('')
    }
  }

  const handleAddUnit = () => {
    if (newUnitName.trim()) {
      addUnit({ id: newUnitName.toLowerCase(), name: newUnitName, nameEn: newUnitName })
      setNewUnitName('')
    }
  }

  const getUnitName = (unitId) => {
    const unit = units.find((u) => u.id === unitId)
    if (!unit) return unitId
    return language === 'fi' ? unit.name : unit.nameEn
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('products.title')}
          </h1>
          <p className="mt-1 text-gray-500">{t('products.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setShowSettings(true)}>
            <Settings className="w-4 h-4" />
            {t('products.settings')}
          </Button>
          <Button onClick={() => handleOpenForm()}>
            <Plus className="w-4 h-4" />
            {t('products.addProduct')}
          </Button>
        </div>
      </div>

      {/* Search */}
      {products.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('products.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* Product list / table */}
      {products.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h2>
            <p className="text-gray-500 mb-6">{t('products.subtitle')}</p>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="w-4 h-4" />
              {t('products.addProduct')}
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
                    {t('products.productName')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    {t('products.priceNet')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    {t('products.vatRate')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('products.priceGross')}
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    {t('products.unit')}
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('common.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {product.productNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">
                        {product.name}
                      </div>
                      {product.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right hidden sm:table-cell">
                      {formatPrice(product.priceNet)} {t('products.currency')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center hidden md:table-cell">
                      {formatVatRate(product.vatRate)} %
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                      {formatPrice(product.priceGross)} {t('products.currency')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 text-center hidden lg:table-cell">
                      {getUnitName(product.unit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {deleteConfirm === product.id ? (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
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
                            onClick={() => setDeleteConfirm(product.id)}
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
          {filteredProducts.length === 0 && searchQuery && (
            <CardBody className="text-center py-8">
              <p className="text-gray-500">{t('common.noData')}</p>
            </CardBody>
          )}
        </Card>
      )}

      {/* Product form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingProduct
                  ? t('products.editProduct')
                  : t('products.addProduct')}
              </h2>
              <button
                onClick={handleCloseForm}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit}>
              <div className="px-6 py-4 space-y-4">
                {/* Product number (read-only for editing) */}
                {editingProduct && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <span className="text-sm text-gray-500">
                      {t('products.productNumber')}:
                    </span>{' '}
                    <span className="font-medium">
                      {editingProduct.productNumber}
                    </span>
                  </div>
                )}

                {/* Name */}
                <Input
                  label={t('products.productName')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                  autoFocus
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.description')}
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* VAT rate selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.vatRate')}
                  </label>
                  <select
                    name="vatRate"
                    value={formData.vatRate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {vatRates.map((rate) => (
                      <option key={rate} value={rate}>
                        {formatVatRate(rate)} %
                      </option>
                    ))}
                  </select>
                </div>

                {/* Price input type toggle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('products.priceType')}
                  </label>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: 'priceInputType', value: 'net' },
                        })
                      }
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        formData.priceInputType === 'net'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t('products.priceWithoutVat')}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleChange({
                          target: { name: 'priceInputType', value: 'gross' },
                        })
                      }
                      className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                        formData.priceInputType === 'gross'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t('products.priceWithVat')}
                    </button>
                  </div>
                </div>

                {/* Price inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label={`${t('products.priceNet')} (${t('products.currency')})`}
                      name="priceNet"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceNet}
                      onChange={handleChange}
                      disabled={formData.priceInputType === 'gross'}
                      className={
                        formData.priceInputType === 'gross' ? 'opacity-60' : ''
                      }
                    />
                  </div>
                  <div>
                    <Input
                      label={`${t('products.priceGross')} (${t('products.currency')})`}
                      name="priceGross"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.priceGross}
                      onChange={handleChange}
                      disabled={formData.priceInputType === 'net'}
                      className={
                        formData.priceInputType === 'net' ? 'opacity-60' : ''
                      }
                    />
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('products.unit')}
                  </label>
                  <select
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {language === 'fi' ? unit.name : unit.nameEn}
                      </option>
                    ))}
                  </select>
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
                      {t('products.savedSuccess')}
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

      {/* Settings modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {t('products.settings')}
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-4 space-y-6">
              {/* VAT rates */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t('products.vatRates')}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {vatRates.map((rate) => (
                    <div
                      key={rate}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {formatVatRate(rate)} %
                      <button
                        type="button"
                        onClick={() => removeVatRate(rate)}
                        className="ml-1 hover:text-blue-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <Input
                    label={t('products.addVatRate')}
                    value={newVatRate}
                    onChange={(e) => setNewVatRate(e.target.value)}
                    placeholder="0,00"
                    className="w-32"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddVatRate}
                    disabled={!newVatRate}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Units */}
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  {t('products.units')}
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {units.map((unit) => (
                    <div
                      key={unit.id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium"
                    >
                      {language === 'fi' ? unit.name : unit.nameEn}
                      <button
                        type="button"
                        onClick={() => removeUnit(unit.id)}
                        className="ml-1 hover:text-green-900"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex items-end gap-2">
                  <Input
                    label={t('products.addUnit')}
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                    placeholder={t('products.unitName')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddUnit}
                    disabled={!newUnitName.trim()}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <Button variant="primary" onClick={() => setShowSettings(false)}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
