-- ============================================================
-- BEARILLY — Multi-School Migration
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- Safe to run on top of the existing database.sql schema.
-- ============================================================

-- ── schools ───────────────────────────────────────────────────
-- Each row is one purchasable "school" (e.g. Bearilly Creators,
-- Bearilly Islamic Studies). Price is stored in kobo (NGN smallest
-- unit) to match how Paystack already works in payment/page.tsx.
create table if not exists public.schools (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,          -- e.g. 'creators', 'islamic-studies'
  name          text not null,                 -- e.g. 'Bearilly Creators'
  tagline       text,                           -- short one-liner for browse cards
  description   text,                           -- longer copy for payment page
  price_kobo    int  not null,                  -- e.g. 100000 = ₦1,000
  features      jsonb not null default '[]'::jsonb,  -- array of strings, e.g. ["6 course categories", ...]
  is_active     boolean not null default true,  -- controls whether it shows on /browse
  order_index   int  not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.schools enable row level security;

-- Anyone (even logged out, if you ever need that) can read active schools —
-- this is public marketing info, same as a pricing page.
create policy "schools: anyone reads active schools"
  on public.schools for select
  using (is_active = true);

-- Admins can read all schools, including inactive ones
create policy "schools: admin reads all"
  on public.schools for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Seed the existing Bearilly Creators school so current users/content
-- have somewhere to attach to. Adjust price/features to match what's
-- currently hardcoded in payment/page.tsx before running in production.
insert into public.schools (slug, name, tagline, description, price_kobo, features, order_index)
values (
  'creators',
  'Bearilly Creators',
  'For content creators, marketers & entrepreneurs',
  'The original Bearilly — everything you need to grow as a creator, from content strategy to business skills.',
  100000,
  '["6 comprehensive course categories", "Full access to the Creator Toolkit", "Unlimited Bearilly AI Tutor conversations", "Real assessment grading and project tracking"]'::jsonb,
  0
)
on conflict (slug) do nothing;

-- ── profiles: add school_id ──────────────────────────────────
alter table public.profiles
  add column if not exists school_id uuid references public.schools(id);

-- Backfill existing paid/activated users into the Creators school
-- so they don't lose access when this migration runs.
update public.profiles
set school_id = (select id from public.schools where slug = 'creators')
where school_id is null and is_activated = true;

-- ── lessons, quizzes, assessments, tool_directory: add school_id ──
alter table public.lessons        add column if not exists school_id uuid references public.schools(id);
alter table public.assessments    add column if not exists school_id uuid references public.schools(id);
alter table public.tool_directory add column if not exists school_id uuid references public.schools(id);

-- Backfill all existing content into Creators school
update public.lessons
set school_id = (select id from public.schools where slug = 'creators')
where school_id is null;

update public.assessments
set school_id = (select id from public.schools where slug = 'creators')
where school_id is null;

update public.tool_directory
set school_id = (select id from public.schools where slug = 'creators')
where school_id is null;

-- Note: quizzes inherit school scoping through their lesson_id -> lessons.school_id,
-- so no school_id column is needed on quizzes itself.

-- ============================================================
-- Updated RLS policies — scope content access to the user's school
-- ============================================================

-- Lessons: activated users read only their own school's lessons
drop policy if exists "lessons: activated users read" on public.lessons;
create policy "lessons: own school activated users read"
  on public.lessons for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_activated = true
        and profiles.school_id = lessons.school_id
    )
  );

-- Quizzes: activated users read quizzes belonging to lessons in their school
drop policy if exists "quizzes: activated users read" on public.quizzes;
create policy "quizzes: own school activated users read"
  on public.quizzes for select
  using (
    exists (
      select 1 from public.lessons
      join public.profiles on profiles.id = auth.uid()
      where lessons.id = quizzes.lesson_id
        and profiles.is_activated = true
        and profiles.school_id = lessons.school_id
    )
  );

-- Assessments: activated users read only their own school's assessments
drop policy if exists "assessments: activated users read" on public.assessments;
create policy "assessments: own school activated users read"
  on public.assessments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_activated = true
        and profiles.school_id = assessments.school_id
    )
  );

-- Tool directory: activated users read only their own school's tools
drop policy if exists "tools: activated users read" on public.tool_directory;
create policy "tools: own school activated users read"
  on public.tool_directory for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid()
        and is_activated = true
        and profiles.school_id = tool_directory.school_id
    )
  );

-- ============================================================
-- Done. Next steps after running this:
-- 1. Verify the 'creators' school row has the correct real price/features.
-- 2. Insert any new school rows via the admin panel (once built) or SQL.
-- 3. Deploy the updated payment page + browse page (separate files).
-- ============================================================
