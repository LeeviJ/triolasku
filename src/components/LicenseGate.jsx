import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, KeyRound } from 'lucide-react'
import { useLicense } from '../context/LicenseContext'
import { useDemo } from '../context/DemoContext'

export default function LicenseGate({ children }) {
  const { licenseStatus, activate } = useLicense()
  const { isDemo } = useDemo()
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (licenseStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500">Tarkistetaan lisenssiä...</p>
        </div>
      </div>
    )
  }

  if (licenseStatus === 'valid' || isDemo) {
    return children
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    setLoading(true)
    setError('')
    const valid = await activate(input)
    if (!valid) setError('Virheellinen tai vanhentunut lisenssiavain.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md w-full space-y-6 shadow-sm">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">TrioLasku</h1>
          <p className="text-gray-500 text-sm">Syötä lisenssiavain jatkaaksesi.</p>
        </div>

        {licenseStatus === 'expired' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            Lisenssi on vanhentunut. Uusi tilaus tai avain tarvitaan.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="TRIO-XXXX-XXXX-XXXX"
              className="w-full border border-gray-300 rounded-xl pl-11 pr-4 py-3 text-center font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Tarkistetaan...' : 'Aktivoi'}
          </button>
        </form>

        <div className="text-center space-y-2">
          <Link to="/#pricing" className="text-sm text-green-600 hover:underline block">
            Ei vielä lisenssiä? Tilaa tästä
          </Link>
          <a href="mailto:trio.tools6@gmail.com" className="text-sm text-gray-400 hover:underline block">
            Tarvitsetko apua? trio.tools6@gmail.com
          </a>
        </div>
      </div>
    </div>
  )
}
