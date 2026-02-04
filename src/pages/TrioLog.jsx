import { useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Play, Square, Clock, Navigation, Signpost, Trash2, AlertTriangle, Plus, Briefcase, Car, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import Card, { CardBody } from '../components/ui/Card'
import Button from '../components/ui/Button'

const STORAGE_KEY = 'triolasku_triolog_trips'

// Haversine formula: distance between two GPS coordinates in meters
const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

const formatTime = (seconds) => {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(2)} km`
}

const formatSpeed = (mps) => {
  return `${((mps || 0) * 3.6).toFixed(1)} km/h`
}

const formatDateFI = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('fi-FI') + ' ' + d.toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit' })
}

const formatDateForInput = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

const PROFILES = [
  { id: 'work', icon: Briefcase, colorClass: 'blue' },
  { id: 'personal', icon: Car, colorClass: 'green' },
]

export default function TrioLog() {
  const { t } = useLanguage()

  const [tracking, setTracking] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [distance, setDistance] = useState(0)
  const [speed, setSpeed] = useState(0)
  const [error, setError] = useState(null)
  const [selectedProfile, setSelectedProfile] = useState('work')
  const [showManualForm, setShowManualForm] = useState(false)
  const [manualForm, setManualForm] = useState({
    date: formatDateForInput(new Date()),
    startKm: '',
    endKm: '',
    description: '',
    profile: 'work',
  })
  const [trips, setTrips] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const watchIdRef = useRef(null)
  const wakeLockRef = useRef(null)
  const timerRef = useRef(null)
  const positionsRef = useRef([])
  const distanceRef = useRef(0)
  const startTimeRef = useRef(null)

  // Persist trips
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips))
  }, [trips])

  // ── Wake Lock ──────────────────────────────────────────────
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        // may fail on low battery – not fatal
      }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire wake lock when page returns to foreground
  useEffect(() => {
    const onVisibility = () => {
      if (tracking && document.visibilityState === 'visible') {
        requestWakeLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [tracking, requestWakeLock])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current)
      if (timerRef.current) clearInterval(timerRef.current)
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  // ── Start / Stop ───────────────────────────────────────────
  const startTracking = async () => {
    if (!navigator.geolocation) {
      setError(t('triolog.gpsNotSupported'))
      return
    }

    setError(null)
    positionsRef.current = []
    distanceRef.current = 0
    setDistance(0)
    setSpeed(0)
    setElapsed(0)
    startTimeRef.current = Date.now()

    await requestWakeLock()

    // Elapsed timer
    timerRef.current = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    // GPS watcher
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed: gpsSpeed } = pos.coords
        const timestamp = pos.timestamp
        const prev = positionsRef.current[positionsRef.current.length - 1]

        if (prev) {
          const dt = (timestamp - prev.timestamp) / 1000
          const dist = haversineDistance(prev.latitude, prev.longitude, latitude, longitude)

          // Skip GPS jitter (< 3 m) but ALWAYS add distance if there was a
          // sleep gap (> 30 s) so trip distance never stays zero after a pause.
          if (dist > 3 || dt > 30) {
            distanceRef.current += dist
            setDistance(distanceRef.current)
          }

          if (gpsSpeed !== null && gpsSpeed >= 0) {
            setSpeed(gpsSpeed)
          } else if (dt > 0 && dist > 3) {
            setSpeed(dist / dt)
          }
        }

        positionsRef.current.push({ latitude, longitude, timestamp })
      },
      (err) => {
        if (err.code === 1) {
          setError(t('triolog.gpsPermissionDenied'))
          stopTracking()
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )

    setTracking(true)
  }

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    releaseWakeLock()

    const finalElapsed = Math.floor((Date.now() - (startTimeRef.current || Date.now())) / 1000)
    if (distanceRef.current > 10 || finalElapsed > 60) {
      setTrips((prev) => [
        {
          id: crypto.randomUUID(),
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date().toISOString(),
          duration: finalElapsed,
          distance: distanceRef.current,
          profile: selectedProfile,
        },
        ...prev,
      ])
    }

    setTracking(false)
    setSpeed(0)
  }

  // ── Manual entry ───────────────────────────────────────────
  const handleManualSubmit = () => {
    const startKm = parseFloat(manualForm.startKm)
    const endKm = parseFloat(manualForm.endKm)
    if (!manualForm.date || isNaN(startKm) || isNaN(endKm) || endKm <= startKm) return

    const distanceM = (endKm - startKm) * 1000

    setTrips((prev) => [
      {
        id: crypto.randomUUID(),
        startTime: new Date(manualForm.date + 'T00:00:00').toISOString(),
        endTime: new Date(manualForm.date + 'T00:00:00').toISOString(),
        duration: 0,
        distance: distanceM,
        profile: manualForm.profile,
        description: manualForm.description,
        manual: true,
        startKm,
        endKm,
      },
      ...prev,
    ])

    setManualForm({ date: formatDateForInput(new Date()), startKm: '', endKm: '', description: '', profile: 'work' })
    setShowManualForm(false)
  }

  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((trip) => trip.id !== id))
    setDeleteConfirm(null)
  }

  const getProfileLabel = (profileId) => {
    if (profileId === 'work') return t('triolog.workTrip')
    return t('triolog.personalTrip')
  }

  const getProfileBadge = (profileId) => {
    if (profileId === 'work') {
      return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700"><Briefcase className="w-2.5 h-2.5" />{t('triolog.workTrip')}</span>
    }
    return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700"><Car className="w-2.5 h-2.5" />{t('triolog.personalTrip')}</span>
  }

  // ── Totals by profile ──────────────────────────────────────
  const workTrips = trips.filter((t) => t.profile === 'work')
  const personalTrips = trips.filter((t) => t.profile === 'personal' || !t.profile)
  const workKm = workTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000
  const personalKm = personalTrips.reduce((sum, t) => sum + (t.distance || 0), 0) / 1000

  // ── Render ─────────────────────────────────────────────────
  const dark = tracking

  return (
    <div className={dark ? 'bg-gray-900 min-h-screen -m-4 md:-m-6 lg:-m-8 p-4 md:p-6 lg:p-8' : ''}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className={`text-2xl md:text-3xl font-bold ${dark ? 'text-gray-100' : 'text-gray-900'}`}>
            {t('triolog.title')}
          </h1>
          <p className={`mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t('triolog.subtitle')}</p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-900/40 border border-red-700 rounded-lg flex items-center gap-2 text-red-200 text-sm">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Profile selector (only shown when not tracking) */}
        {!tracking && (
          <div className="mb-4">
            <p className={`text-xs font-medium uppercase tracking-wide mb-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {t('triolog.selectProfile')}
            </p>
            <div className="flex gap-2">
              {PROFILES.map((p) => {
                const Icon = p.icon
                const active = selectedProfile === p.id
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProfile(p.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg border-2 text-sm font-semibold transition-colors ${
                      active
                        ? p.colorClass === 'blue'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {getProfileLabel(p.id)}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Main panel */}
        <div className={`rounded-2xl p-6 md:p-8 mb-4 ${dark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-sm'}`}>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Time */}
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1.5 mb-1 text-xs font-medium uppercase tracking-wide ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Clock className="w-3.5 h-3.5" />
                {t('triolog.time')}
              </div>
              <div className={`text-2xl md:text-3xl font-mono font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                {formatTime(elapsed)}
              </div>
            </div>
            {/* Distance */}
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1.5 mb-1 text-xs font-medium uppercase tracking-wide ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Signpost className="w-3.5 h-3.5" />
                {t('triolog.distance')}
              </div>
              <div className={`text-2xl md:text-3xl font-mono font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                {formatDistance(distance)}
              </div>
            </div>
            {/* Speed */}
            <div className="text-center">
              <div className={`flex items-center justify-center gap-1.5 mb-1 text-xs font-medium uppercase tracking-wide ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Navigation className="w-3.5 h-3.5" />
                {t('triolog.speed')}
              </div>
              <div className={`text-2xl md:text-3xl font-mono font-bold tabular-nums ${dark ? 'text-white' : 'text-gray-900'}`}>
                {formatSpeed(speed)}
              </div>
            </div>
          </div>

          {/* Active profile badge */}
          {tracking && (
            <div className="flex justify-center mb-4">
              {getProfileBadge(selectedProfile)}
            </div>
          )}

          {/* Big start / stop button */}
          <div className="flex justify-center">
            {tracking ? (
              <button
                onClick={stopTracking}
                className="w-24 h-24 rounded-full bg-red-600 hover:bg-red-700 active:bg-red-800 flex items-center justify-center transition-colors shadow-lg shadow-red-900/30"
              >
                <Square className="w-10 h-10 text-white fill-white" />
              </button>
            ) : (
              <button
                onClick={startTracking}
                className="w-24 h-24 rounded-full bg-green-600 hover:bg-green-700 active:bg-green-800 flex items-center justify-center transition-colors shadow-lg shadow-green-900/30"
              >
                <Play className="w-10 h-10 text-white fill-white ml-1" />
              </button>
            )}
          </div>

          {tracking && (
            <p className="text-center mt-4 text-xs text-gray-500">{t('triolog.trackingActive')}</p>
          )}
        </div>

        {/* Summary cards (when not tracking) */}
        {!tracking && trips.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-blue-600 mb-1">
                <Briefcase className="w-3.5 h-3.5" />
                {t('triolog.workTrip')}
              </div>
              <p className="text-lg font-bold text-blue-900">{workKm.toFixed(1)} km</p>
              <p className="text-[10px] text-blue-500">{workTrips.length} {t('triolog.tripsCount')}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-green-600 mb-1">
                <Car className="w-3.5 h-3.5" />
                {t('triolog.personalTrip')}
              </div>
              <p className="text-lg font-bold text-green-900">{personalKm.toFixed(1)} km</p>
              <p className="text-[10px] text-green-500">{personalTrips.length} {t('triolog.tripsCount')}</p>
            </div>
          </div>
        )}

        {/* Manual entry button + form */}
        {!tracking && (
          <div className="mb-4">
            {!showManualForm ? (
              <button
                onClick={() => setShowManualForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 border-2 border-dashed border-gray-300 rounded-xl text-sm font-medium text-gray-500 hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('triolog.addManual')}
              </button>
            ) : (
              <Card>
                <CardBody className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-900">{t('triolog.manualEntry')}</h3>
                    <button onClick={() => setShowManualForm(false)} className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Profile for manual */}
                  <div className="flex gap-2">
                    {PROFILES.map((p) => {
                      const Icon = p.icon
                      const active = manualForm.profile === p.id
                      return (
                        <button
                          key={p.id}
                          onClick={() => setManualForm((prev) => ({ ...prev, profile: p.id }))}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors ${
                            active
                              ? p.colorClass === 'blue'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-200 bg-white text-gray-500'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {getProfileLabel(p.id)}
                        </button>
                      )
                    })}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{t('triolog.date')}</label>
                      <input
                        type="date"
                        value={manualForm.date}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, date: e.target.value }))}
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{t('triolog.startReading')}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={manualForm.startKm}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, startKm: e.target.value }))}
                        placeholder="km"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-medium text-gray-500 mb-0.5">{t('triolog.endReading')}</label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={manualForm.endKm}
                        onChange={(e) => setManualForm((prev) => ({ ...prev, endKm: e.target.value }))}
                        placeholder="km"
                        className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <input
                    type="text"
                    value={manualForm.description}
                    onChange={(e) => setManualForm((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder={t('triolog.descriptionPlaceholder')}
                    className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />

                  {manualForm.startKm && manualForm.endKm && parseFloat(manualForm.endKm) > parseFloat(manualForm.startKm) && (
                    <p className="text-xs text-gray-500">
                      = {(parseFloat(manualForm.endKm) - parseFloat(manualForm.startKm)).toFixed(1)} km
                    </p>
                  )}

                  <Button onClick={handleManualSubmit} className="w-full" size="sm">
                    {t('common.save')}
                  </Button>
                </CardBody>
              </Card>
            )}
          </div>
        )}

        {/* Trip history (hidden while tracking) */}
        {!tracking && trips.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">{t('triolog.history')}</h2>
            <div className="space-y-2">
              {trips.map((trip) => (
                <Card key={trip.id}>
                  <CardBody className="flex items-center justify-between py-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{formatDateFI(trip.startTime)}</p>
                        {getProfileBadge(trip.profile || 'personal')}
                        {trip.manual && <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-500">{t('triolog.manual')}</span>}
                      </div>
                      <div className="flex gap-4 mt-0.5 text-xs text-gray-500">
                        {trip.duration > 0 && <span>{formatTime(trip.duration)}</span>}
                        <span>{formatDistance(trip.distance)}</span>
                        {trip.manual && trip.startKm != null && (
                          <span>{trip.startKm} → {trip.endKm} km</span>
                        )}
                      </div>
                      {trip.description && <p className="text-xs text-gray-400 mt-0.5">{trip.description}</p>}
                    </div>
                    {deleteConfirm === trip.id ? (
                      <div className="flex items-center gap-1">
                        <Button variant="danger" size="sm" onClick={() => deleteTrip(trip.id)}>
                          {t('common.yes')}
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => setDeleteConfirm(null)}>
                          {t('common.no')}
                        </Button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(trip.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!tracking && trips.length === 0 && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-sm">{t('triolog.noTrips')}</p>
          </div>
        )}
      </div>
    </div>
  )
}
