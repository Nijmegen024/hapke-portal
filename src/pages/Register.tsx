import { type FormEvent, useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'

type FormState = {
  name: string
  email: string
  password: string
  contactName: string
  phone: string
  street: string
  postalCode: string
  city: string
  description: string
}

const initialState: FormState = {
  name: '',
  email: '',
  password: '',
  contactName: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  description: '',
}

export default function Register() {
  const [form, setForm] = useState<FormState>(initialState)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    const payload: Record<string, string> = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
    }

    if (form.contactName.trim()) payload.contactName = form.contactName.trim()
    if (form.phone.trim()) payload.phone = form.phone.trim()
    if (form.street.trim()) payload.street = form.street.trim()
    if (form.postalCode.trim()) payload.postalCode = form.postalCode.trim()
    if (form.city.trim()) payload.city = form.city.trim()
    if (form.description.trim()) payload.description = form.description.trim()

    try {
      const res = await fetch(`${API_BASE}/vendor/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (res.status === 400) {
        const data = await res.json().catch(() => null)
        const message =
          (data && (data.message || data.error)) ||
          'Registratiegegevens zijn ongeldig'
        setError(message)
        return
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Registratie mislukt')
      }
      const data = await res.json()
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token as string)
      }
      localStorage.setItem(SESSION_KEY, '1')
      window.location.href = '/orders'
    } catch (err: any) {
      setError(err?.message || 'Registratie mislukt')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: 10,
    marginBottom: 10,
    borderRadius: 6,
    border: '1px solid #d1d5db',
  }

  return (
    <div
      style={{
        maxWidth: 480,
        margin: '30px auto 60px',
        fontFamily: 'sans-serif',
        background: '#fff',
        padding: 24,
        borderRadius: 12,
        boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
      }}
    >
      <h2 style={{ marginTop: 0 }}>Meld jouw restaurant aan</h2>
      <p style={{ color: '#475569' }}>
        Vul de gegevens van je restaurant in. Na registratie kun je meteen
        inloggen en je menu aanvullen.
      </p>
      <form onSubmit={onSubmit}>
        <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>
          Bedrijfsnaam*
          <input
            required
            style={inputStyle}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Restaurant De Hapke"
          />
        </label>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Contact e-mail*
          <input
            required
            type="email"
            style={inputStyle}
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="contact@restaurant.nl"
          />
        </label>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Wachtwoord*
          <input
            required
            type="password"
            style={inputStyle}
            value={form.password}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, password: e.target.value }))
            }
            placeholder="Minimaal 8 tekens"
          />
        </label>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Contactpersoon
          <input
            style={inputStyle}
            value={form.contactName}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, contactName: e.target.value }))
            }
          />
        </label>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Telefoonnummer
          <input
            style={inputStyle}
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </label>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Straat + nummer
          <input
            style={inputStyle}
            value={form.street}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, street: e.target.value }))
            }
          />
        </label>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1, fontWeight: 600 }}>
            Postcode
            <input
              style={inputStyle}
              value={form.postalCode}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, postalCode: e.target.value }))
              }
            />
          </label>
          <label style={{ flex: 1, fontWeight: 600 }}>
            Plaats
            <input
              style={inputStyle}
              value={form.city}
              onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            />
          </label>
        </div>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Korte omschrijving
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={form.description}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Beschrijf jouw keuken, specialiteiten of openingstijden"
          />
        </label>

        {error && (
          <div style={{ color: '#b91c1c', marginTop: 10, marginBottom: 10 }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            border: 'none',
            borderRadius: 8,
            background: '#14B8A6',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: '0 2px 0 #FFC857',
          }}
        >
          {loading ? 'Versturen…' : 'Account aanmaken'}
        </button>
      </form>

      <p style={{ marginTop: 16 }}>
        Al een account? <Link to="/login">Log direct in</Link>.
      </p>
    </div>
  )
}
