-- ============================================================
-- PATCH: Add missing columns to quiz_results table
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run even if quiz_results was just created.
-- ============================================================

-- Add attempt_number if it doesn't exist yet
alter table public.quiz_results
  add column if not exists attempt_number int not null default 1;

-- Add indexes for performance (safe to re-run)
create index if not exists quiz_results_user_id_idx  on public.quiz_results(user_id);
create index if not exists quiz_results_category_idx on public.quiz_results(category);
create index if not exists quiz_results_taken_at_idx on public.quiz_results(taken_at desc);
