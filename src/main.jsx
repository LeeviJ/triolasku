import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { DataProvider } from './context/DataContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <LanguageProvider>
        <DataProvider>
          <App />
        </DataProvider>
      </LanguageProvider>
    </BrowserRouter>
  </StrictMode>,
)
