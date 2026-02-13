import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LicenseContext = createContext()
const STORAGE_KEY = 'triolasku_license_key'

export function LicenseProvider({ children }) {
  const [licenseKey, setLicenseKey] = useState(() => localStorage.getItem(STORAGE_KEY) || '')
  const [licenseStatus, setLicenseStatus] = useState('checking') // 'checking' | 'valid' | 'invalid' | 'expired' | 'none'
  const [licenseInfo, setLicenseInfo] = useState(null)

  const validateLicense = useCallback(async (key) => {
    if (!key) {
      setLicenseStatus('none')
      return false
    }
    setLicenseStatus('checking')
    try {
      const res = await fetch('/.netlify/functions/validate-license', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey: key }),
      })
      const data = await res.json()
      if (data.valid) {
        setLicenseStatus('valid')
        setLicenseInfo(data)
        return true
      } else {
        setLicenseStatus(data.error === 'expired' ? 'expired' : 'invalid')
        setLicenseInfo(null)
        return false
      }
    } catch {
      // If validation fails (e.g. network error), allow offline use with cached key
      setLicenseStatus('valid')
      return true
    }
  }, [])

  useEffect(() => {
    validateLicense(licenseKey)
  }, [licenseKey, validateLicense])

  const activate = async (key) => {
    const formatted = key.trim().toUpperCase()
    const valid = await validateLicense(formatted)
    if (valid) {
      localStorage.setItem(STORAGE_KEY, formatted)
      setLicenseKey(formatted)
    }
    return valid
  }

  const deactivate = () => {
    localStorage.removeItem(STORAGE_KEY)
    setLicenseKey('')
    setLicenseStatus('none')
    setLicenseInfo(null)
  }

  return (
    <LicenseContext.Provider value={{ licenseKey, licenseStatus, licenseInfo, activate, deactivate }}>
      {children}
    </LicenseContext.Provider>
  )
}

export function useLicense() {
  const context = useContext(LicenseContext)
  if (!context) throw new Error('useLicense must be used within LicenseProvider')
  return context
}
