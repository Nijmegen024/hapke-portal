import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Link } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
const initialState = {
    name: '',
    email: '',
    password: '',
    contactName: '',
    phone: '',
    street: '',
    postalCode: '',
    city: '',
    description: '',
};
export default function Register() {
    const [form, setForm] = useState(initialState);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    async function onSubmit(e) {
        e.preventDefault();
        if (loading)
            return;
        setError(null);
        setLoading(true);
        const payload = {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
        };
        if (form.contactName.trim())
            payload.contactName = form.contactName.trim();
        if (form.phone.trim())
            payload.phone = form.phone.trim();
        if (form.street.trim())
            payload.street = form.street.trim();
        if (form.postalCode.trim())
            payload.postalCode = form.postalCode.trim();
        if (form.city.trim())
            payload.city = form.city.trim();
        if (form.description.trim())
            payload.description = form.description.trim();
        try {
            const res = await fetch(`${API_BASE}/vendor/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload),
            });
            if (res.status === 400) {
                const data = await res.json().catch(() => null);
                const message = (data && (data.message || data.error)) ||
                    'Registratiegegevens zijn ongeldig';
                setError(message);
                return;
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Registratie mislukt');
            }
            const data = await res.json();
            if (data?.token) {
                localStorage.setItem(TOKEN_KEY, data.token);
            }
            localStorage.setItem(SESSION_KEY, '1');
            window.location.href = '/orders';
        }
        catch (err) {
            setError(err?.message || 'Registratie mislukt');
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
    return (_jsxs("div", { style: {
            maxWidth: 480,
            margin: '30px auto 60px',
            fontFamily: 'sans-serif',
            background: '#fff',
            padding: 24,
            borderRadius: 12,
            boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
        }, children: [_jsx("h2", { style: { marginTop: 0 }, children: "Meld jouw restaurant aan" }), _jsx("p", { style: { color: '#475569' }, children: "Vul de gegevens van je restaurant in. Na registratie kun je meteen inloggen en je menu aanvullen." }), _jsxs("form", { onSubmit: onSubmit, children: [_jsxs("label", { style: { display: 'block', fontWeight: 600, marginTop: 12 }, children: ["Bedrijfsnaam*", _jsx("input", { required: true, style: inputStyle, value: form.name, onChange: (e) => setForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Restaurant De Hapke" })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Contact e-mail*", _jsx("input", { required: true, type: "email", style: inputStyle, value: form.email, onChange: (e) => setForm((prev) => ({ ...prev, email: e.target.value })), placeholder: "contact@restaurant.nl" })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Wachtwoord*", _jsx("input", { required: true, type: "password", style: inputStyle, value: form.password, onChange: (e) => setForm((prev) => ({ ...prev, password: e.target.value })), placeholder: "Minimaal 8 tekens" })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Contactpersoon", _jsx("input", { style: inputStyle, value: form.contactName, onChange: (e) => setForm((prev) => ({ ...prev, contactName: e.target.value })) })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Telefoonnummer", _jsx("input", { style: inputStyle, value: form.phone, onChange: (e) => setForm((prev) => ({ ...prev, phone: e.target.value })) })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Straat + nummer", _jsx("input", { style: inputStyle, value: form.street, onChange: (e) => setForm((prev) => ({ ...prev, street: e.target.value })) })] }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [_jsxs("label", { style: { flex: 1, fontWeight: 600 }, children: ["Postcode", _jsx("input", { style: inputStyle, value: form.postalCode, onChange: (e) => setForm((prev) => ({ ...prev, postalCode: e.target.value })) })] }), _jsxs("label", { style: { flex: 1, fontWeight: 600 }, children: ["Plaats", _jsx("input", { style: inputStyle, value: form.city, onChange: (e) => setForm((prev) => ({ ...prev, city: e.target.value })) })] })] }), _jsxs("label", { style: { display: 'block', fontWeight: 600 }, children: ["Korte omschrijving", _jsx("textarea", { style: { ...inputStyle, minHeight: 80, resize: 'vertical' }, value: form.description, onChange: (e) => setForm((prev) => ({ ...prev, description: e.target.value })), placeholder: "Beschrijf jouw keuken, specialiteiten of openingstijden" })] }), error && (_jsx("div", { style: { color: '#b91c1c', marginTop: 10, marginBottom: 10 }, children: error })), _jsx("button", { type: "submit", disabled: loading, style: {
                            width: '100%',
                            padding: 12,
                            border: 'none',
                            borderRadius: 8,
                            background: '#111827',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 600,
                            cursor: loading ? 'wait' : 'pointer',
                        }, children: loading ? 'Versturen…' : 'Account aanmaken' })] }), _jsxs("p", { style: { marginTop: 16 }, children: ["Al een account? ", _jsx(Link, { to: "/login", children: "Log direct in" }), "."] })] }));
}
