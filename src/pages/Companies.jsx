import { useState } from 'react'
import { Building2, Plus, Pencil, Trash2, AlertCircle } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData } from '../context/DataContext'
import Card, { CardBody, CardHeader } from '../components/ui/Card'
import Button from '../components/ui/Button'
import CompanyForm from '../components/companies/CompanyForm'

export default function Companies() {
  const { t } = useLanguage()
  const { companies, deleteCompany, MAX_COMPANIES } = useData()
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const handleEdit = (company) => {
    setEditingCompany(company)
    setShowForm(true)
  }

  const handleDelete = (id) => {
    deleteCompany(id)
    setDeleteConfirm(null)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingCompany(null)
  }

  const canAddMore = companies.length < MAX_COMPANIES

  if (showForm) {
    return (
      <CompanyForm
        company={editingCompany}
        onClose={handleFormClose}
      />
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            {t('companies.title')}
          </h1>
          <p className="mt-1 text-gray-500">{t('companies.subtitle')}</p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          disabled={!canAddMore}
        >
          <Plus className="w-4 h-4" />
          {t('companies.addCompany')}
        </Button>
      </div>

      {/* Max companies warning */}
      {!canAddMore && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">
            {t('companies.maxCompaniesReached')}
          </p>
        </div>
      )}

      {/* Companies list */}
      {companies.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              {t('common.noData')}
            </h2>
            <p className="text-gray-500 mb-6">
              {t('companies.subtitle')}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" />
              {t('companies.addCompany')}
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-4">
          {companies.map((company) => (
            <Card key={company.id}>
              <CardBody className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Company info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Logo or placeholder */}
                    <div className="w-14 h-14 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {company.logo ? (
                        <img
                          src={company.logo}
                          alt={company.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Building2 className="w-7 h-7 text-gray-400" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {company.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {company.businessId && (
                          <span className="mr-3">
                            {t('companies.businessId')}: {company.businessId}
                          </span>
                        )}
                        {company.vatNumber && (
                          <span>{t('companies.vatNumber')}: {company.vatNumber}</span>
                        )}
                      </p>
                      <div className="mt-2 text-sm text-gray-600">
                        {company.streetAddress && (
                          <p>
                            {company.streetAddress}, {company.postalCode} {company.city}
                          </p>
                        )}
                        <p>
                          {company.email && <span className="mr-3">{company.email}</span>}
                          {company.phone && <span>{company.phone}</span>}
                        </p>
                      </div>
                      {company.bankAccounts?.length > 0 && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="font-medium">{t('companies.bankAccounts')}:</span>{' '}
                          {company.bankAccounts.map((acc, i) => acc.iban).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleEdit(company)}
                    >
                      <Pencil className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('common.edit')}</span>
                    </Button>
                    {deleteConfirm === company.id ? (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(company.id)}
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
                        onClick={() => setDeleteConfirm(company.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
