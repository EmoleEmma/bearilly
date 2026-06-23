-- ============================================================
-- MIGRATION: Add quiz_results table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Apply AFTER the base database.sql has been run.
-- ============================================================

-- ── quiz_results ───────────────────────────────────────────────
create table if not exists public.quiz_results (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  category        text not null,
  score           int  not null default 0,
  total           int  not null default 100,
  passed          boolean not null default false,
  attempt_number  int  not null default 1,
  taken_at        timestamptz not null default now()
);

alter table public.quiz_results enable row level security;

-- Users can view their own results
create policy "quiz_results: own rows read"
  on public.quiz_results for select
  using (auth.uid() = user_id);

-- Users can insert their own results
create policy "quiz_results: own rows insert"
  on public.quiz_results for insert
  with check (auth.uid() = user_id);

-- Admins can read all results
create policy "quiz_results: admin read all"
  on public.quiz_results for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Index for fast lookups by user
create index if not exists quiz_results_user_id_idx on public.quiz_results(user_id);
create index if not exists quiz_results_category_idx on public.quiz_results(category);
create index if not exists quiz_results_taken_at_idx on public.quiz_results(taken_at desc);
