-- ================================================================
-- DeutschLernen AI — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- 1. Anonymous user sessions
create table if not exists sessions (
  id         uuid        primary key default gen_random_uuid(),
  device_id  text        unique not null,
  created_at timestamptz default now(),
  last_seen  timestamptz default now()
);

-- 2. Cached AI explanations (shared across all users)
create table if not exists word_explanations (
  word_id     int         primary key,
  explanation text        not null,
  created_at  timestamptz default now()
);

-- 3. Per-user word progress
create table if not exists progress (
  id           uuid        primary key default gen_random_uuid(),
  session_id   uuid        references sessions(id) on delete cascade,
  word_id      int         not null,
  status       text        default 'new'
                           check (status in ('new','learning','review','mastered')),
  interval     int         default 1,
  ease         float       default 2.5,
  review_count int         default 0,
  next_review  timestamptz default now(),
  last_rating  int,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (session_id, word_id)
);

-- ================================================================
-- Row Level Security
-- ================================================================
alter table sessions         enable row level security;
alter table word_explanations enable row level security;
alter table progress          enable row level security;

-- Sessions: anyone can create/read (anon key)
create policy "sessions_insert" on sessions for insert to anon with check (true);
create policy "sessions_select" on sessions for select to anon using (true);
create policy "sessions_update" on sessions for update to anon using (true);

-- Explanations: public read, service-role write (API function)
create policy "explanations_select" on word_explanations for select using (true);
create policy "explanations_insert" on word_explanations for insert to service_role with check (true);
create policy "explanations_upsert" on word_explanations for update to service_role using (true);

-- Progress: anon can read/write their own rows
create policy "progress_insert" on progress for insert to anon with check (true);
create policy "progress_select" on progress for select to anon using (true);
create policy "progress_update" on progress for update to anon using (true);

-- ================================================================
-- Indexes for performance
-- ================================================================
create index if not exists idx_progress_session on progress (session_id);
create index if not exists idx_progress_next_review on progress (next_review);
create index if not exists idx_sessions_device on sessions (device_id);

-- ================================================================
-- Optional: function to auto-update updated_at
-- ================================================================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger progress_updated_at
  before update on progress
  for each row execute function update_updated_at();

-- Allow anon to write explanations (needed for client-side caching)
create policy "anon_insert_explanations" on word_explanations
  for insert to anon with check (true);

create policy "anon_update_explanations" on word_explanations
  for update to anon using (true);
