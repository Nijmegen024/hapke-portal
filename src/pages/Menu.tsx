import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'

type MenuItem = {
  id: string
  name: string
  description: string
  price: number
  available: boolean
  imageUrl?: string | null
}

type MenuCategory = {
  id: string
  name: string
  items: MenuItem[]
}

type ItemFormState = {
  id: string | null
  name: string
  description: string
  price: string
  available: boolean
  imageUrl: string
}

const blankItemForm = (): ItemFormState => ({
  id: null,
  name: '',
  description: '',
  price: '',
  available: true,
  imageUrl: '',
})

const currencyFormatter = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
})

export default function MenuPage() {
  const navigate = useNavigate()
  const selectedCategoryRef = useRef<string | null>(null)
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  )
  const [categoryNameDraft, setCategoryNameDraft] = useState('')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [itemForm, setItemForm] = useState<ItemFormState>(() => blankItemForm())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [renamingCategory, setRenamingCategory] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const [savingItem, setSavingItem] = useState(false)
  const [itemDeleting, setItemDeleting] = useState<Record<string, boolean>>({})
  const [availabilityLoading, setAvailabilityLoading] = useState<
    Record<string, boolean>
  >({})

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  )

  useEffect(() => {
    selectedCategoryRef.current = selectedCategoryId
  }, [selectedCategoryId])

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
    navigate('/login', { replace: true })
  }, [navigate])

  const fetchMenu = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = buildHeaders()
      const res = await fetch(`${API_BASE}/vendor/menu`, {
        credentials: 'include',
        headers,
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        throw new Error('Menu ophalen mislukt')
      }
      const data = await res.json()
      const parsedCategories = Array.isArray(data)
        ? data.map(normalizeCategory)
        : []
      setCategories(parsedCategories)
      const previousSelection = selectedCategoryRef.current
      const nextSelection =
        previousSelection &&
        parsedCategories.some((cat) => cat.id === previousSelection)
          ? previousSelection
          : parsedCategories[0]?.id ?? null
      setSelectedCategoryId(nextSelection)
    } catch (err: any) {
      setError(err?.message || 'Menu ophalen mislukt')
    } finally {
      setLoading(false)
    }
  }, [handleUnauthorized])

  useEffect(() => {
    fetchMenu()
  }, [fetchMenu])

  useEffect(() => {
    if (!flash) return
    const timeout = window.setTimeout(() => setFlash(null), 2500)
    return () => window.clearTimeout(timeout)
  }, [flash])

  useEffect(() => {
    const current = categories.find((cat) => cat.id === selectedCategoryId)
    setCategoryNameDraft(current?.name ?? '')
  }, [categories, selectedCategoryId])

  useEffect(() => {
    setItemForm(blankItemForm())
  }, [selectedCategoryId])

  const categoryCountText =
    categories.length === 0
      ? 'Geen categorieën'
      : `${categories.length} categorieën`

  if (loading) {
    return (
      <div style={containerStyle}>
        <h2>Menu</h2>
        <div>Menu laden…</div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      <h2 style={{ marginBottom: 8 }}>Menu</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Beheer hier je categorieën en gerechten. Alles wat je opslaat is direct
        zichtbaar in de klant-app.
      </p>
      <div style={{ marginBottom: 16, color: '#94a3b8', fontSize: 14 }}>
        {categoryCountText}
      </div>

      {error && (
        <div
          style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            padding: '10px 12px',
            borderRadius: 8,
            color: '#b91c1c',
            marginBottom: 16,
          }}
        >
          {error}{' '}
          <button
            type="button"
            onClick={fetchMenu}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#b91c1c',
              textDecoration: 'underline',
              cursor: 'pointer',
            }}
          >
            Opnieuw laden
          </button>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}
      >
        <aside style={sidebarStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <strong>Categorieën</strong>
            <span style={{ color: '#94a3b8', fontSize: 12 }}>
              {categories.length}x
            </span>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                style={categoryButtonStyle(selectedCategoryId === cat.id)}
              >
                <div style={{ fontWeight: 600 }}>{cat.name}</div>
                <div style={{ fontSize: 12, color: '#94a3b8' }}>
                  {cat.items.length} gerechten
                </div>
              </button>
            ))}
            {categories.length === 0 && (
              <div style={{ fontSize: 13, color: '#94a3b8' }}>
                Nog geen categorieën. Voeg de eerste toe.
              </div>
            )}
          </div>

          <form
            onSubmit={handleCreateCategory}
            style={{
              marginTop: 18,
              paddingTop: 18,
              borderTop: '1px solid #e2e8f0',
            }}
          >
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>
              Nieuwe categorie
              <input
                style={textInputStyle}
                placeholder="Bijv. Pizza"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </label>
            <button
              type="submit"
              disabled={creatingCategory}
              style={primaryButtonStyle(creatingCategory)}
            >
              {creatingCategory ? 'Toevoegen…' : 'Toevoegen'}
            </button>
          </form>
        </aside>

        <section style={contentStyle}>
          {flash && (
            <div style={flashStyle}>{flash}</div>
          )}
          {actionError && (
            <div style={errorStyle}>{actionError}</div>
          )}

          {!selectedCategory && (
            <div style={{ color: '#94a3b8', fontStyle: 'italic' }}>
              Selecteer een categorie of maak een nieuwe aan om gerechten toe te
              voegen.
            </div>
          )}

          {selectedCategory && (
            <>
              <form
                onSubmit={handleRenameCategory}
                style={{
                  display: 'flex',
                  gap: 12,
                  flexWrap: 'wrap',
                  marginBottom: 20,
                }}
              >
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label style={{ fontSize: 13, fontWeight: 600, display: 'block' }}>
                    Categorienaam
                    <input
                      style={textInputStyle}
                      value={categoryNameDraft}
                      onChange={(e) => setCategoryNameDraft(e.target.value)}
                    />
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="submit"
                    disabled={renamingCategory}
                    style={primaryButtonStyle(renamingCategory)}
                  >
                    {renamingCategory ? 'Opslaan…' : 'Categorie opslaan'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteCategory}
                    disabled={deletingCategory}
                    style={dangerButtonStyle(deletingCategory)}
                  >
                    {deletingCategory ? 'Verwijderen…' : 'Verwijderen'}
                  </button>
                </div>
              </form>

              <div>
                <h3 style={{ marginBottom: 8 }}>Gerechten</h3>
                {selectedCategory.items.length === 0 ? (
                  <div
                    style={{
                      padding: 16,
                      border: '1px dashed #cbd5f5',
                      borderRadius: 10,
                      color: '#94a3b8',
                    }}
                  >
                    Nog geen gerechten in deze categorie.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                    {selectedCategory.items.map((item) => (
                      <div key={item.id} style={itemCardStyle}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{item.name}</div>
                            {item.description && (
                              <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                                {item.description}
                              </div>
                            )}
                            {item.imageUrl && (
                              <div style={{ marginTop: 8 }}>
                                <img
                                  src={item.imageUrl}
                                  alt={item.name}
                                  style={{ maxWidth: 160, borderRadius: 10, border: '1px solid #e2e8f0' }}
                                  onError={(ev) => {
                                    (ev.currentTarget as HTMLImageElement).style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                          </div>
                          <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{currencyFormatter.format(item.price ?? 0)}</div>
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <input
                              type="checkbox"
                              checked={item.available}
                              onChange={() => toggleAvailability(item)}
                              disabled={!!availabilityLoading[item.id]}
                            />
                            {availabilityLoading[item.id]
                              ? 'Opslaan…'
                              : item.available
                                ? 'Beschikbaar'
                                : 'Niet beschikbaar'}
                          </label>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button
                              type="button"
                              onClick={() => startEditItem(item)}
                              style={secondaryButtonStyle}
                            >
                              Bewerken
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              disabled={!!itemDeleting[item.id]}
                              style={dangerButtonStyle(!!itemDeleting[item.id])}
                            >
                              {itemDeleting[item.id] ? 'Verwijderen…' : 'Verwijderen'}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            <div
              style={{
                padding: 20,
                border: '1px solid #e2e8f0',
                borderRadius: 12,
                background: '#f8fafc',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                {itemForm.id ? 'Gerecht bewerken' : 'Nieuw gerecht'}
              </h3>
              <form
                onSubmit={handleItemSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  Afbeeldings-URL (optioneel)
                  <input
                    style={textInputStyle}
                    value={itemForm.imageUrl}
                    onChange={(e) =>
                      setItemForm((prev) => ({ ...prev, imageUrl: e.target.value }))
                    }
                    placeholder="https://…/foto.jpg"
                  />
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
                    Gebruik een directe link naar een afbeelding. Uploaden in de portal wordt nog niet ondersteund.
                  </div>
                </label>
                <label style={{ fontSize: 13, fontWeight: 600 }}>
                  Naam
                  <input
                    required
                    style={textInputStyle}
                      value={itemForm.name}
                      onChange={(e) =>
                        setItemForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder="Bijv. Margherita"
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Korte omschrijving
                    <textarea
                      style={{ ...textInputStyle, minHeight: 70, resize: 'vertical' }}
                      value={itemForm.description}
                      onChange={(e) =>
                        setItemForm((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder="Ingrediënten, extra info…"
                    />
                  </label>
                  <label style={{ fontSize: 13, fontWeight: 600 }}>
                    Prijs (in euro’s)
                    <input
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      style={textInputStyle}
                      value={itemForm.price}
                      onChange={(e) =>
                        setItemForm((prev) => ({ ...prev, price: e.target.value }))
                      }
                      placeholder="12.50"
                    />
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={itemForm.available}
                      onChange={(e) =>
                        setItemForm((prev) => ({ ...prev, available: e.target.checked }))
                      }
                    />
                    Beschikbaar voor klanten
                  </label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button
                      type="submit"
                      disabled={savingItem}
                      style={primaryButtonStyle(savingItem)}
                    >
                      {savingItem
                        ? 'Opslaan…'
                        : itemForm.id
                          ? 'Gerecht opslaan'
                          : 'Gerecht toevoegen'}
                    </button>
                    {itemForm.id && (
                      <button
                        type="button"
                        onClick={() => setItemForm(blankItemForm())}
                        style={secondaryButtonStyle}
                      >
                        Annuleren
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )

  function buildHeaders(hasBody = false) {
    const headers: Record<string, string> = {
      Accept: 'application/json',
    }
    const token = localStorage.getItem(TOKEN_KEY)
    if (token) headers.Authorization = `Bearer ${token}`
    if (hasBody) headers['Content-Type'] = 'application/json'
    return headers
  }

  function normalizeCategory(raw: any): MenuCategory {
    return {
      id: String(raw.id ?? raw._id ?? crypto.randomUUID()),
      name: raw.name ?? 'Naamloos',
      items: Array.isArray(raw.items)
        ? raw.items.map(normalizeItem)
        : [],
    }
  }

  function normalizeItem(raw: any): MenuItem {
    const parsedPrice =
      typeof raw.price === 'number'
        ? raw.price
        : Number(raw.price ?? 0)
    return {
      id: String(raw.id ?? raw._id ?? crypto.randomUUID()),
      name: raw.name ?? 'Onbenoemd gerecht',
      description: raw.description ?? '',
      price: parsedPrice,
      available: raw.available !== false,
      imageUrl: raw.imageUrl ?? null,
    }
  }

  async function handleCreateCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (creatingCategory) return
    const name = newCategoryName.trim()
    if (!name) {
      setActionError('Voer een categorienaam in')
      return
    }
    setCreatingCategory(true)
    setActionError(null)
    try {
      const res = await fetch(`${API_BASE}/vendor/menu/category`, {
        method: 'POST',
        headers: buildHeaders(true),
        credentials: 'include',
        body: JSON.stringify({ name }),
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Categorie opslaan mislukt')
      }
      const data = await res.json()
      const created = normalizeCategory(data)
      setCategories((prev) => [...prev, created])
      setSelectedCategoryId(created.id)
      setNewCategoryName('')
      setFlash('Categorie opgeslagen')
    } catch (err: any) {
      setActionError(err?.message || 'Categorie opslaan mislukt')
    } finally {
      setCreatingCategory(false)
    }
  }

  async function handleRenameCategory(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCategory || renamingCategory) return
    const name = categoryNameDraft.trim()
    if (!name) {
      setActionError('Categorie moet een naam hebben')
      return
    }
    if (name === selectedCategory.name) {
      setActionError('Geen wijzigingen om op te slaan')
      return
    }
    setRenamingCategory(true)
    setActionError(null)
    try {
      const res = await fetch(
        `${API_BASE}/vendor/menu/category/${selectedCategory.id}`,
        {
          method: 'PUT',
          headers: buildHeaders(true),
          credentials: 'include',
          body: JSON.stringify({ name }),
        },
      )
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Categorie bijwerken mislukt')
      }
      const updated = await res.json().catch(() => null)
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? updated
              ? normalizeCategory({
                  ...cat,
                  ...updated,
                  items: updated.items ?? cat.items,
                })
              : { ...cat, name }
            : cat,
        ),
      )
      setFlash('Categorie opgeslagen')
      setActionError(null)
    } catch (err: any) {
      setActionError(err?.message || 'Categorie bijwerken mislukt')
    } finally {
      setRenamingCategory(false)
    }
  }

  async function handleDeleteCategory() {
    if (!selectedCategory || deletingCategory) return
    const hasItems = selectedCategory.items.length > 0
    const confirmed = window.confirm(
      hasItems
        ? 'Deze categorie bevat nog gerechten. Weet je zeker dat je wilt verwijderen?'
        : 'Categorie verwijderen?',
    )
    if (!confirmed) return
    setDeletingCategory(true)
    setActionError(null)
    try {
      const res = await fetch(
        `${API_BASE}/vendor/menu/category/${selectedCategory.id}`,
        {
          method: 'DELETE',
          headers: buildHeaders(),
          credentials: 'include',
        },
      )
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Categorie verwijderen mislukt')
      }
      const filtered = categories.filter(
        (cat) => cat.id !== selectedCategory.id,
      )
      setCategories(filtered)
      setSelectedCategoryId((prev) =>
        prev === selectedCategory.id ? filtered[0]?.id ?? null : prev,
      )
      setFlash('Categorie verwijderd')
      setItemForm((prev) =>
        prev.id ? blankItemForm() : prev,
      )
    } catch (err: any) {
      setActionError(err?.message || 'Categorie verwijderen mislukt')
    } finally {
      setDeletingCategory(false)
    }
  }

  async function handleItemSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!selectedCategory || savingItem) return
    const name = itemForm.name.trim()
    if (!name) {
      setActionError('Gerecht heeft een naam nodig')
      return
    }
    const parsedPrice = parseFloat(
      itemForm.price.replace(',', '.').trim() || '0',
    )
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setActionError('Voer een geldige prijs in')
      return
    }
  const payload = {
    categoryId: selectedCategory.id,
    name,
    description: itemForm.description.trim(),
    price: Number(parsedPrice.toFixed(2)),
    available: itemForm.available,
    imageUrl: itemForm.imageUrl.trim() || null,
  }
    setSavingItem(true)
    setActionError(null)
    try {
      const endpoint = itemForm.id
        ? `${API_BASE}/vendor/menu/item/${itemForm.id}`
        : `${API_BASE}/vendor/menu/item`
      const res = await fetch(endpoint, {
        method: itemForm.id ? 'PUT' : 'POST',
        headers: buildHeaders(true),
        credentials: 'include',
        body: JSON.stringify(
          itemForm.id ? { ...payload } : payload,
        ),
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Gerecht opslaan mislukt')
      }
      const data = await res.json()
      const savedItem = normalizeItem(data)
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? {
                ...cat,
                items: upsertItem(cat.items, savedItem),
              }
            : cat,
        ),
      )
      setItemForm(blankItemForm())
      setFlash('Gerecht opgeslagen')
    } catch (err: any) {
      setActionError(err?.message || 'Gerecht opslaan mislukt')
    } finally {
      setSavingItem(false)
    }
  }

  async function handleDeleteItem(item: MenuItem) {
    if (!selectedCategory) return
    const confirmed = window.confirm(
      `Gerecht “${item.name}” verwijderen?`,
    )
    if (!confirmed) return
    setItemDeleting((prev) => ({ ...prev, [item.id]: true }))
    setActionError(null)
    try {
      const res = await fetch(`${API_BASE}/vendor/menu/item/${item.id}`, {
        method: 'DELETE',
        headers: buildHeaders(),
        credentials: 'include',
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Gerecht verwijderen mislukt')
      }
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? {
                ...cat,
                items: cat.items.filter((it) => it.id !== item.id),
              }
            : cat,
        ),
      )
      setItemForm((prev) =>
        prev.id === item.id ? blankItemForm() : prev,
      )
      setFlash('Gerecht verwijderd')
    } catch (err: any) {
      setActionError(err?.message || 'Gerecht verwijderen mislukt')
    } finally {
      setItemDeleting((prev) => {
        const copy = { ...prev }
        delete copy[item.id]
        return copy
      })
    }
  }

  function startEditItem(item: MenuItem) {
    setItemForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price.toFixed(2),
      available: item.available,
      imageUrl: item.imageUrl ?? '',
    })
  }

  async function toggleAvailability(item: MenuItem) {
    if (!selectedCategory) return
    setAvailabilityLoading((prev) => ({ ...prev, [item.id]: true }))
    setActionError(null)
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
          imageUrl: item.imageUrl ?? null,
        }),
      })
      if (res.status === 401) {
        return handleUnauthorized()
      }
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Status aanpassen mislukt')
      }
      const data = await res.json().catch(() => null)
      const updatedItem = data ? normalizeItem(data) : { ...item, available: !item.available }
      setCategories((prev) =>
        prev.map((cat) =>
          cat.id === selectedCategory.id
            ? {
                ...cat,
                items: cat.items.map((it) =>
                  it.id === item.id ? updatedItem : it,
                ),
              }
            : cat,
        ),
      )
      setFlash(
        updatedItem.available
          ? 'Gerecht zichtbaar'
          : 'Gerecht tijdelijk verborgen',
      )
    } catch (err: any) {
      setActionError(err?.message || 'Status aanpassen mislukt')
    } finally {
      setAvailabilityLoading((prev) => {
        const copy = { ...prev }
        delete copy[item.id]
        return copy
      })
    }
  }

  function upsertItem(items: MenuItem[], item: MenuItem) {
    const exists = items.some((it) => it.id === item.id)
    if (exists) {
      return items.map((it) => (it.id === item.id ? item : it))
    }
    return [...items, item]
  }
}

const containerStyle: React.CSSProperties = {
  maxWidth: 1100,
  margin: '24px auto 60px',
  fontFamily: 'sans-serif',
  padding: '0 16px',
}

const sidebarStyle: React.CSSProperties = {
  flexBasis: 280,
  flexGrow: 1,
  maxWidth: 320,
  background: '#fff',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px rgba(15,23,42,0.05)',
}

const contentStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 300,
  background: '#fff',
  padding: 24,
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 12px 40px rgba(15,23,42,0.06)',
}

const textInputStyle: React.CSSProperties = {
  width: '100%',
  marginTop: 4,
  borderRadius: 8,
  border: '1px solid #cbd5f5',
  padding: '8px 10px',
  fontSize: 14,
}

const categoryButtonStyle = (active: boolean): React.CSSProperties => ({
  border: '1px solid',
  borderColor: active ? '#14B8A6' : '#e2e8f0',
  borderRadius: 10,
  padding: '10px 12px',
  textAlign: 'left',
  cursor: 'pointer',
  background: active ? '#14B8A6' : '#fff',
  color: active ? '#fff' : '#0f172a',
  boxShadow: active ? '0 2px 0 #FFC857' : 'none',
})

const primaryButtonStyle = (isLoading: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  borderRadius: 8,
  border: 'none',
  background: '#14B8A6',
  color: '#fff',
  fontWeight: 600,
  cursor: isLoading ? 'wait' : 'pointer',
  boxShadow: '0 2px 0 #FFC857',
})

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #cbd5f5',
  background: '#fff',
  color: '#14B8A6',
  cursor: 'pointer',
}

const dangerButtonStyle = (loading: boolean): React.CSSProperties => ({
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #fecaca',
  background: '#fee2e2',
  color: '#b91c1c',
  cursor: loading ? 'wait' : 'pointer',
})

const itemCardStyle: React.CSSProperties = {
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 16,
  background: '#fff',
  boxShadow: '0 10px 30px rgba(15,23,42,0.04)',
}

const flashStyle: React.CSSProperties = {
  background: '#dcfce7',
  color: '#15803d',
  padding: '8px 12px',
  borderRadius: 8,
  marginBottom: 12,
  border: '1px solid #bbf7d0',
}

const errorStyle: React.CSSProperties = {
  background: '#fee2e2',
  color: '#b91c1c',
  padding: '8px 12px',
  borderRadius: 8,
  marginBottom: 12,
  border: '1px solid #fecaca',
}
