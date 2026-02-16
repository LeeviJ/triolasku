import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  FileText,
  HelpCircle,
  Sparkles,
  Menu,
  X,
  Globe,
  Home,
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { useLicense } from '../../context/LicenseContext'

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/companies', icon: Building2, labelKey: 'nav.companies' },
  { path: '/customers', icon: Users, labelKey: 'nav.customers' },
  { path: '/products', icon: Package, labelKey: 'nav.products' },
  { path: '/invoices', icon: FileText, labelKey: 'nav.invoices' },
  { path: '/triopromote', icon: Sparkles, labelKey: 'nav.triopromote', requireTier: 'promote' },
  { path: '/guide', icon: HelpCircle, label: 'Ohjeet' },
]

export default function Sidebar({ isOpen, onToggle }) {
  const { t, language, setLanguage } = useLanguage()
  const { licenseInfo } = useLicense()

  const languages = ['fi', 'en', 'sv']
  const languageLabels = { fi: 'Suomi', en: 'English', sv: 'Svenska' }

  const cycleLanguage = () => {
    const idx = languages.indexOf(language)
    setLanguage(languages[(idx + 1) % languages.length])
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out
          lg:translate-x-0 lg:static lg:z-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo / Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-900">TrioLasku</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const locked = item.requireTier && licenseInfo?.tier !== item.requireTier
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => window.innerWidth < 1024 && onToggle()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : locked
                        ? 'text-gray-400 hover:bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label || t(item.labelKey)}</span>
                {locked && <span className="ml-auto text-xs text-purple-400">PRO</span>}
              </NavLink>
            )
          })}
        </nav>

        {/* Back to landing page */}
        <div className="p-4 border-t border-gray-200">
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>TrioTools.fi</span>
          </NavLink>
        </div>

        {/* Language switcher */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={cycleLanguage}
            className="flex items-center gap-3 w-full px-3 py-2.5 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          >
            <Globe className="w-5 h-5" />
            <span>{languageLabels[language]} → {languageLabels[languages[(languages.indexOf(language) + 1) % languages.length]]}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
    >
      <Menu className="w-6 h-6 text-gray-600" />
    </button>
  )
}
