-- Migration P0: consenso all'uso dell'AI, limite giornaliero delle richieste AI, hardening.
-- Eseguire nell'SQL Editor di Supabase dopo supabase-schema.sql, migration-tx-date.sql e migration-buckets.sql.

-- 1) Consenso esplicito all'invio dei dati finanziari al fornitore AI (Anthropic).
--    NULL = coach AI non attivato. Le Edge Function rifiutano le richieste senza consenso.
alter table profiles add column if not exists ai_consent_at timestamptz;

-- 2) Contatore giornaliero delle richieste AI per utente (rate limit lato server).
create table if not exists ai_usage (
  user_id uuid references auth.users on delete cascade not null,
  day date not null default current_date,
  count integer not null default 0,
  primary key (user_id, day)
);
-- RLS attivo e nessuna policy: dal browser la tabella non è né leggibile né scrivibile.
-- Ci accede solo l'Edge Function "ai" con la service role key.
alter table ai_usage enable row level security;

-- Incrementa il contatore e dice se l'utente è ancora sotto il limite (operazione atomica).
create or replace function public.ai_usage_hit(p_user uuid, p_limit integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare n integer;
begin
  insert into ai_usage (user_id, day, count) values (p_user, current_date, 1)
  on conflict (user_id, day) do update set count = ai_usage.count + 1
  returning count into n;
  return n <= p_limit;
end;
$$;

-- Solo il server può chiamarla: un utente non deve poter consumare il limite di un altro.
revoke all on function public.ai_usage_hit(uuid, integer) from public, anon, authenticated;
grant execute on function public.ai_usage_hit(uuid, integer) to service_role;

-- 3) Hardening: search_path fisso sulla funzione security definer del signup.
alter function public.handle_new_user() set search_path = public;
