import { useState } from 'react'
import { Link } from 'react-router-dom'
import Sidebar, { MobileMenuButton } from './Sidebar'
import { useDemo } from '../../context/DemoContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isDemo, exitDemo } = useDemo()

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen flex max-w-[100vw] overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Demo banner */}
        {isDemo && (
          <div className="bg-yellow-400 text-yellow-900 text-sm font-medium px-4 py-2 flex items-center justify-center gap-4 print:hidden">
            <span>Demo-tila — max 3 laskua.</span>
            <Link to="/#pricing" onClick={exitDemo} className="underline font-bold hover:text-yellow-800">
              Tilaa lisenssi
            </Link>
          </div>
        )}

        {/* Mobile header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-200 flex items-center px-4">
          <MobileMenuButton onClick={toggleSidebar} />
          <span className="ml-3 font-bold text-lg text-gray-900">TrioLasku</span>
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-gray-200 bg-gray-50 px-4 py-3 text-center text-xs text-gray-500 print:hidden">
          <div>Kyyränkoski Tmi | Y-tunnus: 1437272-9 | Kylänpääntie 54</div>
          <div className="mt-0.5">ALV-velvollisuus rekisteröity 1.2.2026 alkaen</div>
        </footer>
      </div>
    </div>
  )
}
