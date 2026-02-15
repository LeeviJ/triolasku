import { createContext, useContext, useState, useCallback } from 'react'
import { STORAGE_KEYS } from './DataContext'
import { demoCompanies, demoCustomers, demoProducts, demoInvoices } from '../data/demoData'

const DemoContext = createContext()
const DEMO_KEY = 'triolasku_demo'

export function DemoProvider({ children }) {
  const [isDemo, setIsDemo] = useState(() => sessionStorage.getItem(DEMO_KEY) === '1')

  const startDemo = useCallback(() => {
    // Save demo data to localStorage
    localStorage.setItem(STORAGE_KEYS.companies, JSON.stringify(demoCompanies))
    localStorage.setItem(STORAGE_KEYS.customers, JSON.stringify(demoCustomers))
    localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(demoProducts))
    localStorage.setItem(STORAGE_KEYS.invoices, JSON.stringify(demoInvoices))
    localStorage.setItem(STORAGE_KEYS.customerCounter, '3')
    localStorage.setItem(STORAGE_KEYS.productCounter, '3')

    sessionStorage.setItem(DEMO_KEY, '1')
    setIsDemo(true)
  }, [])

  const exitDemo = useCallback(() => {
    // Clear demo data
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key))
    sessionStorage.removeItem(DEMO_KEY)
    setIsDemo(false)
  }, [])

  return (
    <DemoContext.Provider value={{ isDemo, startDemo, exitDemo }}>
      {children}
    </DemoContext.Provider>
  )
}

export function useDemo() {
  const context = useContext(DemoContext)
  if (!context) throw new Error('useDemo must be used within DemoProvider')
  return context
}
