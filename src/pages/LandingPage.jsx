import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FileText, Send, ArrowRight, Play } from 'lucide-react'
import { useDemo } from '../context/DemoContext'

/* ── Hero ──────────────────────────────────────────────── */
function Hero() {
  const { startDemo } = useDemo()
  const navigate = useNavigate()

  const handleDemo = () => {
    startDemo()
    navigate('/dashboard')
  }

  return (
    <section className="pt-24 pb-10 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-2">
          Laskutusohjelma pienyrittäjille
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
          Laskuta{' '}
          <span className="text-green-600 break-normal">ammattimaisesti</span>,{' '}
          aloita heti
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          TrioLasku — laskutusohjelma suomalaiselle pienyrittäjälle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/invoices"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Avaa TrioLasku
          </Link>
          <button
            onClick={handleDemo}
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base inline-flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            Kokeile demoa
          </button>
        </div>
      </div>
    </section>
  )
}

/* ── TrioLasku ─────────────────────────────────────────── */
function TrioLaskuSection() {
  const features = ['PDF-laskut sekunneissa', 'Uusi 13,5 % ALV-tuki', 'Asiakas- ja tuoterekisteri', 'Hyvityslaskut', 'Varmuuskopiointi', 'Toimii kaikilla laitteilla']

  return (
    <section id="triolasku" className="py-10 px-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">TrioLasku</h2>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            PDF-laskut viivakoodilla ja viitenumerolla. Asiakas- ja tuoterekisteri, ALV-erittely, hyvityslaskut.
          </p>
          <ul className="space-y-2">
            {features.map((f) => (
              <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                {f}
              </li>
            ))}
          </ul>
          <p className="text-sm text-red-400">Ei tue e-laskua (Finvoice) — laskut luodaan PDF-muodossa.</p>
          <Link
            to="/invoices"
            className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm hover:underline"
          >
            Avaa TrioLasku <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ───────────────────────────────────────────── */
const plans = [
  { name: '1 kuukausi', price: '10', originalPrice: '15', period: '€ / kk', description: 'Kokeile ilman sitoutumista.', highlighted: false, priceId: import.meta.env.VITE_STRIPE_PRICE_ID_1MO },
  { name: '12 kuukautta', price: '90', originalPrice: '150', period: '€ / vuosi', perMonth: 'Vain 7,50 €/kk', badge: 'Suosituin', description: 'Paras hinta — koko vuosi kerralla.', highlighted: true, priceId: import.meta.env.VITE_STRIPE_PRICE_ID_12MO },
  { name: '6 kuukautta', price: '50', originalPrice: '80', period: '€ / 6 kk', perMonth: '~8,33 €/kk', description: 'Hyvä kompromissi.', highlighted: false, priceId: import.meta.env.VITE_STRIPE_PRICE_ID_6MO },
]

function Pricing() {
  const [loading, setLoading] = useState(null)

  const handleCheckout = async (plan) => {
    setLoading(plan.priceId)
    try {
      const res = await fetch('/.netlify/functions/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId }),
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

  return (
    <section id="pricing" className="py-10 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Hinnoittelu</h2>
          <p className="text-gray-500 max-w-xl mx-auto">Yksinkertainen hinnoittelu ilman yllätyksiä.</p>
        </div>
        <div className="grid sm:grid-cols-3 gap-6 mb-10">
          {plans.map((plan) => (
            <div key={plan.name} className={`rounded-2xl p-8 space-y-5 relative ${plan.highlighted ? 'bg-green-600 text-white ring-2 ring-green-600 shadow-lg scale-[1.03]' : 'bg-white border border-gray-200'}`}>
              {plan.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-xs font-bold px-4 py-1 rounded-full">{plan.badge}</div>}
              <div>
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-green-100' : 'text-gray-500'}`}>{plan.description}</p>
              </div>
              <div className="flex items-baseline gap-2">
                {plan.originalPrice && (
                  <span className={`text-lg line-through ${plan.highlighted ? 'text-green-200' : 'text-gray-300'}`}>{plan.originalPrice}€</span>
                )}
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-green-100' : 'text-gray-400'}`}>{plan.period}</span>
              </div>
              {plan.perMonth && <p className={`text-sm font-medium ${plan.highlighted ? 'text-green-100' : 'text-gray-500'}`}>{plan.perMonth}</p>}
              <button
                onClick={() => handleCheckout(plan)}
                disabled={loading === plan.priceId}
                className={`block w-full text-center font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 ${plan.highlighted ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                {loading === plan.priceId ? 'Ohjataan maksuun...' : 'Tilaa nyt'}
              </button>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-red-400 font-medium mt-6">Lanseeraustarjous –40 % — voimassa rajoitetun ajan!</p>
        <p className="text-center text-sm text-gray-400 mt-2">Hinnat sisältävät ALV 25,5 %.</p>
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
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold mb-4">✓</div>
        <h2 className="text-2xl font-bold">Viesti lähetetty!</h2>
        <p className="text-gray-500 mt-2">Vastaamme 24 tunnin sisällä.</p>
      </section>
    )
  }

  return (
    <section id="contact" className="py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ota yhteyttä</h2>
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
            <h3 className="font-semibold text-gray-900">Kyyränkoski Tmi</h3>
            <p className="text-sm text-gray-500">Y-tunnus: 1437272-9</p>
            <p className="text-sm text-gray-500">Kylänpääntie 54, 61450 Kylänpää</p>
            <p className="text-sm text-gray-500">ALV-velvollisuus rekisteröity 1.2.2026 alkaen</p>
            <a href="mailto:trio.tools6@gmail.com" className="inline-flex items-center gap-2 text-sm font-semibold text-green-600 hover:text-green-700 transition-colors">
              <Send className="w-4 h-4" />
              trio.tools6@gmail.com
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Main Landing Page ─────────────────────────────────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Navbar */}
      <nav className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">
            <span className="text-green-600">Trio</span>Tools
          </span>
          <div className="hidden sm:flex gap-8 text-sm font-medium text-gray-600">
            <a href="#triolasku" className="hover:text-gray-900 transition-colors">TrioLasku</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Hinnoittelu</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors">Yhteyttä</a>
          </div>
          <Link to="/invoices" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Avaa sovellus
          </Link>
        </div>
      </nav>

      <Hero />
      <TrioLaskuSection />
      <Pricing />
      <Contact />
    </div>
  )
}
