import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from './adminApi';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await adminLogin(email, password);
      navigate('/admin/restaurants');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: '32px', background: '#fff', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
      <h2 style={{ marginBottom: 12 }}>Admin login</h2>
      <p style={{ color: '#4b5563', marginBottom: 20 }}>Log in met je admin-account.</p>
      {error && <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '10px 12px', borderRadius: 8, marginBottom: 12 }}>{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Wachtwoord</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '12px',
            borderRadius: 10,
            border: 'none',
            background: '#14B8A6',
            color: '#fff',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Inloggen...' : 'Inloggen'}
        </button>
      </form>
    </div>
  );
}
