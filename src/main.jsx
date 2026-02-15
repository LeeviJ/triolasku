import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { LicenseProvider } from './context/LicenseContext.jsx'
import { DataProvider } from './context/DataContext.jsx'
import { DemoProvider } from './context/DemoContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <DemoProvider>
          <LicenseProvider>
            <DataProvider>
              <App />
            </DataProvider>
          </LicenseProvider>
        </DemoProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
