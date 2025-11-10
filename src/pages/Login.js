import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (loading)
            return;
        setError(null);
        setLoading(true);
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
            });
            if (res.status === 401) {
                setError('Ongeldige inloggegevens');
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Login mislukt');
            }
            const data = await res.json();
            if (data?.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
            }
            localStorage.setItem(SESSION_KEY, '1');
            window.location.href = '/orders';
        }
        catch (err) {
            setError(err?.message || 'Er ging iets mis');
        }
        finally {
            setLoading(false);
        }
    }
    const inputStyle = {
        width: '100%',
        padding: 10,
        marginBottom: 10,
        borderRadius: 6,
        border: '1px solid #d1d5db',
    };
    return (_jsxs("div", { style: { maxWidth: 360, margin: '40px auto', fontFamily: 'sans-serif' }, children: [_jsx("h2", { children: "Restaurant login" }), _jsxs("form", { onSubmit: onSubmit, children: [_jsx("input", { required: true, placeholder: "E-mail", value: email, onChange: (e) => setEmail(e.target.value), style: inputStyle, type: "email" }), _jsx("input", { required: true, placeholder: "Wachtwoord", type: "password", value: password, onChange: (e) => setPassword(e.target.value), style: inputStyle }), _jsx("button", { disabled: loading, type: "submit", style: { width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#111827', color: '#fff', fontWeight: 600 }, children: loading ? 'Inloggen…' : 'Inloggen' }), error && _jsx("div", { style: { color: 'red', marginTop: 10 }, children: error })] }), _jsxs("p", { style: { marginTop: 12 }, children: ["Nog geen account? ", _jsx(Link, { to: "/register", children: "Registreer je bedrijf" }), "."] })] }));
}
