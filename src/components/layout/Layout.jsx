import { useState } from 'react'
import Sidebar, { MobileMenuButton } from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen flex max-w-[100vw] overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
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
          <div className="mt-1 font-bold text-gray-600 uppercase tracking-wide">VERSIO 13.0 - FINAL CREDIT NOTE FIX</div>
        </footer>
      </div>
    </div>
  )
}
