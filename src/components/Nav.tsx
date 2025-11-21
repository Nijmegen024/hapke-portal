import { type CSSProperties, useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'
const NAV_LINKS = [
  { to: '/orders', label: 'Dashboard' },
  { to: '/menu', label: 'Menu' },
  { to: '/settings', label: 'Instellingen' },
]

export default function Nav() {
  const location = useLocation()
  const [pending, setPending] = useState(false)
  const [isAuthed, setIsAuthed] = useState(
    typeof window !== 'undefined' && localStorage.getItem(SESSION_KEY) === '1',
  )

  useEffect(() => {
    setIsAuthed(localStorage.getItem(SESSION_KEY) === '1')
  }, [location.key])

  async function logout() {
    setPending(true)
    try {
      await fetch(`${API_BASE}/vendor/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (err) {
      console.warn('Vendor logout mislukt', err)
    } finally {
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(TOKEN_KEY)
      setPending(false)
      window.location.href = '/login'
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px 16px',
        borderBottom: '1px solid #eee',
        fontFamily: 'sans-serif',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <Link to="/" style={{ textDecoration: 'none' }}>
        <strong>Hapke • Restaurant Portal</strong>
      </Link>
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        {isAuthed && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                style={({ isActive }) => navLinkStyle(isActive)}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          {!isAuthed && <Link to="/register">Registreren</Link>}
          {!isAuthed && <Link to="/login">Inloggen</Link>}
          {isAuthed && (
            <button onClick={logout} disabled={pending}>
              {pending ? 'Uitloggen…' : 'Uitloggen'}
            </button>
          )}
        </div>
      </div>
    </div>
  )

  function navLinkStyle(active: boolean): CSSProperties {
    return {
      textDecoration: 'none',
      padding: '6px 10px',
      borderRadius: 8,
      fontWeight: 600,
      color: active ? '#14B8A6' : '#475569',
      backgroundColor: active ? '#e0f7f4' : 'transparent',
      border: '1px solid',
      borderColor: active ? '#14B8A6' : 'transparent',
      boxShadow: active ? '0 2px 0 #FFC857' : 'none',
    }
  }
}
