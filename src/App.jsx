import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Invoices from './pages/Invoices'
import TrioLog from './pages/TrioLog'
import TrioPromote from './pages/TrioPromote'

function AppContent() {
  const location = useLocation()
  const isLanding = location.pathname === '/'

  if (isLanding) {
    return <LandingPage />
  }

  return (
    <Layout>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/triolog" element={<TrioLog />} />
        <Route path="/triopromote" element={<TrioPromote />} />
      </Routes>
    </Layout>
  )
}

function App() {
  return <AppContent />
}

export default App
