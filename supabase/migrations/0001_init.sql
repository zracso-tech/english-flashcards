-- English flashcards: schema
-- Single-user app. RLS abierto en cards (solo el dueño del proyecto se loguea por magic link),
-- per-user en progreso y sesiones por si en el futuro se invita a alguien.

create extension if not exists "uuid-ossp";

create table public.cards (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  meaning text not null,
  example text,
  module text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index cards_module_idx on public.cards(module);

create table public.user_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id uuid not null references public.cards(id) on delete cascade,
  streak int not null default 0,
  last_seen_at timestamptz,
  mastered_at timestamptz,
  primary key (user_id, card_id)
);

create index user_progress_user_streak_idx on public.user_progress(user_id, streak);

create table public.sessions (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  correct int not null default 0,
  wrong int not null default 0,
  primary key (user_id, date)
);

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger cards_touch_updated_at
  before update on public.cards
  for each row execute function public.touch_updated_at();

-- RLS
alter table public.cards enable row level security;
alter table public.user_progress enable row level security;
alter table public.sessions enable row level security;

create policy "cards_read"   on public.cards for select to authenticated using (true);
create policy "cards_write"  on public.cards for insert to authenticated with check (true);
create policy "cards_update" on public.cards for update to authenticated using (true) with check (true);
create policy "cards_delete" on public.cards for delete to authenticated using (true);

create policy "progress_self" on public.user_progress for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "sessions_self" on public.sessions for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
