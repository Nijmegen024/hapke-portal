import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchAdminRestaurants,
  updateAdminRestaurant,
} from './adminApi';

type Restaurant = {
  id: string;
  name: string;
  description?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
  minOrder?: number | null;
  deliveryFee?: number | null;
  isActive?: boolean | null;
  _count?: { orders: number };
};

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const selected = useMemo(
    () => restaurants.find((r) => r.id === selectedId) || null,
    [restaurants, selectedId],
  );

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return;
    }
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (selected) {
      setForm({
        name: selected.name || '',
        description: selected.description || '',
        street: selected.street || '',
        city: selected.city || '',
        postalCode: selected.postalCode || '',
        minOrder: selected.minOrder ?? '',
        deliveryFee: selected.deliveryFee ?? '',
        isActive: selected.isActive ?? false,
      });
    }
  }, [selected]);

  const loadRestaurants = async () => {
    try {
      const data = await fetchAdminRestaurants();
      setRestaurants(data);
      if (data.length && !selectedId) {
        setSelectedId(data[0].id);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Kon data niet laden');
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    setMessage(null);
    try {
      await updateAdminRestaurant(selected.id, {
        ...form,
        minOrder:
          form.minOrder === '' || form.minOrder === null
            ? undefined
            : Number(form.minOrder),
        deliveryFee:
          form.deliveryFee === '' || form.deliveryFee === null
            ? undefined
            : Number(form.deliveryFee),
      });
      setMessage('Opgeslagen');
      await loadRestaurants();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Opslaan mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin • Restaurants</h2>
        <button
          onClick={() => {
            localStorage.removeItem('adminToken');
            navigate('/admin/login');
          }}
          style={{ background: 'transparent', border: '1px solid #e5e7eb', padding: '8px 12px', borderRadius: 8 }}
        >
          Uitloggen
        </button>
      </div>

      {message && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#f3f4f6' }}>
          {message}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Restaurants</h3>
          <div style={{ maxHeight: 500, overflow: 'auto', border: '1px solid #e5e7eb', borderRadius: 10 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: 8, textAlign: 'left' }}>Naam</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Plaats</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Orders</th>
                </tr>
              </thead>
              <tbody>
                {restaurants.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    style={{
                      cursor: 'pointer',
                      background: selectedId === r.id ? '#ecfeff' : 'transparent',
                    }}
                  >
                    <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>{r.name}</td>
                    <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>
                      {[r.city, r.postalCode].filter(Boolean).join(' ')}
                    </td>
                    <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>{r._count?.orders ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: 16 }}>
          <h3 style={{ marginBottom: 12 }}>Bewerken</h3>
          {selected ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {renderInput('Naam', 'name')}
              {renderInput('Beschrijving', 'description', 'textarea')}
              {renderInput('Straat', 'street')}
              {renderInput('Postcode', 'postalCode')}
              {renderInput('Plaats', 'city')}
              {renderInput('Min. order (€)', 'minOrder')}
              {renderInput('Bezorgkosten (€)', 'deliveryFee')}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={!!form.isActive}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                />
                Actief
              </label>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  marginTop: 8,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: '#14B8A6',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Opslaan...' : 'Opslaan'}
              </button>
            </div>
          ) : (
            <p>Selecteer een restaurant.</p>
          )}
        </div>
      </div>
    </div>
  );

  function renderInput(label: string, key: string, type: 'text' | 'textarea' = 'text') {
    if (type === 'textarea') {
      return (
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>{label}</span>
          <textarea
            value={form[key] ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb', minHeight: 80 }}
          />
        </label>
      );
    }
    return (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <input
          type="text"
          value={form[key] ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
        />
      </label>
    );
  }
}
