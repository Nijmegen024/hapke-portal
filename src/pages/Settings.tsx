import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SupabaseImageUpload } from '../components/SupabaseImageUpload'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'
const DEFAULT_CENTER = { lat: 51.8428, lng: 5.8547 }

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  shadowSize: [41, 41],
})
L.Marker.prototype.options.icon = markerIcon

type RestaurantResponse = {
  name?: string
  description?: string | null
  minimumOrderAmount?: number | null
  minimumOrderValue?: number | null
  minOrderAmount?: number | null
  minOrderValue?: number | null
  heroImageUrl?: string | null
  lat?: number | null
  lng?: number | null
  deliveryRadiusKm?: number | null
}

type FormState = {
  name: string
  description: string
  minOrderAmount: string
  heroImageUrl: string
  lat: string
  lng: string
  deliveryRadiusKm: string
}

const EMPTY_FORM: FormState = {
  name: '',
  description: '',
  minOrderAmount: '',
  heroImageUrl: '',
  lat: '',
  lng: '',
  deliveryRadiusKm: '5',
}

export default function Settings() {
  const navigate = useNavigate()
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerRef = useRef<L.Marker | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
    navigate('/login', { replace: true })
  }, [navigate])

  const fetchRestaurant = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers: Record<string, string> = {
        Accept: 'application/json',
      }
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) headers.Authorization = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/vendor/restaurant`, {
        credentials: 'include',
        headers,
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        throw new Error('Kan gegevens niet ophalen')
      }
      const data: RestaurantResponse = await res.json()
      setForm({
        name: data.name ?? '',
        description: data.description ?? '',
        minOrderAmount: resolveMinimumOrderAmount(data),
        heroImageUrl: data.heroImageUrl ?? '',
        lat: formatNumber(data.lat),
        lng: formatNumber(data.lng),
        deliveryRadiusKm: formatNumber(data.deliveryRadiusKm, '5'),
      })
    } catch (err: any) {
      setError(err?.message || 'Kon restaurantgegevens niet laden')
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    fetchRestaurant()
  }, [fetchRestaurant])

  useEffect(() => {
    if (!success) return
    const timeout = window.setTimeout(() => setSuccess(null), 3000)
    return () => window.clearTimeout(timeout)
  }, [success])

  const coords = useMemo(() => {
    const lat = parseFloat(form.lat.replace(',', '.'))
    const lng = parseFloat(form.lng.replace(',', '.'))
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }, [form.lat, form.lng])

  const radiusKm = useMemo(() => {
    const parsed = parseFloat(form.deliveryRadiusKm.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed <= 0) return 5
    return parsed
  }, [form.deliveryRadiusKm])

  const setLocation = useCallback((lat: number, lng: number) => {
    setForm((prev) => ({
      ...prev,
      lat: lat.toFixed(6),
      lng: lng.toFixed(6),
    }))
  }, [])

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const map = L.map(mapRef.current, {
      center: DEFAULT_CENTER,
      zoom: 12,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    map.on('click', (event) => {
      setLocation(event.latlng.lat, event.latlng.lng)
    })

    mapInstance.current = map
    return () => {
      map.remove()
      mapInstance.current = null
      markerRef.current = null
      circleRef.current = null
    }
  }, [setLocation])

  useEffect(() => {
    const map = mapInstance.current
    if (!map || !coords) return

    if (!markerRef.current) {
      const marker = L.marker(coords, { draggable: true }).addTo(map)
      marker.on('dragend', () => {
        const next = marker.getLatLng()
        setLocation(next.lat, next.lng)
      })
      markerRef.current = marker
    } else {
      markerRef.current.setLatLng(coords)
    }

    if (!circleRef.current) {
      circleRef.current = L.circle(coords, {
        radius: radiusKm * 1000,
        color: '#14B8A6',
        weight: 2,
        fillColor: '#14B8A6',
        fillOpacity: 0.12,
      }).addTo(map)
    } else {
      circleRef.current.setLatLng(coords)
    }

    map.setView(coords, map.getZoom(), { animate: false })
  }, [coords, radiusKm, setLocation])

  useEffect(() => {
    if (circleRef.current) {
      circleRef.current.setRadius(radiusKm * 1000)
    }
  }, [radiusKm])

  function resolveMinimumOrderAmount(data: RestaurantResponse) {
    const value =
      data.minimumOrderAmount ??
      data.minimumOrderValue ??
      data.minOrderAmount ??
      data.minOrderValue ??
      null
    if (typeof value === 'number') {
      return value.toFixed(2)
    }
    return ''
  }

  function formatNumber(value: number | null | undefined, fallback = '') {
    if (value === null || value === undefined) return fallback
    return String(value)
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (saving) return
    setError(null)
    setSuccess(null)

    if (!form.name.trim()) {
      setError('Naam is verplicht')
      return
    }

    const parsedValue = parseFloat(
      form.minOrderAmount.replace(',', '.').trim() || '0',
    )
    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setError('Voer een geldig minimaal bestelbedrag in')
      return
    }

    const parsedLat = form.lat.trim() ? parseFloat(form.lat.trim()) : null
    const parsedLng = form.lng.trim() ? parseFloat(form.lng.trim()) : null
    const parsedRadius = form.deliveryRadiusKm.trim()
      ? parseFloat(form.deliveryRadiusKm.trim())
      : null

    setSaving(true)
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) headers.Authorization = `Bearer ${token}`
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        minimumOrderAmount: Number(parsedValue.toFixed(2)),
        heroImageUrl: form.heroImageUrl.trim() || null,
        lat: parsedLat,
        lng: parsedLng,
        deliveryRadiusKm: parsedRadius ?? 5,
      }
      const res = await fetch(`${API_BASE}/vendor/restaurant`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(payload),
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Opslaan mislukt')
      }
      const data: RestaurantResponse = await res.json()
      setForm({
        name: data.name ?? payload.name,
        description: data.description ?? payload.description,
        minOrderAmount: resolveMinimumOrderAmount(data),
        heroImageUrl: data.heroImageUrl ?? payload.heroImageUrl ?? '',
        lat: formatNumber(data.lat ?? payload.lat ?? null),
        lng: formatNumber(data.lng ?? payload.lng ?? null),
        deliveryRadiusKm: formatNumber(
          data.deliveryRadiusKm ?? payload.deliveryRadiusKm ?? 5,
        ),
      })
      setSuccess('Gegevens opgeslagen')
    } catch (err: any) {
      setError(err?.message || 'Opslaan mislukt')
    } finally {
      setSaving(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 10,
    borderRadius: 8,
    border: '1px solid #d1d5db',
    marginTop: 4,
  }

  return (
    <div
      style={{
        maxWidth: 640,
        margin: '30px auto',
        fontFamily: 'sans-serif',
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Instellingen</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Pas hier de basisgegevens van je restaurant aan. De klant-app gebruikt
        deze gegevens direct.
      </p>

      {loading ? (
        <div style={{ padding: '20px 0' }}>Gegevens laden…</div>
      ) : (
        <form onSubmit={onSubmit}>
          <label style={{ display: 'block', fontWeight: 600, marginTop: 16 }}>
            Restaurantnaam
            <input
              required
              style={inputStyle}
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Restaurant naam"
            />
          </label>
          <label style={{ display: 'block', fontWeight: 600, marginTop: 16 }}>
            Korte beschrijving
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
              value={form.description}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Vertel iets over jullie keuken"
            />
          </label>
          <label style={{ display: 'block', fontWeight: 600, marginTop: 16 }}>
            Minimaal bestelbedrag (in euro’s)
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              value={form.minOrderAmount}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, minOrderAmount: e.target.value }))
              }
              placeholder="25.00"
            />
          </label>

          <div
            style={{
              marginTop: 16,
              padding: 12,
              border: '1px solid #e2e8f0',
              borderRadius: 10,
              background: '#f8fafc',
            }}
          >
            <h4 style={{ margin: '0 0 6px' }}>Bezorging</h4>
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>
              Klik op de kaart om je locatie te zetten en stel je bezorgbereik in.
            </p>
            <div
              style={{
                marginTop: 12,
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
              }}
            >
              <div ref={mapRef} style={{ width: '100%', height: 260 }} />
            </div>
            <p style={{ margin: '8px 0 0', color: '#475569', fontSize: 13 }}>
              Tip: klik op de kaart of sleep de marker om te verfijnen.
            </p>
            <label style={{ display: 'block', fontWeight: 600, marginTop: 10 }}>
              Bezorgbereik (km)
              <div
                style={{
                  display: 'grid',
                  gap: 10,
                  gridTemplateColumns: '120px 1fr',
                  alignItems: 'center',
                  marginTop: 6,
                }}
              >
                <input
                  type="number"
                  min="1"
                  step="0.5"
                  style={inputStyle}
                  value={form.deliveryRadiusKm}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      deliveryRadiusKm: e.target.value,
                    }))
                  }
                  placeholder="5"
                />
                <input
                  type="range"
                  min="1"
                  max="25"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      deliveryRadiusKm: e.target.value,
                    }))
                  }
                  style={{ width: '100%' }}
                />
              </div>
            </label>
            <details style={{ marginTop: 10 }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#475569' }}>
                Geavanceerd: coordinaten
              </summary>
              <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr' }}>
                <label style={{ fontWeight: 600, marginTop: 8 }}>
                  Latitude
                  <input
                    style={inputStyle}
                    value={form.lat}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lat: e.target.value }))
                    }
                    placeholder="52.0907"
                  />
                </label>
                <label style={{ fontWeight: 600, marginTop: 8 }}>
                  Longitude
                  <input
                    style={inputStyle}
                    value={form.lng}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lng: e.target.value }))
                    }
                    placeholder="5.1214"
                  />
                </label>
              </div>
            </details>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              marginTop: 16,
              padding: 12,
              border: '1px solid #e5e7eb',
              borderRadius: 10,
              background: '#f8fafc',
            }}
          >
            <div style={{ fontWeight: 600 }}>Restaurantfoto</div>
            <p style={{ margin: 0, color: '#475569', fontSize: 14 }}>
              Upload een foto die in de app bij je restaurant getoond wordt.
            </p>
            <SupabaseImageUpload
              ownerId={form.name || 'restaurant'}
              onUploaded={(url) =>
                setForm((prev) => ({ ...prev, heroImageUrl: url }))
              }
            />
            <label style={{ display: 'block', fontWeight: 600 }}>
              Of plak een afbeelding-URL
              <input
                style={inputStyle}
                value={form.heroImageUrl}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, heroImageUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </label>
            {form.heroImageUrl && (
              <div
                style={{
                  marginTop: 8,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid #e2e8f0',
                }}
              >
                <img
                  src={form.heroImageUrl}
                  alt="Voorbeeld restaurant"
                  style={{ width: '100%', display: 'block', maxHeight: 240, objectFit: 'cover' }}
                />
              </div>
            )}
          </div>

          {error && (
            <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>
          )}
          {success && (
            <div
              style={{
                color: '#15803d',
                marginTop: 12,
                background: '#dcfce7',
                padding: '8px 12px',
                borderRadius: 6,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                border: 'none',
                background: '#14B8A6',
                color: '#fff',
                fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer',
                boxShadow: '0 2px 0 #FFC857',
              }}
            >
              {saving ? 'Opslaan…' : 'Opslaan'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
