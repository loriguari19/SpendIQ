-- Migration: buste di budget mensili (piano AI) + busta sulle singole spese
-- Eseguire nell'SQL Editor di Supabase (dopo supabase-schema.sql e migration-tx-date.sql).

-- Ogni spesa appartiene a una busta: 'ricorrenti' | 'spesa' | 'svago'
alter table expenses add column if not exists bucket text;

-- Piano del mese: quanto assegnare a ogni busta (proposto dall'AI, confermato dall'utente)
create table if not exists budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  month integer not null,          -- 0-11
  year integer not null,
  ricorrenti numeric default 0,
  spesa numeric default 0,
  svago numeric default 0,
  salvadanaio numeric default 0,
  consiglio text,                  -- nota del coach AI sul piano
  salvadanaio_done boolean default false,  -- accantonamento del mese confermato
  created_at timestamptz default now(),
  unique (user_id, month, year)
);

alter table budgets enable row level security;
create policy "own budgets" on budgets for all using (auth.uid() = user_id);
