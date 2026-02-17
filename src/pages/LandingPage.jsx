import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  FileText, Send, ArrowRight, Play, Sparkles, Check,
  Users, Shield, Menu, X, Building2, MapPin, Wand2,
} from 'lucide-react'
import { useDemo } from '../context/DemoContext'

/* ── Navbar ───────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`sticky top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200' : 'bg-white/60 backdrop-blur-md border-b border-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight flex items-center gap-1.5">
          <FileText className="w-5 h-5 text-green-600" />
          <span className="text-green-600">Trio</span>Tools
        </span>

        {/* Desktop links */}
        <div className="hidden sm:flex gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-gray-900 transition-colors">Ominaisuudet</a>
          <a href="#pricing" className="hover:text-gray-900 transition-colors">Hinnoittelu</a>
          <a href="#contact" className="hover:text-gray-900 transition-colors">Yhteystiedot</a>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/invoices" className="hidden sm:inline-flex bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Avaa sovellus
          </Link>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="sm:hidden p-2 hover:bg-gray-100 rounded-lg">
            {menuOpen ? <X className="w-5 h-5 text-gray-600" /> : <Menu className="w-5 h-5 text-gray-600" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden overflow-hidden transition-all duration-300 ${menuOpen ? 'max-h-64' : 'max-h-0'}`}>
        <div className="px-6 pb-4 space-y-2">
          <a href="#features" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Ominaisuudet</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Hinnoittelu</a>
          <a href="#contact" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Yhteystiedot</a>
          <Link to="/invoices" onClick={() => setMenuOpen(false)} className="block py-2 text-sm font-semibold text-green-600">Avaa sovellus</Link>
        </div>
      </div>
    </nav>
  )
}

/* ── Hero ──────────────────────────────────────────────── */
function Hero() {
  const { startDemo } = useDemo()
  const navigate = useNavigate()

  const handleDemo = () => {
    startDemo()
    navigate('/dashboard')
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-20 px-6">
      {/* Background decorations */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-green-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
      <div className="absolute -top-16 right-0 w-72 h-72 bg-blue-50 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-48 bg-gradient-to-t from-green-50/40 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-4xl mx-auto text-center space-y-6">
        <div className="animate-fade-in-up inline-block bg-green-50 text-green-700 border border-green-200 text-sm font-semibold px-4 py-1.5 rounded-full mb-2">
          Laskutusohjelma pienyrittäjille
        </div>
        <h1 className="animate-fade-in-up-delay-1 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Laskuta{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">ammattimaisesti</span>,{' '}
          aloita heti
        </h1>
        <p className="animate-fade-in-up-delay-2 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Luo viivakoodilliset PDF-laskut, hallitse asiakkaita ja tuotteita — kaikki yhdessä paikassa.
        </p>
        <div className="animate-fade-in-up-delay-3 flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/invoices"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-all text-base inline-flex items-center justify-center gap-2 shadow-lg shadow-green-600/20 hover:shadow-xl hover:shadow-green-600/30"
          >
            <FileText className="w-5 h-5" />
            Avaa TrioLasku
          </Link>
          <button
            onClick={handleDemo}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-all text-base inline-flex items-center justify-center gap-2 hover:shadow-md"
          >
            <Play className="w-5 h-5" />
            Kokeile demoa
          </button>
        </div>

        {/* Trust signals */}
        <div className="animate-fade-in-up-delay-3 flex flex-wrap justify-center gap-x-6 gap-y-1 pt-4 text-xs text-gray-400">
          <span>Ei luottokorttia tarvita</span>
          <span className="hidden sm:inline">·</span>
          <span>Toimii selaimessa</span>
          <span className="hidden sm:inline">·</span>
          <span>Suomalainen palvelu</span>
        </div>
      </div>
    </section>
  )
}

/* ── Features ─────────────────────────────────────────── */
const features = [
  {
    icon: FileText,
    color: 'bg-blue-100 text-blue-600',
    title: 'PDF-laskut viivakoodilla',
    desc: 'Luo ammattimaisia laskuja viivakoodilla ja viitenumerolla. Tukee uutta 13,5 % ALV-kantaa.',
  },
  {
    icon: Users,
    color: 'bg-green-100 text-green-600',
    title: 'Asiakas- ja tuoterekisteri',
    desc: 'Tallenna asiakkaat ja tuotteet kertaalleen. Lisää ne laskulle yhdellä klikkauksella.',
  },
  {
    icon: Shield,
    color: 'bg-amber-100 text-amber-600',
    title: 'Varmuuskopiointi & hyvityslaskut',
    desc: 'Varmuuskopiot, hyvityslaskut ja kuitit. TrioLog-ajonseuranta sisältyy.',
  },
]

function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kaikki mitä tarvitset laskutukseen</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Yksinkertainen työkalu joka hoitaa laskutuksen puolestasi.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-white border border-gray-100 rounded-2xl p-6 space-y-4 hover:shadow-md hover:border-gray-200 transition-all duration-200">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${f.color}`}>
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">Ei tue e-laskua (Finvoice) — laskut luodaan PDF-muodossa.</p>
      </div>
    </section>
  )
}

/* ── TrioPromote Section ──────────────────────────────── */
function TrioPromoteSection() {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left — Text */}
        <div className="space-y-5">
          <div className="inline-block bg-purple-100 text-purple-700 text-sm font-semibold px-3 py-1 rounded-full">
            Uusi: TrioPromote
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">AI-markkinointi yrityksellesi</h2>
          <p className="text-gray-500 leading-relaxed">
            TrioPromote luo ammattimaiset markkinointisisällöt tekoälyllä. Valitse kanava, säädä viesti ja jaa.
          </p>
          <ul className="space-y-3">
            {['Facebook, Instagram, LinkedIn & lisää', 'Google Ads ja sähköpostikampanjat', 'Blogi-sisällöntuotanto'].map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                <Check className="w-4 h-4 text-purple-500 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <a href="#pricing" className="inline-flex items-center gap-2 text-purple-600 font-semibold text-sm hover:underline mt-2">
            Katso hinnoittelu <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* Right — Mockup */}
        <div className="flex justify-center">
          <div className="w-full max-w-sm bg-white border border-purple-200 rounded-2xl shadow-lg shadow-purple-100/50 p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-purple-500" />
              <span className="text-sm font-semibold text-gray-800">TrioPromote</span>
            </div>
            {/* Simulated channels */}
            <div className="space-y-3">
              {[
                { label: 'Facebook', color: 'bg-blue-600' },
                { label: 'Instagram', color: 'bg-pink-500' },
                { label: 'LinkedIn', color: 'bg-blue-800' },
              ].map((ch) => (
                <div key={ch.label} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${ch.color}`} />
                    <span className="text-xs font-medium text-gray-500">{ch.label}</span>
                  </div>
                  <div className="space-y-1.5 pl-4">
                    <div className="h-2.5 bg-gray-100 rounded-full w-full" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-4/5" />
                    <div className="h-2.5 bg-gray-100 rounded-full w-3/5" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-purple-500 font-medium">
                <Sparkles className="w-3.5 h-3.5" />
                AI-generoitu
              </div>
              <div className="flex gap-2">
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-1 rounded">Kopioi</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ───────────────────────────────────────────── */
const standardFeatures = ['PDF-laskut viivakoodilla', 'Asiakas- ja tuoterekisteri', 'Hyvityslaskut & kuitit', 'TrioLog ajonseuranta', 'Varmuuskopiointi']
const promoteFeatures = ['Kaikki TrioLasku-ominaisuudet', 'TrioPromote AI-markkinointi', 'Facebook, Instagram, LinkedIn...', 'Google Ads & sähköposti', 'Blogi-sisällöntuotanto']

const pricingPlans = [
  { id: '1kk', name: '1 kuukausi', period: '/ kk' },
  { id: '6kk', name: '6 kuukautta', period: '/ 6 kk' },
  { id: '12kk', name: '12 kuukautta', period: '/ vuosi', badge: 'Suosituin' },
]

const tierPrices = {
  standard: { '1kk': 10, '6kk': 50, '12kk': 90 },
  promote: { '1kk': 15, '6kk': 80, '12kk': 150 },
}

const monthlyPrices = {
  standard: { '1kk': '10', '6kk': '8,33', '12kk': '7,50' },
  promote: { '1kk': '15', '6kk': '13,33', '12kk': '12,50' },
}

const tierPriceIds = {
  standard: {
    '1kk': import.meta.env.VITE_STRIPE_PRICE_ID_1MO,
    '6kk': import.meta.env.VITE_STRIPE_PRICE_ID_6MO,
    '12kk': import.meta.env.VITE_STRIPE_PRICE_ID_12MO,
  },
  promote: {
    '1kk': import.meta.env.VITE_STRIPE_PRICE_ID_1MO_PROMOTE,
    '6kk': import.meta.env.VITE_STRIPE_PRICE_ID_6MO_PROMOTE,
    '12kk': import.meta.env.VITE_STRIPE_PRICE_ID_12MO_PROMOTE,
  },
}

function Pricing() {
  const [loading, setLoading] = useState(null)
  const [selectedPlan, setSelectedPlan] = useState('12kk')

  const handleCheckout = async (tier) => {
    const priceId = tierPriceIds[tier][selectedPlan]
    setLoading(priceId)
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert('Virhe: ' + (data.error || 'Tuntematon virhe'))
        setLoading(null)
      }
    } catch {
      alert('Yhteysvirhe. Yritä uudelleen.')
      setLoading(null)
    }
  }

  const planInfo = pricingPlans.find((p) => p.id === selectedPlan)

  return (
    <section id="pricing" className="py-20 px-6 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Hinnoittelu</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Valitse sinulle sopiva tilaus. Kaikki hinnat sisältävät ALV 25,5 %.</p>
        </div>

        {/* Plan duration selector — segmented control */}
        <div className="flex justify-center mb-12">
          <div className="bg-gray-100 p-1 rounded-2xl inline-flex gap-1">
            {pricingPlans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all relative ${
                  selectedPlan === plan.id
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {plan.name}
                {plan.badge && (
                  <span className="absolute -top-2.5 -right-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{plan.badge}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Two tier cards */}
        <div className="grid sm:grid-cols-2 gap-6 max-w-3xl mx-auto mb-8">
          {/* Standard */}
          <div className="rounded-2xl p-8 space-y-5 bg-white border border-gray-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-bold text-gray-900">TrioLasku</h3>
              </div>
              <p className="text-sm text-gray-500 mt-1">Laskutuksen perustyökalut</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-gray-900">{tierPrices.standard[selectedPlan]}</span>
                <span className="text-base font-medium text-gray-400">€</span>
                <span className="text-sm text-gray-400 ml-1">{planInfo.period}</span>
              </div>
              <p className="text-sm text-green-600 font-medium mt-1">{monthlyPrices.standard[selectedPlan]} €/kk</p>
            </div>
            <ul className="space-y-2.5">
              {standardFeatures.map((f) => (
                <li key={f} className="text-sm text-gray-600 flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-green-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('standard')}
              disabled={!!loading}
              className="block w-full text-center font-semibold py-3 rounded-xl transition-all disabled:opacity-60 bg-green-600 text-white hover:bg-green-700 hover:shadow-md"
            >
              {loading === tierPriceIds.standard[selectedPlan] ? 'Ohjataan maksuun...' : 'Tilaa nyt'}
            </button>
          </div>

          {/* Promote */}
          <div className="rounded-2xl p-8 space-y-5 bg-gradient-to-br from-purple-600 to-indigo-600 text-white shadow-xl shadow-purple-600/20 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">Suosituin</div>
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-200" />
                <h3 className="text-lg font-bold">TrioLasku + Promote</h3>
              </div>
              <p className="text-sm text-purple-200 mt-1">Laskutus + AI-markkinointi</p>
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{tierPrices.promote[selectedPlan]}</span>
                <span className="text-base font-medium text-purple-200">€</span>
                <span className="text-sm text-purple-200 ml-1">{planInfo.period}</span>
              </div>
              <p className="text-sm text-purple-100 font-medium mt-1">{monthlyPrices.promote[selectedPlan]} €/kk</p>
            </div>
            <ul className="space-y-2.5">
              {promoteFeatures.map((f) => (
                <li key={f} className="text-sm text-purple-100 flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-purple-200 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout('promote')}
              disabled={!!loading}
              className="block w-full text-center font-semibold py-3 rounded-xl transition-all disabled:opacity-60 bg-white text-purple-700 hover:bg-purple-50 hover:shadow-md"
            >
              {loading === tierPriceIds.promote[selectedPlan] ? 'Ohjataan maksuun...' : 'Tilaa nyt'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Contact ───────────────────────────────────────────── */
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/.netlify/functions/send-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Viestin lähetys epäonnistui')
      }
    } catch {
      setError('Yhteysvirhe. Yritä uudelleen.')
    } finally { setLoading(false) }
  }

  if (submitted) {
    return (
      <section id="contact" className="py-20 px-6 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold">Viesti lähetetty!</h2>
        <p className="text-gray-500 mt-2">Vastaamme 24 tunnin sisällä.</p>
      </section>
    )
  }

  return (
    <section id="contact" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">Ota yhteyttä</h2>
          <p className="text-gray-500">Kysyttävää palvelusta? Autamme mielellään.</p>
        </div>
        <div className="grid sm:grid-cols-5 gap-8">
          <form onSubmit={handleSubmit} className="sm:col-span-3 bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}
            <input name="name" type="text" required value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Nimi" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <input name="email" type="email" required value={form.email} onChange={(e) => setForm(p => ({ ...p, email: e.target.value }))} placeholder="Sähköposti" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <textarea name="message" required rows={4} value={form.message} onChange={(e) => setForm(p => ({ ...p, message: e.target.value }))} placeholder="Viesti" className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" />
            <button type="submit" disabled={loading} className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors">
              {loading ? 'Lähetetään...' : 'Lähetä viesti'}
            </button>
          </form>
          <div className="sm:col-span-2 flex flex-col justify-center space-y-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Kyyränkoski Tmi</h3>
            </div>
            <p className="text-sm text-gray-500">Y-tunnus: 1437272-9</p>
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <p className="text-sm text-gray-500">Kylänpääntie 54, 61450 Kylänpää</p>
            </div>
            <p className="text-sm text-gray-500">ALV-velvollisuus rekisteröity 1.2.2026 alkaen</p>
            <a href="mailto:trio.tools6@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 px-3 py-2 -mx-3 rounded-lg transition-colors">
              <Send className="w-4 h-4" />
              trio.tools6@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Footer ───────────────────────────────────────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid sm:grid-cols-3 gap-8">
          {/* Brand */}
          <div className="space-y-3">
            <span className="text-lg font-bold text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-green-400" />
              <span className="text-green-400">Trio</span>Tools
            </span>
            <p className="text-sm leading-relaxed">Laskutus- ja markkinointityökalut suomalaiselle pienyrittäjälle.</p>
          </div>

          {/* Products */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">Tuotteet</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/invoices" className="hover:text-white transition-colors">TrioLasku</Link></li>
              <li><Link to="/triopromote" className="hover:text-white transition-colors">TrioPromote</Link></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Hinnoittelu</a></li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-300">Yhteystiedot</h4>
            <ul className="space-y-2 text-sm">
              <li>trio.tools6@gmail.com</li>
              <li>Kyyränkoski Tmi (1437272-9)</li>
              <li>Kylänpääntie 54, 61450 Kylänpää</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 text-center text-sm text-gray-500">
          &copy; 2026 Kyyränkoski Tmi. Kaikki oikeudet pidätetään.
        </div>
      </div>
    </footer>
  )
}

/* ── Main Landing Page ─────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar />
      <Hero />
      <Features />
      <TrioPromoteSection />
      <Pricing />
      <Contact />
      <Footer />
    </div>
  )
}
