import { useState, useRef } from 'react'
import {
  ArrowLeft,
  Building2,
  Plus,
  Trash2,
  Upload,
  X,
  Check,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useData } from '../../context/DataContext'
import Card, { CardBody, CardHeader, CardFooter } from '../ui/Card'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { formatVatRate } from '../../utils/formatters'

const EMPTY_BANK_ACCOUNT = { bankName: '', iban: '', bic: '' }

export default function CompanyForm({ company, onClose }) {
  const { t } = useLanguage()
  const { addCompany, updateCompany, DEFAULT_VAT_RATES } = useData()
  const fileInputRef = useRef(null)
  const [saved, setSaved] = useState(false)

  const [formData, setFormData] = useState({
    name: company?.name || '',
    businessId: company?.businessId || '',
    vatNumber: company?.vatNumber || '',
    streetAddress: company?.streetAddress || '',
    postalCode: company?.postalCode || '',
    city: company?.city || '',
    country: company?.country || 'Suomi',
    phone: company?.phone || '',
    email: company?.email || '',
    website: company?.website || '',
    logo: company?.logo || '',
    bankAccounts: company?.bankAccounts?.length
      ? company.bankAccounts
      : [{ ...EMPTY_BANK_ACCOUNT }],
    vatRates: company?.vatRates || [...DEFAULT_VAT_RATES],
  })

  const [errors, setErrors] = useState({})
  const [newVatRate, setNewVatRate] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleBankAccountChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.map((acc, i) =>
        i === index ? { ...acc, [field]: value } : acc
      ),
    }))
  }

  const addBankAccount = () => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: [...prev.bankAccounts, { ...EMPTY_BANK_ACCOUNT }],
    }))
  }

  const removeBankAccount = (index) => {
    setFormData((prev) => ({
      ...prev,
      bankAccounts: prev.bankAccounts.filter((_, i) => i !== index),
    }))
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 500000) {
        alert('Logo file too large (max 500KB)')
        return
      }
      const reader = new FileReader()
      reader.onload = (event) => {
        setFormData((prev) => ({ ...prev, logo: event.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeLogo = () => {
    setFormData((prev) => ({ ...prev, logo: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addVatRate = () => {
    const rate = parseFloat(newVatRate.replace(',', '.'))
    if (!isNaN(rate) && rate >= 0 && rate <= 100) {
      // Round to 2 decimal places
      const roundedRate = Math.round(rate * 100) / 100
      if (!formData.vatRates.includes(roundedRate)) {
        setFormData((prev) => ({
          ...prev,
          vatRates: [...prev.vatRates, roundedRate].sort((a, b) => b - a),
        }))
      }
      setNewVatRate('')
    }
  }

  const removeVatRate = (rate) => {
    setFormData((prev) => ({
      ...prev,
      vatRates: prev.vatRates.filter((r) => r !== rate),
    }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) {
      newErrors.name = t('common.required')
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return

    // Filter out empty bank accounts
    const cleanedData = {
      ...formData,
      bankAccounts: formData.bankAccounts.filter(
        (acc) => acc.bankName || acc.iban || acc.bic
      ),
    }

    if (company) {
      updateCompany(company.id, cleanedData)
    } else {
      addCompany(cleanedData)
    }

    setSaved(true)
    setTimeout(() => {
      onClose()
    }, 1000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {company ? t('companies.editCompany') : t('companies.addCompany')}
        </h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Basic info */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.companyName')}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('companies.companyName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />
              <Input
                label={t('companies.businessId')}
                name="businessId"
                value={formData.businessId}
                onChange={handleChange}
                placeholder="1234567-8"
              />
            </div>
            <Input
              label={t('companies.vatNumber')}
              name="vatNumber"
              value={formData.vatNumber}
              onChange={handleChange}
              placeholder="FI12345678"
              className="md:w-1/2"
            />
          </CardBody>
        </Card>

        {/* Logo */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.logo')}
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                {formData.logo ? (
                  <img
                    src={formData.logo}
                    alt="Logo"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4" />
                  {t('companies.uploadLogo')}
                </Button>
                {formData.logo && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeLogo}
                  >
                    <X className="w-4 h-4" />
                    {t('companies.removeLogo')}
                  </Button>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Address */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.address')}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label={t('companies.streetAddress')}
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
            />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Input
                label={t('companies.postalCode')}
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
              />
              <Input
                label={t('companies.city')}
                name="city"
                value={formData.city}
                onChange={handleChange}
                className="col-span-1 md:col-span-2"
              />
            </div>
            <Input
              label={t('companies.country')}
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="md:w-1/2"
            />
          </CardBody>
        </Card>

        {/* Contact */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.phone')} & {t('companies.email')}
            </h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('companies.phone')}
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                label={t('companies.email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <Input
              label={t('companies.website')}
              name="website"
              type="url"
              value={formData.website}
              onChange={handleChange}
              placeholder="https://"
              className="md:w-1/2"
            />
          </CardBody>
        </Card>

        {/* Bank accounts */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.bankAccounts')}
            </h2>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addBankAccount}
            >
              <Plus className="w-4 h-4" />
              {t('companies.addBankAccount')}
            </Button>
          </CardHeader>
          <CardBody className="space-y-4">
            {formData.bankAccounts.map((account, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    {t('companies.bankAccounts')} #{index + 1}
                  </span>
                  {formData.bankAccounts.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBankAccount(index)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label={t('companies.bankName')}
                    value={account.bankName}
                    onChange={(e) =>
                      handleBankAccountChange(index, 'bankName', e.target.value)
                    }
                  />
                  <Input
                    label={t('companies.iban')}
                    value={account.iban}
                    onChange={(e) =>
                      handleBankAccountChange(index, 'iban', e.target.value)
                    }
                    placeholder="FI00 0000 0000 0000 00"
                  />
                  <Input
                    label={t('companies.bic')}
                    value={account.bic}
                    onChange={(e) =>
                      handleBankAccountChange(index, 'bic', e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        {/* VAT rates */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('companies.vatRates')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('companies.defaultVatRates')}
            </p>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-2 mb-4">
              {formData.vatRates.map((rate) => (
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
                label={t('companies.addVatRate')}
                value={newVatRate}
                onChange={(e) => setNewVatRate(e.target.value)}
                placeholder="0,00"
                className="w-32"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={addVatRate}
                disabled={!newVatRate}
              >
                <Plus className="w-4 h-4" />
                {t('common.add')}
              </Button>
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
                  {t('companies.savedSuccess')}
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
