import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
const STATUS_ACTIONS = [
    { label: 'Ontvangen', value: 'RECEIVED' },
    { label: 'Bereiden', value: 'PREPARING' },
    { label: 'Onderweg', value: 'ON_THE_WAY' },
    { label: 'Afgeleverd', value: 'DELIVERED' },
];
export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [error, setError] = useState(null);
    const [authed, setAuthed] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState({});
    const [statusMessages, setStatusMessages] = useState({});
    const pollRef = useRef(null);
    const navigate = useNavigate();
    const clearPoll = useCallback(() => {
        if (pollRef.current) {
            window.clearInterval(pollRef.current);
            pollRef.current = null;
        }
    }, []);
    const redirectToLogin = useCallback(() => {
        clearPoll();
        setOrders([]);
        setAuthed(false);
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        navigate('/login', { replace: true });
    }, [clearPoll, navigate]);
    const fetchOrders = useCallback(async () => {
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const headers = {};
            if (token)
                headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/vendor/orders`, {
                credentials: 'include',
                headers,
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            if (!res.ok)
                throw new Error('Kan orders niet ophalen');
            const data = await res.json();
            setError(null);
            setAuthed(true);
            setOrders(data);
        }
        catch (e) {
            if (e?.message === 'Kan orders niet ophalen') {
                setError(e.message);
            }
            else {
                setError(e?.message || 'Fout bij laden');
            }
        }
    }, [redirectToLogin]);
    useEffect(() => {
        fetchOrders();
        pollRef.current = window.setInterval(fetchOrders, 5000);
        return clearPoll;
    }, [fetchOrders, clearPoll]);
    return (_jsxs("div", { style: { maxWidth: 900, margin: '20px auto', fontFamily: 'sans-serif' }, children: [_jsx("h2", { children: "Dashboard \u2014 Nieuwe orders" }), !authed && (_jsxs("div", { style: { padding: 12, border: '1px solid #ffd28a', background: '#fff7e6', marginBottom: 16 }, children: [_jsx("strong", { children: "Niet ingelogd." }), " ", _jsx("span", { children: "Log in om live orders te zien." }), ' ', _jsx(Link, { to: "/login", children: "Naar inloggen \u2192" })] })), error && _jsx("div", { style: { color: 'red' }, children: error }), authed && orders.length === 0 && (_jsxs("div", { children: [_jsx("div", { children: "Geen nieuwe orders\u2026" }), _jsx("pre", { style: { marginTop: 8, background: '#f5f5f5', padding: 12, borderRadius: 4 }, children: JSON.stringify(orders, null, 2) })] })), authed && orders.map(o => (_jsxs("div", { style: { border: '1px solid #ddd', padding: 12, marginBottom: 12 }, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsxs("strong", { children: ["#", o.id] }), _jsx("span", { children: new Date(o.createdAt).toLocaleTimeString() })] }), _jsx("ul", { children: o.items.map((it, i) => _jsxs("li", { children: [it.qty, "\u00D7 ", it.name] }, i)) }), o.note && _jsxs("div", { children: [_jsx("em", { children: "Opmerking:" }), " ", o.note] }), typeof o.total === 'number' && _jsxs("div", { children: [_jsx("strong", { children: "Totaal:" }), " \u20AC", o.total.toFixed(2)] }), _jsx("div", { style: { marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }, children: STATUS_ACTIONS.map(action => (_jsx("button", { onClick: () => updateStatus(o.id, action.value), style: statusButtonStyle(o.status, action.value, !!loadingOrders[o.id]), disabled: !!loadingOrders[o.id], children: action.label }, action.value))) }), statusMessages[o.id] && (_jsx("div", { style: { marginTop: 8, color: '#b91c1c' }, children: statusMessages[o.id] }))] }, o.id)))] }));
    function statusButtonStyle(currentStatus, targetStatus, isDisabled) {
        const isActive = currentStatus === targetStatus;
        return {
            backgroundColor: isActive ? '#16a34a' : '#d1d5db',
            color: isActive ? '#fff' : '#111827',
            border: 'none',
            borderRadius: 6,
            padding: '6px 12px',
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.7 : 1,
            transition: 'background-color 0.2s ease, opacity 0.2s ease',
        };
    }
    async function updateStatus(id, status) {
        setStatusMessages(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setLoadingOrders(prev => ({ ...prev, [id]: true }));
        setError(null);
        try {
            const token = localStorage.getItem(TOKEN_KEY);
            const headers = { 'Content-Type': 'application/json' };
            if (token)
                headers.Authorization = `Bearer ${token}`;
            const res = await fetch(`${API_BASE}/vendor/orders/${id}/status`, {
                method: 'PATCH',
                headers,
                credentials: 'include',
                body: JSON.stringify({ status }),
            });
            if (res.status === 401) {
                redirectToLogin();
                return;
            }
            if (res.status === 400 || res.status === 409) {
                setStatusMessages(prev => ({ ...prev, [id]: 'Statusoverschakeling niet toegestaan' }));
                return;
            }
            if (!res.ok) {
                setError('Status bijwerken mislukt');
                return;
            }
            await fetchOrders();
        }
        catch (e) {
            setError(e?.message || 'Status bijwerken mislukt');
        }
        finally {
            setLoadingOrders(prev => {
                const next = { ...prev };
                delete next[id];
                return next;
            });
        }
    }
}
