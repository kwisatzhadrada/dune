-- ============================================================
-- DreamLink V2: Dreams as first-class entities
-- ============================================================

-- Add updated_at trigger helper (if not exists)
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Updated_at trigger on profiles (bug fix)
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- DREAMS
-- ============================================================
create table if not exists public.dreams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  why_it_matters text,
  current_stage text not null default 'Idea'
    check (current_stage in ('Idea', 'Building', 'Launching', 'Growing', 'Scaling')),
  progress_percentage integer not null default 0 check (progress_percentage between 0 and 100),
  current_obstacle text,
  next_milestone text,
  status text not null default 'active' check (status in ('active', 'archived', 'completed')),
  followers_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists dreams_user_id_idx on public.dreams (user_id);
create index if not exists dreams_status_idx on public.dreams (status);

drop trigger if exists dreams_updated_at on public.dreams;
create trigger dreams_updated_at before update on public.dreams
  for each row execute procedure public.set_updated_at();

-- ============================================================
-- DREAM MILESTONES
-- ============================================================
create table if not exists public.dream_milestones (
  id uuid primary key default gen_random_uuid(),
  dream_id uuid not null references public.dreams(id) on delete cascade,
  title text not null,
  description text,
  completed boolean not null default false,
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dream_milestones_dream_id_idx on public.dream_milestones (dream_id);

-- ============================================================
-- DREAM FOLLOWERS
-- ============================================================
create table if not exists public.dream_followers (
  dream_id uuid not null references public.dreams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dream_id, user_id)
);

-- ============================================================
-- DREAM SAVES
-- ============================================================
create table if not exists public.dream_saves (
  dream_id uuid not null references public.dreams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dream_id, user_id)
);

-- ============================================================
-- DREAM COLLABORATORS
-- ============================================================
create table if not exists public.dream_collaborators (
  dream_id uuid not null references public.dreams(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'collaborator',
  created_at timestamptz not null default now(),
  primary key (dream_id, user_id)
);

-- ============================================================
-- Add dream_id FK to posts
-- ============================================================
alter table public.posts add column if not exists dream_id uuid references public.dreams(id) on delete set null;
create index if not exists posts_dream_id_idx on public.posts (dream_id);

-- ============================================================
-- RPC: increment/decrement dream followers
-- ============================================================
create or replace function public.increment_dream_followers(dream_id uuid)
returns void language sql security definer as $$
  update public.dreams set followers_count = followers_count + 1 where id = dream_id;
$$;

create or replace function public.decrement_dream_followers(dream_id uuid)
returns void language sql security definer as $$
  update public.dreams set followers_count = greatest(0, followers_count - 1) where id = dream_id;
$$;

-- ============================================================
-- Also fix increment_likes / decrement_likes if missing
-- ============================================================
create or replace function public.increment_likes(post_id uuid)
returns void language sql security definer as $$
  update public.posts set likes_count = likes_count + 1 where id = post_id;
$$;

create or replace function public.decrement_likes(post_id uuid)
returns void language sql security definer as $$
  update public.posts set likes_count = greatest(0, likes_count - 1) where id = post_id;
$$;

create or replace function public.increment_saves(post_id uuid)
returns void language sql security definer as $$
  update public.posts set saves_count = saves_count + 1 where id = post_id;
$$;

create or replace function public.decrement_saves(post_id uuid)
returns void language sql security definer as $$
  update public.posts set saves_count = greatest(0, saves_count - 1) where id = post_id;
$$;

-- ============================================================
-- RLS
-- ============================================================
alter table public.dreams enable row level security;
alter table public.dream_milestones enable row level security;
alter table public.dream_followers enable row level security;
alter table public.dream_saves enable row level security;
alter table public.dream_collaborators enable row level security;

-- Dreams: public read, owner write
create policy "dreams_select" on public.dreams for select using (true);
create policy "dreams_insert" on public.dreams for insert with check (auth.uid() = user_id);
create policy "dreams_update" on public.dreams for update using (auth.uid() = user_id);
create policy "dreams_delete" on public.dreams for delete using (auth.uid() = user_id);

-- Milestones: public read, dream owner write
create policy "milestones_select" on public.dream_milestones for select using (true);
create policy "milestones_insert" on public.dream_milestones for insert
  with check (exists (select 1 from public.dreams where id = dream_id and user_id = auth.uid()));
create policy "milestones_update" on public.dream_milestones for update
  using (exists (select 1 from public.dreams where id = dream_id and user_id = auth.uid()));
create policy "milestones_delete" on public.dream_milestones for delete
  using (exists (select 1 from public.dreams where id = dream_id and user_id = auth.uid()));

-- Followers: public read, self manage
create policy "followers_select" on public.dream_followers for select using (true);
create policy "followers_insert" on public.dream_followers for insert with check (auth.uid() = user_id);
create policy "followers_delete" on public.dream_followers for delete using (auth.uid() = user_id);

-- Saves: self only
create policy "saves_select" on public.dream_saves for select using (auth.uid() = user_id);
create policy "saves_insert" on public.dream_saves for insert with check (auth.uid() = user_id);
create policy "saves_delete" on public.dream_saves for delete using (auth.uid() = user_id);

-- Collaborators: public read, dream owner manage
create policy "collaborators_select" on public.dream_collaborators for select using (true);
create policy "collaborators_insert" on public.dream_collaborators for insert
  with check (exists (select 1 from public.dreams where id = dream_id and user_id = auth.uid()));
create policy "collaborators_delete" on public.dream_collaborators for delete
  using (exists (select 1 from public.dreams where id = dream_id and user_id = auth.uid()));

-- Realtime
alter publication supabase_realtime add table public.dreams;
