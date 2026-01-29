import { useState } from 'react'
import Sidebar, { MobileMenuButton } from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)

  return (
    <div className="min-h-screen flex">
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
      </div>
    </div>
  )
}
