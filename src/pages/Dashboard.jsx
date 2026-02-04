import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, Users, Package, FileText, ArrowRight, Download, Upload, Mail, ExternalLink, ClipboardList, Plus, Trash2, Check } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { useData, STORAGE_KEYS } from '../context/DataContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'
import { formatPrice, formatDateFI } from '../utils/formatters'
// emailBackup not needed for Gmail button - uses direct URL

export default function Dashboard() {
  const { t } = useLanguage()
  const { companies, customers, products, invoices, settings, setSettings, sendEmailBackup: sendEmail } = useData()
  const backupFileInputRef = useRef(null)
  const [emailMsg, setEmailMsg] = useState(null)

  // TrioLoki – simple todo list persisted in localStorage
  const TRIOLOKI_KEY = 'triolasku_trioloki'
  const defaultItems = [{ id: '1', text: 'Paperitulostus (käyttäjä testaa itse)', done: false }]
  const [triolokiItems, setTriolokiItems] = useState(() => {
    try {
      const saved = localStorage.getItem(TRIOLOKI_KEY)
      return saved ? JSON.parse(saved) : defaultItems
    } catch { return defaultItems }
  })
  const [triolokiInput, setTriolokiInput] = useState('')

  const saveTrioloki = (items) => {
    setTriolokiItems(items)
    localStorage.setItem(TRIOLOKI_KEY, JSON.stringify(items))
  }
  const addTriolokiItem = () => {
    const text = triolokiInput.trim()
    if (!text) return
    saveTrioloki([...triolokiItems, { id: crypto.randomUUID(), text, done: false }])
    setTriolokiInput('')
  }
  const toggleTriolokiItem = (id) => {
    saveTrioloki(triolokiItems.map(item => item.id === id ? { ...item, done: !item.done } : item))
  }
  const removeTriolokiItem = (id) => {
    saveTrioloki(triolokiItems.filter(item => item.id !== id))
  }

  const handleDownloadBackup = () => {
    // Direct file download - completely invisible, no share or popup
    const backup = {}
    Object.entries(STORAGE_KEYS).forEach(([key, storageKey]) => {
      const data = localStorage.getItem(storageKey)
      if (data) backup[storageKey] = JSON.parse(data)
    })
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'triolasku_backup.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleRestoreBackup = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input so same file can be selected again
    e.target.value = ''

    // Confirmation dialog
    const confirmed = window.confirm(
      'Oletko varma? Tämä poistaa kaikki nykyiset tiedot ja korvaa ne varmuuskopion tiedoilla.'
    )
    if (!confirmed) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const backup = JSON.parse(event.target.result)

        // Validate that it looks like a TrioLasku backup
        const validKeys = Object.values(STORAGE_KEYS)
        const backupKeys = Object.keys(backup)
        const hasValidData = backupKeys.some(key => validKeys.includes(key))

        if (!hasValidData) {
          alert('Virheellinen tiedosto. Valitse oikea .json-varmuuskopio.')
          return
        }

        // Restore data to localStorage
        Object.entries(backup).forEach(([key, value]) => {
          localStorage.setItem(key, JSON.stringify(value))
        })

        // Success message and reload
        alert('Tiedot palautettu! Sivu ladataan uudelleen...')
        window.location.reload()
      } catch {
        alert('Virheellinen tiedosto. Valitse oikea .json-varmuuskopio.')
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
              <Download className="w-4 h-4" />
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
            <Button
              variant="secondary"
              onClick={async () => {
                if (!settings.backupEmail) { setEmailMsg('Aseta ensin sähköpostiosoite.'); setTimeout(() => setEmailMsg(null), 5000); return }
                if (invoices.length === 0) { setEmailMsg('Ei laskuja lähetettäväksi.'); setTimeout(() => setEmailMsg(null), 5000); return }

                // Get latest invoice
                const latest = invoices[invoices.length - 1]
                const company = companies.find((c) => c.id === latest?.companyId)
                const invoiceWithName = { ...latest, _companyName: company?.name }

                setEmailMsg('Lähetetään...')
                try {
                  await sendEmail(settings.backupEmail, invoiceWithName, 'TrioLasku')
                  setEmailMsg('Varmuuskopio lähetetty!')
                  setTimeout(() => setEmailMsg(null), 5000)
                } catch {
                  setEmailMsg('Lähetys epäonnistui. Käytä "Lähetä Gmaililla" -nappia.')
                }
              }}
            >
              <Mail className="w-4 h-4" />
              Lähetä sähköpostiin
            </Button>
            {/* DIRECT GMAIL BUTTON */}
            <Button
              variant="secondary"
              onClick={() => {
                if (invoices.length === 0) { setEmailMsg('Ei laskuja.'); setTimeout(() => setEmailMsg(null), 5000); return }

                const latest = invoices[invoices.length - 1]

                // Build rich message with products
                const products = (latest.rows || [])
                  .filter(row => row.description)
                  .map(row => row.description + ' ' + row.quantity + ' kpl ' + row.priceNet + '€')
                  .join(', ')

                let message = 'Lasku ' + String(latest.invoiceNumber || '')
                if (latest._customerName) message += ' | Asiakas: ' + latest._customerName
                if (products) message += ' | Tuotteet: ' + products
                message += ' | Yhteensä: ' + String(latest.totalGross || '0') + ' EUR'

                const gmailUrl = 'https://mail.google.com/mail/?view=cm&fs=1&to=leevi.latvatalo@gmail.com&su=' + encodeURIComponent('Varmuuskopio') + '&body=' + encodeURIComponent(message)

                const popupWidth = 600
                const popupHeight = 700
                const left = (window.screen.width - popupWidth) / 2
                const top = (window.screen.height - popupHeight) / 2
                window.open(gmailUrl, 'GmailCompose', 'width=' + popupWidth + ',height=' + popupHeight + ',left=' + left + ',top=' + top + ',scrollbars=yes,resizable=yes')
                setEmailMsg('Gmail avattu!')
                setTimeout(() => setEmailMsg(null), 3000)
              }}
              className="bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
            >
              <ExternalLink className="w-4 h-4" />
              Lähetä Gmaililla
            </Button>
          </div>
          {emailMsg && <p className={`text-sm mb-3 ${emailMsg.includes('epäonnistui') ? 'text-orange-600' : 'text-green-600'}`}>{emailMsg}</p>}

          {/* Email backup settings */}
          <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-700">Sähköpostivarmuuskopio</h3>
            <input
              type="email"
              value={settings.backupEmail || ''}
              onChange={(e) => setSettings((prev) => ({ ...prev, backupEmail: e.target.value }))}
              placeholder="nimi@esimerkki.fi"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            />
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-gray-600">Lähetä automaattisesti kun lasku luodaan</span>
              <div
                onClick={() => setSettings((prev) => ({ ...prev, autoEmailBackup: !prev.autoEmailBackup }))}
                className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                  settings.autoEmailBackup ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    settings.autoEmailBackup ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
            <p className="text-sm text-blue-800">
              Sähköposti sisältää vain viimeisimmän laskun numeron, päiväyksen ja summan. Täysi varmuuskopiointi on tehtävä manuaalisesti &quot;Jaa varmuuskopio&quot; -toiminnolla.
            </p>
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {t('dashboard.backupHint')}
          </p>
        </CardBody>
      </Card>

      {/* TrioLoki – todo list */}
      <Card className="mb-8">
        <CardBody>
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">{t('trioloki.title')}</h2>
          </div>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={triolokiInput}
              onChange={(e) => setTriolokiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTriolokiItem()}
              placeholder={t('trioloki.placeholder')}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <button
              onClick={addTriolokiItem}
              className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {t('trioloki.add')}
            </button>
          </div>
          {triolokiItems.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">{t('common.noData')}</p>
          ) : (
            <ul className="space-y-2">
              {triolokiItems.map((item) => (
                <li key={item.id} className="flex items-center gap-3 group">
                  <button
                    onClick={() => toggleTriolokiItem(item.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      item.done ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300 hover:border-indigo-400'
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3" />}
                  </button>
                  <span className={`flex-1 text-sm ${item.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeTriolokiItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {/* Recent invoices */}
      {invoices.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('dashboard.recentInvoices')}
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400"></span> {t('invoices.statusDraft')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> {t('invoices.statusReady')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> {t('invoices.statusSent')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> {t('invoices.statusPaid')}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> {t('invoices.statusOverdue')}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{t('invoices.invoiceDate')}</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">{t('invoices.recipient')}</th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">{t('invoices.total')}</th>
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
                      const status = invoice.status || 'draft'
                      const borderColors = {
                        draft: 'border-l-gray-400',
                        ready: 'border-l-purple-500',
                        sent: 'border-l-blue-500',
                        paid: 'border-l-green-500',
                        overdue: 'border-l-red-500',
                      }
                      return (
                        <tr key={invoice.id} className={`hover:bg-gray-50 border-l-4 ${borderColors[status] || borderColors.draft}`}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{invoice.invoiceNumber}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{formatDateFI(invoice.invoiceDate)}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 hidden sm:table-cell">{customer?.name || invoice._customerName || '-'}</td>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">{formatPrice(invoice.totalGross)} EUR</td>
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
