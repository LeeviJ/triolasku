import { Link } from 'react-router-dom'
import { Building2, Users, Package, FileText, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData } from '../context/DataContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

export default function Dashboard() {
  const { t } = useLanguage()
  const { companies, customers, products, invoices } = useData()

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

      {/* Recent invoices placeholder */}
      {invoices.length > 0 && (
        <Card>
          <CardBody>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard.recentInvoices')}
            </h2>
            <div className="text-gray-500 text-sm">
              {/* Invoice list will be implemented later */}
              {t('common.noData')}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
