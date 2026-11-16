import { supabase } from './supabase'

// Tutte le chiamate AI passano dall'Edge Function "ai": la chiave Anthropic non è mai nel browser.
// Il server decide modello, system prompt e limiti; il client indica solo il tipo di richiesta.

const GENERIC = 'Il coach AI non è disponibile in questo momento. Riprova tra poco.'

export class AIError extends Error {
  constructor(code, message) {
    super(message || GENERIC)
    this.name = 'AIError'
    this.code = code // consent_required | rate_limited | unauthorized | busy | upstream | unavailable
  }
}

// testo da mostrare all'utente per un errore qualsiasi di una funzione AI
export const aiErrorText = e => (e instanceof AIError ? e.message : GENERIC)

// task: 'chat' | 'insight' | 'report' | 'goal' | 'plan' | 'categorize'
// input: stringa (prompt singolo) oppure array di messaggi { role, content }
export async function callAI(task, input) {
  const body = typeof input === 'string' ? { task, prompt: input } : { task, messages: input }
  const { data, error } = await supabase.functions.invoke('ai', { body })
  if (error) {
    let code = 'unavailable', message = ''
    try {
      const payload = await error.context?.json?.()
      if (payload) { code = payload.code || code; message = payload.error || '' }
    } catch { /* risposta non JSON o errore di rete */ }
    throw new AIError(code, message)
  }
  return data?.text || ''
}

export function aiJSON(text, fallback) {
  try { return JSON.parse(String(text).replace(/```json|```/g, '').trim()) } catch { return fallback }
}
