import { useState } from 'react'
import { Sparkles, Send, Copy, Check, Loader2 } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

const PROMPT_TEMPLATES = [
  {
    id: 'ad',
    labelFi: 'Mainos sosiaaliseen mediaan',
    labelEn: 'Social media ad',
    promptFi: 'Kirjoita lyhyt ja myyvä mainos sosiaaliseen mediaan seuraavalle yritykselle tai palvelulle:',
    promptEn: 'Write a short and compelling social media ad for the following business or service:',
  },
  {
    id: 'email',
    labelFi: 'Markkinointisähköposti',
    labelEn: 'Marketing email',
    promptFi: 'Kirjoita ammattimainen markkinointisähköposti seuraavalle yritykselle:',
    promptEn: 'Write a professional marketing email for the following business:',
  },
  {
    id: 'slogan',
    labelFi: 'Iskulause / slogan',
    labelEn: 'Slogan / tagline',
    promptFi: 'Keksi 5 iskevää iskulausetta seuraavalle yritykselle:',
    promptEn: 'Create 5 catchy slogans for the following business:',
  },
  {
    id: 'description',
    labelFi: 'Yrityksen kuvaus',
    labelEn: 'Business description',
    promptFi: 'Kirjoita ammattimainen yrityksen kuvaus verkkosivuille:',
    promptEn: 'Write a professional business description for a website:',
  },
]

export default function TrioPromote() {
  const { language } = useLanguage()
  const isFi = language === 'fi'

  const [selectedTemplate, setSelectedTemplate] = useState('ad')
  const [userInput, setUserInput] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    if (!userInput.trim()) return

    const template = PROMPT_TEMPLATES.find((t) => t.id === selectedTemplate)
    const prefix = isFi ? template.promptFi : template.promptEn
    const fullPrompt = `${prefix}\n\n${userInput}\n\n${isFi ? 'Vastaa suomeksi.' : 'Reply in English.'}`

    setLoading(true)
    setError('')
    setResult('')

    try {
      const res = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      setResult(data.result || (isFi ? 'Ei vastausta.' : 'No response.'))
    } catch (err) {
      setError(isFi ? `Virhe: ${err.message}` : `Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-7 h-7 text-purple-500" />
          TrioPromote
        </h1>
        <p className="mt-1 text-gray-500">
          {isFi
            ? 'AI-avusteinen markkinointisisällön luonti yrityksellesi.'
            : 'AI-powered marketing content generation for your business.'}
        </p>
      </div>

      {/* Template selector */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PROMPT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            onClick={() => setSelectedTemplate(tmpl.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedTemplate === tmpl.id
                ? 'bg-purple-100 text-purple-700 border-2 border-purple-400'
                : 'bg-gray-100 text-gray-600 border-2 border-transparent hover:bg-gray-200'
            }`}
          >
            {isFi ? tmpl.labelFi : tmpl.labelEn}
          </button>
        ))}
      </div>

      {/* Input */}
      <Card className="mb-4">
        <CardBody>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {isFi
              ? 'Kerro yrityksestäsi tai palvelustasi:'
              : 'Describe your business or service:'}
          </label>
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            rows={4}
            placeholder={
              isFi
                ? 'Esim. "Kyyränkoski Tmi tarjoaa metsäpalveluita Pirkanmaalla..."'
                : 'E.g. "Kyyränkoski Tmi provides forestry services in Pirkanmaa..."'
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          />
          <div className="flex justify-end mt-3">
            <Button onClick={handleGenerate} disabled={loading || !userInput.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isFi ? 'Luodaan...' : 'Generating...'}
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  {isFi ? 'Luo sisältö' : 'Generate'}
                </>
              )}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Result */}
      {result && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                {isFi ? 'Tulos' : 'Result'}
              </h3>
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                {copied ? (isFi ? 'Kopioitu!' : 'Copied!') : (isFi ? 'Kopioi' : 'Copy')}
              </Button>
            </div>
            <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
              {result}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
