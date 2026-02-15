const DEMO_COMPANY_ID = 'demo-company-001'
const DEMO_CUSTOMER_IDS = ['demo-customer-001', 'demo-customer-002', 'demo-customer-003']
const DEMO_PRODUCT_IDS = ['demo-product-001', 'demo-product-002', 'demo-product-003']
const DEMO_INVOICE_IDS = ['demo-invoice-001', 'demo-invoice-002']

const today = new Date().toISOString().split('T')[0]
const dueDate = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]

export const demoCompanies = [
  {
    id: DEMO_COMPANY_ID,
    name: 'Demo Oy',
    businessId: '1234567-8',
    vatNumber: 'FI12345678',
    streetAddress: 'Esimerkkikatu 1',
    postalCode: '00100',
    city: 'Helsinki',
    phone: '040 123 4567',
    email: 'info@demo.fi',
    logo: '',
    bankAccounts: [{ iban: 'FI21 1234 5600 0007 85', bic: 'NDEAFIHH', bank: 'Nordea' }],
    vatRates: [25.5, 14, 13.5, 10, 0],
    startNumber: 1001,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const demoCustomers = [
  {
    id: DEMO_CUSTOMER_IDS[0],
    customerNumber: 1,
    name: 'Asiakas Oy',
    contactPerson: 'Matti Meikäläinen',
    businessId: '2345678-9',
    vatNumber: 'FI23456789',
    address: 'Asiakaskuja 5, 00200 Espoo',
    phone: '050 234 5678',
    email: 'matti@asiakas.fi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_CUSTOMER_IDS[1],
    customerNumber: 2,
    name: 'Firma Ab',
    contactPerson: 'Anna Virtanen',
    businessId: '3456789-0',
    vatNumber: 'FI34567890',
    address: 'Firmatie 12, 33100 Tampere',
    phone: '040 345 6789',
    email: 'anna@firma.fi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_CUSTOMER_IDS[2],
    customerNumber: 3,
    name: 'Yhdistys Ry',
    contactPerson: 'Liisa Korhonen',
    businessId: '',
    vatNumber: '',
    address: 'Yhdistyskatu 3, 20100 Turku',
    phone: '045 456 7890',
    email: 'liisa@yhdistys.fi',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const demoProducts = [
  {
    id: DEMO_PRODUCT_IDS[0],
    productNumber: 1,
    name: 'Konsultointi',
    description: 'Asiantuntijapalvelut',
    priceNet: 95,
    priceGross: 119.23,
    vatRate: 25.5,
    unit: 'h',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_PRODUCT_IDS[1],
    productNumber: 2,
    name: 'Web-kehitys',
    description: 'Verkkosivujen suunnittelu ja toteutus',
    priceNet: 85,
    priceGross: 106.68,
    vatRate: 25.5,
    unit: 'h',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_PRODUCT_IDS[2],
    productNumber: 3,
    name: 'Koulutuspäivä',
    description: 'Ryhmäkoulutus, max 10 henkilöä',
    priceNet: 750,
    priceGross: 941.25,
    vatRate: 25.5,
    unit: 'pv',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const demoInvoices = [
  {
    id: DEMO_INVOICE_IDS[0],
    invoiceNumber: 1001,
    companyId: DEMO_COMPANY_ID,
    customerId: DEMO_CUSTOMER_IDS[0],
    invoiceDate: today,
    dueDate: dueDate,
    status: 'sent',
    paymentMethod: 'bank',
    rows: [
      { productId: DEMO_PRODUCT_IDS[0], name: 'Konsultointi', description: 'Projektin suunnittelu', quantity: 8, unit: 'h', priceNet: 95, vatRate: 25.5 },
      { productId: DEMO_PRODUCT_IDS[1], name: 'Web-kehitys', description: 'Etusivun toteutus', quantity: 16, unit: 'h', priceNet: 85, vatRate: 25.5 },
    ],
    totalNet: 2120,
    totalVat: 540.6,
    totalGross: 2660.6,
    _customerName: 'Asiakas Oy',
    _companyName: 'Demo Oy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: DEMO_INVOICE_IDS[1],
    invoiceNumber: 1002,
    companyId: DEMO_COMPANY_ID,
    customerId: DEMO_CUSTOMER_IDS[1],
    invoiceDate: today,
    dueDate: dueDate,
    status: 'draft',
    paymentMethod: 'bank',
    rows: [
      { productId: DEMO_PRODUCT_IDS[2], name: 'Koulutuspäivä', description: 'React-koulutus', quantity: 2, unit: 'pv', priceNet: 750, vatRate: 25.5 },
    ],
    totalNet: 1500,
    totalVat: 382.5,
    totalGross: 1882.5,
    _customerName: 'Firma Ab',
    _companyName: 'Demo Oy',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const DEMO_MAX_INVOICES = 3
