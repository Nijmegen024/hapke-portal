import { useState } from 'react'
import { Link } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)
    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/vendor/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
        }),
      })

      if (res.status === 401) {
        setError('Ongeldige inloggegevens')
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Login mislukt')
      }

      const data = await res.json()
      if (data?.token) {
        localStorage.setItem(TOKEN_KEY, data.token as string)
      }
      localStorage.setItem(SESSION_KEY, '1')
      window.location.href = '/orders'
    } catch (err: any) {
      setError(err?.message || 'Er ging iets mis')
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
    <div style={{ maxWidth: 360, margin: '40px auto', fontFamily: 'sans-serif' }}>
      <h2>Restaurant login</h2>
      <form onSubmit={onSubmit}>
        <input
          required
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
          type="email"
        />
        <input
          required
          placeholder="Wachtwoord"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button
          disabled={loading}
          type="submit"
          style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontWeight: 600 }}
        >
          {loading ? 'Inloggen…' : 'Inloggen'}
        </button>
        {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      </form>
      <p style={{ marginTop: 12 }}>
        Nog geen account? <Link to="/register">Registreer je bedrijf</Link>.
      </p>
    </div>
  )
}
