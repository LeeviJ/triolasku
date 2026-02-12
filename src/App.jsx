import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Invoices from './pages/Invoices'
import Guide from './pages/Guide'

function AppLayout({ children }) {
  return <Layout>{children}</Layout>
}

function App() {
  return (
    <Routes>
      {/* Landing page — only exact "/" */}
      <Route path="/" element={<LandingPage />} />

      {/* App pages — each wrapped in Layout */}
      <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
      <Route path="/companies" element={<AppLayout><Companies /></AppLayout>} />
      <Route path="/customers" element={<AppLayout><Customers /></AppLayout>} />
      <Route path="/products" element={<AppLayout><Products /></AppLayout>} />
      <Route path="/invoices" element={<AppLayout><Invoices /></AppLayout>} />
      <Route path="/guide" element={<AppLayout><Guide /></AppLayout>} />
    </Routes>
  )
}

export default App
