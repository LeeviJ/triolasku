import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Send, Copy, Check, Loader2, Trash2, ChevronDown, ChevronUp, Lock, Unplug } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useLicense } from '../context/LicenseContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

const SETTINGS_KEY = 'triolasku_triopromote_settings'
const HISTORY_KEY = 'triolasku_triopromote_history'
const MAX_HISTORY = 20

const TONES = [
  { id: 'professional', active: 'bg-blue-100 text-blue-700 border-blue-400', label: 'Professional' },
  { id: 'casual', active: 'bg-green-100 text-green-700 border-green-400', label: 'Casual' },
  { id: 'sales', active: 'bg-orange-100 text-orange-700 border-orange-400', label: 'Sales' },
  { id: 'informative', active: 'bg-purple-100 text-purple-700 border-purple-400', label: 'Informative' },
]

const CHANNELS = [
  { id: 'facebook', color: 'bg-blue-600' },
  { id: 'instagram', color: 'bg-pink-500' },
  { id: 'linkedin', color: 'bg-blue-800' },
  { id: 'email', color: 'bg-gray-600' },
  { id: 'googleAds', color: 'bg-yellow-500' },
  { id: 'blog', color: 'bg-emerald-600' },
]

function loadSettings() {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return { product: '', audience: '', tone: 'professional' }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function loadHistory() {
  try {
    const saved = localStorage.getItem(HISTORY_KEY)
    if (saved) return JSON.parse(saved)
  } catch { /* ignore */ }
  return []
}

function saveHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
}

export default function TrioPromote() {
  const { t } = useLanguage()
  const { licenseKey, licenseInfo } = useLicense()
  const [searchParams, setSearchParams] = useSearchParams()

  const hasPromote = licenseInfo?.tier === 'promote'

  const [settings, setSettings] = useState(loadSettings)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copiedChannel, setCopiedChannel] = useState(null)
  const [history, setHistory] = useState(loadHistory)
  const [expandedHistory, setExpandedHistory] = useState(null)

  // Facebook state
  const [fbConnected, setFbConnected] = useState(false)
  const [fbPageName, setFbPageName] = useState('')
  const [fbPublishing, setFbPublishing] = useState(false)
  const [fbPublishStatus, setFbPublishStatus] = useState(null) // 'success' | 'error' | null
  const [fbMessage, setFbMessage] = useState('')

  // Check FB connection status
  const checkFbStatus = useCallback(async () => {
    if (!licenseKey) return
    try {
      const res = await fetch(`/.netlify/functions/fb-status?licenseKey=${encodeURIComponent(licenseKey)}`)
      const data = await res.json()
      setFbConnected(data.connected)
      setFbPageName(data.pageName || '')
    } catch { /* ignore */ }
  }, [licenseKey])

  useEffect(() => {
    checkFbStatus()
  }, [checkFbStatus])

  // Handle ?fb= URL parameter from OAuth callback
  useEffect(() => {
    const fbParam = searchParams.get('fb')
    if (!fbParam) return

    if (fbParam === 'connected') {
      setFbMessage(t('triopromote.fbConnectedSuccess'))
      checkFbStatus()
    } else if (fbParam === 'no_pages') {
      setFbMessage(t('triopromote.fbNoPages'))
    } else if (fbParam === 'error') {
      setFbMessage(t('triopromote.fbError'))
    }

    // Clear the param from URL
    searchParams.delete('fb')
    setSearchParams(searchParams, { replace: true })
  }, [searchParams, setSearchParams, checkFbStatus, t])

  // Auto-save settings
  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  // Auto-save history
  useEffect(() => {
    saveHistory(history)
  }, [history])

  const updateSetting = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerate = async () => {
    if (!settings.product.trim() || !settings.audience.trim()) return

    setLoading(true)
    setError('')
    setResults(null)

    try {
      const res = await fetch('/.netlify/functions/gemini-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: settings.product,
          audience: settings.audience,
          tone: settings.tone,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP ${res.status}`)
      }

      const data = await res.json()
      if (data.results) {
        setResults(data.results)

        // Save to history
        const entry = {
          id: crypto.randomUUID(),
          product: settings.product,
          audience: settings.audience,
          tone: settings.tone,
          results: data.results,
          createdAt: new Date().toISOString(),
        }
        setHistory((prev) => [entry, ...prev].slice(0, MAX_HISTORY))
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (channel, text) => {
    navigator.clipboard.writeText(text)
    setCopiedChannel(channel)
    setTimeout(() => setCopiedChannel(null), 2000)
  }

  const handleDeleteHistory = (id) => {
    setHistory((prev) => prev.filter((item) => item.id !== id))
  }

  const handleClearHistory = () => {
    if (window.confirm(t('triopromote.clearHistoryConfirm'))) {
      setHistory([])
    }
  }

  const handleLoadFromHistory = (entry) => {
    setResults(entry.results)
    setSettings({ product: entry.product, audience: entry.audience, tone: entry.tone })
  }

  const handleFbConnect = () => {
    window.location.href = `/.netlify/functions/fb-auth?licenseKey=${encodeURIComponent(licenseKey)}`
  }

  const handleFbDisconnect = async () => {
    if (!window.confirm(t('triopromote.fbDisconnectConfirm'))) return
    try {
      await fetch('/.netlify/functions/fb-disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey }),
      })
      setFbConnected(false)
      setFbPageName('')
    } catch { /* ignore */ }
  }

  const handleFbPublish = async (text) => {
    setFbPublishing(true)
    setFbPublishStatus(null)
    try {
      const res = await fetch('/.netlify/functions/fb-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseKey, message: text }),
      })
      const data = await res.json()
      if (data.success) {
        setFbPublishStatus('success')
      } else {
        setFbPublishStatus('error')
      }
    } catch {
      setFbPublishStatus('error')
    } finally {
      setFbPublishing(false)
      setTimeout(() => setFbPublishStatus(null), 3000)
    }
  }

  const canGenerate = settings.product.trim() && settings.audience.trim() && !loading

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-7 h-7 text-purple-500" />
              {t('triopromote.title')}
            </h1>
            <p className="mt-1 text-gray-500">{t('triopromote.subtitle')}</p>
          </div>
          {hasPromote && (
            <div className="flex items-center gap-2">
              {fbConnected ? (
                <>
                  <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                    {t('triopromote.fbConnected')}: {fbPageName}
                  </span>
                  <button
                    onClick={handleFbDisconnect}
                    className="text-xs text-gray-500 hover:text-red-600 px-2 py-1.5 rounded hover:bg-red-50 transition-colors flex items-center gap-1"
                  >
                    <Unplug className="w-3.5 h-3.5" />
                    {t('triopromote.fbDisconnect')}
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFbConnect}
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  {t('triopromote.fbConnect')}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Facebook status message */}
      {fbMessage && (
        <div className="mb-4 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-center justify-between">
          <span>{fbMessage}</span>
          <button onClick={() => setFbMessage('')} className="text-blue-400 hover:text-blue-600 ml-2">&times;</button>
        </div>
      )}

      {/* Upgrade prompt */}
      {!hasPromote && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardBody className="text-center py-8">
            <Lock className="w-10 h-10 text-purple-400 mx-auto mb-3" />
            <p className="text-gray-700 mb-4">{t('license.upgradePrompt')}</p>
            <Link
              to="/#pricing"
              className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              <Sparkles className="w-4 h-4" />
              {t('license.upgradeButton')}
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Input section */}
      <Card className={`mb-6 ${!hasPromote ? 'opacity-50 pointer-events-none' : ''}`}>
        <CardBody>
          {/* Product */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('triopromote.product')}
            </label>
            <textarea
              value={settings.product}
              onChange={(e) => updateSetting('product', e.target.value)}
              rows={3}
              placeholder={t('triopromote.productPlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Audience */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('triopromote.audience')}
            </label>
            <textarea
              value={settings.audience}
              onChange={(e) => updateSetting('audience', e.target.value)}
              rows={2}
              placeholder={t('triopromote.audiencePlaceholder')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
            />
          </div>

          {/* Tone selector */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('triopromote.tone')}
            </label>
            <div className="flex flex-wrap gap-2">
              {TONES.map((tone) => (
                <button
                  key={tone.id}
                  onClick={() => updateSetting('tone', tone.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border-2 ${
                    settings.tone === tone.id
                      ? tone.active
                      : 'bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200'
                  }`}
                >
                  {t(`triopromote.tone${tone.id.charAt(0).toUpperCase() + tone.id.slice(1)}`)}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-end">
            <Button onClick={handleGenerate} disabled={!canGenerate}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('triopromote.generating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {t('triopromote.generate')}
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

      {/* Results - one card per channel */}
      {results && (
        <div className="space-y-3 mb-8">
          {CHANNELS.map((channel) => {
            const text = results[channel.id]
            if (!text) return null
            const isCopied = copiedChannel === channel.id
            const isFacebook = channel.id === 'facebook'
            return (
              <Card key={channel.id}>
                <CardBody className="py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${channel.color}`} />
                      <span className="text-sm font-semibold text-gray-700">
                        {t(`triopromote.${channel.id}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {isFacebook && fbConnected && (
                        <button
                          onClick={() => handleFbPublish(text)}
                          disabled={fbPublishing}
                          className="flex items-center gap-1 text-xs text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-2.5 py-1 rounded transition-colors"
                        >
                          {fbPublishing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              {t('triopromote.fbPublishing')}
                            </>
                          ) : fbPublishStatus === 'success' ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              {t('triopromote.fbPublished')}
                            </>
                          ) : fbPublishStatus === 'error' ? (
                            <span className="text-red-200">{t('triopromote.fbPublishError')}</span>
                          ) : (
                            <>
                              <Send className="w-3.5 h-3.5" />
                              {t('triopromote.fbPublish')}
                            </>
                          )}
                        </button>
                      )}
                      <button
                        onClick={() => handleCopy(channel.id, text)}
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        {isCopied ? t('triopromote.copied') : t('triopromote.copy')}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{text}</div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardBody>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">{t('triopromote.history')}</h3>
              <Button variant="ghost" size="sm" onClick={handleClearHistory}>
                <Trash2 className="w-3.5 h-3.5" />
                {t('triopromote.clearHistory')}
              </Button>
            </div>
            <div className="space-y-2">
              {history.map((entry) => {
                const isExpanded = expandedHistory === entry.id
                const date = new Date(entry.createdAt)
                const dateStr = date.toLocaleDateString('fi-FI')
                const timeStr = date.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
                const toneLabel = t(`triopromote.tone${entry.tone.charAt(0).toUpperCase() + entry.tone.slice(1)}`)

                return (
                  <div key={entry.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedHistory(isExpanded ? null : entry.id)}
                      className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">{dateStr} {timeStr}</span>
                        <span className="text-xs text-gray-400 mx-2">|</span>
                        <span className="text-xs font-medium text-purple-600">{toneLabel}</span>
                        <p className="text-sm text-gray-700 truncate mt-0.5">{entry.product}</p>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2 mt-2 mb-2">
                          <Button variant="secondary" size="sm" onClick={() => handleLoadFromHistory(entry)}>
                            {t('triopromote.showAll')}
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDeleteHistory(entry.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                            {t('triopromote.deleteItem')}
                          </Button>
                        </div>
                        {CHANNELS.map((ch) => {
                          const chText = entry.results?.[ch.id]
                          if (!chText) return null
                          return (
                            <div key={ch.id} className="mt-2">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className={`w-2 h-2 rounded-full ${ch.color}`} />
                                <span className="text-xs font-medium text-gray-500">{t(`triopromote.${ch.id}`)}</span>
                                <button
                                  onClick={() => handleCopy(`history-${entry.id}-${ch.id}`, chText)}
                                  className="ml-auto text-xs text-gray-400 hover:text-gray-600"
                                >
                                  {copiedChannel === `history-${entry.id}-${ch.id}` ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                </button>
                              </div>
                              <p className="text-xs text-gray-600 whitespace-pre-wrap pl-3.5">{chText}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
