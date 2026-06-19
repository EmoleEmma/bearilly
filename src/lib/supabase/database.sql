-- ============================================================
-- BEARILLY — Complete Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── access_codes ──────────────────────────────────────────────
create table if not exists public.access_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  status        text not null default 'active' check (status in ('active', 'used', 'disabled')),
  usage_limit   int  not null default 1,
  used_count    int  not null default 0,
  expires_at    timestamptz,
  created_at    timestamptz not null default now()
);

-- ── profiles ──────────────────────────────────────────────────
-- Mirrors auth.users; auto-created on sign-up via trigger below
create table if not exists public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text not null default '',
  email               text not null unique,
  role                text not null default 'user' check (role in ('user', 'admin')),
  is_activated        boolean not null default false,
  payment_status      text not null default 'unpaid' check (payment_status in ('unpaid', 'paid', 'activated')),
  payment_reference   text,
  access_code_id      uuid references public.access_codes(id),
  created_at          timestamptz not null default now()
);

-- ── lessons ───────────────────────────────────────────────────
create table if not exists public.lessons (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  title       text not null,
  description text,
  content     text,
  example     text,
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

-- ── quizzes ───────────────────────────────────────────────────
create table if not exists public.quizzes (
  id          uuid primary key default gen_random_uuid(),
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  question    text not null,
  options     jsonb,          -- array of answer options
  answer      text not null,  -- correct answer
  created_at  timestamptz not null default now()
);

-- ── progress ──────────────────────────────────────────────────
create table if not exists public.progress (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  lesson_id   uuid not null references public.lessons(id) on delete cascade,
  status      text not null default 'started' check (status in ('started', 'completed')),
  updated_at  timestamptz not null default now(),
  unique (user_id, lesson_id)
);

-- ── assessments ───────────────────────────────────────────────
create table if not exists public.assessments (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text,
  deadline    timestamptz,
  status      text not null default 'active' check (status in ('active', 'closed')),
  file_url    text,           -- downloadable instructions PDF
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);

-- ── submissions ───────────────────────────────────────────────
create table if not exists public.submissions (
  id              uuid primary key default gen_random_uuid(),
  assessment_id   uuid not null references public.assessments(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  file_url        text,
  link_url        text,
  submission_date timestamptz not null default now(),
  status          text not null default 'submitted' check (status in ('submitted', 'under_review', 'reviewed')),
  reviewer_notes  text
);

-- ── tool_directory ────────────────────────────────────────────
create table if not exists public.tool_directory (
  id          uuid primary key default gen_random_uuid(),
  category    text not null,
  tool_name   text not null,
  tool_url    text not null,
  description text,
  is_free     boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── ai_usage ──────────────────────────────────────────────────
create table if not exists public.ai_usage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  date        date not null default current_date,
  count       int  not null default 0,
  unique (user_id, date)
);

-- ============================================================
-- RLS Policies
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.access_codes   enable row level security;
alter table public.lessons         enable row level security;
alter table public.quizzes         enable row level security;
alter table public.progress        enable row level security;
alter table public.assessments     enable row level security;
alter table public.submissions     enable row level security;
alter table public.tool_directory  enable row level security;
alter table public.ai_usage        enable row level security;

-- Profiles: users see/edit their own; admins see all
create policy "users: read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "users: update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Lessons: activated users can read
create policy "lessons: activated users read"
  on public.lessons for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_activated = true
    )
  );

-- Quizzes: activated users can read
create policy "quizzes: activated users read"
  on public.quizzes for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_activated = true
    )
  );

-- Progress: own rows only
create policy "progress: own rows"
  on public.progress for all
  using (auth.uid() = user_id);

-- Assessments: activated users read; admins write
create policy "assessments: activated users read"
  on public.assessments for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_activated = true
    )
  );

-- Submissions: own rows read/insert; admins read all
create policy "submissions: own rows"
  on public.submissions for all
  using (auth.uid() = user_id);

-- Tool directory: all activated users read
create policy "tools: activated users read"
  on public.tool_directory for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_activated = true
    )
  );

-- AI usage: own rows
create policy "ai_usage: own rows"
  on public.ai_usage for all
  using (auth.uid() = user_id);

-- ============================================================
-- Auto-create profile on new auth user sign-up
-- (Fallback — the register API route also does this)
-- ============================================================

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, email, role, is_activated, payment_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.email,
    'user',
    false,
    'unpaid'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
