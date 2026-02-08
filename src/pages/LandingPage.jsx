import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, MapPin, Sparkles, Send, ArrowRight } from 'lucide-react'

/* ── Hero ──────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="inline-block bg-blue-50 text-blue-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-2">
          Laskutusohjelma pienyrittäjille
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          Laskuta{' '}
          <span className="text-green-600">ammattimaisesti</span>,{' '}
          aloita heti
        </h1>
        <p className="text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          TrioTools — laskutus, ajopäiväkirja ja AI-markkinointi yhdessä paketissa.
          Suunniteltu suomalaiselle pienyrittäjälle.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <Link
            to="/invoices"
            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-3.5 rounded-xl transition-colors text-base inline-flex items-center justify-center gap-2"
          >
            <FileText className="w-5 h-5" />
            Avaa TrioLasku
          </Link>
          <a
            href="#products"
            className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-8 py-3.5 rounded-xl transition-colors text-base"
          >
            Lue lisää
          </a>
        </div>
      </div>
    </section>
  )
}

/* ── Products ──────────────────────────────────────────── */
const tools = [
  {
    title: 'TrioLasku',
    icon: FileText,
    color: 'blue',
    link: '/invoices',
    badge: 'Valmis',
    description: 'PDF-laskut viivakoodilla ja viitenumerolla. Asiakas- ja tuoterekisteri, ALV-erittely, hyvityslaskut.',
    features: ['PDF-laskut sekunneissa', 'Uusi 13,5 % ALV-tuki', 'Asiakas- ja tuoterekisteri', 'Hyvityslaskut', 'Varmuuskopiointi', 'Toimii kaikilla laitteilla'],
  },
  {
    title: 'TrioLog',
    icon: MapPin,
    color: 'green',
    link: '/triolog',
    badge: 'Beta',
    description: 'Ajopäiväkirja ja kuittien hallinta. GPS-seuranta, työ- ja yksityisajot, km-korvaukset.',
    features: ['GPS-ajopäiväkirja', 'Kuittien tallennus', 'Työ- ja yksityisajoprofiilit', 'ALV-erittely kuiteista'],
  },
  {
    title: 'TrioPromote',
    icon: Sparkles,
    color: 'purple',
    link: '/triopromote',
    badge: 'AI',
    description: 'Tekoäly markkinoi puolestasi. Valmiit tekstit Facebookiin, Instagramiin, LinkedIniin ja sähköpostiin.',
    features: ['Some-postaukset sekunneissa', 'Myyvät sähköpostit', 'Suomalainen sävy', 'Google Gemini -pohjainen'],
  },
]

function Products() {
  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', badge: 'bg-blue-600', dot: 'bg-blue-500' },
    green: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', badge: 'bg-green-600', dot: 'bg-green-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', badge: 'bg-purple-600', dot: 'bg-purple-500' },
  }

  return (
    <section id="products" className="py-20 px-6 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Kolme työkalua, yksi paketti</h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Kaikki mitä pienyrittäjä tarvitsee — laskutus, ajopäiväkirja ja markkinointi.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tools.map((tool) => {
            const c = colorMap[tool.color]
            return (
              <div key={tool.title} className={`${c.bg} border ${c.border} rounded-2xl p-8 space-y-5 relative`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 ${c.badge} rounded-lg flex items-center justify-center`}>
                    <tool.icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{tool.title}</h3>
                  <span className={`${c.badge} text-white text-xs font-bold px-3 py-1 rounded-full`}>
                    {tool.badge}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{tool.description}</p>
                <ul className="space-y-2">
                  {tool.features.map((f) => (
                    <li key={f} className="text-sm text-gray-600 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={tool.link}
                  className={`inline-flex items-center gap-2 ${c.text} font-semibold text-sm hover:underline`}
                >
                  Avaa {tool.title} <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/* ── TrioPromote Demo ──────────────────────────────────── */
const channelLabels = { facebook: 'Facebook', instagram: 'Instagram', linkedin: 'LinkedIn', email: 'Sähköposti' }
const channelColors = { facebook: 'bg-blue-600', instagram: 'bg-pink-500', linkedin: 'bg-blue-700', email: 'bg-gray-700' }

function PromoteDemo() {
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')

  const handleGenerate = async (e) => {
    e.preventDefault()
    if (!product.trim()) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const res = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product: product.trim(), audience: audience.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Jokin meni pieleen.')
      setResult(data.results)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (channel, text) => {
    navigator.clipboard.writeText(text)
    setCopied(channel)
    setTimeout(() => setCopied(''), 2000)
  }

  return (
    <section id="triopromote" className="py-20 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-14">
          <div className="inline-block bg-purple-50 text-purple-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
            Kokeile ilmaiseksi
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            TrioPromote — tekoäly markkinoi puolestasi
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Kerro mitä haluat markkinoida ja kenelle, niin TrioPromote luo valmiit tekstit Facebookiin,
            Instagramiin, LinkedIniin ja sähköpostiin.
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 sm:p-10 space-y-6">
          <h3 className="text-xl font-bold text-purple-800 text-center">Kokeile TrioPromotea</h3>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-700">Mitä haluat mainostaa?</label>
              <input type="text" value={product} onChange={(e) => setProduct(e.target.value)} required placeholder="esim. TrioLasku, melontaretki, kesäale..." className="w-full border border-purple-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-purple-700">Kenelle?</label>
              <input type="text" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="esim. pienyrittäjät, perheet..." className="w-full border border-purple-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>}
            <button type="submit" disabled={loading || !product.trim()} className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl transition-colors">
              {loading ? 'Tekoäly kirjoittaa...' : 'Luo markkinointiteksti'}
            </button>
          </form>

          {result && (
            <div className="space-y-4 pt-4">
              {Object.entries(result).map(([channel, text]) => (
                <div key={channel} className="bg-white rounded-xl border border-purple-100 overflow-hidden">
                  <div className={`${channelColors[channel] || 'bg-gray-600'} text-white text-xs font-bold px-4 py-1.5 flex items-center justify-between`}>
                    <span>{channelLabels[channel] || channel}</span>
                    <button onClick={() => handleCopy(channel, text)} className="text-white/80 hover:text-white text-xs font-medium">
                      {copied === channel ? 'Kopioitu!' : 'Kopioi'}
                    </button>
                  </div>
                  <pre className="p-4 text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ── Pricing ───────────────────────────────────────────── */
const plans = [
  { name: '1 kuukausi', price: '12', period: '€ / kk', description: 'Kokeile ilman sitoutumista.', highlighted: false },
  { name: '12 kuukautta', price: '120', period: '€ / vuosi', perMonth: 'Vain 10 €/kk', badge: 'Suosituin', description: 'Paras hinta — koko vuosi kerralla.', highlighted: true },
  { name: '6 kuukautta', price: '65', period: '€ / 6 kk', perMonth: '~10,83 €/kk', description: 'Hyvä kompromissi.', highlighted: false },
]

function Pricing() {
  return (
    <section id="pricing" className="py-20 px-6 bg-gray-50">
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
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-extrabold">{plan.price}</span>
                <span className={`text-sm ${plan.highlighted ? 'text-green-100' : 'text-gray-400'}`}>{plan.period}</span>
              </div>
              {plan.perMonth && <p className={`text-sm font-medium ${plan.highlighted ? 'text-green-100' : 'text-gray-500'}`}>{plan.perMonth}</p>}
              <a href="#contact" className={`block text-center font-semibold py-3 rounded-xl transition-colors ${plan.highlighted ? 'bg-white text-green-700 hover:bg-green-50' : 'bg-green-600 text-white hover:bg-green-700'}`}>
                Tilaa nyt
              </a>
            </div>
          ))}
        </div>
        <p className="text-center text-sm text-gray-400 mt-8">Hinnat sisältävät ALV:n.</p>
      </div>
    </section>
  )
}

/* ── Contact ───────────────────────────────────────────── */
function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'form-name': 'contact', ...form }).toString(),
      })
      setSubmitted(true)
    } catch { /* ignore */ } finally { setLoading(false) }
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
    <section id="contact" className="py-20 px-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ota yhteyttä</h2>
        </div>
        <div className="grid sm:grid-cols-5 gap-8">
          <form name="contact" method="POST" data-netlify="true" onSubmit={handleSubmit} className="sm:col-span-3 bg-white border border-gray-200 rounded-2xl p-8 space-y-5">
            <input type="hidden" name="form-name" value="contact" />
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
          </div>
        </div>
      </div>
    </section>
  )
}

/* ── Landing Footer ────────────────────────────────────── */
function LandingFooter() {
  return (
    <footer className="border-t border-gray-100 py-12 px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="grid sm:grid-cols-3 gap-8 text-sm text-gray-500">
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Kyyränkoski Tmi</h4>
            <p>Y-tunnus: 1437272-9</p>
            <p>Kylänpääntie 54, 61450 Kylänpää</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Tietoa</h4>
            <p>Hinnat sisältävät ALV:n.</p>
            <p>ALV-velvollisuus rekisteröity 1.2.2026 alkaen.</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Työkalut</h4>
            <Link to="/invoices" className="block hover:text-gray-900 transition-colors">TrioLasku</Link>
            <Link to="/triolog" className="block hover:text-gray-900 transition-colors">TrioLog</Link>
            <Link to="/triopromote" className="block hover:text-gray-900 transition-colors">TrioPromote</Link>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
          <div>© {new Date().getFullYear()} TrioTools — Kyyränkoski Tmi. Kaikki oikeudet pidätetään.</div>
        </div>
      </div>
    </footer>
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
            <a href="#products" className="hover:text-gray-900 transition-colors">Tuotteet</a>
            <a href="#triopromote" className="hover:text-gray-900 transition-colors">TrioPromote</a>
            <a href="#pricing" className="hover:text-gray-900 transition-colors">Hinnoittelu</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors">Yhteyttä</a>
          </div>
          <Link to="/invoices" className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Avaa sovellus
          </Link>
        </div>
      </nav>

      <Hero />
      <Products />
      <PromoteDemo />
      <Pricing />
      <Contact />
      <LandingFooter />
    </div>
  )
}
