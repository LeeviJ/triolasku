import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Companies from './pages/Companies'
import Customers from './pages/Customers'
import Products from './pages/Products'
import Invoices from './pages/Invoices'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/companies" element={<Companies />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/products" element={<Products />} />
        <Route path="/invoices" element={<Invoices />} />
      </Routes>
    </Layout>
  )
}

export default App
