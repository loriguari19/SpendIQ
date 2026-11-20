// @vitest-environment jsdom
// Test di fumo dell'interfaccia con un Supabase finto in memoria.
// Verifica i comportamenti corretti con le modifiche P0, simulando il 3 gennaio 2027:
// lo storico dell'anno precedente resta visibile, le ricorrenti e il piano del nuovo mese
// vengono creati nell'anno giusto, e un errore di caricamento non genera scritture.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'

const h = vi.hoisted(() => {
  const state = { db: {}, calls: [], fail: false, seq: 0, invoked: [] }

  function builder(table) {
    const st = { op: 'select', payload: null, single: false, range: null }
    const b = {
      select: () => b, eq: () => b, in: () => b, order: () => b,
      range: (from, to) => { st.range = [from, to]; return b },
      insert: p => { st.op = 'insert'; st.payload = p; return b },
      update: p => { st.op = 'update'; st.payload = p; return b },
      upsert: p => { st.op = 'upsert'; st.payload = p; return b },
      delete: () => { st.op = 'delete'; return b },
      single: () => { st.single = true; return b },
      maybeSingle: () => { st.single = true; return b },
      then: (res, rej) => Promise.resolve(exec()).then(res, rej),
      catch: fn => Promise.resolve(exec()).catch(fn),
    }
    function exec() {
      if (state.fail) return { data: null, error: { message: 'network down', code: 'NETWORK' } }
      const rows = state.db[table] || (state.db[table] = [])
      if (st.op === 'select') {
        if (st.single) return { data: rows[0] ?? null, error: null }
        const [from, to] = st.range || [0, 999]
        return { data: rows.slice(from, to + 1), error: null }
      }
      state.calls.push({ table, op: st.op, payload: st.payload })
      if (st.op === 'insert') {
        const added = [].concat(st.payload).map(r => ({ id: `${table}-new-${++state.seq}`, created_at: '2027-01-03T08:00:00Z', ...r }))
        rows.push(...added)
        return { data: st.single ? added[0] : added, error: null }
      }
      return { data: st.single ? { ...(rows[0] || {}), ...st.payload } : [], error: null }
    }
    return b
  }

  const supabase = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1', email: 'test@example.com' } } } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() { } } } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: builder,
    functions: { invoke: (name, opts) => { state.invoked.push({ name, opts }); return Promise.resolve({ data: { text: '' }, error: null }) } },
  }
  return { state, supabase }
})

vi.mock('./lib/supabase', () => ({ supabase: h.supabase }))

import App from './App.jsx'

const exp = (id, year, month, day, cat_id, sub, amount, extra = {}) => ({
  id, user_id: 'u1', year, month, cat_id, sub, amount, note: '', bucket: null, recurring_id: null,
  tx_date: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
  created_at: `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T10:00:00Z`, ...extra,
})

function seed({ aiConsent = null } = {}) {
  h.state.db = {
    profiles: [{ id: 'u1', salary: 1800, ai_consent_at: aiConsent }],
    expenses: [
      exp('e1', 2026, 10, 12, '4', 'Supermercato', 250),
      exp('e2', 2026, 11, 5, '4', 'Supermercato', 320),
      exp('e3', 2026, 11, 20, '3', 'Ristoranti', 80),
      exp('e4', 2026, 11, 1, '6', 'Streaming', 12.99, { recurring_id: 'r1', bucket: 'ricorrenti' }),
    ],
    incomes: [],
    goals: [],
    categories: [],
    recurring: [{ id: 'r1', user_id: 'u1', cat_id: '6', sub: 'Streaming', amount: 12.99, note: 'Netflix', active: true, created_at: '2026-10-01T10:00:00Z' }],
    budgets: [{ id: 'b1', user_id: 'u1', year: 2026, month: 11, ricorrenti: 13, spesa: 300, svago: 200, salvadanaio: 400, consiglio: '', salvadanaio_done: true, created_at: '2026-12-01T10:00:00Z' }],
  }
  h.state.calls = []
  h.state.invoked = []
  h.state.fail = false
  h.state.seq = 0
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2027, 0, 3, 9, 0, 0)) // 3 gennaio 2027
  globalThis.ResizeObserver = class { observe() { } unobserve() { } disconnect() { } }
  localStorage.clear(); sessionStorage.clear()
  seed()
})
afterEach(() => { cleanup(); vi.useRealTimers() })

const inserts = table => h.state.calls.filter(c => c.table === table && c.op === 'insert').flatMap(c => [].concat(c.payload))

describe('cambio d\'anno (3 gennaio 2027)', () => {
  it('mostra gennaio, propone il report di dicembre e chiede il consenso AI una sola volta', async () => {
    render(<App />)
    expect(await screen.findByText('Speso a Gennaio')).toBeTruthy()
    // prima del fix il banner di dicembre a gennaio non compariva mai
    expect(screen.getByText(/Dicembre è finito/)).toBeTruthy()
    // consenso al coach AI proposto al primo accesso
    expect(await screen.findByText('Attiva il coach AI')).toBeTruthy()
    fireEvent.click(await screen.findByText('Non ora'))
    await waitFor(() => expect(screen.queryByText('Attiva il coach AI')).toBeNull())
    // senza consenso non parte nessuna chiamata AI
    expect(h.state.invoked).toEqual([])
  })

  it('applica ricorrenti e piano al nuovo mese con l\'anno giusto', async () => {
    render(<App />)
    await screen.findByText('Speso a Gennaio')
    await waitFor(() => expect(inserts('expenses').length).toBe(1))
    expect(inserts('expenses')[0]).toMatchObject({ recurring_id: 'r1', month: 0, year: 2027, amount: 12.99 })
    // il piano di dicembre 2026 viene rinnovato su gennaio 2027 (prima: nessun rinnovo a cavallo d'anno)
    await waitFor(() => expect(inserts('budgets').length).toBe(1))
    expect(inserts('budgets')[0]).toMatchObject({ month: 0, year: 2027, spesa: 300, svago: 200, salvadanaio_done: false })
  })

  it('permette di tornare all\'anno precedente e vedere le spese di dicembre', async () => {
    render(<App />)
    await screen.findByText('Speso a Gennaio')
    fireEvent.click(await screen.findByText('Non ora'))
    fireEvent.click(screen.getByLabelText('Anno precedente'))
    expect(await screen.findByText('Speso a Gennaio 2026')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Dic' }))
    expect(await screen.findByText('Speso a Dicembre 2026')).toBeTruthy()
    // 320 + 80 + 12,99 = 412,99
    expect(screen.getAllByText('412,99 €').length).toBeGreaterThan(0)
  })

  it('rende tutte le viste senza errori, compresa la scheda Account', async () => {
    render(<App />)
    await screen.findByText('Speso a Gennaio')
    fireEvent.click(await screen.findByText('Non ora'))
    fireEvent.click(screen.getByText('Obiettivi'))
    expect(await screen.findByText('La tua situazione')).toBeTruthy()
    fireEvent.click(screen.getByText('Import'))
    expect(await screen.findByText('Carica il tuo estratto conto')).toBeTruthy()
    fireEvent.click(screen.getByText('Gestione'))
    expect(await screen.findByText('Spese di Gennaio 2027')).toBeTruthy()
    for (const tab of ['Ricorrenti', 'Entrate', 'Categorie', 'Account']) fireEvent.click(screen.getByRole('button', { name: tab }))
    expect(screen.getByText('test@example.com')).toBeTruthy()
    expect(screen.getByText('Elimina il mio account')).toBeTruthy()
    expect(screen.getByText('Esporta i miei dati')).toBeTruthy()
  })

  it('con il coach attivo le richieste AI passano dalla Edge Function', async () => {
    seed({ aiConsent: '2027-01-01T10:00:00Z' })
    render(<App />)
    await screen.findByText('Speso a Gennaio')
    expect(screen.queryByText('Attiva il coach AI')).toBeNull()
    await waitFor(() => expect(h.state.invoked.length).toBeGreaterThan(0))
    expect(h.state.invoked[0].name).toBe('ai')
    expect(h.state.invoked[0].opts.body.task).toBe('insight')
  })
})

describe('errore di caricamento', () => {
  it('mostra un errore con Riprova e non scrive nulla nel database', async () => {
    h.state.fail = true
    render(<App />)
    expect(await screen.findByText('Non riesco a caricare i tuoi dati')).toBeTruthy()
    // prima del fix un caricamento fallito faceva reinserire tutte le ricorrenti
    expect(h.state.calls).toEqual([])
    h.state.fail = false
    fireEvent.click(screen.getByText('Riprova'))
    expect(await screen.findByText('Speso a Gennaio')).toBeTruthy()
  })
})
