import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAdminOrders } from './adminApi';

type Order = {
  id: string;
  orderNumber?: string;
  total?: number;
  status?: string;
  createdAt?: string;
  restaurantId?: string | null;
  vendor?: { name?: string | null } | null;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filters, setFilters] = useState<{ restaurantId?: string; from?: string; to?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) {
      navigate('/admin/login');
      return;
    }
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminOrders(filters);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kon orders niet laden');
    } finally {
      setLoading(false);
    }
  };

  const onFilterChange = (key: 'restaurantId' | 'from' | 'to', value: string) => {
    setFilters((f) => ({ ...f, [key]: value || undefined }));
  };

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Admin • Orders</h2>
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

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Restaurant ID</span>
          <input
            value={filters.restaurantId || ''}
            onChange={(e) => onFilterChange('restaurantId', e.target.value)}
            placeholder="optioneel"
            style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Vanaf</span>
          <input
            type="date"
            value={filters.from || ''}
            onChange={(e) => onFilterChange('from', e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </label>
        <label style={{ display: 'grid', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>Tot</span>
          <input
            type="date"
            value={filters.to || ''}
            onChange={(e) => onFilterChange('to', e.target.value)}
            style={{ padding: 10, borderRadius: 8, border: '1px solid #e5e7eb' }}
          />
        </label>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8 }}>
          <button
            onClick={loadOrders}
            disabled={loading}
            style={{ padding: '12px 14px', borderRadius: 10, border: 'none', background: '#14B8A6', color: '#fff', fontWeight: 700 }}
          >
            {loading ? 'Laden...' : 'Toepassen'}
          </button>
          <button
            onClick={() => {
              setFilters({});
              setTimeout(loadOrders, 0);
            }}
            style={{ padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', background: '#fff' }}
          >
            Reset
          </button>
        </div>
      </div>

      {error && (
        <div style={{ marginTop: 12, padding: 10, borderRadius: 8, background: '#fee2e2', color: '#b91c1c' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: 20, background: '#fff', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.06)', padding: 16 }}>
        <div style={{ overflow: 'auto', maxHeight: 520 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#f9fafb', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: 8, textAlign: 'left' }}>Order</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Bedrag</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Restaurant</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Datum</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>{o.orderNumber || o.id}</td>
                  <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>{o.status}</td>
                  <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>
                    {o.total != null ? `€ ${(Number(o.total) || 0).toFixed(2)}` : '-'}
                  </td>
                  <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>{o.vendor?.name || '-'}</td>
                  <td style={{ padding: 8, borderTop: '1px solid #e5e7eb' }}>
                    {o.createdAt ? new Date(o.createdAt).toLocaleString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
