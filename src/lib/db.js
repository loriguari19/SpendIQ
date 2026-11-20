import { supabase } from './supabase'

const PAGE = 1000 // limite predefinito di righe per richiesta di Supabase/PostgREST

// Scarica tutte le righe dell'utente da una tabella, pagina per pagina.
// Lancia un errore se una richiesta fallisce: chi chiama non deve mai scambiare
// "errore di rete" per "nessun dato".
export async function fetchAll(table, client = supabase) {
  let out = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await client.from(table).select('*')
      .order('created_at', { ascending: true }).order('id', { ascending: true })
      .range(from, from + PAGE - 1)
    if (error) throw error
    out = out.concat(data || [])
    if (!data || data.length < PAGE) return out
  }
}

// Tabelle con i dati dell'utente (profiles ha chiave "id" e va letta a parte).
export const USER_TABLES = ['expenses', 'incomes', 'budgets', 'goals', 'categories', 'recurring']

// Esportazione completa dei dati dell'utente (portabilità, art. 20 GDPR).
export async function exportUserData(user, client = supabase) {
  const { data: profile, error } = await client.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (error) throw error
  const out = {
    app: 'SpendIQ',
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile,
  }
  for (const t of USER_TABLES) out[t] = await fetchAll(t, client)
  return out
}
