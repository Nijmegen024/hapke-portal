import { useEffect, useState } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE as string
const TOKEN_KEY = 'vendor_token'

function buildHeaders(contentTypeJson = false) {
  const token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null
  return {
    ...(contentTypeJson ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

type Video = {
  id: string
  title: string
  description?: string
  videoUrl: string
  thumbUrl?: string
  isVisible: boolean
  createdAt: string
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [thumbUrl, setThumbUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    loadVideos()
  }, [])

  async function loadVideos() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/vendor/videos`, {
        headers: buildHeaders(),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Kon video\'s niet laden')
      const data = await res.json()
      setVideos(Array.isArray(data) ? data : [])
    } catch (err: any) {
      setError(err?.message || 'Video\'s laden mislukt')
    } finally {
      setLoading(false)
    }
  }

  async function handleVideoFile(file: File) {
    setUploading(true)
    try {
      const signRes = await fetch(`${API_BASE}/media/sign-upload`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({ fileName: file.name }),
      })
      if (!signRes.ok) {
        const txt = await signRes.text()
        throw new Error(txt || 'Kon upload-URL niet ophalen')
      }
      const signData = await signRes.json()
      const uploadUrl = signData.uploadUrl as string
      const publicUrl = signData.publicUrl as string
      if (!uploadUrl || !publicUrl) {
        throw new Error('Ongeldige upload respons')
      }
      const upload = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      })
      if (!upload.ok) {
        const txt = await upload.text()
        throw new Error(txt || 'Upload mislukt')
      }
      setVideoUrl(publicUrl)
    } catch (err: any) {
      setError(err?.message || 'Upload mislukt')
    } finally {
      setUploading(false)
    }
  }

  async function createVideo(e: React.FormEvent) {
    e.preventDefault()
    if (!videoUrl || !title.trim()) {
      setError('Titel en video zijn verplicht')
      return
    }
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/vendor/videos`, {
        method: 'POST',
        headers: buildHeaders(true),
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          videoUrl: videoUrl.trim(),
          thumbUrl: thumbUrl.trim() || undefined,
        }),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Video opslaan mislukt')
      }
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setThumbUrl('')
      await loadVideos()
    } catch (err: any) {
      setError(err?.message || 'Opslaan mislukt')
    } finally {
      setCreating(false)
    }
  }

  async function deleteVideo(id: string) {
    if (!window.confirm('Video verwijderen?')) return
    try {
      const res = await fetch(`${API_BASE}/vendor/videos/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(),
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || 'Verwijderen mislukt')
      }
      setVideos((prev) => prev.filter((v) => v.id !== id))
    } catch (err: any) {
      setError(err?.message || 'Verwijderen mislukt')
    }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: 20, fontFamily: 'sans-serif' }}>
      <h2 style={{ marginBottom: 8 }}>Video&#39;s</h2>
      <p style={{ color: '#475569', marginTop: 0 }}>
        Upload hier korte video&#39;s van je gerechten. Ze staan los van het menu.
      </p>

      {error && (
        <div style={{
          background: '#fee2e2', border: '1px solid #fecaca', padding: '10px 12px',
          borderRadius: 8, color: '#b91c1c', marginBottom: 14,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={createVideo} style={{
        display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr',
        background: '#fff', padding: 16, borderRadius: 12, border: '1px solid #e2e8f0',
        boxShadow: '0 6px 20px rgba(0,0,0,0.05)', marginBottom: 20,
      }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Titel</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={inputStyle}
            placeholder="Bijv. Pizza Margherita"
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Omschrijving</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ ...inputStyle, minHeight: 70 }}
            placeholder="Korte toelichting"
          />
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Video upload</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleVideoFile(f)
            }}
          />
          {uploading && <div style={{ fontSize: 12, color: '#64748b' }}>Uploaden...</div>}
          {videoUrl && (
            <div style={{ fontSize: 12, color: '#0f766e', marginTop: 4 }}>
              Video klaar: {videoUrl.slice(0, 50)}...
            </div>
          )}
        </div>
        <div>
          <label style={{ fontWeight: 600, fontSize: 14 }}>Thumb URL (optioneel)</label>
          <input
            value={thumbUrl}
            onChange={(e) => setThumbUrl(e.target.value)}
            style={inputStyle}
            placeholder="https://.../thumb.jpg"
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <button
            type="submit"
            disabled={creating || uploading}
            style={{
              padding: '10px 14px', borderRadius: 8, border: 'none',
              background: '#14B8A6', color: '#fff', fontWeight: 700,
              boxShadow: '0 2px 0 #FFC857', cursor: creating || uploading ? 'not-allowed' : 'pointer',
            }}
          >
            {creating ? 'Opslaan…' : 'Opslaan'}
          </button>
        </div>
      </form>

      <div style={{ display: 'grid', gap: 12 }}>
        {loading && <div>Video&#39;s laden…</div>}
        {!loading && videos.length === 0 && (
          <div style={{ color: '#94a3b8' }}>Nog geen video&#39;s toegevoegd.</div>
        )}
        {videos.map((v) => (
          <div
            key={v.id}
            style={{
              background: '#fff', padding: 14, borderRadius: 10,
              border: '1px solid #e2e8f0', display: 'flex', gap: 12,
              alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap',
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700 }}>{v.title}</div>
              {v.description && (
                <div style={{ color: '#475569', fontSize: 14 }}>{v.description}</div>
              )}
              <div style={{ fontSize: 12, color: '#0f766e' }}>
                <a href={v.videoUrl} target="_blank" rel="noreferrer">Bekijk video</a>
                {v.thumbUrl && (
                  <>
                    {' · '}
                    <a href={v.thumbUrl} target="_blank" rel="noreferrer">Thumbnail</a>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => deleteVideo(v.id)}
              style={{
                padding: '8px 10px', borderRadius: 8, border: '1px solid #ef4444',
                background: '#fff1f2', color: '#b91c1c', cursor: 'pointer',
              }}
            >
              Verwijderen
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: 10,
  marginTop: 4,
  borderRadius: 8,
  border: '1px solid #cbd5e1',
  fontSize: 14,
  boxSizing: 'border-box',
}
