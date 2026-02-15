import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { sendEmailBackup } from '../utils/emailBackup'
import { useDemo } from './DemoContext'
import { DEMO_MAX_INVOICES } from '../data/demoData'

const DataContext = createContext()

export const STORAGE_KEYS = {
  companies: 'triolasku_companies',
  customers: 'triolasku_customers',
  products: 'triolasku_products',
  invoices: 'triolasku_invoices',
  customerCounter: 'triolasku_customer_counter',
  productCounter: 'triolasku_product_counter',
  invoiceCounter: 'triolasku_invoice_counter',
  vatRates: 'triolasku_vat_rates',
  units: 'triolasku_units',
  settings: 'triolasku_settings',
}

const DEFAULT_SETTINGS = {
  backupEmail: '',
  autoEmailBackup: false,
}

const MAX_COMPANIES = 3

// Default VAT rates for Finland (supports two decimals)
const DEFAULT_VAT_RATES = [25.5, 14, 13.5, 10, 0]

// Default units
const DEFAULT_UNITS = [
  { id: 'h', name: 'tunti', nameEn: 'hour' },
  { id: 'kpl', name: 'kpl', nameEn: 'pcs' },
  { id: 'kg', name: 'kg', nameEn: 'kg' },
  { id: 'l', name: 'l', nameEn: 'l' },
  { id: 'm', name: 'm', nameEn: 'm' },
  { id: 'pv', name: 'päivä', nameEn: 'day' },
]

const loadFromStorage = (key, defaultValue = []) => {
  try {
    const saved = localStorage.getItem(key)
    return saved ? JSON.parse(saved) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

export function DataProvider({ children }) {
  const { isDemo } = useDemo()
  const [companies, setCompanies] = useState(() =>
    loadFromStorage(STORAGE_KEYS.companies)
  )
  const [customers, setCustomers] = useState(() =>
    loadFromStorage(STORAGE_KEYS.customers)
  )
  const [products, setProducts] = useState(() =>
    loadFromStorage(STORAGE_KEYS.products)
  )
  const [invoices, setInvoices] = useState(() =>
    loadFromStorage(STORAGE_KEYS.invoices)
  )
  const [vatRates, setVatRates] = useState(() =>
    loadFromStorage(STORAGE_KEYS.vatRates, DEFAULT_VAT_RATES)
  )
  const [units, setUnits] = useState(() =>
    loadFromStorage(STORAGE_KEYS.units, DEFAULT_UNITS)
  )
  const [settings, setSettings] = useState(() =>
    loadFromStorage(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  )
  const prevInvoiceLen = useRef(invoices.length)

  // Persist to localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.companies, companies)
  }, [companies])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.customers, customers)
  }, [customers])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.products, products)
  }, [products])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.invoices, invoices)
  }, [invoices])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.vatRates, vatRates)
  }, [vatRates])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.units, units)
  }, [units])

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.settings, settings)
  }, [settings])

  // Auto email backup when new invoice is added (send only the latest invoice)
  useEffect(() => {
    if (settings.autoEmailBackup && settings.backupEmail && invoices.length > prevInvoiceLen.current) {
      const latest = invoices[invoices.length - 1]
      const customer = customers.find((c) => c.id === latest?.customerId)
      const company = companies.find((c) => c.id === latest?.companyId)
      sendEmailBackup(settings.backupEmail, { ...latest, _customerName: customer?.name, _companyName: company?.name }, 'TrioLasku').catch(() => {})
    }
    prevInvoiceLen.current = invoices.length
  }, [invoices, settings.autoEmailBackup, settings.backupEmail])

  // VAT rate operations
  const addVatRate = (rate) => {
    const roundedRate = Math.round(parseFloat(rate) * 100) / 100
    if (!vatRates.includes(roundedRate)) {
      setVatRates((prev) => [...prev, roundedRate].sort((a, b) => b - a))
      return { success: true }
    }
    return { success: false, error: 'rate_exists' }
  }

  const removeVatRate = (rate) => {
    setVatRates((prev) => prev.filter((r) => r !== rate))
    return { success: true }
  }

  // Unit operations
  const addUnit = (unit) => {
    const newUnit = {
      id: unit.id || crypto.randomUUID(),
      name: unit.name,
      nameEn: unit.nameEn || unit.name,
    }
    if (!units.find((u) => u.id === newUnit.id || u.name === newUnit.name)) {
      setUnits((prev) => [...prev, newUnit])
      return { success: true, unit: newUnit }
    }
    return { success: false, error: 'unit_exists' }
  }

  const removeUnit = (unitId) => {
    setUnits((prev) => prev.filter((u) => u.id !== unitId))
    return { success: true }
  }

  // Company operations
  const addCompany = (company) => {
    if (companies.length >= MAX_COMPANIES) {
      return { success: false, error: 'max_companies_reached' }
    }
    const newCompany = {
      ...company,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      vatRates: company.vatRates || DEFAULT_VAT_RATES,
    }
    setCompanies((prev) => [...prev, newCompany])
    return { success: true, company: newCompany }
  }

  const updateCompany = (id, updates) => {
    setCompanies((prev) =>
      prev.map((company) =>
        company.id === id
          ? { ...company, ...updates, updatedAt: new Date().toISOString() }
          : company
      )
    )
    return { success: true }
  }

  const deleteCompany = (id) => {
    setCompanies((prev) => prev.filter((company) => company.id !== id))
    return { success: true }
  }

  const getCompany = (id) => {
    return companies.find((company) => company.id === id)
  }

  // Customer operations
  const getNextCustomerNumber = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.customerCounter)
    const currentNumber = stored ? parseInt(stored, 10) : 0
    const nextNumber = currentNumber + 1
    localStorage.setItem(STORAGE_KEYS.customerCounter, nextNumber.toString())
    return nextNumber
  }

  const addCustomer = (customer) => {
    const customerNumber = getNextCustomerNumber()
    const newCustomer = {
      ...customer,
      id: crypto.randomUUID(),
      customerNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setCustomers((prev) => [...prev, newCustomer])
    return { success: true, customer: newCustomer }
  }

  const updateCustomer = (id, updates) => {
    setCustomers((prev) =>
      prev.map((customer) =>
        customer.id === id
          ? { ...customer, ...updates, updatedAt: new Date().toISOString() }
          : customer
      )
    )
    return { success: true }
  }

  const deleteCustomer = (id) => {
    setCustomers((prev) => prev.filter((customer) => customer.id !== id))
    return { success: true }
  }

  // Product operations
  const getNextProductNumber = () => {
    const stored = localStorage.getItem(STORAGE_KEYS.productCounter)
    const currentNumber = stored ? parseInt(stored, 10) : 0
    const nextNumber = currentNumber + 1
    localStorage.setItem(STORAGE_KEYS.productCounter, nextNumber.toString())
    return nextNumber
  }

  const addProduct = (product) => {
    const productNumber = product.productNumber || getNextProductNumber()
    const newProduct = {
      ...product,
      id: crypto.randomUUID(),
      productNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setProducts((prev) => [...prev, newProduct])
    return { success: true, product: newProduct }
  }

  const updateProduct = (id, updates) => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, ...updates, updatedAt: new Date().toISOString() }
          : product
      )
    )
    return { success: true }
  }

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id))
    return { success: true }
  }

  // Invoice operations (per-company numbering based on saved invoices)
  const getNextInvoiceNumberForCompany = (companyId) => {
    if (!companyId) return 1
    const company = companies.find((c) => c.id === companyId)
    const startNumber = parseInt(company?.startNumber, 10) || 1
    const companyInvoices = invoices.filter((inv) => inv.companyId === companyId)
    if (companyInvoices.length === 0) return startNumber
    const maxNumber = Math.max(...companyInvoices.map((inv) => parseInt(inv.invoiceNumber, 10) || 0))
    return Math.max(maxNumber + 1, startNumber)
  }

  const addInvoice = (invoice) => {
    if (isDemo && invoices.length >= DEMO_MAX_INVOICES) {
      return { success: false, error: 'demo_invoice_limit' }
    }
    const invoiceNumber = invoice.invoiceNumber || getNextInvoiceNumberForCompany(invoice.companyId)
    const newInvoice = {
      ...invoice,
      id: crypto.randomUUID(),
      invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setInvoices((prev) => [...prev, newInvoice])
    return { success: true, invoice: newInvoice }
  }

  const updateInvoice = (id, updates) => {
    setInvoices((prev) =>
      prev.map((invoice) =>
        invoice.id === id
          ? { ...invoice, ...updates, updatedAt: new Date().toISOString() }
          : invoice
      )
    )
    return { success: true }
  }

  const duplicateInvoice = (invoice) => {
    const today = new Date().toISOString().split('T')[0]
    const invoiceNumber = getNextInvoiceNumberForCompany(invoice.companyId)
    const newInvoice = {
      ...invoice,
      id: crypto.randomUUID(),
      invoiceNumber,
      invoiceDate: today,
      dueDate: '',
      status: 'draft',
      rows: (invoice.rows || []).map(row => ({ ...row })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setInvoices((prev) => [...prev, newInvoice])
    return { success: true, invoice: newInvoice }
  }


  const deleteInvoice = (id) => {
    setInvoices((prev) => prev.filter((invoice) => invoice.id !== id))
    return { success: true }
  }

  const value = {
    // Data
    companies,
    customers,
    products,
    invoices,
    vatRates,
    units,
    // Constants
    MAX_COMPANIES,
    DEFAULT_VAT_RATES,
    DEFAULT_UNITS,
    // VAT rate operations
    addVatRate,
    removeVatRate,
    // Unit operations
    addUnit,
    removeUnit,
    // Company operations
    addCompany,
    updateCompany,
    deleteCompany,
    getCompany,
    // Customer operations
    addCustomer,
    updateCustomer,
    deleteCustomer,
    // Product operations
    addProduct,
    updateProduct,
    deleteProduct,
    // Invoice operations
    addInvoice,
    updateInvoice,
    deleteInvoice,
    duplicateInvoice,
    getNextInvoiceNumberForCompany,
    // Demo
    isDemo,
    DEMO_MAX_INVOICES,
    // Settings & email backup
    settings,
    setSettings,
    sendEmailBackup,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within a DataProvider')
  }
  return context
}
