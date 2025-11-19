import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
const EMPTY_FORM = {
    name: '',
    description: '',
    minOrderAmount: '',
};
export default function Settings() {
    const navigate = useNavigate();
    const [form, setForm] = useState(EMPTY_FORM);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        navigate('/login', { replace: true });
    }, [navigate]);
    const fetchRestaurant = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = {
                Accept: 'application/json',
            };
            const token = localStorage.getItem(TOKEN_KEY);
            if (token)
                headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/vendor/restaurant`, {
                credentials: 'include',
                headers,
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                throw new Error('Kan gegevens niet ophalen');
            }
            const data = await res.json();
            setForm({
                name: data.name ?? '',
                description: data.description ?? '',
                minOrderAmount: resolveMinimumOrderAmount(data),
            });
        }
        catch (err) {
            setError(err?.message || 'Kon restaurantgegevens niet laden');
        }
        finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);
    useEffect(() => {
        fetchRestaurant();
    }, [fetchRestaurant]);
    useEffect(() => {
        if (!success)
            return;
        const timeout = window.setTimeout(() => setSuccess(null), 3000);
        return () => window.clearTimeout(timeout);
    }, [success]);
    function resolveMinimumOrderAmount(data) {
        const value = data.minimumOrderAmount ??
            data.minimumOrderValue ??
            data.minOrderAmount ??
            data.minOrderValue ??
            null;
        if (typeof value === 'number') {
            return value.toFixed(2);
        }
        return '';
    }
    async function onSubmit(e) {
        e.preventDefault();
        if (saving)
            return;
        setError(null);
        setSuccess(null);
        if (!form.name.trim()) {
            setError('Naam is verplicht');
            return;
        }
        const parsedValue = parseFloat(form.minOrderAmount.replace(',', '.').trim() || '0');
        if (Number.isNaN(parsedValue) || parsedValue < 0) {
            setError('Voer een geldig minimaal bestelbedrag in');
            return;
        }
        setSaving(true);
        try {
            const headers = {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            };
            const token = localStorage.getItem(TOKEN_KEY);
            if (token)
                headers.Authorization = `Bearer ${token}`;
            const payload = {
                name: form.name.trim(),
                description: form.description.trim(),
                minimumOrderAmount: Number(parsedValue.toFixed(2)),
            };
            const res = await fetch(`${API_BASE}/vendor/restaurant`, {
                method: 'PUT',
                credentials: 'include',
                headers,
                body: JSON.stringify(payload),
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Opslaan mislukt');
            }
            const data = await res.json();
            setForm({
                name: data.name ?? payload.name,
                description: data.description ?? payload.description,
                minOrderAmount: resolveMinimumOrderAmount(data),
            });
            setSuccess('Gegevens opgeslagen');
        }
        catch (err) {
            setError(err?.message || 'Opslaan mislukt');
        }
        finally {
            setSaving(false);
        }
    }
    const inputStyle = {
        width: '100%',
        padding: 10,
        borderRadius: 8,
        border: '1px solid #d1d5db',
        marginTop: 4,
    };
    return (_jsxs("div", { style: {
            maxWidth: 640,
            margin: '30px auto',
            fontFamily: 'sans-serif',
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
        }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Instellingen" }), _jsx("p", { style: { color: '#475569', marginTop: 0 }, children: "Pas hier de basisgegevens van je restaurant aan. De klant-app gebruikt deze gegevens direct." }), loading ? (_jsx("div", { style: { padding: '20px 0' }, children: "Gegevens laden\u2026" })) : (_jsxs("form", { onSubmit: onSubmit, children: [_jsxs("label", { style: { display: 'block', fontWeight: 600, marginTop: 16 }, children: ["Restaurantnaam", _jsx("input", { required: true, style: inputStyle, value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Restaurant naam" })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600, marginTop: 16 }, children: ["Korte beschrijving", _jsx("textarea", { style: { ...inputStyle, minHeight: 80, resize: 'vertical' }, value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Vertel iets over jullie keuken" })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600, marginTop: 16 }, children: ["Minimaal bestelbedrag (in euro\u2019s)", _jsx("input", { type: "number", min: "0", step: "0.01", style: inputStyle, value: form.minOrderAmount, onChange: (e) => setForm((prev) => ({ ...prev, minOrderAmount: e.target.value })), placeholder: "25.00" })] }), error && (_jsx("div", { style: { color: '#b91c1c', marginTop: 12 }, children: error })), success && (_jsx("div", { style: {
                            color: '#15803d',
                            marginTop: 12,
                            background: '#dcfce7',
                            padding: '8px 12px',
                            borderRadius: 6,
                        }, children: success })), _jsx("div", { style: { marginTop: 24 }, children: _jsx("button", { type: "submit", disabled: saving, style: {
                                padding: '10px 18px',
                                borderRadius: 8,
                                border: 'none',
                                background: '#111827',
                                color: '#fff',
                                fontWeight: 600,
                                cursor: saving ? 'wait' : 'pointer',
                            }, children: saving ? 'Opslaan…' : 'Opslaan' }) })] }))] }));
}
