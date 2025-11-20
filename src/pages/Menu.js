import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useRef, useState, } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE = import.meta.env.VITE_API_BASE;
const SESSION_KEY = 'vendor_session';
const TOKEN_KEY = 'vendor_token';
const blankItemForm = () => ({
    id: null,
    name: '',
    description: '',
    price: '',
    available: true,
});
const currencyFormatter = new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
});
export default function MenuPage() {
    const navigate = useNavigate();
    const selectedCategoryRef = useRef(null);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [categoryNameDraft, setCategoryNameDraft] = useState('');
    const [newCategoryName, setNewCategoryName] = useState('');
    const [itemForm, setItemForm] = useState(() => blankItemForm());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [flash, setFlash] = useState(null);
    const [creatingCategory, setCreatingCategory] = useState(false);
    const [renamingCategory, setRenamingCategory] = useState(false);
    const [deletingCategory, setDeletingCategory] = useState(false);
    const [savingItem, setSavingItem] = useState(false);
    const [itemDeleting, setItemDeleting] = useState({});
    const [availabilityLoading, setAvailabilityLoading] = useState({});
    const selectedCategory = useMemo(() => categories.find((cat) => cat.id === selectedCategoryId) || null, [categories, selectedCategoryId]);
    useEffect(() => {
        selectedCategoryRef.current = selectedCategoryId;
    }, [selectedCategoryId]);
    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(TOKEN_KEY);
        navigate('/login', { replace: true });
    }, [navigate]);
    const fetchMenu = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const headers = buildHeaders();
            const res = await fetch(`${API_BASE}/vendor/menu`, {
                credentials: 'include',
                headers,
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                throw new Error('Menu ophalen mislukt');
            }
            const data = await res.json();
            const parsedCategories = Array.isArray(data)
                ? data.map(normalizeCategory)
                : [];
            setCategories(parsedCategories);
            const previousSelection = selectedCategoryRef.current;
            const nextSelection = previousSelection &&
                parsedCategories.some((cat) => cat.id === previousSelection)
                ? previousSelection
                : parsedCategories[0]?.id ?? null;
            setSelectedCategoryId(nextSelection);
        }
        catch (err) {
            setError(err?.message || 'Menu ophalen mislukt');
        }
        finally {
            setLoading(false);
        }
    }, [handleUnauthorized]);
    useEffect(() => {
        fetchMenu();
    }, [fetchMenu]);
    useEffect(() => {
        if (!flash)
            return;
        const timeout = window.setTimeout(() => setFlash(null), 2500);
        return () => window.clearTimeout(timeout);
    }, [flash]);
    useEffect(() => {
        const current = categories.find((cat) => cat.id === selectedCategoryId);
        setCategoryNameDraft(current?.name ?? '');
    }, [categories, selectedCategoryId]);
    useEffect(() => {
        setItemForm(blankItemForm());
    }, [selectedCategoryId]);
    const categoryCountText = categories.length === 0
        ? 'Geen categorieën'
        : `${categories.length} categorieën`;
    if (loading) {
        return (_jsxs("div", { style: containerStyle, children: [_jsx("h2", { children: "Menu" }), _jsx("div", { children: "Menu laden\u2026" })] }));
    }
    return (_jsxs("div", { style: containerStyle, children: [_jsx("h2", { style: { marginBottom: 8 }, children: "Menu" }), _jsx("p", { style: { color: '#475569', marginTop: 0 }, children: "Beheer hier je categorie\u00EBn en gerechten. Alles wat je opslaat is direct zichtbaar in de klant-app." }), _jsx("div", { style: { marginBottom: 16, color: '#94a3b8', fontSize: 14 }, children: categoryCountText }), error && (_jsxs("div", { style: {
                    background: '#fee2e2',
                    border: '1px solid #fecaca',
                    padding: '10px 12px',
                    borderRadius: 8,
                    color: '#b91c1c',
                    marginBottom: 16,
                }, children: [error, ' ', _jsx("button", { type: "button", onClick: fetchMenu, style: {
                            border: 'none',
                            background: 'transparent',
                            color: '#b91c1c',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                        }, children: "Opnieuw laden" })] })), _jsxs("div", { style: {
                    display: 'flex',
                    gap: 24,
                    alignItems: 'flex-start',
                    flexWrap: 'wrap',
                }, children: [_jsxs("aside", { style: sidebarStyle, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between' }, children: [_jsx("strong", { children: "Categorie\u00EBn" }), _jsxs("span", { style: { color: '#94a3b8', fontSize: 12 }, children: [categories.length, "x"] })] }), _jsxs("div", { style: { marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }, children: [categories.map((cat) => (_jsxs("button", { type: "button", onClick: () => setSelectedCategoryId(cat.id), style: categoryButtonStyle(selectedCategoryId === cat.id), children: [_jsx("div", { style: { fontWeight: 600 }, children: cat.name }), _jsxs("div", { style: { fontSize: 12, color: '#94a3b8' }, children: [cat.items.length, " gerechten"] })] }, cat.id))), categories.length === 0 && (_jsx("div", { style: { fontSize: 13, color: '#94a3b8' }, children: "Nog geen categorie\u00EBn. Voeg de eerste toe." }))] }), _jsxs("form", { onSubmit: handleCreateCategory, style: {
                                    marginTop: 18,
                                    paddingTop: 18,
                                    borderTop: '1px solid #e2e8f0',
                                }, children: [_jsxs("label", { style: { display: 'block', fontSize: 13, fontWeight: 600 }, children: ["Nieuwe categorie", _jsx("input", { style: textInputStyle, placeholder: "Bijv. Pizza", value: newCategoryName, onChange: (e) => setNewCategoryName(e.target.value) })] }), _jsx("button", { type: "submit", disabled: creatingCategory, style: primaryButtonStyle(creatingCategory), children: creatingCategory ? 'Toevoegen…' : 'Toevoegen' })] })] }), _jsxs("section", { style: contentStyle, children: [flash && (_jsx("div", { style: flashStyle, children: flash })), actionError && (_jsx("div", { style: errorStyle, children: actionError })), !selectedCategory && (_jsx("div", { style: { color: '#94a3b8', fontStyle: 'italic' }, children: "Selecteer een categorie of maak een nieuwe aan om gerechten toe te voegen." })), selectedCategory && (_jsxs(_Fragment, { children: [_jsxs("form", { onSubmit: handleRenameCategory, style: {
                                            display: 'flex',
                                            gap: 12,
                                            flexWrap: 'wrap',
                                            marginBottom: 20,
                                        }, children: [_jsx("div", { style: { flex: 1, minWidth: 200 }, children: _jsxs("label", { style: { fontSize: 13, fontWeight: 600, display: 'block' }, children: ["Categorienaam", _jsx("input", { style: textInputStyle, value: categoryNameDraft, onChange: (e) => setCategoryNameDraft(e.target.value) })] }) }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { type: "submit", disabled: renamingCategory, style: primaryButtonStyle(renamingCategory), children: renamingCategory ? 'Opslaan…' : 'Categorie opslaan' }), _jsx("button", { type: "button", onClick: handleDeleteCategory, disabled: deletingCategory, style: dangerButtonStyle(deletingCategory), children: deletingCategory ? 'Verwijderen…' : 'Verwijderen' })] })] }), _jsxs("div", { children: [_jsx("h3", { style: { marginBottom: 8 }, children: "Gerechten" }), selectedCategory.items.length === 0 ? (_jsx("div", { style: {
                                                    padding: 16,
                                                    border: '1px dashed #cbd5f5',
                                                    borderRadius: 10,
                                                    color: '#94a3b8',
                                                }, children: "Nog geen gerechten in deze categorie." })) : (_jsx("div", { style: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }, children: selectedCategory.items.map((item) => (_jsxs("div", { style: itemCardStyle, children: [_jsxs("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }, children: [_jsxs("div", { children: [_jsx("div", { style: { fontWeight: 600 }, children: item.name }), item.description && (_jsx("div", { style: { fontSize: 13, color: '#64748b', marginTop: 4 }, children: item.description }))] }), _jsx("div", { style: { fontWeight: 600 }, children: currencyFormatter.format(item.price ?? 0) })] }), _jsxs("div", { style: { marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }, children: [_jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }, children: [_jsx("input", { type: "checkbox", checked: item.available, onChange: () => toggleAvailability(item), disabled: !!availabilityLoading[item.id] }), availabilityLoading[item.id]
                                                                            ? 'Opslaan…'
                                                                            : item.available
                                                                                ? 'Beschikbaar'
                                                                                : 'Niet beschikbaar'] }), _jsxs("div", { style: { display: 'flex', gap: 8 }, children: [_jsx("button", { type: "button", onClick: () => startEditItem(item), style: secondaryButtonStyle, children: "Bewerken" }), _jsx("button", { type: "button", onClick: () => handleDeleteItem(item), disabled: !!itemDeleting[item.id], style: dangerButtonStyle(!!itemDeleting[item.id]), children: itemDeleting[item.id] ? 'Verwijderen…' : 'Verwijderen' })] })] })] }, item.id))) }))] }), _jsxs("div", { style: {
                                            padding: 20,
                                            border: '1px solid #e2e8f0',
                                            borderRadius: 12,
                                            background: '#f8fafc',
                                        }, children: [_jsx("h3", { style: { marginTop: 0 }, children: itemForm.id ? 'Gerecht bewerken' : 'Nieuw gerecht' }), _jsxs("form", { onSubmit: handleItemSubmit, style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [_jsxs("label", { style: { fontSize: 13, fontWeight: 600 }, children: ["Naam", _jsx("input", { required: true, style: textInputStyle, value: itemForm.name, onChange: (e) => setItemForm((prev) => ({ ...prev, name: e.target.value })), placeholder: "Bijv. Margherita" })] }), _jsxs("label", { style: { fontSize: 13, fontWeight: 600 }, children: ["Korte omschrijving", _jsx("textarea", { style: { ...textInputStyle, minHeight: 70, resize: 'vertical' }, value: itemForm.description, onChange: (e) => setItemForm((prev) => ({
                                                                    ...prev,
                                                                    description: e.target.value,
                                                                })), placeholder: "Ingredi\u00EBnten, extra info\u2026" })] }), _jsxs("label", { style: { fontSize: 13, fontWeight: 600 }, children: ["Prijs (in euro\u2019s)", _jsx("input", { required: true, type: "number", min: "0", step: "0.01", style: textInputStyle, value: itemForm.price, onChange: (e) => setItemForm((prev) => ({ ...prev, price: e.target.value })), placeholder: "12.50" })] }), _jsxs("label", { style: { display: 'flex', alignItems: 'center', gap: 8 }, children: [_jsx("input", { type: "checkbox", checked: itemForm.available, onChange: (e) => setItemForm((prev) => ({ ...prev, available: e.target.checked })) }), "Beschikbaar voor klanten"] }), _jsxs("div", { style: { display: 'flex', gap: 8, flexWrap: 'wrap' }, children: [_jsx("button", { type: "submit", disabled: savingItem, style: primaryButtonStyle(savingItem), children: savingItem
                                                                    ? 'Opslaan…'
                                                                    : itemForm.id
                                                                        ? 'Gerecht opslaan'
                                                                        : 'Gerecht toevoegen' }), itemForm.id && (_jsx("button", { type: "button", onClick: () => setItemForm(blankItemForm()), style: secondaryButtonStyle, children: "Annuleren" }))] })] })] })] }))] })] })] }));
    function buildHeaders(hasBody = false) {
        const headers = {
            Accept: 'application/json',
        };
        const token = localStorage.getItem(TOKEN_KEY);
        if (token)
            headers.Authorization = `Bearer ${token}`;
        if (hasBody)
            headers['Content-Type'] = 'application/json';
        return headers;
    }
    function normalizeCategory(raw) {
        return {
            id: String(raw.id ?? raw._id ?? crypto.randomUUID()),
            name: raw.name ?? 'Naamloos',
            items: Array.isArray(raw.items)
                ? raw.items.map(normalizeItem)
                : [],
        };
    }
    function normalizeItem(raw) {
        const parsedPrice = typeof raw.price === 'number'
            ? raw.price
            : Number(raw.price ?? 0);
        return {
            id: String(raw.id ?? raw._id ?? crypto.randomUUID()),
            name: raw.name ?? 'Onbenoemd gerecht',
            description: raw.description ?? '',
            price: parsedPrice,
            available: raw.available !== false,
        };
    }
    async function handleCreateCategory(e) {
        e.preventDefault();
        if (creatingCategory)
            return;
        const name = newCategoryName.trim();
        if (!name) {
            setActionError('Voer een categorienaam in');
            return;
        }
        setCreatingCategory(true);
        setActionError(null);
        try {
            const res = await fetch(`${API_BASE}/vendor/menu/category`, {
                method: 'POST',
                headers: buildHeaders(true),
                credentials: 'include',
                body: JSON.stringify({ name }),
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Categorie opslaan mislukt');
            }
            const data = await res.json();
            const created = normalizeCategory(data);
            setCategories((prev) => [...prev, created]);
            setSelectedCategoryId(created.id);
            setNewCategoryName('');
            setFlash('Categorie opgeslagen');
        }
        catch (err) {
            setActionError(err?.message || 'Categorie opslaan mislukt');
        }
        finally {
            setCreatingCategory(false);
        }
    }
    async function handleRenameCategory(e) {
        e.preventDefault();
        if (!selectedCategory || renamingCategory)
            return;
        const name = categoryNameDraft.trim();
        if (!name) {
            setActionError('Categorie moet een naam hebben');
            return;
        }
        if (name === selectedCategory.name) {
            setActionError('Geen wijzigingen om op te slaan');
            return;
        }
        setRenamingCategory(true);
        setActionError(null);
        try {
            const res = await fetch(`${API_BASE}/vendor/menu/category/${selectedCategory.id}`, {
                method: 'PUT',
                headers: buildHeaders(true),
                credentials: 'include',
                body: JSON.stringify({ name }),
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Categorie bijwerken mislukt');
            }
            const updated = await res.json().catch(() => null);
            setCategories((prev) => prev.map((cat) => cat.id === selectedCategory.id
                ? updated
                    ? normalizeCategory({
                        ...cat,
                        ...updated,
                        items: updated.items ?? cat.items,
                    })
                    : { ...cat, name }
                : cat));
            setFlash('Categorie opgeslagen');
            setActionError(null);
        }
        catch (err) {
            setActionError(err?.message || 'Categorie bijwerken mislukt');
        }
        finally {
            setRenamingCategory(false);
        }
    }
    async function handleDeleteCategory() {
        if (!selectedCategory || deletingCategory)
            return;
        const hasItems = selectedCategory.items.length > 0;
        const confirmed = window.confirm(hasItems
            ? 'Deze categorie bevat nog gerechten. Weet je zeker dat je wilt verwijderen?'
            : 'Categorie verwijderen?');
        if (!confirmed)
            return;
        setDeletingCategory(true);
        setActionError(null);
        try {
            const res = await fetch(`${API_BASE}/vendor/menu/category/${selectedCategory.id}`, {
                method: 'DELETE',
                headers: buildHeaders(),
                credentials: 'include',
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Categorie verwijderen mislukt');
            }
            const filtered = categories.filter((cat) => cat.id !== selectedCategory.id);
            setCategories(filtered);
            setSelectedCategoryId((prev) => prev === selectedCategory.id ? filtered[0]?.id ?? null : prev);
            setFlash('Categorie verwijderd');
            setItemForm((prev) => prev.id ? blankItemForm() : prev);
        }
        catch (err) {
            setActionError(err?.message || 'Categorie verwijderen mislukt');
        }
        finally {
            setDeletingCategory(false);
        }
    }
    async function handleItemSubmit(e) {
        e.preventDefault();
        if (!selectedCategory || savingItem)
            return;
        const name = itemForm.name.trim();
        if (!name) {
            setActionError('Gerecht heeft een naam nodig');
            return;
        }
        const parsedPrice = parseFloat(itemForm.price.replace(',', '.').trim() || '0');
        if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
            setActionError('Voer een geldige prijs in');
            return;
        }
        const payload = {
            categoryId: selectedCategory.id,
            name,
            description: itemForm.description.trim(),
            price: Number(parsedPrice.toFixed(2)),
            available: itemForm.available,
        };
        setSavingItem(true);
        setActionError(null);
        try {
            const endpoint = itemForm.id
                ? `${API_BASE}/vendor/menu/item/${itemForm.id}`
                : `${API_BASE}/vendor/menu/item`;
            const res = await fetch(endpoint, {
                method: itemForm.id ? 'PUT' : 'POST',
                headers: buildHeaders(true),
                credentials: 'include',
                body: JSON.stringify(itemForm.id ? { ...payload } : payload),
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Gerecht opslaan mislukt');
            }
            const data = await res.json();
            const savedItem = normalizeItem(data);
            setCategories((prev) => prev.map((cat) => cat.id === selectedCategory.id
                ? {
                    ...cat,
                    items: upsertItem(cat.items, savedItem),
                }
                : cat));
            setItemForm(blankItemForm());
            setFlash('Gerecht opgeslagen');
        }
        catch (err) {
            setActionError(err?.message || 'Gerecht opslaan mislukt');
        }
        finally {
            setSavingItem(false);
        }
    }
    async function handleDeleteItem(item) {
        if (!selectedCategory)
            return;
        const confirmed = window.confirm(`Gerecht “${item.name}” verwijderen?`);
        if (!confirmed)
            return;
        setItemDeleting((prev) => ({ ...prev, [item.id]: true }));
        setActionError(null);
        try {
            const res = await fetch(`${API_BASE}/vendor/menu/item/${item.id}`, {
                method: 'DELETE',
                headers: buildHeaders(),
                credentials: 'include',
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Gerecht verwijderen mislukt');
            }
            setCategories((prev) => prev.map((cat) => cat.id === selectedCategory.id
                ? {
                    ...cat,
                    items: cat.items.filter((it) => it.id !== item.id),
                }
                : cat));
            setItemForm((prev) => prev.id === item.id ? blankItemForm() : prev);
            setFlash('Gerecht verwijderd');
        }
        catch (err) {
            setActionError(err?.message || 'Gerecht verwijderen mislukt');
        }
        finally {
            setItemDeleting((prev) => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
        }
    }
    function startEditItem(item) {
        setItemForm({
            id: item.id,
            name: item.name,
            description: item.description,
            price: item.price.toFixed(2),
            available: item.available,
        });
    }
    async function toggleAvailability(item) {
        if (!selectedCategory)
            return;
        setAvailabilityLoading((prev) => ({ ...prev, [item.id]: true }));
        setActionError(null);
        try {
            const res = await fetch(`${API_BASE}/vendor/menu/item/${item.id}`, {
                method: 'PUT',
                headers: buildHeaders(true),
                credentials: 'include',
                body: JSON.stringify({
                    name: item.name,
                    description: item.description,
                    price: item.price,
                    available: !item.available,
                }),
            });
            if (res.status === 401) {
                return handleUnauthorized();
            }
            if (!res.ok) {
                const text = await res.text();
                throw new Error(text || 'Status aanpassen mislukt');
            }
            const data = await res.json().catch(() => null);
            const updatedItem = data ? normalizeItem(data) : { ...item, available: !item.available };
            setCategories((prev) => prev.map((cat) => cat.id === selectedCategory.id
                ? {
                    ...cat,
                    items: cat.items.map((it) => it.id === item.id ? updatedItem : it),
                }
                : cat));
            setFlash(updatedItem.available
                ? 'Gerecht zichtbaar'
                : 'Gerecht tijdelijk verborgen');
        }
        catch (err) {
            setActionError(err?.message || 'Status aanpassen mislukt');
        }
        finally {
            setAvailabilityLoading((prev) => {
                const copy = { ...prev };
                delete copy[item.id];
                return copy;
            });
        }
    }
    function upsertItem(items, item) {
        const exists = items.some((it) => it.id === item.id);
        if (exists) {
            return items.map((it) => (it.id === item.id ? item : it));
        }
        return [...items, item];
    }
}
const containerStyle = {
    maxWidth: 1100,
    margin: '24px auto 60px',
    fontFamily: 'sans-serif',
    padding: '0 16px',
};
const sidebarStyle = {
    flexBasis: 280,
    flexGrow: 1,
    maxWidth: 320,
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
};
const contentStyle = {
    flex: 1,
    minWidth: 300,
    background: '#fff',
    padding: 24,
    borderRadius: 12,
    border: '1px solid #e2e8f0',
    boxShadow: '0 12px 40px rgba(15,23,42,0.06)',
};
const textInputStyle = {
    width: '100%',
    marginTop: 4,
    borderRadius: 8,
    border: '1px solid #cbd5f5',
    padding: '8px 10px',
    fontSize: 14,
};
const categoryButtonStyle = (active) => ({
    border: '1px solid',
    borderColor: active ? '#111827' : '#e2e8f0',
    borderRadius: 10,
    padding: '10px 12px',
    textAlign: 'left',
    cursor: 'pointer',
    background: active ? '#111827' : '#fff',
    color: active ? '#fff' : '#111827',
});
const primaryButtonStyle = (isLoading) => ({
    padding: '10px 16px',
    borderRadius: 8,
    border: 'none',
    background: '#111827',
    color: '#fff',
    fontWeight: 600,
    cursor: isLoading ? 'wait' : 'pointer',
});
const secondaryButtonStyle = {
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #cbd5f5',
    background: '#fff',
    color: '#111827',
    cursor: 'pointer',
};
const dangerButtonStyle = (loading) => ({
    padding: '10px 16px',
    borderRadius: 8,
    border: '1px solid #fecaca',
    background: '#fee2e2',
    color: '#b91c1c',
    cursor: loading ? 'wait' : 'pointer',
});
const itemCardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: 12,
    padding: 16,
    background: '#fff',
    boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
};
const flashStyle = {
    background: '#dcfce7',
    color: '#15803d',
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 12,
    border: '1px solid #bbf7d0',
};
const errorStyle = {
    background: '#fee2e2',
    color: '#b91c1c',
    padding: '8px 12px',
    borderRadius: 8,
    marginBottom: 12,
    border: '1px solid #fecaca',
};
