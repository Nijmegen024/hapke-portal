import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'

export default function Account() {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (saving) return
    setMessage(null)
    setError(null)
    if (!form.email.trim() && !form.newPassword.trim()) {
      setError('Vul een nieuw e-mailadres of een nieuw wachtwoord in.')
      return
    }
    setSaving(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }
      if (token) headers.Authorization = `Bearer ${token}`

      const res = await fetch(`${API_BASE}/vendor/account`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          email: form.email.trim() || undefined,
          currentPassword: form.currentPassword || undefined,
          newPassword: form.newPassword || undefined,
        }),
      })

      if (res.status === 401) {
        localStorage.removeItem(SESSION_KEY)
        localStorage.removeItem(TOKEN_KEY)
        navigate('/login', { replace: true })
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Aanpassen mislukt')
      }

      setMessage('Gegevens bijgewerkt. Log eventueel opnieuw in met je nieuwe gegevens.')
    } catch (err: any) {
      setError(err?.message || 'Aanpassen mislukt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '30px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>Account</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Pas hier je e-mailadres of wachtwoord aan. Gebruik je huidige wachtwoord om een nieuw wachtwoord te zetten.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 10px 30px rgba(15,23,42,0.05)' }}
      >
        <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>
          Nieuw e-mailadres
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="bijv. contact@restaurant.nl"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>
          Huidig wachtwoord
          <input
            type="password"
            value={form.currentPassword}
            onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))}
            placeholder="Huidig wachtwoord"
            style={inputStyle}
          />
        </label>

        <label style={{ display: 'block', fontWeight: 600, marginTop: 12 }}>
          Nieuw wachtwoord
          <input
            type="password"
            value={form.newPassword}
            onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))}
            placeholder="Nieuw wachtwoord"
            style={inputStyle}
          />
        </label>

        {error && <div style={{ color: '#b91c1c', marginTop: 12 }}>{error}</div>}
        {message && <div style={{ color: '#15803d', marginTop: 12 }}>{message}</div>}

        <div style={{ marginTop: 18 }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: '#14B8A6',
              color: '#fff',
              fontWeight: 700,
              cursor: saving ? 'wait' : 'pointer',
              boxShadow: '0 2px 0 #FFC857',
            }}
          >
            {saving ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </form>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: '1px solid #d1d5db',
  marginTop: 6,
}
