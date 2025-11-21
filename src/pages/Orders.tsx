import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
const API_BASE = import.meta.env.VITE_API_BASE as string
const SESSION_KEY = 'vendor_session'
const TOKEN_KEY = 'vendor_token'
const STATUS_ACTIONS = [
  { label: 'Ontvangen', value: 'RECEIVED' },
  { label: 'Bereiden', value: 'PREPARING' },
  { label: 'Onderweg', value: 'ON_THE_WAY' },
  { label: 'Afgeleverd', value: 'DELIVERED' },
]

type OrderItem = { name: string; qty: number; price?: number }
type Order = { id: string; createdAt: string; items: OrderItem[]; note?: string; total?: number; status: string }

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [error, setError] = useState<string | null>(null)
  const [authed, setAuthed] = useState<boolean>(true)
  const [loadingOrders, setLoadingOrders] = useState<Record<string, boolean>>({})
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({})
  const pollRef = useRef<number | null>(null)
  const navigate = useNavigate()

  const clearPoll = useCallback(()=>{
    if(pollRef.current){
      window.clearInterval(pollRef.current)
      pollRef.current = null
    }
  },[])

  const redirectToLogin = useCallback(()=>{
    clearPoll()
    setOrders([])
    setAuthed(false)
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(TOKEN_KEY)
    navigate('/login', { replace: true })
  },[clearPoll,navigate])

  const fetchOrders = useCallback(async ()=>{
    try{
      const token = localStorage.getItem(TOKEN_KEY)
      const headers: Record<string, string> = {}
      if (token) headers.Authorization = `Bearer ${token}`
      const res=await fetch(`${API_BASE}/vendor/orders`,{
        credentials:'include',
        headers,
      })
      if(res.status===401){
        redirectToLogin()
        return
      }
      if(!res.ok) throw new Error('Kan orders niet ophalen')
      const data=await res.json()
      setError(null)
      setAuthed(true)
      setOrders(data)
    }catch(e:any){
      if(e?.message === 'Kan orders niet ophalen'){
        setError(e.message)
      }else{
        setError(e?.message||'Fout bij laden')
      }
    }
  },[redirectToLogin])

  useEffect(()=>{
    fetchOrders()
    pollRef.current = window.setInterval(fetchOrders, 5000)
    return clearPoll
  },[fetchOrders,clearPoll])

  return (
    <div style={{maxWidth:900,margin:'20px auto',fontFamily:'sans-serif'}}>
      <h2>Dashboard — Nieuwe orders</h2>

      {!authed && (
        <div style={{padding:12,border:'1px solid #ffd28a',background:'#fff7e6',marginBottom:16}}>
          <strong>Niet ingelogd.</strong> <span>Log in om live orders te zien.</span>{' '}
          <Link to="/login">Naar inloggen →</Link>
        </div>
      )}

      {error && <div style={{ color: 'red' }}>{error}</div>}
      {authed && orders.length===0 && (
        <div>
          <div>Geen nieuwe orders…</div>
          <pre style={{marginTop:8,background:'#f5f5f5',padding:12,borderRadius:4}}>{JSON.stringify(orders,null,2)}</pre>
        </div>
      )}

      {authed && orders.map(o=>(
        <div key={o.id} style={{border:'1px solid #ddd',padding:12,marginBottom:12}}>
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <strong>#{o.id}</strong><span>{new Date(o.createdAt).toLocaleTimeString()}</span>
          </div>
          <ul>{o.items.map((it,i)=><li key={i}>{it.qty}× {it.name}</li>)}</ul>
          {o.note&&<div><em>Opmerking:</em> {o.note}</div>}
          {typeof o.total==='number'&&<div><strong>Totaal:</strong> €{o.total.toFixed(2)}</div>}
          <div style={{marginTop:12,display:'flex',gap:8,flexWrap:'wrap'}}>
            {STATUS_ACTIONS.map(action=>(
              <button
                key={action.value}
                onClick={()=>updateStatus(o.id,action.value)}
                style={statusButtonStyle(o.status,action.value,!!loadingOrders[o.id])}
                disabled={!!loadingOrders[o.id]}
              >
                {action.label}
              </button>
            ))}
          </div>
          {statusMessages[o.id] && (
            <div style={{marginTop:8,color:'#b91c1c'}}>{statusMessages[o.id]}</div>
          )}
        </div>
      ))}
    </div>
  )

  function statusButtonStyle(currentStatus:string,targetStatus:string,isDisabled:boolean){
    const isActive=currentStatus===targetStatus
    return {
      backgroundColor:isActive?'#16a34a':'#d1d5db',
      color:isActive?'#fff':'#14B8A6',
      border:'none',
      borderRadius:6,
      padding:'6px 12px',
      cursor:isDisabled?'not-allowed':'pointer',
      opacity:isDisabled?0.7:1,
      transition:'background-color 0.2s ease, opacity 0.2s ease',
    }
  }

  async function updateStatus(id:string,status:string){
    setStatusMessages(prev=>{
      const next={...prev}
      delete next[id]
      return next
    })
    setLoadingOrders(prev=>({...prev,[id]:true}))
    setError(null)
    try{
      const token = localStorage.getItem(TOKEN_KEY)
      const headers: Record<string, string> = {'Content-Type':'application/json'}
      if (token) headers.Authorization = `Bearer ${token}`
      const res=await fetch(`${API_BASE}/vendor/orders/${id}/status`,{
        method:'PATCH',
        headers,
        credentials:'include',
        body:JSON.stringify({status}),
      })
      if(res.status===401){
        redirectToLogin()
        return
      }
      if(res.status===400||res.status===409){
        setStatusMessages(prev=>({...prev,[id]:'Statusoverschakeling niet toegestaan'}))
        return
      }
      if(!res.ok){
        setError('Status bijwerken mislukt')
        return
      }
      await fetchOrders()
    }catch(e:any){
      setError(e?.message||'Status bijwerken mislukt')
    }finally{
      setLoadingOrders(prev=>{
        const next={...prev}
        delete next[id]
        return next
      })
    }
  }
}
