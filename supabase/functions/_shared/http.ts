// Utility condivise dalle Edge Function di SpendIQ: CORS, risposte JSON, autenticazione.
import { createClient, type User } from 'npm:@supabase/supabase-js@2.119.0'

// ALLOWED_ORIGINS: elenco separato da virgole (es. "https://spendiq.vercel.app,http://localhost:5173").
// Se non impostato si accetta qualunque origine: le richieste restano comunque protette dal JWT.
const ALLOWED = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? ''
  const allow = ALLOWED.length === 0 ? '*' : (ALLOWED.includes(origin) ? origin : ALLOWED[0])
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
}

export function json(req: Request, status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), 'Content-Type': 'application/json' },
  })
}

// Client con la service role key: bypassa RLS, da usare solo dopo aver verificato l'utente.
export const admin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// Verifica il JWT dell'utente (header Authorization) e restituisce l'utente, o null.
export async function getUser(req: Request): Promise<User | null> {
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const { data, error } = await admin.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user
}
