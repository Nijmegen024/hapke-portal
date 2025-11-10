import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
export default function Nav() {
    const location = useLocation();
    const [pending, setPending] = useState(false);
    const [isAuthed, setIsAuthed] = useState(typeof window !== 'undefined' && localStorage.getItem(SESSION_KEY) === '1');
    useEffect(() => {
        setIsAuthed(localStorage.getItem(SESSION_KEY) === '1');
    }, [location.key]);
    async function logout() {
        setPending(true);
        try {
            await fetch(`${API_BASE}/vendor/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        }
        catch (err) {
            console.warn('Vendor logout mislukt', err);
        }
        finally {
            localStorage.removeItem(SESSION_KEY);
            localStorage.removeItem(TOKEN_KEY);
            setPending(false);
            window.location.href = '/login';
        }
    }
    return (_jsxs("div", { style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 16px',
            borderBottom: '1px solid #eee',
            fontFamily: 'sans-serif',
        }, children: [_jsx(Link, { to: "/", style: { textDecoration: 'none' }, children: _jsx("strong", { children: "Hapke \u2022 Restaurant Portal" }) }), _jsxs("div", { style: { display: 'flex', gap: 12 }, children: [!isAuthed && _jsx(Link, { to: "/register", children: "Registreren" }), !isAuthed && _jsx(Link, { to: "/login", children: "Inloggen" }), isAuthed && (_jsx("button", { onClick: logout, disabled: pending, children: pending ? 'Uitloggen…' : 'Uitloggen' }))] })] }));
}
