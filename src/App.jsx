import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from './lib/supabase'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

// ─────────────────────────────────────────────────────────────────────────────
// Design system
// ─────────────────────────────────────────────────────────────────────────────
const P = {
  ink: '#0F0F14', ink2: '#3A3A4A', ink3: '#8A8A9A', ink4: '#C4C4CC',
  ink5: '#EEEEF2', ink6: '#F6F6F9', white: '#FFFFFF',
  blue: '#2563EB', blueL: '#EFF4FF',
  green: '#059669', greenL: '#ECFDF5',
  red: '#DC2626', redL: '#FEF2F2',
  amber: '#D97706', amberL: '#FFFBEB',
}

const PATHS = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z',
  car: 'M5 17h14M5 17l1.3-5.5h11.4L19 17M5 17v2.5M19 17v2.5M7.3 11.5 8.5 7h7l1.2 4.5',
  fun: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM8.5 9.5h.01M15.5 9.5h.01M8 14s1.5 2.2 4 2.2S16 14 16 14',
  cart: 'M3 4h2l2.4 12h11.2L21 8H6.2M9.5 20h.01M17.5 20h.01',
  health: 'M12 20S4.5 15.2 2.8 10.8A5.1 5.1 0 0 1 12 6.6a5.1 5.1 0 0 1 9.2 4.2C19.5 15.2 12 20 12 20Z',
  tech: 'M9 2v3M15 2v3M9 19v3M15 19v3M2 9h3M2 15h3M19 9h3M19 15h3M7 5h10a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2ZM10 10h4v4h-4v-4Z',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15Z',
  invest: 'M22 7l-8.5 8.5-5-5L2 17M16 7h6v6',
  tag: 'M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8ZM7.5 7.5h.01',
  plus: 'M12 5v14M5 12h14',
  x: 'M6 6l12 12M18 6 6 18',
  check: 'M4 12.5l5 5L20 6.5',
  pencil: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z',
  trash: 'M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6',
  wallet: 'M21 8V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M16 8h5v8h-5a4 4 0 0 1 0-8ZM17 12h.01',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 11.5a.5.5 0 1 0 0 1 .5.5 0 0 0 0-1Z',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  chat: 'M21 11.5a8.4 8.4 0 0 1-8.5 8.3c-1.5 0-2.9-.4-4.1-1L3 20l1.2-4.2a8.3 8.3 0 1 1 16.8-4.3Z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  back: 'M19 12H5M12 19l-7-7 7-7',
  repeat: 'M17 1l4 4-4 4M21 5H8a4 4 0 0 0-4 4v1M7 23l-4-4 4-4M3 19h13a4 4 0 0 0 4-4v-1',
  settings: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 12h6',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  spark: 'M12 2l1.9 5.8 6.1 1.7-5 3.9 1.5 6.6-4.5-3.5L7.5 20 9 13.4 4 9.5l6.1-1.7L12 2Z',
  chart: 'M18 20V10M12 20V4M6 20v-6',
  calendar: 'M8 2v4M16 2v4M3 9h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18ZM12 8h.01M12 11v5',
}

function Icon({ name, size = 20, color = P.ink2, style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, ...style }}>
      <path d={PATHS[name] || PATHS.tag} />
    </svg>
  )
}

function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: P.white, border: `1px solid ${P.ink5}`, borderRadius: 16,
      padding: 16, cursor: onClick ? 'pointer' : 'default', ...style,
    }}>{children}</div>
  )
}

function SLabel({ children, style }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase',
      color: P.ink3, margin: '22px 0 10px', ...style,
    }}>{children}</div>
  )
}

const inputStyle = {
  width: '100%', padding: '11px 12px', border: `1.5px solid ${P.ink5}`, borderRadius: 10,
  fontSize: 15, outline: 'none', background: P.white, color: P.ink, transition: 'border-color .15s',
}
const labelStyle = {
  display: 'block', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
  textTransform: 'uppercase', color: P.ink3, marginBottom: 6,
}

function Field({ label, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <input {...props} style={{ ...inputStyle, ...props.style }}
        onFocus={e => { e.target.style.borderColor = P.blue }}
        onBlur={e => { e.target.style.borderColor = P.ink5 }} />
    </div>
  )
}

function Select({ label, children, ...props }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={labelStyle}>{label}</label>}
      <select {...props} style={{ ...inputStyle, appearance: 'none', ...props.style }}
        onFocus={e => { e.target.style.borderColor = P.blue }}
        onBlur={e => { e.target.style.borderColor = P.ink5 }}>
        {children}
      </select>
    </div>
  )
}

function Btn({ children, variant = 'primary', color = P.blue, small, style, ...props }) {
  const variants = {
    primary: { background: color, color: '#fff', border: 'none' },
    ghost: { background: P.white, color: P.ink2, border: `1.5px solid ${P.ink5}` },
    danger: { background: P.redL, color: P.red, border: 'none' },
  }
  return (
    <button {...props} style={{
      borderRadius: 11, fontWeight: 600, cursor: 'pointer',
      fontSize: small ? 13 : 14.5, padding: small ? '8px 13px' : '12px 18px',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      transition: 'opacity .15s', opacity: props.disabled ? 0.5 : 1,
      ...variants[variant], ...style,
    }}>{children}</button>
  )
}

function TipC({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: P.ink, color: '#fff', borderRadius: 10, padding: '8px 12px', fontSize: 12.5 }}>
      {label != null && <div style={{ opacity: 0.65, marginBottom: 2 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ fontWeight: 600 }}>{p.name && p.name !== 'v' ? `${p.name}: ` : ''}{fmt(p.value)}</div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Costanti e helper
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_CATS = [
  { id: '1', name: 'Casa', icon: 'home', color: '#2563EB', bg: '#EFF4FF', subs: ['Affitto', 'Mutuo', 'Condominio', 'Utenze', 'Internet'] },
  { id: '2', name: 'Trasporti', icon: 'car', color: '#7C3AED', bg: '#F5F3FF', subs: ['Carburante', 'Assicurazione', 'Parcheggio', 'Taxi', 'Treno', 'Voli'] },
  { id: '3', name: 'Svago', icon: 'fun', color: '#D97706', bg: '#FFFBEB', subs: ['Ristoranti', 'Bar', 'Cinema', 'Shopping', 'Concerti', 'Viaggi'] },
  { id: '4', name: 'Spesa', icon: 'cart', color: '#059669', bg: '#ECFDF5', subs: ['Supermercato', 'Mercato', 'Delivery', 'Bio'] },
  { id: '5', name: 'Salute', icon: 'health', color: '#DC2626', bg: '#FEF2F2', subs: ['Farmaci', 'Medico', 'Palestra', 'Sport'] },
  { id: '6', name: 'Tech', icon: 'tech', color: '#0891B2', bg: '#ECFEFF', subs: ['Software', 'Streaming', 'Cloud', 'Gadget'] },
  { id: '7', name: 'Formazione', icon: 'book', color: '#7C3AED', bg: '#F5F3FF', subs: ['Libri', 'Corsi', 'Certificazioni'] },
  { id: '8', name: 'Investimenti', icon: 'invest', color: '#059669', bg: '#ECFDF5', subs: ['ETF', 'Pensione', 'Crypto', 'Emergenza'] },
]

const MONTHS = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre']
const MONTHS_S = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic']
const CAT_COLORS = [
  ['#2563EB', '#EFF4FF'], ['#7C3AED', '#F5F3FF'], ['#D97706', '#FFFBEB'],
  ['#059669', '#ECFDF5'], ['#DC2626', '#FEF2F2'], ['#0891B2', '#ECFEFF'], ['#3A3A4A', '#EEEEF2'],
]

function fmt(n) {
  const v = Math.round((+n || 0) * 100) / 100
  return v.toLocaleString('it-IT', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' €'
}
const sum = arr => arr.reduce((a, e) => a + (+e.amount || 0), 0)

// Importi digitati: accetta virgola o punto come separatore decimale
// ("15,53" → 15.53, "1.234,56" → 1234.56). NaN se non interpretabile.
function parseAmount(v) {
  if (typeof v === 'number') return v
  const s = String(v ?? '').trim()
  if (!s) return NaN
  const norm = s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s
  return parseFloat(norm)
}
const isPos = v => parseAmount(v) > 0
const cleanMoney = s => s.replace(/[^\d.,]/g, '')
const toComma = n => (n == null || n === '') ? '' : String(n).replace('.', ',')

// ─── Buste di budget ─────────────────────────────────────────────────────────
// Ogni spesa vive in una di 3 buste; il salvadanaio è la quota per gli obiettivi.
const BUCKETS = {
  ricorrenti: { name: 'Ricorrenti', icon: 'repeat', color: '#7C3AED', bg: '#F5F3FF' },
  spesa: { name: 'Spesa', icon: 'cart', color: '#059669', bg: '#ECFDF5' },
  svago: { name: 'Svago', icon: 'fun', color: '#D97706', bg: '#FFFBEB' },
  salvadanaio: { name: 'Salvadanaio', icon: 'target', color: '#2563EB', bg: '#EFF4FF' },
}
const BUCKET_KEYS = ['ricorrenti', 'spesa', 'svago']

// colore della linea residuo: verde finché resta ≥80% del budget,
// arancione man mano che si spende, rosso quando resta ≤20%
const resColor = pct => pct <= 20 ? '#DC2626' : pct < 80 ? '#D97706' : '#059669'

// esercenti/diciture tipiche di abbonamenti e spese fisse
const RIC_KEYWORDS = /netflix|spotify|disney|dazn|prime video|amazon prime|now tv|apple\.com|icloud|google one|youtube|playstation|ps plus|xbox|game pass|palestra|gym|mcfit|anytime|basic.?fit|abbonament|canone|iliad|vodafone|tim\b|windtre|wind tre|fastweb|ho\. ?mobile|very mobile|postemobile|assicurazion|mutuo|affitto|rata |leasing|enel|eni plenitude|a2a|hera|iren|edison|luce e gas|fibra|telepass|netflix/i

// sottocategorie di Casa che sono di fatto spese fisse mensili
const CASA_FISSE = /affitto|mutuo|condominio|utenze|internet/i

// busta suggerita per una spesa (usata anche per le spese vecchie senza colonna bucket)
function guessBucket(catId, sub, recurring) {
  if (recurring) return 'ricorrenti'
  if (String(catId) === '4') return 'spesa'
  if (String(catId) === '1' && CASA_FISSE.test(sub || '')) return 'ricorrenti'
  return 'svago'
}
function bucketOf(e) {
  if (e.bucket && BUCKETS[e.bucket]) return e.bucket
  return guessBucket(e.cat_id, e.sub, !!e.recurring_id)
}
// chiave "firma" di una spesa per il rilevamento ricorrenti (senza numeri/date)
const ricKey = e => ((e.note || e.sub || '') + '').toLowerCase().replace(/\d+/g, '').replace(/\s+/g, ' ').trim().slice(0, 40)

// Import: individua le transazioni già registrate nell'app, per non contarle due volte.
// Due casi: (1) ricorrente auto-inserita dal template a inizio mese che ricompare
// nell'estratto conto; (2) doppione esatto (stessa data e stesso importo, re-import).
function markDuplicates(txs, expenses) {
  return txs.map(t => {
    const sameMonth = expenses.filter(e => e.month === t.month && e.year === t.year)
    const tol = Math.max(1, t.amount * 0.02)
    const ricSignal = t.ric || RIC_KEYWORDS.test(t.desc || '')
    const auto = sameMonth.find(e => e.recurring_id && Math.abs((+e.amount || 0) - t.amount) <= tol)
    if (auto && ricSignal) return { ...t, dup: 'ricorrente' }
    const exact = sameMonth.find(e => Math.abs((+e.amount || 0) - t.amount) < 0.005 && e.tx_date && t.tx_date && e.tx_date === t.tx_date)
    if (exact) return { ...t, dup: 'doppione' }
    return t
  })
}

// data locale in formato YYYY-MM-DD (senza problemi di fuso orario)
const isoDate = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// data di una spesa: usa tx_date se presente, altrimenti la data di creazione
function txDateOf(e) {
  if (e.tx_date) { const d = new Date(e.tx_date + 'T00:00:00'); if (!isNaN(d)) return d }
  if (e.created_at) { const d = new Date(e.created_at); if (!isNaN(d)) return d }
  return null
}
function fmtDate(e) {
  const d = txDateOf(e)
  return d ? `${d.getDate()} ${MONTHS_S[d.getMonth()].toLowerCase()}` : ''
}
const dateKey = e => (e.tx_date || (e.created_at || '').slice(0, 10) || '')

async function askAI(prompt, maxTokens = 300) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await res.json()
  return data.content?.find(b => b.type === 'text')?.text || ''
}

async function askAIChat(messages, maxTokens = 300) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: maxTokens, messages }),
  })
  const data = await res.json()
  return data.content?.find(b => b.type === 'text')?.text || ''
}

function aiJSON(text, fallback) {
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()) } catch { return fallback }
}

const loadedScripts = {}
function loadScript(src) {
  if (loadedScripts[src]) return loadedScripts[src]
  loadedScripts[src] = new Promise((resolve, reject) => {
    const s = document.createElement('script')
    s.src = src
    s.onload = resolve
    s.onerror = () => reject(new Error('Impossibile caricare ' + src))
    document.head.appendChild(s)
  })
  return loadedScripts[src]
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
function AuthScreen() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState(null)
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setBusy(true); setMsg(null)
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setMsg({ t: 'err', text: error.message })
      } else {
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) setMsg({ t: 'err', text: error.message })
        else setMsg({ t: 'ok', text: 'Registrazione avvenuta! Controlla la tua email per confermare l\'account.' })
      }
    } catch (err) {
      setMsg({ t: 'err', text: 'Errore di connessione. Verifica la configurazione Supabase nel file .env' })
    }
    setBusy(false)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="fadeUp" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 8 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: P.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="spark" size={22} color="#fff" />
          </div>
          <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.5px' }}>SpendIQ</span>
        </div>
        <div style={{ textAlign: 'center', color: P.ink3, fontSize: 14, marginBottom: 28 }}>
          Il tuo coach finanziario personale
        </div>
        <Card style={{ padding: 22 }}>
          <form onSubmit={submit}>
            <Field label="Email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com" />
            <Field label="Password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            {msg && (
              <div style={{
                background: msg.t === 'err' ? P.redL : P.greenL, color: msg.t === 'err' ? P.red : P.green,
                borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14, fontWeight: 500,
              }}>{msg.text}</div>
            )}
            <Btn type="submit" disabled={busy} style={{ width: '100%' }}>
              {busy ? 'Attendi…' : mode === 'login' ? 'Accedi' : 'Crea account'}
            </Btn>
          </form>
        </Card>
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13.5, color: P.ink3 }}>
          {mode === 'login' ? 'Non hai un account?' : 'Hai già un account?'}{' '}
          <span onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMsg(null) }}
            style={{ color: P.blue, fontWeight: 600, cursor: 'pointer' }}>
            {mode === 'login' ? 'Registrati' : 'Accedi'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal generico
// ─────────────────────────────────────────────────────────────────────────────
function Modal({ children, onClose, title }) {
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(15,15,20,.45)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <div className="fadeUp" onClick={e => e.stopPropagation()} style={{
        background: P.white, borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 480,
        maxHeight: '88vh', overflowY: 'auto', padding: '20px 20px 28px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <span style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>{title}</span>
          <button onClick={onClose} style={{ background: P.ink6, border: 'none', borderRadius: 10, width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Form spesa (aggiungi / modifica)
// ─────────────────────────────────────────────────────────────────────────────
function ExpenseModal({ cats, initial, defaultDate, onSave, onClose }) {
  const editing = !!initial?.id
  const [catId, setCatId] = useState(String(initial?.cat_id || initial?.catId || '1'))
  const cat = cats.find(c => c.id === catId) || cats[0]
  const [sub, setSub] = useState(initial?.sub || cat.subs[0] || '')
  const [amount, setAmount] = useState(toComma(initial?.amount ?? ''))
  const [note, setNote] = useState(initial?.note || '')
  const [txDate, setTxDate] = useState(
    initial?.tx_date || (initial?.created_at ? initial.created_at.slice(0, 10) : '') || defaultDate || isoDate(new Date())
  )
  const [recurring, setRecurring] = useState(false)
  const [busy, setBusy] = useState(false)
  const [bucket, setBucket] = useState(initial?.id ? bucketOf(initial) : guessBucket(initial?.cat_id || initial?.catId || '1', initial?.sub, false))
  const [bucketTouched, setBucketTouched] = useState(!!initial?.bucket)

  // la busta segue categoria/sottocategoria/ricorrenza finché l'utente non la sceglie a mano
  useEffect(() => {
    if (!bucketTouched) setBucket(guessBucket(catId, sub, recurring))
  }, [catId, sub, recurring, bucketTouched])

  function changeCat(id) {
    setCatId(id)
    const c = cats.find(x => x.id === id)
    setSub(c?.subs[0] || '')
  }

  async function save() {
    const val = parseAmount(amount)
    if (!(val > 0)) return
    setBusy(true)
    await onSave({ id: initial?.id, cat_id: catId, sub, amount: val, note, tx_date: txDate || null, bucket, recurring: !editing && recurring })
    setBusy(false)
    onClose()
  }

  return (
    <Modal title={editing ? 'Modifica spesa' : 'Nuova spesa'} onClose={onClose}>
      <Select label="Categoria" value={catId} onChange={e => changeCat(e.target.value)}>
        {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </Select>
      <Select label="Sottocategoria" value={sub} onChange={e => setSub(e.target.value)}>
        {(cat.subs.length ? cat.subs : ['Generale']).map(s => <option key={s} value={s}>{s}</option>)}
      </Select>
      <Field label="Importo (€)" type="text" inputMode="decimal"
        value={amount} onChange={e => setAmount(cleanMoney(e.target.value))} placeholder="0,00" />
      <Field label="Data" type="date" value={txDate} onChange={e => setTxDate(e.target.value)} />
      <Field label="Note (opzionale)" value={note} onChange={e => setNote(e.target.value)} placeholder="es. cena con amici" />

      <label style={labelStyle}>Busta budget</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {BUCKET_KEYS.map(k => {
          const b = BUCKETS[k]
          const on = bucket === k
          return (
            <button key={k} type="button" onClick={() => { setBucket(k); setBucketTouched(true) }} style={{
              flex: 1, padding: '9px 4px', borderRadius: 11, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
              border: `1.5px solid ${on ? b.color : P.ink5}`,
              background: on ? b.bg : P.white, color: on ? b.color : P.ink3,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              transition: 'all .15s',
            }}>
              <Icon name={b.icon} size={13} color={on ? b.color : P.ink4} />{b.name}
            </button>
          )
        })}
      </div>

      {!editing && (
        <div onClick={() => { const r = !recurring; setRecurring(r); if (r) { setBucket('ricorrenti'); setBucketTouched(true) } }} style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12,
          border: `1.5px solid ${recurring ? P.blue : P.ink5}`, background: recurring ? P.blueL : P.white,
          cursor: 'pointer', marginBottom: 18, transition: 'all .15s',
        }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6, border: `1.5px solid ${recurring ? P.blue : P.ink4}`,
            background: recurring ? P.blue : P.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {recurring && <Icon name="check" size={13} color="#fff" />}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Spesa ricorrente</div>
            <div style={{ fontSize: 12, color: P.ink3 }}>Verrà aggiunta automaticamente ogni mese</div>
          </div>
          <Icon name="repeat" size={18} color={recurring ? P.blue : P.ink4} style={{ marginLeft: 'auto' }} />
        </div>
      )}
      <Btn onClick={save} disabled={busy || !isPos(amount)} style={{ width: '100%' }}>
        {busy ? 'Salvataggio…' : editing ? 'Salva modifiche' : 'Aggiungi spesa'}
      </Btn>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal stipendio
// ─────────────────────────────────────────────────────────────────────────────
function SalaryModal({ salary, onSave, onClose, onAddExtra }) {
  const [v, setV] = useState(toComma(salary || ''))
  return (
    <Modal title="Stipendio mensile" onClose={onClose}>
      <div style={{ fontSize: 13.5, color: P.ink3, marginBottom: 14 }}>
        Il tuo stipendio base, uguale ogni mese. Bonus, straordinari e altre entrate una tantum si aggiungono come "entrata extra".
      </div>
      <Field label="Stipendio netto (€ / mese)" type="text" inputMode="decimal"
        value={v} onChange={e => setV(cleanMoney(e.target.value))} placeholder="1800" />
      <Btn onClick={() => { onSave(parseAmount(v) || 0); onClose() }} style={{ width: '100%' }}>Salva</Btn>
      <Btn variant="ghost" onClick={() => { onClose(); onAddExtra() }} style={{ width: '100%', marginTop: 10 }}>
        <Icon name="plus" size={15} color={P.green} /> Aggiungi entrata extra del mese
      </Btn>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal entrata extra (Feature 2 — resa più accessibile)
// ─────────────────────────────────────────────────────────────────────────────
function IncomeModal({ month, onSave, onClose }) {
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  return (
    <Modal title={`Entrata extra · ${MONTHS[month]}`} onClose={onClose}>
      <div style={{ fontSize: 13.5, color: P.ink3, marginBottom: 14 }}>
        Bonus, straordinari, vendite, regali: tutto ciò che incassi <b>oltre lo stipendio</b> in questo mese. Va ad aumentare il budget disponibile.
      </div>
      <Field label="Importo (€)" type="text" inputMode="decimal"
        value={amount} onChange={e => setAmount(cleanMoney(e.target.value))} placeholder="150" autoFocus />
      <Field label="Descrizione (opzionale)" value={note} onChange={e => setNote(e.target.value)} placeholder="es. straordinari, vendita Vinted…" />
      <Btn disabled={busy || !isPos(amount)} onClick={async () => {
        setBusy(true)
        await onSave(parseAmount(amount), note)
        setBusy(false)
        onClose()
      }} style={{ width: '100%', background: P.green }}>
        <Icon name="plus" size={15} color="#fff" /> {busy ? 'Salvataggio…' : 'Aggiungi entrata'}
      </Btn>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal report mensile (Feature 3)
// ─────────────────────────────────────────────────────────────────────────────
function ReportModal({ report, onClose }) {
  return (
    <Modal title={`Report di ${MONTHS[report.month]}`} onClose={onClose}>
      {report.loading ? (
        <div style={{ textAlign: 'center', padding: '36px 0', color: P.ink3, fontSize: 14 }}>
          <div className="spin" style={{
            width: 28, height: 28, border: `3px solid ${P.ink5}`, borderTopColor: P.blue,
            borderRadius: '50%', margin: '0 auto 14px',
          }} />
          L'AI sta analizzando il mese…
        </div>
      ) : !report.data ? (
        <div style={{ color: P.ink3, fontSize: 14, padding: '20px 0', textAlign: 'center' }}>
          Impossibile generare il report. Verifica la chiave API Anthropic e riprova.
        </div>
      ) : (
        <div>
          <div style={{ background: P.blueL, borderRadius: 14, padding: 14, display: 'flex', gap: 10, marginBottom: 18 }}>
            <Icon name="spark" size={18} color={P.blue} />
            <div style={{ fontSize: 14, lineHeight: 1.5, color: P.ink2 }}>{report.data.summary}</div>
          </div>
          <SLabel style={{ marginTop: 0 }}>Cosa è andato bene</SLabel>
          {(report.data.wins || []).map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 8, fontSize: 13.5, color: P.ink2, lineHeight: 1.45 }}>
              <Icon name="check" size={15} color={P.green} style={{ marginTop: 2 }} />{w}
            </div>
          ))}
          <SLabel>Aree di attenzione</SLabel>
          {(report.data.warnings || []).map((w, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 8, fontSize: 13.5, color: P.ink2, lineHeight: 1.45 }}>
              <Icon name="alert" size={15} color={P.amber} style={{ marginTop: 2 }} />{w}
            </div>
          ))}
          <SLabel>Per il mese prossimo</SLabel>
          <div style={{ background: P.greenL, borderRadius: 12, padding: 13, fontSize: 13.5, color: P.ink2, lineHeight: 1.5 }}>
            {report.data.advice}
          </div>
        </div>
      )}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Piano di gestione — l'utente dichiara il salvadanaio, l'AI analizza il mese
// scorso e divide il disponibile (entrate − ricorrenti − salvadanaio) tra
// Spesa e Svago. L'utente conferma o ritocca.
// ─────────────────────────────────────────────────────────────────────────────
function PlanModal({ monthName, income, estRic, goalHint, existing, onGenerate, onSave, onClose }) {
  const [salv, setSalv] = useState(toComma(existing?.salvadanaio ?? (goalHint > 0 ? Math.round(goalHint) : '')))
  const [vals, setVals] = useState(existing ? { spesa: toComma(existing.spesa), svago: toComma(existing.svago) } : { spesa: '', svago: '' })
  const [consiglio, setConsiglio] = useState(existing?.consiglio || '')
  const [phase, setPhase] = useState(existing ? 'edit' : 'input') // input | loading | edit | error
  const [busy, setBusy] = useState(false)

  const salvN = parseAmount(salv) || 0
  const disp = income - estRic - salvN          // da dividere tra Spesa e Svago
  const spesaN = parseAmount(vals.spesa) || 0
  const svagoN = parseAmount(vals.svago) || 0
  const resto = disp - spesaN - svagoN

  async function generate() {
    setPhase('loading')
    const r = await onGenerate(salvN)
    if (r && isFinite(+r.spesa) && isFinite(+r.svago)) {
      setVals({ spesa: toComma(Math.round(+r.spesa)), svago: toComma(Math.round(+r.svago)) })
      setConsiglio(r.consiglio || '')
      setPhase('edit')
    } else setPhase('error')
  }

  const summary = (
    <div style={{ background: P.ink6, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12.5, color: P.ink2 }}>
      <span>Entrate<br /><b style={{ fontSize: 14, color: P.ink }}>{fmt(income)}</b></span>
      <span style={{ textAlign: 'center' }}>Ricorrenti<br /><b style={{ fontSize: 14, color: P.ink }}>−{fmt(estRic)}</b></span>
      <span style={{ textAlign: 'center' }}>Salvadanaio<br /><b style={{ fontSize: 14, color: P.ink }}>−{fmt(salvN)}</b></span>
      <span style={{ textAlign: 'right' }}>Da vivere<br /><b style={{ fontSize: 14, color: disp < 0 ? P.red : P.green }}>{fmt(disp)}</b></span>
    </div>
  )

  return (
    <Modal title={`Piano di ${monthName}`} onClose={onClose}>
      {summary}

      {phase === 'input' && (
        <div>
          <Field label="Quanto vuoi mettere da parte questo mese? (€)" type="text" inputMode="decimal"
            value={salv} onChange={e => setSalv(cleanMoney(e.target.value))} placeholder="500" autoFocus />
          {goalHint > 0 && (
            <div style={{ fontSize: 12.5, color: P.ink3, margin: '-6px 0 14px' }}>
              I tuoi obiettivi richiedono circa <b style={{ color: P.ink }}>{fmt(Math.round(goalHint))}/mese</b>.
            </div>
          )}
          {disp < 0 && (
            <div style={{ background: P.redL, color: P.red, borderRadius: 10, padding: '10px 12px', fontSize: 13, marginBottom: 14, fontWeight: 500 }}>
              Salvadanaio troppo alto: superi le entrate di {fmt(-disp)}.
            </div>
          )}
          <Btn disabled={disp < 0} onClick={generate} style={{ width: '100%' }}>
            <Icon name="spark" size={16} color="#fff" /> Analizza il mese scorso con AI
          </Btn>
          <Btn variant="ghost" disabled={disp < 0} onClick={() => {
            const half = Math.max(0, Math.floor(disp / 2))
            setVals({ spesa: String(half), svago: String(Math.max(0, Math.round(disp - half))) })
            setPhase('edit')
          }} style={{ width: '100%', marginTop: 10 }}>
            Divido io a mano
          </Btn>
        </div>
      )}

      {phase === 'loading' && (
        <div style={{ textAlign: 'center', padding: '36px 0', color: P.ink3, fontSize: 14 }}>
          <div className="spin" style={{ width: 28, height: 28, border: `3px solid ${P.ink5}`, borderTopColor: P.blue, borderRadius: '50%', margin: '0 auto 14px' }} />
          L'AI sta analizzando il mese scorso…
        </div>
      )}

      {phase === 'error' && (
        <div>
          <div style={{ color: P.ink3, fontSize: 14, padding: '16px 0', textAlign: 'center' }}>
            Analisi non riuscita. Verifica la chiave API Anthropic e riprova.
          </div>
          <Btn variant="ghost" onClick={generate} style={{ width: '100%' }}>Riprova</Btn>
        </div>
      )}

      {phase === 'edit' && (
        <div>
          {[['salvadanaio', salv, v => setSalv(v)], ['spesa', vals.spesa, v => setVals({ ...vals, spesa: v })], ['svago', vals.svago, v => setVals({ ...vals, svago: v })]].map(([k, val, set]) => {
            const b = BUCKETS[k]
            return (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={b.icon} size={16} color={b.color} />
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{b.name}</div>
                <input type="text" inputMode="decimal" value={val}
                  onChange={e => set(cleanMoney(e.target.value))}
                  style={{ ...inputStyle, width: 110, padding: '9px 10px', fontSize: 14, textAlign: 'right' }}
                  onFocus={e => { e.target.style.borderColor = P.blue }}
                  onBlur={e => { e.target.style.borderColor = P.ink5 }} />
              </div>
            )
          })}
          <div style={{ fontSize: 13, margin: '12px 2px 14px', color: resto < 0 ? P.red : P.ink3, textAlign: 'right' }}>
            {resto < 0 ? `Sfori il disponibile di ${fmt(-resto)}` : resto > 0 ? `Non assegnati ${fmt(resto)}` : 'Tutto il disponibile è assegnato'}
          </div>
          {consiglio && (
            <div style={{ background: P.blueL, borderRadius: 12, padding: 12, display: 'flex', gap: 9, marginBottom: 14 }}>
              <Icon name="spark" size={16} color={P.blue} style={{ marginTop: 1 }} />
              <div style={{ fontSize: 13, color: P.ink2, lineHeight: 1.45 }}>{consiglio}</div>
            </div>
          )}
          <Btn disabled={busy || resto < 0} onClick={async () => {
            setBusy(true)
            const ok = await onSave({ ricorrenti: estRic, spesa: spesaN, svago: svagoN, salvadanaio: salvN, consiglio })
            setBusy(false)
            if (ok) onClose()
          }} style={{ width: '100%' }}>
            <Icon name="check" size={16} color="#fff" /> {busy ? 'Salvataggio…' : 'Attiva piano'}
          </Btn>
          <Btn variant="ghost" onClick={generate} style={{ width: '100%', marginTop: 10 }}>
            <Icon name="spark" size={15} color={P.blue} /> Rianalizza con AI
          </Btn>
        </div>
      )}
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Ricorrenti rilevate — l'AI propone, l'utente conferma con un tap
// ─────────────────────────────────────────────────────────────────────────────
function RicSuggestModal({ candidates, cats, onConfirm, onDismiss, onClose }) {
  const [sel, setSel] = useState(() => candidates.map(() => true))
  const [busy, setBusy] = useState(false)
  const nSel = sel.filter(Boolean).length

  return (
    <Modal title="Probabili spese ricorrenti" onClose={onClose}>
      <div style={{ fontSize: 13.5, color: P.ink3, marginBottom: 14 }}>
        Queste spese sembrano abbonamenti o costi fissi mensili. Confermale: verranno aggiunte
        automaticamente ogni mese nella busta <b>Ricorrenti</b>.
      </div>
      {candidates.map((c, i) => {
        const cat = cats.find(x => x.id === c.cat_id) || cats[0]
        return (
          <div key={c.key} onClick={() => setSel(sel.map((s, j) => j === i ? !s : s))} style={{
            display: 'flex', alignItems: 'center', gap: 11, padding: '11px 12px', marginBottom: 8,
            borderRadius: 12, border: `1.5px solid ${sel[i] ? P.blue : P.ink5}`,
            background: sel[i] ? P.blueL : P.white, cursor: 'pointer', transition: 'all .15s',
          }}>
            <div style={{
              width: 20, height: 20, borderRadius: 6, flexShrink: 0,
              border: `1.5px solid ${sel[i] ? P.blue : P.ink4}`, background: sel[i] ? P.blue : P.white,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {sel[i] && <Icon name="check" size={12} color="#fff" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.label}</div>
              <div style={{ fontSize: 11.5, color: P.ink3 }}>
                {cat.name} · {c.sub}{c.months > 1 ? ` · vista in ${c.months} mesi` : ''}
              </div>
            </div>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.3px' }}>{fmt(c.amount)}/mese</span>
          </div>
        )
      })}
      <Btn disabled={busy || nSel === 0} onClick={async () => {
        setBusy(true)
        await onConfirm(candidates.filter((_, i) => sel[i]))
        onDismiss(candidates.filter((_, i) => !sel[i]))
        setBusy(false)
        onClose()
      }} style={{ width: '100%', marginTop: 6 }}>
        <Icon name="check" size={16} color="#fff" /> {busy ? 'Salvataggio…' : `Conferma ${nSel} ricorrenti`}
      </Btn>
      <Btn variant="ghost" onClick={() => { onDismiss(candidates); onClose() }} style={{ width: '100%', marginTop: 10 }}>
        Non sono ricorrenti
      </Btn>
    </Modal>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Obiettivi (Feature centrale) — vista + flusso creazione AI
// ─────────────────────────────────────────────────────────────────────────────
function GoalCard({ g, margin, onUpdateSaved, onDelete }) {
  const [saved, setSaved] = useState(toComma(g.saved))
  useEffect(() => setSaved(toComma(g.saved)), [g.saved])
  const now = new Date()
  const d = new Date(g.deadline)
  const monthsLeft = Math.max(0, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()))
  const pct = Math.min(100, g.target > 0 ? (g.saved / g.target) * 100 : 0)
  const needed = monthsLeft > 0 ? (g.target - g.saved) / monthsLeft : (g.target - g.saved)
  const onTrack = g.saved >= g.target || (monthsLeft > 0 && needed <= Math.max(margin, g.monthly_ai || 0))

  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 28 }}>{g.icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.2px' }}>{g.name}</div>
          <div style={{ fontSize: 12.5, color: P.ink3, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
            <Icon name="calendar" size={13} color={P.ink3} />
            {d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' })} · {monthsLeft} mesi
          </div>
        </div>
        <span style={{
          fontSize: 11.5, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
          background: onTrack ? P.greenL : P.redL, color: onTrack ? P.green : P.red,
        }}>{onTrack ? 'In linea' : 'A rischio'}</span>
        <button onClick={() => onDelete(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <Icon name="trash" size={16} color={P.ink4} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '14px 0 6px', fontSize: 13 }}>
        <span style={{ fontWeight: 700, letterSpacing: '-0.3px' }}>{fmt(g.saved)}</span>
        <span style={{ color: P.ink3 }}>di {fmt(g.target)}</span>
      </div>
      <div style={{ height: 6, background: P.ink5, borderRadius: 6 }}>
        <div style={{ height: 6, width: `${pct}%`, background: onTrack ? P.green : P.red, borderRadius: 6, transition: 'width .2s' }} />
      </div>

      {g.advice && (
        <div style={{ background: P.blueL, borderRadius: 12, padding: 12, marginTop: 14, display: 'flex', gap: 9 }}>
          <Icon name="spark" size={16} color={P.blue} style={{ marginTop: 1 }} />
          <div style={{ fontSize: 13, color: P.ink2, lineHeight: 1.45 }}>
            <span style={{ fontWeight: 700, color: P.blue }}>AI Coach · {fmt(g.monthly_ai || needed)}/mese</span>
            <div style={{ marginTop: 3 }}>{g.advice}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, marginTop: 14, alignItems: 'center' }}>
        <input type="text" inputMode="decimal" value={saved}
          onChange={e => setSaved(cleanMoney(e.target.value))}
          onKeyDown={e => { if (e.key === 'Enter') onUpdateSaved(g.id, parseAmount(saved) || 0) }}
          style={{ ...inputStyle, padding: '8px 10px', fontSize: 14, flex: 1 }}
          onFocus={e => { e.target.style.borderColor = P.blue }}
          onBlur={e => { e.target.style.borderColor = P.ink5 }} />
        <Btn small variant="ghost" onClick={() => onUpdateSaved(g.id, parseAmount(saved) || 0)}>Aggiorna</Btn>
      </div>
    </Card>
  )
}

function GoalsView({ goals, totalIncome, avgSpend, margin, analyzeGoal, onSaveGoal, onUpdateSaved, onDelete }) {
  const [flow, setFlow] = useState(null) // null | 'form' | 'analyzing' | {result}
  const [form, setForm] = useState({ icon: '🎯', name: '', target: '', saved: '0', deadline: '' })
  const [result, setResult] = useState(null)
  const EMOJI = ['🎯', '✈️', '🏠', '🚗', '💍', '📈', '🎓', '🛟', '🎸', '💻']

  async function analyze() {
    if (!form.name || !form.target || !form.deadline) return
    setFlow('analyzing')
    const r = await analyzeGoal(form)
    setResult(r)
    setFlow('result')
  }

  async function accept() {
    await onSaveGoal({
      name: form.name, icon: form.icon, target: parseAmount(form.target), saved: parseAmount(form.saved) || 0,
      deadline: form.deadline, monthly_ai: result?.mensile ?? null, advice: result?.consiglio ?? null,
    })
    setFlow(null)
    setForm({ icon: '🎯', name: '', target: '', saved: '0', deadline: '' })
    setResult(null)
  }

  if (flow === 'form') {
    return (
      <div className="fadeUp" style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <button onClick={() => setFlow(null)} style={{ background: P.white, border: `1px solid ${P.ink5}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={17} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Nuovo obiettivo</span>
        </div>
        <Card>
          <label style={labelStyle}>Icona</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {EMOJI.map(e => (
              <button key={e} onClick={() => setForm({ ...form, icon: e })} style={{
                fontSize: 20, width: 42, height: 42, borderRadius: 11, cursor: 'pointer',
                border: `1.5px solid ${form.icon === e ? P.blue : P.ink5}`,
                background: form.icon === e ? P.blueL : P.white,
              }}>{e}</button>
            ))}
          </div>
          <Field label="Nome obiettivo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="es. Viaggio in Giappone" />
          <Field label="Target (€)" type="text" inputMode="decimal" value={form.target} onChange={e => setForm({ ...form, target: cleanMoney(e.target.value) })} placeholder="3000" />
          <Field label="Già risparmiato (€)" type="text" inputMode="decimal" value={form.saved} onChange={e => setForm({ ...form, saved: cleanMoney(e.target.value) })} />
          <Field label="Scadenza" type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          <Btn onClick={analyze} disabled={!form.name || !form.target || !form.deadline} style={{ width: '100%' }}>
            <Icon name="spark" size={16} color="#fff" /> Analizza con AI
          </Btn>
        </Card>
      </div>
    )
  }

  if (flow === 'analyzing') {
    return (
      <div className="fadeUp" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spin" style={{ width: 34, height: 34, border: `3px solid ${P.ink5}`, borderTopColor: P.blue, borderRadius: '50%', margin: '0 auto 18px' }} />
        <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>L'AI sta analizzando le tue spese reali…</div>
        <div style={{ color: P.ink3, fontSize: 13.5, marginTop: 6 }}>Calcolo fattibilità e piano mensile</div>
      </div>
    )
  }

  if (flow === 'result') {
    const ok = result?.raggiungibile
    const monthly = result?.mensile
    return (
      <div className="fadeUp" style={{ padding: '0 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <button onClick={() => setFlow('form')} style={{ background: P.white, border: `1px solid ${P.ink5}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="back" size={17} />
          </button>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.3px' }}>Piano AI</span>
        </div>
        {!result ? (
          <Card>
            <div style={{ fontSize: 14, color: P.ink3, textAlign: 'center', padding: '16px 0' }}>
              Analisi non riuscita. Verifica la chiave API Anthropic e riprova.
            </div>
          </Card>
        ) : (
          <>
            <div style={{
              background: ok ? P.greenL : P.redL, borderRadius: 16, padding: 18,
              border: `1px solid ${ok ? '#BBE7D4' : '#F5C6C6'}`, marginBottom: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
                <Icon name={ok ? 'check' : 'alert'} size={19} color={ok ? P.green : P.red} />
                <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px', color: ok ? P.green : P.red }}>
                  {ok ? 'Obiettivo raggiungibile' : 'Richiede aggiustamenti'}
                </span>
              </div>
              <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: '-1.5px', margin: '6px 0 2px' }}>
                {fmt(monthly || 0)}<span style={{ fontSize: 15, color: P.ink3, fontWeight: 500, letterSpacing: 0 }}> / mese</span>
              </div>
              <div style={{ fontSize: 13, color: P.ink3 }}>
                Quota da accantonare · margine residuo {fmt(margin - (monthly || 0))}
              </div>
            </div>
            <Card style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 10 }}>
                <Icon name="spark" size={18} color={P.blue} style={{ marginTop: 1 }} />
                <div style={{ fontSize: 14, color: P.ink2, lineHeight: 1.55 }}>{result.consiglio}</div>
              </div>
            </Card>
            <Btn onClick={accept} style={{ width: '100%' }}>
              <Icon name="check" size={16} color="#fff" /> Accetta piano AI
            </Btn>
            <Btn variant="ghost" onClick={() => setFlow('form')} style={{ width: '100%', marginTop: 10 }}>Modifica obiettivo</Btn>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fadeUp" style={{ padding: '0 16px' }}>
      <SLabel style={{ marginTop: 18 }}>La tua situazione</SLabel>
      <Card style={{ display: 'flex', padding: '16px 8px' }}>
        {[['Entrate', totalIncome, P.ink], ['Spesa media', avgSpend, P.ink], ['Margine', margin, margin >= 0 ? P.green : P.red]].map(([l, v, c]) => (
          <div key={l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: P.ink3 }}>{l}</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px', color: c, marginTop: 4 }}>{fmt(v)}</div>
          </div>
        ))}
      </Card>

      <SLabel>I tuoi obiettivi</SLabel>
      {goals.length === 0 && (
        <Card style={{ textAlign: 'center', padding: '30px 16px' }}>
          <Icon name="target" size={30} color={P.ink4} style={{ margin: '0 auto 10px' }} />
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nessun obiettivo ancora</div>
          <div style={{ fontSize: 13, color: P.ink3, marginTop: 4 }}>
            Dichiara un obiettivo: l'AI ti dirà cosa puoi fare realisticamente.
          </div>
        </Card>
      )}
      {goals.map(g => (
        <GoalCard key={g.id} g={g} margin={margin} onUpdateSaved={onUpdateSaved} onDelete={onDelete} />
      ))}
      <Btn onClick={() => setFlow('form')} style={{ width: '100%', marginTop: 14 }}>
        <Icon name="plus" size={16} color="#fff" /> Nuovo obiettivo
      </Btn>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Import estratto conto (7.6)
// ─────────────────────────────────────────────────────────────────────────────
function ImportView({ cats, categorizeAI, onImport, expenses }) {
  const [step, setStep] = useState('pick') // pick | working | review | done | error
  const [workMsg, setWorkMsg] = useState('')
  const [txs, setTxs] = useState([])
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  function extractTx(lines) {
    const out = []
    const dateRe = /(\d{2})[\/\.](\d{2})[\/\.](\d{2,4})/
    const negRe = /-\s?\d{1,3}(?:\.\d{3})*,\d{2}/
    for (const line of lines) {
      const dm = line.match(dateRe)
      const am = line.match(negRe)
      if (!dm || !am) continue
      const amount = Math.abs(parseFloat(am[0].replace(/\s/g, '').replace(/\./g, '').replace(',', '.')))
      let yy = +dm[3]; if (yy < 100) yy += 2000
      const desc = line
        .replace(new RegExp(dateRe.source, 'g'), '')
        .replace(new RegExp(negRe.source, 'g'), '')
        .replace(/\d{1,3}(?:\.\d{3})*,\d{2}/g, '')
        .replace(/\s+/g, ' ').trim()
      if (!desc || !amount || amount <= 0 || +dm[2] < 1 || +dm[2] > 12) continue
      out.push({
        month: +dm[2] - 1, year: yy, desc: desc.slice(0, 90), amount,
        tx_date: `${yy}-${dm[2]}-${dm[1]}`,
      })
    }
    return out
  }

  async function parsePDF(file) {
    setWorkMsg('Lettura del PDF…')
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js')
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'
    const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise
    const lines = []
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const tc = await page.getTextContent()
      const rows = {}
      for (const it of tc.items) {
        const y = Math.round(it.transform[5])
        if (!rows[y]) rows[y] = []
        rows[y].push(it)
      }
      Object.keys(rows).map(Number).sort((a, b) => b - a).forEach(y => {
        lines.push(rows[y].sort((a, b) => a.transform[4] - b.transform[4]).map(i => i.str).join(' '))
      })
    }
    return extractTx(lines)
  }

  async function parseXLSX(file) {
    setWorkMsg('Lettura del file Excel…')
    await loadScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js')
    const wb = window.XLSX.read(await file.arrayBuffer(), { cellDates: true })
    const rows = window.XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 })
    const out = []
    for (const r of rows) {
      if (!Array.isArray(r)) continue
      let date = null, amount = null, desc = ''
      for (const c of r) {
        if (c instanceof Date && !isNaN(c) && !date) date = c
        else if (typeof c === 'number' && c < 0 && amount === null) amount = -c
        else if (typeof c === 'string') {
          const dm = c.match(/^(\d{2})[\/\.](\d{2})[\/\.](\d{2,4})$/)
          if (dm && !date) { let yy = +dm[3]; if (yy < 100) yy += 2000; date = new Date(yy, +dm[2] - 1, +dm[1]) }
          else if (amount === null && /-/.test(c) && /\d,\d{2}/.test(c)) {
            const n = parseFloat(c.replace(/\s/g, '').replace(/\./g, '').replace(',', '.'))
            if (n < 0) amount = -n
          } else if (c.trim().length > desc.length) desc = c.trim()
        }
      }
      if (date && amount && desc) {
        out.push({
          month: date.getMonth(), year: date.getFullYear(), desc: desc.slice(0, 90), amount,
          tx_date: isoDate(date),
        })
      }
    }
    return out
  }

  async function handleFile(file) {
    if (!file) return
    setStep('working')
    setError('')
    try {
      const isPdf = /\.pdf$/i.test(file.name)
      let found = isPdf ? await parsePDF(file) : await parseXLSX(file)
      if (!found.length) {
        setError(isPdf
          ? 'Nessuna transazione trovata. Alcuni PDF sono scansioni immagine non leggibili: prova con l\'export Excel del tuo home banking.'
          : 'Nessuna transazione trovata nel file. Verifica che sia l\'export movimenti del conto.')
        setStep('error')
        return
      }
      setWorkMsg(`Categorizzazione AI di ${found.length} transazioni…`)
      found = await categorizeAI(found)
      // riconosci ricorrenti già inserite e doppioni: deselezionali
      found = markDuplicates(found, expenses)
      setTxs(found.map(t => ({ ...t, checked: !t.dup })))
      setStep('review')
    } catch (e) {
      setError('Errore durante la lettura del file: ' + (e.message || e))
      setStep('error')
    }
  }

  async function confirm() {
    const selected = txs.filter(t => t.checked)
    if (!selected.length) return
    setStep('working')
    setWorkMsg('Salvataggio…')
    await onImport(selected)
    setStep('done')
  }

  const allChecked = txs.every(t => t.checked)

  return (
    <div className="fadeUp" style={{ padding: '0 16px' }}>
      <SLabel style={{ marginTop: 18 }}>Import estratto conto</SLabel>

      {step === 'pick' && (
        <>
          <Card style={{ textAlign: 'center', padding: '34px 20px' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: P.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="upload" size={24} color={P.blue} />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.3px' }}>Carica il tuo estratto conto</div>
            <div style={{ fontSize: 13, color: P.ink3, margin: '6px 0 18px', lineHeight: 1.5 }}>
              PDF o Excel (.xlsx / .xls) — pensato per Intesa Sanpaolo / Easybank.<br />
              L'AI categorizza automaticamente ogni transazione.
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.xlsx,.xls" style={{ display: 'none' }}
              onChange={e => handleFile(e.target.files[0])} />
            <Btn onClick={() => fileRef.current.click()}>
              <Icon name="upload" size={16} color="#fff" /> Scegli file
            </Btn>
          </Card>
          <div style={{ display: 'flex', gap: 8, background: P.amberL, borderRadius: 12, padding: 12, marginTop: 12, fontSize: 12.5, color: P.ink2, lineHeight: 1.45 }}>
            <Icon name="info" size={15} color={P.amber} style={{ marginTop: 1 }} />
            Vengono importate solo le uscite (importi negativi). Le spese ricorrenti già registrate dall'app vengono riconosciute e deselezionate, così non le conti due volte. I PDF scansionati come immagine non sono leggibili: in quel caso usa l'export Excel.
          </div>
        </>
      )}

      {step === 'working' && (
        <Card style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div className="spin" style={{ width: 30, height: 30, border: `3px solid ${P.ink5}`, borderTopColor: P.blue, borderRadius: '50%', margin: '0 auto 16px' }} />
          <div style={{ fontWeight: 600, fontSize: 14.5 }}>{workMsg}</div>
        </Card>
      )}

      {step === 'error' && (
        <Card>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <Icon name="alert" size={19} color={P.red} />
            <div style={{ fontSize: 14, color: P.ink2, lineHeight: 1.5 }}>{error}</div>
          </div>
          <Btn variant="ghost" onClick={() => setStep('pick')} style={{ width: '100%' }}>Riprova</Btn>
        </Card>
      )}

      {step === 'review' && (
        <>
          {txs.some(t => t.dup) && (
            <div style={{ display: 'flex', gap: 8, background: P.amberL, borderRadius: 12, padding: 12, marginBottom: 10, fontSize: 12.5, color: P.ink2, lineHeight: 1.45 }}>
              <Icon name="info" size={15} color={P.amber} style={{ marginTop: 1 }} />
              <span>
                <b>{txs.filter(t => t.dup).length} {txs.filter(t => t.dup).length === 1 ? 'transazione risulta' : 'transazioni risultano'} già {txs.filter(t => t.dup).length === 1 ? 'registrata' : 'registrate'}</b> (ricorrenti
                automatiche o doppioni): le ho deselezionate per non contarle due volte.
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, color: P.ink3 }}>{txs.filter(t => t.checked).length} di {txs.length} selezionate</span>
            <Btn small variant="ghost" onClick={() => setTxs(txs.map(t => ({ ...t, checked: !allChecked })))}>
              {allChecked ? 'Deseleziona tutto' : 'Seleziona tutto'}
            </Btn>
          </div>
          {txs.map((t, i) => {
            const cat = cats.find(c => c.id === t.catId) || cats[0]
            return (
              <Card key={i} onClick={() => setTxs(txs.map((x, j) => j === i ? { ...x, checked: !x.checked } : x))}
                style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8, opacity: t.checked ? 1 : 0.5 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${t.checked ? P.blue : P.ink4}`, background: t.checked ? P.blue : P.white,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {t.checked && <Icon name="check" size={12} color="#fff" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.desc}</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: cat.bg, color: cat.color }}>
                      {cat.name} · {t.sub}
                    </span>
                    {t.dup && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20, background: P.amberL, color: P.amber, whiteSpace: 'nowrap' }}>
                        già registrata{t.dup === 'ricorrente' ? ' · ricorrente' : ''}
                      </span>
                    )}
                    <span style={{ fontSize: 11.5, color: P.ink3 }}>{fmtDate(t) || MONTHS_S[t.month].toLowerCase()} {t.year}</span>
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.3px' }}>{fmt(t.amount)}</span>
              </Card>
            )
          })}
          <Btn onClick={confirm} disabled={!txs.some(t => t.checked)} style={{ width: '100%', margin: '12px 0 6px' }}>
            <Icon name="check" size={16} color="#fff" /> Importa {txs.filter(t => t.checked).length} spese
          </Btn>
          <Btn variant="ghost" onClick={() => { setTxs([]); setStep('pick') }} style={{ width: '100%' }}>Annulla</Btn>
        </>
      )}

      {step === 'done' && (
        <Card style={{ textAlign: 'center', padding: '36px 20px' }}>
          <div style={{ width: 52, height: 52, borderRadius: '50%', background: P.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <Icon name="check" size={26} color={P.green} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>Import completato</div>
          <div style={{ fontSize: 13, color: P.ink3, margin: '6px 0 18px' }}>Le spese sono state aggiunte ai rispettivi mesi.</div>
          <Btn variant="ghost" onClick={() => { setTxs([]); setStep('pick') }}>Importa un altro file</Btn>
        </Card>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Gestione (7.8) — 4 tab
// ─────────────────────────────────────────────────────────────────────────────
function ManageView({
  cats, customCats, monthExp, month, recurring, incomes, monthIncomes, salary, totalIncome,
  onEditExpense, onDeleteExpense, onToggleRecurring, onDeleteRecurring,
  onAddIncome, onDeleteIncome, onAddCategory, onDeleteCategory, onUpdateCatSubs, onOpenSalary,
}) {
  const [tab, setTab] = useState('spese')
  const [incAmount, setIncAmount] = useState('')
  const [incNote, setIncNote] = useState('')
  const [catName, setCatName] = useState('')
  const [catColor, setCatColor] = useState(0)
  const [catSubs, setCatSubs] = useState('')
  const [newSub, setNewSub] = useState({})

  const TABS = [['spese', 'Spese'], ['ricorrenti', 'Ricorrenti'], ['entrate', 'Entrate'], ['categorie', 'Categorie']]

  return (
    <div className="fadeUp" style={{ padding: '0 16px' }}>
      <div className="hscroll" style={{ display: 'flex', gap: 6, margin: '16px 0' }}>
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: '8px 15px', borderRadius: 20, fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
            border: `1.5px solid ${tab === k ? P.blue : P.ink5}`,
            background: tab === k ? P.blue : P.white, color: tab === k ? '#fff' : P.ink2,
            whiteSpace: 'nowrap', transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>

      {tab === 'spese' && (
        <>
          <SLabel style={{ marginTop: 6 }}>Spese di {MONTHS[month]}</SLabel>
          {monthExp.length === 0 && <Card style={{ color: P.ink3, fontSize: 13.5, textAlign: 'center' }}>Nessuna spesa questo mese.</Card>}
          {[...monthExp].sort((a, b) => dateKey(b).localeCompare(dateKey(a))).map(e => {
            const cat = cats.find(c => c.id === String(e.cat_id)) || cats[0]
            return (
              <Card key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={cat.icon} size={17} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{e.sub}</div>
                  <div style={{ fontSize: 12, color: P.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {fmtDate(e) && `${fmtDate(e)} · `}{e.note || cat.name}{e.recurring_id ? ' · ricorrente' : ''}
                  </div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.3px' }}>{fmt(e.amount)}</span>
                <button onClick={() => onEditExpense(e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name="pencil" size={15} color={P.ink4} />
                </button>
                <button onClick={() => onDeleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name="trash" size={15} color={P.ink4} />
                </button>
              </Card>
            )
          })}
        </>
      )}

      {tab === 'ricorrenti' && (
        <>
          <SLabel style={{ marginTop: 6 }}>Spese ricorrenti</SLabel>
          {recurring.length === 0 && (
            <Card style={{ color: P.ink3, fontSize: 13.5, textAlign: 'center' }}>
              Nessuna spesa ricorrente. Attiva il flag "ricorrente" quando crei una spesa.
            </Card>
          )}
          {recurring.map(r => {
            const cat = cats.find(c => c.id === String(r.cat_id)) || cats[0]
            return (
              <Card key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8, opacity: r.active ? 1 : 0.55 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="repeat" size={16} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{r.sub}</div>
                  <div style={{ fontSize: 12, color: P.ink3 }}>{cat.name}{r.note ? ` · ${r.note}` : ''}</div>
                </div>
                <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.3px' }}>{fmt(r.amount)}</span>
                <div onClick={() => onToggleRecurring(r)} style={{
                  width: 40, height: 23, borderRadius: 20, background: r.active ? P.green : P.ink4,
                  position: 'relative', cursor: 'pointer', transition: 'background .15s', flexShrink: 0,
                }}>
                  <div style={{
                    width: 17, height: 17, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3,
                    left: r.active ? 20 : 3, transition: 'left .15s',
                  }} />
                </div>
                <button onClick={() => onDeleteRecurring(r.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name="trash" size={15} color={P.ink4} />
                </button>
              </Card>
            )
          })}
        </>
      )}

      {tab === 'entrate' && (
        <>
          <SLabel style={{ marginTop: 6 }}>Entrate di {MONTHS[month]}</SLabel>
          <Card style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12.5, color: P.ink3 }}>Totale entrate del mese</div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-1px', marginTop: 2 }}>{fmt(totalIncome)}</div>
                <div style={{ fontSize: 12.5, color: P.ink3, marginTop: 2 }}>
                  Stipendio {fmt(salary)} + extra {fmt(totalIncome - salary)}
                </div>
              </div>
              <Btn small variant="ghost" onClick={onOpenSalary}>
                <Icon name="pencil" size={13} /> Stipendio
              </Btn>
            </div>
          </Card>

          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 10 }}>Aggiungi entrata extra</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input type="text" inputMode="decimal" placeholder="Importo €" value={incAmount}
                onChange={e => setIncAmount(cleanMoney(e.target.value))}
                style={{ ...inputStyle, width: 110, padding: '9px 10px', fontSize: 14 }} />
              <input placeholder="Nota (es. bonus)" value={incNote} onChange={e => setIncNote(e.target.value)}
                style={{ ...inputStyle, flex: 1, padding: '9px 10px', fontSize: 14 }} />
              <Btn small disabled={!isPos(incAmount)}
                onClick={() => { onAddIncome(parseAmount(incAmount), incNote); setIncAmount(''); setIncNote('') }}>
                <Icon name="plus" size={14} color="#fff" />
              </Btn>
            </div>
          </Card>

          {monthIncomes.map(i => (
            <Card key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: P.greenL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="invest" size={16} color={P.green} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{i.note || 'Entrata extra'}</div>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14.5, color: P.green, letterSpacing: '-0.3px' }}>+{fmt(i.amount)}</span>
              <button onClick={() => onDeleteIncome(i.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Icon name="trash" size={15} color={P.ink4} />
              </button>
            </Card>
          ))}
        </>
      )}

      {tab === 'categorie' && (
        <>
          <SLabel style={{ marginTop: 6 }}>Nuova categoria</SLabel>
          <Card style={{ marginBottom: 16 }}>
            <Field label="Nome" value={catName} onChange={e => setCatName(e.target.value)} placeholder="es. Animali" />
            <label style={labelStyle}>Colore</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {CAT_COLORS.map(([c], i) => (
                <div key={i} onClick={() => setCatColor(i)} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: catColor === i ? `3px solid ${P.ink}` : '3px solid transparent',
                }} />
              ))}
            </div>
            <Field label="Sottocategorie (separate da virgola)" value={catSubs} onChange={e => setCatSubs(e.target.value)} placeholder="Veterinario, Cibo, Accessori" />
            <Btn disabled={!catName.trim()} onClick={() => {
              onAddCategory({
                name: catName.trim(), icon: 'tag',
                color: CAT_COLORS[catColor][0], bg: CAT_COLORS[catColor][1],
                subs: catSubs.split(',').map(s => s.trim()).filter(Boolean),
              })
              setCatName(''); setCatSubs('')
            }} style={{ width: '100%' }}>
              <Icon name="plus" size={15} color="#fff" /> Crea categoria
            </Btn>
          </Card>

          <SLabel>Le tue categorie custom</SLabel>
          {customCats.length === 0 && (
            <Card style={{ color: P.ink3, fontSize: 13.5, textAlign: 'center' }}>
              Nessuna categoria custom. Le 8 di default sono sempre disponibili.
            </Card>
          )}
          {customCats.map(c => (
            <Card key={c.id} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="tag" size={16} color={c.color} />
                </div>
                <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5 }}>{c.name}</div>
                <button onClick={() => onDeleteCategory(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                  <Icon name="trash" size={15} color={P.ink4} />
                </button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                {(c.subs || []).map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 20, background: P.ink6, color: P.ink2, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {s}
                    <span onClick={() => onUpdateCatSubs(c.id, c.subs.filter(x => x !== s))} style={{ cursor: 'pointer', display: 'flex' }}>
                      <Icon name="x" size={11} color={P.ink3} />
                    </span>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <input placeholder="Nuova sottocategoria" value={newSub[c.id] || ''}
                  onChange={e => setNewSub({ ...newSub, [c.id]: e.target.value })}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (newSub[c.id] || '').trim()) {
                      onUpdateCatSubs(c.id, [...(c.subs || []), newSub[c.id].trim()])
                      setNewSub({ ...newSub, [c.id]: '' })
                    }
                  }}
                  style={{ ...inputStyle, flex: 1, padding: '8px 10px', fontSize: 13.5 }} />
                <Btn small variant="ghost" disabled={!(newSub[c.id] || '').trim()} onClick={() => {
                  onUpdateCatSubs(c.id, [...(c.subs || []), newSub[c.id].trim()])
                  setNewSub({ ...newSub, [c.id]: '' })
                }}>Aggiungi</Btn>
              </div>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Coach Chat (7.7)
// ─────────────────────────────────────────────────────────────────────────────
function ChatPanel({ open, onClose, buildContext }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Ciao! Sono il tuo coach finanziario. Chiedimi qualsiasi cosa sui tuoi soldi.' },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, typing, open])

  async function send() {
    const text = input.trim()
    if (!text || typing) return
    setInput('')
    const history = [...messages, { role: 'user', text }]
    setMessages(history)
    setTyping(true)
    try {
      const apiMsgs = history.slice(-9).map((m, i, arr) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: i === arr.length - 1
          ? `${buildContext()}\n\nDomanda dell'utente: ${m.text}\n\nRispondi in italiano, massimo 2 frasi, tono diretto da coach finanziario.`
          : m.text,
      }))
      if (apiMsgs[0]?.role !== 'user') apiMsgs.shift()
      const reply = await askAIChat(apiMsgs, 200)
      setMessages(prev => [...prev, { role: 'assistant', text: reply || 'Non sono riuscito a rispondere, riprova.' }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Errore di connessione all\'AI. Verifica la chiave API.' }])
    }
    setTyping(false)
  }

  if (!open) return null
  return (
    <div style={{
      position: 'fixed', right: 0, left: 0, bottom: 0, zIndex: 90,
      display: 'flex', justifyContent: 'center', pointerEvents: 'none',
    }}>
      <div className="fadeUp" style={{
        pointerEvents: 'auto', width: '100%', maxWidth: 480, height: 480, maxHeight: '75vh',
        background: P.white, borderRadius: '20px 20px 0 0', border: `1px solid ${P.ink5}`,
        display: 'flex', flexDirection: 'column', boxShadow: '0 -8px 40px rgba(15,15,20,.12)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderBottom: `1px solid ${P.ink5}` }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: P.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="spark" size={17} color="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.2px' }}>AI Coach</div>
            <div style={{ fontSize: 11.5, color: P.green, fontWeight: 500 }}>conosce le tue finanze</div>
          </div>
          <button onClick={onClose} style={{ background: P.ink6, border: 'none', borderRadius: 10, width: 30, height: 30, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={15} />
          </button>
        </div>
        <div ref={bodyRef} style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map((m, i) => (
            <div key={i} style={{
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '82%',
              background: m.role === 'user' ? P.blue : P.ink6,
              color: m.role === 'user' ? '#fff' : P.ink,
              borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
              padding: '9px 13px', fontSize: 13.5, lineHeight: 1.45,
            }}>{m.text}</div>
          ))}
          {typing && (
            <div style={{ alignSelf: 'flex-start', background: P.ink6, borderRadius: '14px 14px 14px 4px', padding: '11px 14px' }}>
              <span className="tdot" /><span className="tdot" /><span className="tdot" />
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${P.ink5}` }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send() }}
            placeholder="Chiedi al coach…"
            style={{ ...inputStyle, flex: 1, padding: '10px 13px', fontSize: 14, borderRadius: 22 }}
            onFocus={e => { e.target.style.borderColor = P.blue }}
            onBlur={e => { e.target.style.borderColor = P.ink5 }} />
          <button onClick={send} disabled={typing} style={{
            width: 42, height: 42, borderRadius: '50%', background: P.blue, border: 'none',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="send" size={17} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// App principale
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const now = new Date()
  const YEAR = now.getFullYear()

  const [session, setSession] = useState(undefined)
  const [loaded, setLoaded] = useState(false)
  const [salary, setSalary] = useState(0)
  const [expenses, setExpenses] = useState([])
  const [goals, setGoals] = useState([])
  const [incomes, setIncomes] = useState([])
  const [recurring, setRecurring] = useState([])
  const [customCats, setCustomCats] = useState([])
  const [budgets, setBudgets] = useState([])

  const [month, setMonth] = useState(now.getMonth())
  const [view, setView] = useState({ name: 'dash' })
  const [expenseModal, setExpenseModal] = useState(null)
  const [salaryOpen, setSalaryOpen] = useState(false)
  const [incomeOpen, setIncomeOpen] = useState(false)
  const [report, setReport] = useState(null)
  const [insight, setInsight] = useState(null)
  const [insightGone, setInsightGone] = useState(false)
  const [reportBannerGone, setReportBannerGone] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [ricCands, setRicCands] = useState([])   // ricorrenti rilevate da confermare
  const [ricOpen, setRicOpen] = useState(false)
  const [aiFlagged, setAiFlagged] = useState([]) // firme flaggate come abbonamento dall'AI in import

  // ── Auth ──
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session)).catch(() => setSession(null))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (session?.user) loadAll(session.user.id)
    else { setLoaded(false) }
  }, [session?.user?.id])

  // ── Dati ──
  async function loadAll(uid) {
    const [p, e, g, c, i, r, b] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
      supabase.from('expenses').select('*').eq('year', YEAR),
      supabase.from('goals').select('*').order('created_at'),
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('incomes').select('*').eq('year', YEAR),
      supabase.from('recurring').select('*').order('created_at'),
      supabase.from('budgets').select('*').eq('year', YEAR),
    ])
    setSalary(+(p.data?.salary) || 0)
    const exps = e.data || []
    const recs = r.data || []
    setExpenses(exps)
    setGoals(g.data || [])
    setCustomCats(c.data || [])
    setIncomes(i.data || [])
    setRecurring(recs)
    setBudgets(b.data || [])
    setLoaded(true)
    // Feature 4 — applica le ricorrenti attive al mese corrente (dedup via recurring_id)
    const M = now.getMonth()
    const missing = recs.filter(rc => rc.active && !exps.some(x => x.recurring_id === rc.id && x.month === M && x.year === YEAR))
    if (missing.length) {
      const rows = missing.map(rc => ({
        user_id: uid, cat_id: String(rc.cat_id), sub: rc.sub, amount: rc.amount,
        note: rc.note || '', tx_date: isoDate(now), month: M, year: YEAR, recurring_id: rc.id,
        bucket: 'ricorrenti',
      }))
      const data = await insertExpenseRows(rows)
      if (data) setExpenses(prev => [...prev, ...data])
    }
  }

  // ── Derivati ──
  const cats = useMemo(() => [
    ...DEFAULT_CATS,
    ...customCats.map(c => ({ ...c, id: String(c.id), icon: c.icon && PATHS[c.icon] ? c.icon : 'tag', subs: c.subs || [] })),
  ], [customCats])

  const monthExp = useMemo(() => expenses.filter(e => e.month === month && e.year === YEAR), [expenses, month])
  const spent = useMemo(() => sum(monthExp), [monthExp])
  const monthIncomes = useMemo(() => incomes.filter(i => i.month === month && i.year === YEAR), [incomes, month])
  const totalIncome = salary + sum(monthIncomes)

  const avgSpend = useMemo(() => {
    const totals = []
    for (let m = 0; m <= now.getMonth(); m++) {
      const t = sum(expenses.filter(e => e.month === m && e.year === YEAR))
      if (t > 0) totals.push(t)
    }
    return totals.length ? totals.reduce((a, b) => a + b, 0) / totals.length : 0
  }, [expenses])

  const curIncome = salary + sum(incomes.filter(i => i.month === now.getMonth() && i.year === YEAR))
  const margin = curIncome - avgSpend

  const byCat = useMemo(() => cats.map(c => ({
    ...c, total: sum(monthExp.filter(e => String(e.cat_id) === c.id)),
  })), [cats, monthExp])

  // ── Buste: piano del mese visualizzato + speso per busta ──
  const curBudget = useMemo(() => budgets.find(b => b.month === month && b.year === YEAR) || null, [budgets, month])
  const spentBuckets = useMemo(() => {
    const s = { ricorrenti: 0, spesa: 0, svago: 0 }
    for (const e of monthExp) s[bucketOf(e)] += +e.amount || 0
    return s
  }, [monthExp])

  // totale spese ricorrenti note (template attivi); fallback: speso ricorrenti del mese scorso
  const estRic = useMemo(() => {
    const t = sum(recurring.filter(r => r.active))
    if (t > 0) return t
    const pm = now.getMonth() - 1
    if (pm < 0) return 0
    return sum(expenses.filter(e => e.month === pm && e.year === YEAR && bucketOf(e) === 'ricorrenti'))
  }, [recurring, expenses])

  // riporto: i residui (positivi o negativi) di Spesa e Svago dei mesi già
  // pianificati si trascinano sul mese successivo
  function carryFor(targetMonth) {
    const out = { spesa: 0, svago: 0 }
    const planned = budgets.filter(b => b.year === YEAR && b.month < targetMonth).sort((a, b) => a.month - b.month)
    for (const b of planned) {
      const ex = expenses.filter(e => e.month === b.month && e.year === YEAR)
      const sp = { spesa: 0, svago: 0 }
      for (const e of ex) { const k = bucketOf(e); if (sp[k] !== undefined) sp[k] += +e.amount || 0 }
      out.spesa += (+b.spesa || 0) - sp.spesa
      out.svago += (+b.svago || 0) - sp.svago
    }
    return out
  }
  const carryover = useMemo(() => carryFor(month), [budgets, expenses, month])

  // rinnovo automatico: a inizio mese copia il piano più recente (il riporto fa il resto)
  useEffect(() => {
    if (!loaded || !uid) return
    const M = now.getMonth()
    if (budgets.some(b => b.month === M && b.year === YEAR)) return
    const prev = budgets.filter(b => b.year === YEAR && b.month < M).sort((a, b) => b.month - a.month)[0]
    if (!prev) return
    supabase.from('budgets').insert({
      user_id: uid, month: M, year: YEAR, ricorrenti: prev.ricorrenti, spesa: prev.spesa,
      svago: prev.svago, salvadanaio: prev.salvadanaio, consiglio: prev.consiglio, salvadanaio_done: false,
    }).select().single().then(({ data }) => {
      if (data) setBudgets(p => p.some(b => b.id === data.id) ? p : [...p, data])
    }).catch(() => { })
  }, [loaded, budgets])

  // quota mensile di un obiettivo (piano AI se c'è, altrimenti calcolo dal residuo)
  function goalQuota(g) {
    if (+g.monthly_ai > 0) return +g.monthly_ai
    const d = new Date(g.deadline)
    const ml = Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()))
    return Math.max(0, ((+g.target || 0) - (+g.saved || 0)) / ml)
  }
  const totGoalQuota = goals.reduce((a, g) => a + goalQuota(g), 0)

  // ── Rilevamento ricorrenti: firme ripetute nei mesi + parole chiave + flag AI ──
  useEffect(() => {
    if (!loaded) return
    let dismissed = []
    try { dismissed = JSON.parse(localStorage.getItem('spendiq-ric-dismissed') || '[]') } catch { }
    const existingRec = new Set(recurring.map(r => ricKey(r)))
    const groups = {}
    for (const e of expenses) {
      if (e.recurring_id) continue
      const k = ricKey(e)
      if (!k || k.length < 4) continue
      if (!groups[k]) groups[k] = { key: k, months: new Set(), amounts: [], last: e }
      const g = groups[k]
      g.months.add(e.year * 12 + e.month)
      g.amounts.push(+e.amount || 0)
      if (dateKey(e) > dateKey(g.last)) g.last = e
    }
    const cands = []
    for (const k in groups) {
      if (dismissed.includes(k) || existingRec.has(k)) continue
      const g = groups[k]
      const avg = g.amounts.reduce((a, b) => a + b, 0) / g.amounts.length
      const stable = g.amounts.every(a => Math.abs(a - avg) <= Math.max(2, avg * 0.12))
      const repeated = g.months.size >= 2 && stable          // stesso importo in almeno 2 mesi
      const keyword = RIC_KEYWORDS.test(k) || aiFlagged.includes(k) // esercente da abbonamento
      if (repeated || keyword) {
        cands.push({
          key: k, label: g.last.note || g.last.sub, amount: Math.round(avg * 100) / 100,
          cat_id: String(g.last.cat_id), sub: g.last.sub, months: g.months.size,
        })
      }
    }
    setRicCands(cands.slice(0, 8))
  }, [loaded, expenses, recurring, aiFlagged])

  function dismissRic(cands) {
    if (!cands.length) return
    let d = []
    try { d = JSON.parse(localStorage.getItem('spendiq-ric-dismissed') || '[]') } catch { }
    localStorage.setItem('spendiq-ric-dismissed', JSON.stringify([...new Set([...d, ...cands.map(c => c.key)])]))
    setRicCands(prev => prev.filter(c => !cands.some(x => x.key === c.key)))
  }

  // conferma candidati: crea il template ricorrente e aggancia le spese esistenti
  async function confirmRic(selected) {
    for (const c of selected) {
      const { data: rec } = await supabase.from('recurring')
        .insert({ user_id: uid, cat_id: c.cat_id, sub: c.sub, amount: c.amount, note: c.label === c.sub ? '' : c.label, active: true })
        .select().single()
      if (!rec) continue
      setRecurring(prev => [...prev, rec])
      const ids = expenses.filter(e => !e.recurring_id && ricKey(e) === c.key).map(e => e.id)
      if (ids.length) {
        let { data, error } = await supabase.from('expenses')
          .update({ recurring_id: rec.id, bucket: 'ricorrenti' }).in('id', ids).select()
        if (error && /bucket/i.test(error.message || '')) {
          ;({ data } = await supabase.from('expenses').update({ recurring_id: rec.id }).in('id', ids).select())
        }
        if (data) setExpenses(prev => prev.map(e => data.find(d => d.id === e.id) || e))
      }
    }
  }

  // ── Contesto finanziario per l'AI ──
  function buildContext() {
    const M = now.getMonth()
    const mExp = expenses.filter(e => e.month === M && e.year === YEAR)
    const sp = sum(mExp)
    const inc = salary + sum(incomes.filter(i => i.month === M && i.year === YEAR))
    const pct = inc > 0 ? Math.round((sp / inc) * 100) : 0
    const perCat = cats
      .map(c => ({ n: c.name, v: sum(mExp.filter(e => String(e.cat_id) === c.id)) }))
      .filter(x => x.v > 0)
      .map(x => `${x.n} ${Math.round(x.v)}€`).join(', ') || 'nessuna spesa'
    const goalsTxt = goals.length
      ? goals.map(g => `"${g.name}" ${Math.round(g.saved)}/${Math.round(g.target)}€ entro ${g.deadline}${g.monthly_ai ? ` (quota AI ${Math.round(g.monthly_ai)}€/mese)` : ''}`).join('; ')
      : 'nessuno'
    // piano di gestione del mese corrente, se attivo (con riporto dai mesi precedenti)
    const bud = budgets.find(b => b.month === M && b.year === YEAR)
    let bucketTxt = 'Nessun piano di gestione attivo questo mese.'
    if (bud) {
      const sb = { ricorrenti: 0, spesa: 0, svago: 0 }
      for (const e of mExp) sb[bucketOf(e)] += +e.amount || 0
      const cf = carryFor(M)
      const resS = Math.round((+bud.spesa || 0) + cf.spesa - sb.spesa)
      const resV = Math.round((+bud.svago || 0) + cf.svago - sb.svago)
      bucketTxt = `Piano di gestione del mese: ricorrenti previste ${Math.round(bud.ricorrenti)}€ (spese finora ${Math.round(sb.ricorrenti)}€); busta Spesa residuo ${resS}€ (budget ${Math.round(bud.spesa)}€${Math.round(cf.spesa) ? `, riporto ${Math.round(cf.spesa)}€` : ''}); busta Svago residuo ${resV}€ (budget ${Math.round(bud.svago)}€${Math.round(cf.svago) ? `, riporto ${Math.round(cf.svago)}€` : ''}); salvadanaio ${Math.round(bud.salvadanaio)}€ ${bud.salvadanaio_done ? 'già accantonato' : 'ancora da accantonare'}.`
    }
    return `Situazione finanziaria dell'utente (oggi è il ${now.getDate()} ${MONTHS[M]} ${YEAR}): entrate del mese ${Math.round(inc)}€, speso finora ${Math.round(sp)}€ (${pct}% delle entrate), spesa media mensile storica ${Math.round(avgSpend)}€. Spese del mese per categoria: ${perCat}. ${bucketTxt} Obiettivi: ${goalsTxt}.`
  }

  // ── Feature 1: insight proattivo (cache sessionStorage per giorno) ──
  useEffect(() => {
    if (!loaded || !session) return
    const key = 'spendiq-insight-' + new Date().toISOString().slice(0, 10)
    const cached = sessionStorage.getItem(key)
    if (cached) { try { setInsight(JSON.parse(cached)) } catch { } return }
    if (!expenses.length) return
    const prompt = `${buildContext()}\nSei un coach finanziario proattivo. Genera UN SOLO insight specifico e utile basato su questi dati (max 25 parole, italiano, tono diretto — es. "Sei al 78% del budget svago e siamo solo al 15 del mese").\nRispondi SOLO con JSON: {"text":"...","severity":"ok"}\nseverity: "ok" se va tutto bene, "warn" se serve attenzione, "alert" se la situazione è critica.`
    askAI(prompt, 200).then(t => {
      const ins = aiJSON(t, null)
      if (ins?.text) { setInsight(ins); sessionStorage.setItem(key, JSON.stringify(ins)) }
    }).catch(() => { })
  }, [loaded])

  // ── Feature 3: report mensile ──
  const prevM = (now.getMonth() + 11) % 12
  const prevMYear = now.getMonth() === 0 ? YEAR - 1 : YEAR
  const reportSeenKey = `spendiq-report-${prevMYear}-${prevM}`
  const showReportBanner = loaded && !reportBannerGone && now.getDate() <= 5 &&
    !localStorage.getItem(reportSeenKey) && prevMYear === YEAR &&
    expenses.some(e => e.month === prevM && e.year === YEAR)

  function statsFor(m) {
    if (m < 0) return null
    const ex = expenses.filter(e => e.month === m && e.year === YEAR)
    if (!ex.length) return null
    const inc = salary + sum(incomes.filter(i => i.month === m && i.year === YEAR))
    const per = cats.map(c => ({ n: c.name, v: sum(ex.filter(e => String(e.cat_id) === c.id)) }))
      .filter(x => x.v > 0).map(x => `${x.n} ${Math.round(x.v)}€`).join(', ')
    return `entrate ${Math.round(inc)}€, spese totali ${Math.round(sum(ex))}€ (${per})`
  }

  async function genReport(m) {
    setReport({ loading: true, month: m })
    const cur = statsFor(m)
    const prev = statsFor(m - 1)
    if (!cur) { setReport({ loading: false, month: m, data: { summary: `Nessuna spesa registrata a ${MONTHS[m]}: non c'è nulla da analizzare.`, wins: [], warnings: [], advice: 'Registra le tue spese per ottenere report utili.' } }); return }
    const prompt = `Sei un coach finanziario diretto e concreto. Analizza il mese di ${MONTHS[m]} ${YEAR} per questo utente.\n${MONTHS[m]}: ${cur}.\n${m > 0 && prev ? `Mese precedente (${MONTHS[m - 1]}): ${prev}. Confronta i due mesi.` : 'Nessun dato del mese precedente.'}\nObiettivi attivi: ${goals.map(g => g.name).join(', ') || 'nessuno'}.\nRispondi SOLO con JSON: {"summary":"sintesi in 2 frasi","wins":["2-3 cose andate bene"],"warnings":["1-2 aree di attenzione"],"advice":"un consiglio concreto per il mese prossimo"}`
    const data = aiJSON(await askAI(prompt, 700).catch(() => ''), null)
    setReport({ loading: false, month: m, data })
    if (m === prevM) { localStorage.setItem(reportSeenKey, '1'); setReportBannerGone(true) }
  }

  // ── AI: analisi obiettivo ──
  async function analyzeGoal(form) {
    const d = new Date(form.deadline)
    const monthsLeft = Math.max(1, (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth()))
    const prompt = `${buildContext()}\nMargine mensile stimato (entrate - spesa media): ${Math.round(margin)}€.\nL'utente vuole questo obiettivo: "${form.name}", target ${parseAmount(form.target)}€, già risparmiati ${parseAmount(form.saved) || 0}€, scadenza ${form.deadline} (${monthsLeft} mesi rimanenti).\nCalcola la quota mensile necessaria (numero). Valuta se è raggiungibile con il margine attuale. Dai UN consiglio specifico e concreto su quale categoria di spesa reale tagliare e di quanto per sostenere il piano (max 40 parole, italiano).\nRispondi SOLO con JSON: {"raggiungibile":true,"mensile":250,"consiglio":"..."}`
    try { return aiJSON(await askAI(prompt, 400), null) } catch { return null }
  }

  // ── AI: divide il disponibile (entrate − ricorrenti − salvadanaio) tra Spesa e Svago
  //    analizzando come l'utente ha speso il mese precedente ──
  async function generatePlan(salv) {
    const disp = Math.round(totalIncome - estRic - salv)
    // analisi del mese precedente rispetto al mese del piano
    const pm = month - 1
    const pex = pm >= 0 ? expenses.filter(e => e.month === pm && e.year === YEAR) : []
    const psp = { ricorrenti: 0, spesa: 0, svago: 0 }
    for (const e of pex) psp[bucketOf(e)] += +e.amount || 0
    const svagoDet = cats
      .map(c => ({ n: c.name, v: sum(pex.filter(e => String(e.cat_id) === c.id && bucketOf(e) === 'svago')) }))
      .filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 5)
      .map(x => `${x.n} ${Math.round(x.v)}€`).join(', ')
    const prevTxt = pex.length
      ? `Analisi di ${MONTHS[pm]}: spesa alimentare ${Math.round(psp.spesa)}€, svago ${Math.round(psp.svago)}€ (dettaglio svago: ${svagoDet || 'n/d'}), ricorrenti ${Math.round(psp.ricorrenti)}€.`
      : 'Nessun dato del mese precedente disponibile.'
    const prompt = `${buildContext()}
${prevTxt}
L'utente vuole mettere da parte ${Math.round(salv)}€ questo mese. Entrate ${Math.round(totalIncome)}€, spese ricorrenti fisse ${Math.round(estRic)}€: restano ${disp}€ da dividere SOLO tra le buste "spesa" (supermercato/alimentari per casa) e "svago" (tutto il resto: ristoranti, uscite, shopping…).
Proponi una divisione realistica basata su come ha speso il mese scorso; la somma spesa+svago deve essere ≤ ${disp}. Se il mese scorso ha speso più del disponibile attuale, dillo chiaramente nel consiglio. Aggiungi UN consiglio pratico (max 30 parole, italiano, tono diretto).
Rispondi SOLO con JSON: {"spesa":300,"svago":300,"consiglio":"..."}`
    try { return aiJSON(await askAI(prompt, 300), null) } catch { return null }
  }

  async function saveBudget(vals) {
    const existing = budgets.find(b => b.month === month && b.year === YEAR)
    if (existing) {
      const { data, error } = await supabase.from('budgets').update(vals).eq('id', existing.id).select().single()
      if (error) { window.alert('Impossibile salvare il piano: ' + error.message); return false }
      if (data) setBudgets(prev => prev.map(x => x.id === data.id ? data : x))
      return true
    }
    const { data, error } = await supabase.from('budgets')
      .insert({ user_id: uid, month, year: YEAR, ...vals }).select().single()
    if (error) {
      window.alert('Impossibile salvare il piano. Se è la prima volta, esegui migration-buckets.sql nell\'SQL Editor di Supabase.')
      return false
    }
    if (data) setBudgets(prev => [...prev, data])
    return true
  }

  // segna l'accantonamento del mese e distribuisci sugli obiettivi (proporzionale alle quote)
  async function confirmSalvadanaio() {
    if (!curBudget || curBudget.salvadanaio_done) return
    const amountTot = +curBudget.salvadanaio || 0
    if (!window.confirm(`Confermi di aver messo da parte ${fmt(amountTot)}? Aggiornerò il progresso dei tuoi obiettivi.`)) return
    const qs = goals.map(g => ({ g, q: goalQuota(g) })).filter(x => x.q > 0)
    const tot = qs.reduce((a, x) => a + x.q, 0)
    if (amountTot > 0 && tot > 0) {
      for (const { g, q } of qs) {
        const inc = Math.round(amountTot * (q / tot) * 100) / 100
        const { data } = await supabase.from('goals')
          .update({ saved: Math.round(((+g.saved || 0) + inc) * 100) / 100 }).eq('id', g.id).select().single()
        if (data) setGoals(prev => prev.map(x => x.id === g.id ? data : x))
      }
    }
    const { data } = await supabase.from('budgets')
      .update({ salvadanaio_done: true }).eq('id', curBudget.id).select().single()
    if (data) setBudgets(prev => prev.map(x => x.id === data.id ? data : x))
  }

  // ── AI: categorizzazione import ──
  async function categorizeAI(txs) {
    const catList = cats.map(c => `${c.id}=${c.name} [${c.subs.join(', ')}]`).join('; ')
    for (let i = 0; i < txs.length; i += 30) {
      const batch = txs.slice(i, i + 30)
      const prompt = `Categorizza queste transazioni bancarie italiane. Categorie disponibili (id=nome [sottocategorie]): ${catList}.
Transazioni:
${batch.map((t, j) => `${j}: ${t.desc}`).join('\n')}
Per ogni transazione scegli categoria e sottocategoria più adatte, più:
- "b": la busta di budget — "spesa" (supermercato/alimentari), "ricorrenti" (abbonamenti, utenze, affitto, rate, spese fisse mensili), "svago" (tutto il resto).
- "ric": true SOLO se è chiaramente un abbonamento o costo fisso mensile (Netflix, Spotify, palestra, telefono, assicurazione, affitto…).
Rispondi SOLO con JSON array: [{"i":0,"cat":"1","sub":"Supermercato","b":"spesa","ric":false}]`
      try {
        const res = aiJSON(await askAI(prompt, 2200), [])
        for (const r of res || []) {
          const t = batch[r.i]
          const c = cats.find(x => x.id === String(r.cat))
          if (t && c) { t.catId = c.id; t.sub = c.subs.includes(r.sub) ? r.sub : (c.subs[0] || 'Generale') }
          if (t) {
            if (BUCKET_KEYS.includes(r.b)) t.bucket = r.b
            t.ric = !!r.ric
          }
        }
      } catch { }
    }
    return txs.map(t => ({
      ...t, catId: t.catId || '3', sub: t.sub || 'Shopping',
      bucket: t.bucket || guessBucket(t.catId || '3', t.sub, t.ric),
    }))
  }

  // ── CRUD ──
  const uid = session?.user?.id

  // Insert/update con fallback: se le colonne bucket/tx_date non esistono ancora
  // nel DB, riprova senza (l'app resta funzionante anche prima delle migration SQL).
  async function insertExpenseRows(rows) {
    let { data, error } = await supabase.from('expenses').insert(rows).select()
    if (error && /bucket/i.test(error.message || '')) {
      rows = rows.map(({ bucket, ...r }) => r)
      ;({ data, error } = await supabase.from('expenses').insert(rows).select())
    }
    if (error && /tx_date/i.test(error.message || '')) {
      rows = rows.map(({ tx_date, ...r }) => r)
      ;({ data } = await supabase.from('expenses').insert(rows).select())
    }
    return data
  }

  async function saveExpense(f) {
    // il mese/anno della spesa seguono la data scelta
    const d = f.tx_date ? new Date(f.tx_date + 'T00:00:00') : null
    const expMonth = d && !isNaN(d) ? d.getMonth() : month
    const expYear = d && !isNaN(d) ? d.getFullYear() : YEAR
    if (f.id) {
      let patch = { cat_id: f.cat_id, sub: f.sub, amount: f.amount, note: f.note, tx_date: f.tx_date, bucket: f.bucket, month: expMonth, year: expYear }
      let { data, error } = await supabase.from('expenses').update(patch).eq('id', f.id).select().single()
      if (error && /bucket/i.test(error.message || '')) {
        const { bucket, ...p2 } = patch; patch = p2
        ;({ data, error } = await supabase.from('expenses').update(patch).eq('id', f.id).select().single())
      }
      if (error && /tx_date/i.test(error.message || '')) {
        const { tx_date, ...p3 } = patch
        ;({ data } = await supabase.from('expenses').update(p3).eq('id', f.id).select().single())
      }
      if (data) setExpenses(prev => prev.map(e => e.id === f.id ? data : e).filter(e => e.year === YEAR))
    } else {
      let recurringId = null
      if (f.recurring) {
        const { data: rec } = await supabase.from('recurring')
          .insert({ user_id: uid, cat_id: f.cat_id, sub: f.sub, amount: f.amount, note: f.note, active: true })
          .select().single()
        if (rec) { recurringId = rec.id; setRecurring(prev => [...prev, rec]) }
      }
      const data = await insertExpenseRows([{
        user_id: uid, cat_id: f.cat_id, sub: f.sub, amount: f.amount, note: f.note,
        tx_date: f.tx_date, month: expMonth, year: expYear, recurring_id: recurringId,
        bucket: f.bucket || guessBucket(f.cat_id, f.sub, !!recurringId),
      }])
      if (data) setExpenses(prev => [...prev, ...data.filter(e => e.year === YEAR)])
    }
  }

  async function deleteExpense(id) {
    await supabase.from('expenses').delete().eq('id', id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  async function saveSalary(v) {
    setSalary(v)
    await supabase.from('profiles').upsert({ id: uid, salary: v })
  }

  async function addIncome(amount, note) {
    const { data } = await supabase.from('incomes')
      .insert({ user_id: uid, amount, note, month, year: YEAR }).select().single()
    if (data) setIncomes(prev => [...prev, data])
  }

  async function deleteIncome(id) {
    await supabase.from('incomes').delete().eq('id', id)
    setIncomes(prev => prev.filter(i => i.id !== id))
  }

  async function toggleRecurring(r) {
    const { data } = await supabase.from('recurring').update({ active: !r.active }).eq('id', r.id).select().single()
    if (data) setRecurring(prev => prev.map(x => x.id === r.id ? data : x))
  }

  async function deleteRecurring(id) {
    await supabase.from('recurring').delete().eq('id', id)
    setRecurring(prev => prev.filter(r => r.id !== id))
  }

  async function addCategory(c) {
    const { data } = await supabase.from('categories').insert({ user_id: uid, ...c }).select().single()
    if (data) setCustomCats(prev => [...prev, data])
  }

  async function deleteCategory(id) {
    if (!window.confirm('Eliminare questa categoria? Le spese già registrate non verranno cancellate.')) return
    await supabase.from('categories').delete().eq('id', id)
    setCustomCats(prev => prev.filter(c => String(c.id) !== String(id)))
  }

  async function updateCatSubs(id, subs) {
    const { data } = await supabase.from('categories').update({ subs }).eq('id', id).select().single()
    if (data) setCustomCats(prev => prev.map(c => String(c.id) === String(id) ? data : c))
  }

  async function saveGoal(g) {
    const { data } = await supabase.from('goals').insert({ user_id: uid, ...g }).select().single()
    if (data) setGoals(prev => [...prev, data])
  }

  async function updateGoalSaved(id, saved) {
    const { data } = await supabase.from('goals').update({ saved }).eq('id', id).select().single()
    if (data) setGoals(prev => prev.map(g => g.id === id ? data : g))
  }

  async function deleteGoal(id) {
    if (!window.confirm('Eliminare questo obiettivo?')) return
    await supabase.from('goals').delete().eq('id', id)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  async function importExpenses(txs) {
    const rows = txs.map(t => ({
      user_id: uid, cat_id: t.catId, sub: t.sub, amount: t.amount,
      note: t.desc, tx_date: t.tx_date || null, month: t.month, year: t.year,
      bucket: t.bucket || guessBucket(t.catId, t.sub, false),
    }))
    const data = await insertExpenseRows(rows)
    if (data) setExpenses(prev => [...prev, ...data.filter(e => e.year === YEAR)])
    // le transazioni flaggate come abbonamento dall'AI entrano tra i candidati ricorrenti
    const flags = txs.filter(t => t.ric).map(t => ricKey({ note: t.desc, sub: t.sub })).filter(Boolean)
    if (flags.length) setAiFlagged(prev => [...new Set([...prev, ...flags])])
  }

  // ── Render ──
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spin" style={{ width: 30, height: 30, border: `3px solid ${P.ink5}`, borderTopColor: P.blue, borderRadius: '50%' }} />
      </div>
    )
  }
  if (!session) return <AuthScreen />

  // dati grafici
  const trendData = []
  for (let i = 5; i >= 0; i--) {
    const m = month - i
    if (m < 0) { trendData.push({ name: MONTHS_S[(m + 12) % 12], v: 0 }); continue }
    trendData.push({ name: MONTHS_S[m], v: Math.round(sum(expenses.filter(e => e.month === m && e.year === YEAR)) * 100) / 100 })
  }
  const pieData = byCat.filter(c => c.total > 0)
  const pct = totalIncome > 0 ? Math.min(100, (spent / totalIncome) * 100) : (spent > 0 ? 100 : 0)
  const barColor = pct > 90 ? P.red : pct > 70 ? P.amber : P.blue
  const recentTx = [...monthExp].sort((a, b) => b.amount - a.amount).slice(0, 6)

  const sevStyle = {
    ok: { bg: P.blueL, fg: P.blue, icon: 'spark' },
    warn: { bg: P.amberL, fg: P.amber, icon: 'alert' },
    alert: { bg: P.redL, fg: P.red, icon: 'alert' },
  }[insight?.severity] || { bg: P.blueL, fg: P.blue, icon: 'spark' }

  const NAV = [
    ['dash', 'home', 'Home'],
    ['goals', 'target', 'Obiettivi'],
    ['add', 'plus', ''],
    ['import', 'upload', 'Import'],
    ['manage', 'settings', 'Gestione'],
  ]

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header sticky */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20,
        background: 'rgba(246,246,249,.92)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${P.ink5}`,
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: P.blue, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="spark" size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.5px' }}>SpendIQ</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setSalaryOpen(true)} style={{
            display: 'flex', alignItems: 'center', gap: 6, background: P.white,
            border: `1px solid ${P.ink5}`, borderRadius: 20, padding: '7px 13px',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', color: P.ink,
          }}>
            <Icon name="wallet" size={15} color={P.blue} />
            {fmt(totalIncome)}
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{
            background: P.white, border: `1px solid ${P.ink5}`, borderRadius: 10,
            width: 34, height: 34, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="logout" size={16} color={P.ink3} />
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', paddingBottom: 90 }}>

        {/* ── DASHBOARD ── */}
        {view.name === 'dash' && (
          <div className="fadeUp">
            {/* barra mesi */}
            <div className="hscroll" style={{ display: 'flex', gap: 6, padding: '12px 16px 2px' }}>
              {MONTHS_S.map((m, i) => (
                <button key={m} onClick={() => setMonth(i)} style={{
                  padding: '7px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  border: `1.5px solid ${month === i ? P.blue : P.ink5}`,
                  background: month === i ? P.blue : P.white, color: month === i ? '#fff' : P.ink3,
                  whiteSpace: 'nowrap', transition: 'all .15s', flexShrink: 0,
                }}>{m}</button>
              ))}
            </div>

            <div style={{ padding: '12px 16px 0' }}>
              {/* Feature 1: banner insight */}
              {insight && !insightGone && (
                <div className="fadeUp" style={{
                  background: sevStyle.bg, borderRadius: 14, padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12,
                }}>
                  <Icon name={sevStyle.icon} size={17} color={sevStyle.fg} style={{ marginTop: 1 }} />
                  <div style={{ flex: 1, fontSize: 13.5, color: P.ink2, lineHeight: 1.45 }}>
                    <span style={{ fontWeight: 700, color: sevStyle.fg }}>AI Coach · </span>{insight.text}
                  </div>
                  <span onClick={() => setInsightGone(true)} style={{ cursor: 'pointer', display: 'flex', padding: 2 }}>
                    <Icon name="x" size={14} color={P.ink3} />
                  </span>
                </div>
              )}

              {/* Feature 3: banner report automatico */}
              {showReportBanner && (
                <div className="fadeUp" style={{
                  background: P.blueL, borderRadius: 14, padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12,
                }}>
                  <Icon name="chart" size={17} color={P.blue} />
                  <div style={{ flex: 1, fontSize: 13.5, color: P.ink2 }}>
                    {MONTHS[prevM]} è finito: vuoi il check del mese?
                  </div>
                  <Btn small onClick={() => genReport(prevM)}>Vedi report</Btn>
                  <span onClick={() => { localStorage.setItem(reportSeenKey, '1'); setReportBannerGone(true) }}
                    style={{ cursor: 'pointer', display: 'flex', padding: 2 }}>
                    <Icon name="x" size={14} color={P.ink3} />
                  </span>
                </div>
              )}

              {/* Ricorrenti rilevate dall'AI */}
              {ricCands.length > 0 && (
                <div className="fadeUp" style={{
                  background: '#F5F3FF', borderRadius: 14, padding: '12px 14px',
                  display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12,
                }}>
                  <Icon name="repeat" size={17} color="#7C3AED" />
                  <div style={{ flex: 1, fontSize: 13.5, color: P.ink2 }}>
                    Ho trovato <b>{ricCands.length} probabili {ricCands.length === 1 ? 'spesa ricorrente' : 'spese ricorrenti'}</b>
                  </div>
                  <Btn small color="#7C3AED" onClick={() => setRicOpen(true)}>Rivedi</Btn>
                  <span onClick={() => dismissRic(ricCands)} style={{ cursor: 'pointer', display: 'flex', padding: 2 }}>
                    <Icon name="x" size={14} color={P.ink3} />
                  </span>
                </div>
              )}

              {/* Hero card */}
              <Card style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: P.ink3 }}>
                  Speso a {MONTHS[month]}
                </div>
                <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-1.5px', margin: '4px 0 2px' }}>
                  {fmt(spent)}
                </div>
                <div style={{ fontSize: 13, color: P.ink3 }}>
                  su {fmt(totalIncome)} di entrate {totalIncome > 0 && `· ${Math.round(pct)}%`}
                </div>
                <div style={{ height: 6, background: P.ink5, borderRadius: 6, margin: '14px 0 10px' }}>
                  <div style={{ height: 6, width: `${pct}%`, background: barColor, borderRadius: 6, transition: 'width .3s, background .3s' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5 }}>
                  <span style={{ color: P.ink3 }}>Rimanente</span>
                  <span style={{ fontWeight: 700, letterSpacing: '-0.3px', color: totalIncome - spent >= 0 ? P.green : P.red }}>
                    {fmt(totalIncome - spent)}
                  </span>
                </div>
                {monthIncomes.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                    {monthIncomes.map(i => (
                      <span key={i.id} style={{
                        fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                        background: P.greenL, color: P.green, display: 'inline-flex', alignItems: 'center', gap: 5,
                      }}>
                        +{fmt(i.amount)}{i.note ? ` ${i.note}` : ''}
                        <span onClick={() => deleteIncome(i.id)} style={{ cursor: 'pointer', display: 'flex' }}>
                          <Icon name="x" size={11} color={P.green} />
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <button onClick={() => setIncomeOpen(true)} style={{
                  width: '100%', marginTop: 12, padding: '10px 12px', borderRadius: 11, cursor: 'pointer',
                  border: `1.5px dashed ${P.ink4}`, background: 'transparent', color: P.green,
                  fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  transition: 'all .15s',
                }}>
                  <Icon name="plus" size={15} color={P.green} /> Aggiungi entrata extra
                </button>
              </Card>

              {/* Piano di gestione: Spesa, Svago, Salvadanaio — sempre visibile */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '20px 0 8px' }}>
                <SLabel style={{ margin: 0 }}>Piano di {MONTHS[month]}</SLabel>
                {curBudget ? (
                  <button onClick={() => setPlanOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600, color: P.blue }}>
                    <Icon name="pencil" size={13} color={P.blue} /> Modifica
                  </button>
                ) : (
                  <Btn small onClick={() => setPlanOpen(true)}>
                    <Icon name="spark" size={14} color="#fff" /> Crea piano
                  </Btn>
                )}
              </div>
              {curBudget ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, color: P.ink3, padding: '0 2px', marginBottom: 8 }}>
                  <span>Entrate <b style={{ color: P.ink }}>{fmt(totalIncome)}</b></span>
                  <span>Ricorrenti <b style={{ color: spentBuckets.ricorrenti > (+curBudget.ricorrenti || 0) ? P.red : P.ink }}>−{fmt(curBudget.ricorrenti)}</b></span>
                  <span>Da vivere <b style={{ color: P.ink }}>{fmt(Math.max(0, totalIncome - (+curBudget.ricorrenti || 0) - (+curBudget.salvadanaio || 0)))}</b></span>
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: P.ink3, margin: '0 2px 8px', lineHeight: 1.45 }}>
                  Dichiara quanto risparmiare: l'AI analizza il mese scorso e divide il resto tra Spesa e Svago.
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {['spesa', 'svago'].map(k => {
                  const b = BUCKETS[k]
                  if (!curBudget) {
                    return (
                      <Card key={k} onClick={() => setPlanOpen(true)} style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div style={{ width: 26, height: 26, borderRadius: 8, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={b.icon} size={14} color={b.color} />
                          </div>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink2 }}>{b.name}</span>
                        </div>
                        <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.6px', margin: '8px 0 1px', color: P.ink4 }}>— €</div>
                        <div style={{ fontSize: 11, color: P.ink3 }}>crea il piano per il residuo</div>
                        <div style={{ height: 5, background: P.ink5, borderRadius: 5, marginTop: 8 }} />
                      </Card>
                    )
                  }
                  const budTot = (+curBudget[k] || 0) + carryover[k]   // budget + riporto
                  const res = budTot - spentBuckets[k]
                  const pb = budTot > 0 ? Math.max(0, Math.min(100, (res / budTot) * 100)) : 0
                  return (
                    <Card key={k} style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: b.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name={b.icon} size={14} color={b.color} />
                        </div>
                        <span style={{ fontSize: 12.5, fontWeight: 600, color: P.ink2 }}>{b.name}</span>
                      </div>
                      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-0.6px', margin: '8px 0 1px', color: res < 0 ? P.red : P.ink }}>
                        {fmt(res)}
                      </div>
                      <div style={{ fontSize: 11, color: P.ink3 }}>
                        rimanenti di {fmt(budTot)}
                        {Math.round(carryover[k]) !== 0 && (
                          <span style={{ color: carryover[k] > 0 ? P.green : P.red, fontWeight: 600 }}>
                            {' '}({carryover[k] > 0 ? '+' : ''}{fmt(Math.round(carryover[k] * 100) / 100)} riporto)
                          </span>
                        )}
                      </div>
                      <div style={{ height: 5, background: P.ink5, borderRadius: 5, marginTop: 8 }}>
                        <div style={{ height: 5, width: `${pb}%`, background: resColor(pb), borderRadius: 5, transition: 'width .3s, background .3s' }} />
                      </div>
                    </Card>
                  )
                })}
                {/* Salvadanaio */}
                {curBudget ? (
                  <Card style={{
                    padding: '12px 14px', gridColumn: '1 / -1',
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: curBudget.salvadanaio_done ? P.greenL : P.white,
                    border: `1px solid ${curBudget.salvadanaio_done ? '#BBE7D4' : P.ink5}`,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: P.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="target" size={17} color={P.blue} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink2 }}>Salvadanaio · obiettivi</div>
                      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px' }}>{fmt(curBudget.salvadanaio)}</div>
                    </div>
                    {curBudget.salvadanaio_done ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, fontWeight: 600, color: P.green }}>
                        <Icon name="check" size={15} color={P.green} /> Accantonato
                      </span>
                    ) : month === now.getMonth() ? (
                      <Btn small variant="ghost" onClick={confirmSalvadanaio}>
                        <Icon name="check" size={14} color={P.green} /> Metti da parte
                      </Btn>
                    ) : (
                      <span style={{ fontSize: 12, color: P.ink3 }}>da accantonare</span>
                    )}
                  </Card>
                ) : (
                  <Card onClick={() => setPlanOpen(true)} style={{
                    padding: '12px 14px', gridColumn: '1 / -1',
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: P.blueL, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon name="target" size={17} color={P.blue} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 600, color: P.ink2 }}>Salvadanaio · obiettivi</div>
                      <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.5px', color: P.ink4 }}>— €</div>
                    </div>
                    <span style={{ fontSize: 12, color: P.blue, fontWeight: 600 }}>Crea piano</span>
                  </Card>
                )}
              </div>

              {/* Strip obiettivi — sezione separata dal piano del mese */}
              {goals.length > 0 && (
                <>
                  <SLabel>Obiettivi</SLabel>
                  <div className="hscroll" style={{ display: 'flex', gap: 8 }}>
                  {goals.map(g => {
                    const gp = Math.min(100, g.target > 0 ? (g.saved / g.target) * 100 : 0)
                    return (
                      <Card key={g.id} onClick={() => setView({ name: 'goals' })}
                        style={{ minWidth: 150, padding: '12px 14px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontSize: 17 }}>{g.icon}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.name}</span>
                        </div>
                        <div style={{ height: 5, background: P.ink5, borderRadius: 5, margin: '9px 0 6px' }}>
                          <div style={{ height: 5, width: `${gp}%`, background: P.blue, borderRadius: 5 }} />
                        </div>
                        <div style={{ fontSize: 11, color: P.ink3, fontWeight: 500 }}>{Math.round(gp)}% · {fmt(g.saved)}</div>
                      </Card>
                    )
                  })}
                  </div>
                </>
              )}

              {/* Report on-demand */}
              <Btn variant="ghost" onClick={() => genReport(month)} style={{ width: '100%', marginTop: 12 }}>
                <Icon name="spark" size={15} color={P.blue} /> Report di {MONTHS[month]}
              </Btn>

              {/* Andamento 6 mesi */}
              <SLabel>Andamento 6 mesi</SLabel>
              <Card style={{ padding: '16px 8px 6px 0' }}>
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="gBlue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={P.blue} stopOpacity={0.22} />
                        <stop offset="100%" stopColor={P.blue} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: P.ink3 }} />
                    <YAxis hide />
                    <Tooltip content={<TipC />} />
                    <Area type="monotone" dataKey="v" stroke={P.blue} strokeWidth={2.2} fill="url(#gBlue)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>

              {/* Distribuzione categorie */}
              {pieData.length > 0 && (
                <>
                  <SLabel>Distribuzione</SLabel>
                  <Card style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 140, height: 140, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} dataKey="total" nameKey="name" innerRadius={42} outerRadius={62}
                            paddingAngle={2} strokeWidth={0}>
                            {pieData.map(c => <Cell key={c.id} fill={c.color} />)}
                          </Pie>
                          <Tooltip content={<TipC />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {pieData.sort((a, b) => b.total - a.total).map(c => (
                        <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                          <span style={{ fontSize: 12.5, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                          <span style={{ fontSize: 12.5, fontWeight: 700 }}>{spent > 0 ? Math.round((c.total / spent) * 100) : 0}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </>
              )}

              {/* Griglia categorie */}
              <SLabel>Categorie</SLabel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {byCat.map(c => (
                  <Card key={c.id} onClick={() => setView({ name: 'cat', id: c.id })} style={{ padding: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <Icon name={c.icon} size={17} color={c.color} />
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.name}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.4px', marginTop: 2, color: c.total > 0 ? P.ink : P.ink4 }}>
                      {fmt(c.total)}
                    </div>
                  </Card>
                ))}
              </div>

              {/* Transazioni recenti */}
              <SLabel>Transazioni principali</SLabel>
              {recentTx.length === 0 && (
                <Card style={{ color: P.ink3, fontSize: 13.5, textAlign: 'center' }}>
                  Nessuna spesa a {MONTHS[month]}. Aggiungine una col pulsante +.
                </Card>
              )}
              {recentTx.map(e => {
                const cat = cats.find(c => c.id === String(e.cat_id)) || cats[0]
                return (
                  <Card key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon name={cat.icon} size={17} color={cat.color} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {e.sub}
                        {e.recurring_id && (
                          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: P.blueL, color: P.blue, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Icon name="repeat" size={9} color={P.blue} /> ric.
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: P.ink3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fmtDate(e) && `${fmtDate(e)} · `}{e.note || cat.name}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.3px' }}>{fmt(e.amount)}</span>
                    <button onClick={() => setExpenseModal({ expense: e })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Icon name="pencil" size={15} color={P.ink4} />
                    </button>
                    <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <Icon name="trash" size={15} color={P.ink4} />
                    </button>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* ── DETTAGLIO CATEGORIA ── */}
        {view.name === 'cat' && (() => {
          const cat = cats.find(c => c.id === view.id) || cats[0]
          const catExp = monthExp.filter(e => String(e.cat_id) === cat.id)
          const catTotal = sum(catExp)
          const subTotals = cat.subs.map(s => ({ s, v: sum(catExp.filter(e => e.sub === s)) }))
          return (
            <div className="fadeUp" style={{ padding: '0 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0' }}>
                <button onClick={() => setView({ name: 'dash' })} style={{ background: P.white, border: `1px solid ${P.ink5}`, borderRadius: 10, width: 36, height: 36, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="back" size={17} />
                </button>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={cat.icon} size={20} color={cat.color} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.3px' }}>{cat.name}</div>
                  <div style={{ fontSize: 12.5, color: P.ink3 }}>{MONTHS[month]}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.6px' }}>{fmt(catTotal)}</div>
              </div>

              {cat.subs.length > 0 && (
                <div className="hscroll" style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
                  {subTotals.map(({ s, v }) => (
                    <span key={s} style={{
                      padding: '7px 13px', borderRadius: 20, fontSize: 12.5, whiteSpace: 'nowrap', flexShrink: 0,
                      background: v > 0 ? cat.bg : P.white, border: `1px solid ${v > 0 ? 'transparent' : P.ink5}`,
                      color: v > 0 ? cat.color : P.ink3, fontWeight: 600,
                    }}>{s} · {fmt(v)}</span>
                  ))}
                </div>
              )}

              {catExp.length === 0 && (
                <Card style={{ color: P.ink3, fontSize: 13.5, textAlign: 'center' }}>Nessuna spesa in questa categoria a {MONTHS[month]}.</Card>
              )}
              {[...catExp].sort((a, b) => b.amount - a.amount).map(e => (
                <Card key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{e.sub}</div>
                    <div style={{ fontSize: 12, color: P.ink3 }}>{fmtDate(e)}{e.note ? ` · ${e.note}` : ''}</div>
                  </div>
                  <span style={{ fontWeight: 700, fontSize: 14.5, letterSpacing: '-0.3px' }}>{fmt(e.amount)}</span>
                  <button onClick={() => setExpenseModal({ expense: e })} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Icon name="pencil" size={15} color={P.ink4} />
                  </button>
                  <button onClick={() => deleteExpense(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Icon name="trash" size={15} color={P.ink4} />
                  </button>
                </Card>
              ))}
              <Btn onClick={() => setExpenseModal({ catId: cat.id })} style={{ width: '100%', marginTop: 12 }}>
                <Icon name="plus" size={16} color="#fff" /> Aggiungi spesa in {cat.name}
              </Btn>
            </div>
          )
        })()}

        {/* ── OBIETTIVI ── */}
        {view.name === 'goals' && (
          <GoalsView goals={goals} totalIncome={curIncome} avgSpend={avgSpend} margin={margin}
            analyzeGoal={analyzeGoal} onSaveGoal={saveGoal} onUpdateSaved={updateGoalSaved} onDelete={deleteGoal} />
        )}

        {/* ── IMPORT ── */}
        {view.name === 'import' && (
          <ImportView cats={cats} categorizeAI={categorizeAI} onImport={importExpenses} expenses={expenses} />
        )}

        {/* ── GESTIONE ── */}
        {view.name === 'manage' && (
          <ManageView cats={cats} customCats={customCats} monthExp={monthExp} month={month}
            recurring={recurring} incomes={incomes} monthIncomes={monthIncomes}
            salary={salary} totalIncome={totalIncome}
            onEditExpense={e => setExpenseModal({ expense: e })} onDeleteExpense={deleteExpense}
            onToggleRecurring={toggleRecurring} onDeleteRecurring={deleteRecurring}
            onAddIncome={addIncome} onDeleteIncome={deleteIncome}
            onAddCategory={addCategory} onDeleteCategory={deleteCategory}
            onUpdateCatSubs={updateCatSubs} onOpenSalary={() => setSalaryOpen(true)} />
        )}
      </div>

      {/* FAB chat */}
      {!chatOpen && (
        <button onClick={() => setChatOpen(true)} style={{
          position: 'fixed', right: 16, bottom: 96, zIndex: 80,
          width: 52, height: 52, borderRadius: '50%', background: P.ink, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 20px rgba(15,15,20,.28)',
        }}>
          <Icon name="chat" size={22} color="#fff" />
        </button>
      )}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} buildContext={buildContext} />

      {/* Bottom nav */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
        background: 'rgba(255,255,255,.94)', backdropFilter: 'blur(10px)', borderTop: `1px solid ${P.ink5}`,
      }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'flex', padding: '8px 8px calc(8px + env(safe-area-inset-bottom))' }}>
          {NAV.map(([key, icon, label]) => key === 'add' ? (
            <div key={key} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <button onClick={() => setExpenseModal({})} style={{
                width: 48, height: 48, borderRadius: '50%', background: P.blue, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -14,
                boxShadow: '0 5px 16px rgba(37,99,235,.35)',
              }}>
                <Icon name="plus" size={22} color="#fff" />
              </button>
            </div>
          ) : (
            <button key={key} onClick={() => setView({ name: key })} style={{
              flex: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '5px 0 3px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            }}>
              <Icon name={icon} size={20} color={view.name === key ? P.blue : P.ink4} />
              <span style={{ fontSize: 10.5, fontWeight: 600, color: view.name === key ? P.blue : P.ink4 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modali */}
      {expenseModal && (
        <ExpenseModal cats={cats} initial={expenseModal.expense || (expenseModal.catId ? { catId: expenseModal.catId } : null)}
          defaultDate={month === now.getMonth() ? isoDate(now) : `${YEAR}-${String(month + 1).padStart(2, '0')}-01`}
          onSave={saveExpense} onClose={() => setExpenseModal(null)} />
      )}
      {salaryOpen && <SalaryModal salary={salary} onSave={saveSalary} onClose={() => setSalaryOpen(false)}
        onAddExtra={() => setIncomeOpen(true)} />}
      {incomeOpen && <IncomeModal month={month} onSave={addIncome} onClose={() => setIncomeOpen(false)} />}
      {report && <ReportModal report={report} onClose={() => setReport(null)} />}
      {planOpen && (
        <PlanModal monthName={MONTHS[month]} income={totalIncome} estRic={estRic}
          goalHint={totGoalQuota} existing={curBudget}
          onGenerate={generatePlan} onSave={saveBudget} onClose={() => setPlanOpen(false)} />
      )}
      {ricOpen && ricCands.length > 0 && (
        <RicSuggestModal candidates={ricCands} cats={cats}
          onConfirm={confirmRic} onDismiss={dismissRic} onClose={() => setRicOpen(false)} />
      )}
    </div>
  )
}
