const API_BASE = import.meta.env.VITE_API_BASE as string;

const authHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export async function adminLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Login mislukt');
  }
  const data = await res.json();
  if (!data.accessToken) {
    throw new Error('Geen access token ontvangen');
  }
  localStorage.setItem('adminToken', data.accessToken);
  if (data.user) {
    localStorage.setItem('adminUser', JSON.stringify(data.user));
  }
  return data;
}

export async function fetchAdminRestaurants() {
  const res = await fetch(`${API_BASE}/admin/restaurants`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error('Kon restaurants niet laden');
  return res.json();
}

export async function updateAdminRestaurant(
  id: string,
  updates: Record<string, unknown>,
) {
  const res = await fetch(`${API_BASE}/admin/restaurants/${id}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error('Kon restaurant niet bijwerken');
  return res.json();
}

export async function fetchAdminOrders(params?: {
  restaurantId?: string;
  from?: string;
  to?: string;
}) {
  const query = new URLSearchParams();
  if (params?.restaurantId) query.set('restaurantId', params.restaurantId);
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);

  const res = await fetch(
    `${API_BASE}/admin/orders${query.toString() ? `?${query.toString()}` : ''}`,
    {
      headers: { ...authHeaders() },
    },
  );
  if (!res.ok) throw new Error('Kon orders niet laden');
  return res.json();
}
