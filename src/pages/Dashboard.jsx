import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Package, FileText, ArrowRight, Download, Upload, Share2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData, STORAGE_KEYS } from '../context/DataContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatPrice, formatDateFI } from '../utils/formatters'

export default function Dashboard() {
  const { t } = useLanguage()
  const { companies, customers, products, invoices } = useData()
  const backupFileInputRef = useRef(null)

  const getBackupFileName = () => {
    const d = new Date()
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const yy = String(d.getFullYear()).slice(-2)
    return `triolasku_backup_${dd}${mm}${yy}.json`
  }

  const createBackupBlob = () => {
    const backup = {}
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey)
      if (data) backup[storageKey] = JSON.parse(data)
    })
    return new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  }

  const downloadBlob = (blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = getBackupFileName()
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleDownloadBackup = async () => {
    const blob = createBackupBlob()
    const fileName = getBackupFileName()
    const file = new File([blob], fileName, { type: 'application/json' })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ title: 'TrioLasku backup', files: [file] })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }
    downloadBlob(blob)
  }

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result)
        Object.entries(backup).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value))
        })
        window.location.reload()
      } catch {
        alert('Invalid backup file')
      }
    }
    reader.readAsText(file)
  }

  const stats = [
    {
      label: t('dashboard.companiesCount'),
      value: companies.length,
      max: 3,
      icon: Building2,
      color: 'bg-blue-500',
      link: '/companies',
    },
    {
      label: t('dashboard.customersCount'),
      value: customers.length,
      icon: Users,
      color: 'bg-green-500',
      link: '/customers',
    },
    {
      label: t('dashboard.productsCount'),
      value: products.length,
      icon: Package,
      color: 'bg-purple-500',
      link: '/products',
    },
    {
      label: t('dashboard.invoicesCount'),
      value: invoices.length,
      icon: FileText,
      color: 'bg-orange-500',
      link: '/invoices',
    },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          {t('dashboard.welcome')}
        </h1>
        <p className="mt-1 text-gray-500">{t('dashboard.description')}</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} to={stat.link}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardBody className="p-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}
                  >
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                    {stat.max && (
                      <span className="text-sm font-normal text-gray-400">
                        /{stat.max}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      {/* Get started section */}
      {companies.length === 0 && (
        <Card>
          <CardBody className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {t('dashboard.getStarted')}
            </h2>
            <p className="text-gray-500 mb-6">{t('dashboard.noCompanies')}</p>
            <Link to="/companies">
              <Button>
                <Building2 className="w-4 h-4" />
                {t('companies.addCompany')}
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Backup section */}
      <Card className="mb-8">
        <CardBody>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard.backup')}
          </h2>
          <div className="flex flex-wrap gap-3 mb-3">
            <Button variant="secondary" onClick={handleDownloadBackup}>
              <Share2 className="w-4 h-4" />
              {t('dashboard.downloadBackup')}
            </Button>
            <input
              ref={backupFileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreBackup}
              className="hidden"
            />
            <Button variant="secondary" onClick={() => backupFileInputRef.current?.click()}>
              <Upload className="w-4 h-4" />
              {t('dashboard.restoreBackup')}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            {t('dashboard.backupHint')}
          </p>
        </CardBody>
      </Card>

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.recentInvoices')}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('invoices.invoiceDate')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">{t('invoices.recipient')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('invoices.total')}</th>
                    <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">{t('invoices.status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...invoices]
                    .sort((a, b) => {
                      const dateCompare = (b.invoiceDate || '').localeCompare(a.invoiceDate || '')
                      if (dateCompare !== 0) return dateCompare
                      return (parseInt(b.invoiceNumber, 10) || 0) - (parseInt(a.invoiceNumber, 10) || 0)
                    })
                    .slice(0, 5)
                    .map((invoice) => {
                      const customer = customers.find((c) => c.id === invoice.customerId)
                      const statusStyles = {
                        draft: 'bg-gray-100 text-gray-700',
                        sent: 'bg-blue-100 text-blue-700',
                        paid: 'bg-green-100 text-green-700',
                        overdue: 'bg-red-100 text-red-700',
                      }
                      const statusLabels = {
                        draft: t('invoices.statusDraft'),
                        sent: t('invoices.statusSent'),
                        paid: t('invoices.statusPaid'),
                        overdue: t('invoices.statusOverdue'),
                      }
                      const status = invoice.status || 'draft'
                      return (
                        <tr key={invoice.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{formatDateFI(invoice.invoiceDate)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 hidden sm:table-cell">{customer?.name || '-'}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatPrice(invoice.totalGross)} EUR</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status] || statusStyles.draft}`}>
                              {statusLabels[status] || statusLabels.draft}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
            {invoices.length > 5 && (
              <div className="mt-4 text-center">
                <Link to="/invoices">
                  <Button variant="secondary">
                    {t('dashboard.showAll')}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  )
}
