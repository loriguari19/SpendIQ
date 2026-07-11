-- SpendIQ — Schema database Supabase
-- Eseguire tutto nell'SQL Editor di Supabase.
-- Nota: cat_id è TEXT (non integer come nella prima bozza) perché le categorie
-- di default hanno id '1'..'8' mentre quelle custom hanno id UUID.

create extension if not exists "uuid-ossp";

-- Profili (stipendio base)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  salary numeric default 0,
  created_at timestamptz default now()
);

-- Spese
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cat_id text not null,
  sub text not null,
  amount numeric not null,
  note text default '',
  month integer not null,      -- 0-11
  year integer not null,
  recurring_id uuid,           -- collega alle spese ricorrenti generate
  created_at timestamptz default now()
);

-- Obiettivi
create table goals (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text default '🎯',
  target numeric not null,
  saved numeric default 0,
  deadline date not null,
  monthly_ai numeric,
  advice text,
  created_at timestamptz default now()
);

-- Categorie personalizzate (le 8 di default sono hardcoded nel frontend)
create table categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  icon text not null,
  color text not null,
  bg text not null,
  subs text[] default '{}',
  created_at timestamptz default now()
);

-- Entrate extra mensili (oltre lo stipendio base)
create table incomes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount numeric not null,
  note text default '',
  month integer not null,
  year integer not null,
  created_at timestamptz default now()
);

-- Spese ricorrenti (template applicati ogni mese)
create table recurring (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  cat_id text not null,
  sub text not null,
  amount numeric not null,
  note text default '',
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table profiles enable row level security;
alter table expenses enable row level security;
alter table goals enable row level security;
alter table categories enable row level security;
alter table incomes enable row level security;
alter table recurring enable row level security;

create policy "own profile" on profiles for all using (auth.uid() = id);
create policy "own expenses" on expenses for all using (auth.uid() = user_id);
create policy "own goals" on goals for all using (auth.uid() = user_id);
create policy "own categories" on categories for all using (auth.uid() = user_id);
create policy "own incomes" on incomes for all using (auth.uid() = user_id);
create policy "own recurring" on recurring for all using (auth.uid() = user_id);

-- Crea profilo automaticamente al signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
