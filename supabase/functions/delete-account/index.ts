// Edge Function "delete-account": elimina definitivamente l'account dell'utente che la chiama.
// Tutte le tabelle di SpendIQ hanno "on delete cascade" verso auth.users, quindi spese,
// entrate, obiettivi, categorie, ricorrenti, piani e contatori AI vengono cancellati insieme.
import { admin, corsHeaders, getUser, json } from '../_shared/http.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) })
  if (req.method !== 'POST') return json(req, 405, { code: 'method_not_allowed', error: 'Metodo non consentito' })

  const user = await getUser(req)
  if (!user) return json(req, 401, { code: 'unauthorized', error: 'Sessione non valida, accedi di nuovo' })

  // Conferma esplicita richiesta anche lato server, per evitare cancellazioni accidentali.
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* corpo assente */ }
  if (body.confirm !== 'ELIMINA') {
    return json(req, 400, { code: 'bad_request', error: 'Conferma mancante' })
  }

  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('deleteUser failed', error.message)
    return json(req, 500, { code: 'server_error', error: 'Impossibile eliminare l\'account, riprova più tardi' })
  }
  return json(req, 200, { ok: true })
})
