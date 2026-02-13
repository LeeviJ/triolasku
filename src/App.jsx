import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LicenseGate from './components/LicenseGate'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Invoices from './pages/Invoices'
import Guide from './pages/Guide'

function ProtectedLayout({ children }) {
  return (
    <LicenseGate>
      <Layout>{children}</Layout>
    </LicenseGate>
  )
}

function App() {
  return (
    <Routes>
      {/* Landing page — only exact "/" */}
      <Route path="/" element={<LandingPage />} />

      {/* App pages — protected by license + wrapped in Layout */}
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/companies" element={<ProtectedLayout><Companies /></ProtectedLayout>} />
      <Route path="/customers" element={<ProtectedLayout><Customers /></ProtectedLayout>} />
      <Route path="/products" element={<ProtectedLayout><Products /></ProtectedLayout>} />
      <Route path="/invoices" element={<ProtectedLayout><Invoices /></ProtectedLayout>} />
      <Route path="/guide" element={<ProtectedLayout><Guide /></ProtectedLayout>} />
    </Routes>
  )
}

export default App
