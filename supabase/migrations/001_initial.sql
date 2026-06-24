-- ============================================================
-- DreamLink initial schema
-- ============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  full_name text,
  avatar_url text,
  location text,
  industry text,
  current_goal text,
  current_blocker text,
  skills text[] not null default '{}',
  bio text,
  linkedin_url text,
  twitter_url text,
  website_url text,
  is_admin boolean not null default false,
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- POSTS
-- ============================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  post_type text not null default 'reflection'
    check (post_type in ('question','win','obstacle','lesson','milestone','reflection')),
  industry text,
  tags text[] not null default '{}',
  likes_count integer not null default 0,
  replies_count integer not null default 0,
  saves_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on public.posts (created_at desc);
create index if not exists posts_user_id_idx on public.posts (user_id);
create index if not exists posts_post_type_idx on public.posts (post_type);

-- ============================================================
-- POST LIKES
-- ============================================================
create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ============================================================
-- POST SAVES
-- ============================================================
create table if not exists public.post_saves (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- ============================================================
-- POST REPLIES
-- ============================================================
create table if not exists public.post_replies (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists post_replies_post_id_idx on public.post_replies (post_id);

-- ============================================================
-- CONNECTIONS
-- ============================================================
create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique (requester_id, addressee_id)
);

-- ============================================================
-- MESSAGES (1:1)
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  receiver_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_idx on public.messages (sender_id, receiver_id, created_at);

-- ============================================================
-- GROUP MESSAGES
-- ============================================================
create table if not exists public.group_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists group_messages_created_at_idx on public.group_messages (created_at);

-- ============================================================
-- COUNTER TRIGGERS
-- ============================================================
create or replace function public.bump_likes() returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set likes_count = likes_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set likes_count = greatest(0, likes_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end; $$;

create or replace function public.bump_saves() returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set saves_count = saves_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set saves_count = greatest(0, saves_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end; $$;

create or replace function public.bump_replies() returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.posts set replies_count = replies_count + 1 where id = new.post_id;
    return new;
  elsif (tg_op = 'DELETE') then
    update public.posts set replies_count = greatest(0, replies_count - 1) where id = old.post_id;
    return old;
  end if;
  return null;
end; $$;

drop trigger if exists trg_post_likes on public.post_likes;
create trigger trg_post_likes after insert or delete on public.post_likes
  for each row execute function public.bump_likes();

drop trigger if exists trg_post_saves on public.post_saves;
create trigger trg_post_saves after insert or delete on public.post_saves
  for each row execute function public.bump_saves();

drop trigger if exists trg_post_replies on public.post_replies;
create trigger trg_post_replies after insert or delete on public.post_replies
  for each row execute function public.bump_replies();

-- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_posts_touch on public.posts;
create trigger trg_posts_touch before update on public.posts
  for each row execute function public.touch_updated_at();

-- ============================================================
-- NEW USER -> PROFILE
-- ============================================================
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.post_saves enable row level security;
alter table public.post_replies enable row level security;
alter table public.connections enable row level security;
alter table public.messages enable row level security;
alter table public.group_messages enable row level security;

-- helper: is admin
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- PROFILES policies
drop policy if exists "profiles_select_all" on public.profiles;
create policy "profiles_select_all" on public.profiles for select using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert
  with check (auth.uid() = id);

-- POSTS policies
drop policy if exists "posts_select_all" on public.posts;
create policy "posts_select_all" on public.posts for select using (true);

drop policy if exists "posts_insert_own" on public.posts;
create policy "posts_insert_own" on public.posts for insert with check (auth.uid() = user_id);

drop policy if exists "posts_update_own" on public.posts;
create policy "posts_update_own" on public.posts for update using (auth.uid() = user_id);

drop policy if exists "posts_delete_own_or_admin" on public.posts;
create policy "posts_delete_own_or_admin" on public.posts for delete
  using (auth.uid() = user_id or public.is_admin());

-- POST LIKES
drop policy if exists "likes_select_all" on public.post_likes;
create policy "likes_select_all" on public.post_likes for select using (true);
drop policy if exists "likes_insert_own" on public.post_likes;
create policy "likes_insert_own" on public.post_likes for insert with check (auth.uid() = user_id);
drop policy if exists "likes_delete_own" on public.post_likes;
create policy "likes_delete_own" on public.post_likes for delete using (auth.uid() = user_id);

-- POST SAVES
drop policy if exists "saves_select_own" on public.post_saves;
create policy "saves_select_own" on public.post_saves for select using (auth.uid() = user_id);
drop policy if exists "saves_insert_own" on public.post_saves;
create policy "saves_insert_own" on public.post_saves for insert with check (auth.uid() = user_id);
drop policy if exists "saves_delete_own" on public.post_saves;
create policy "saves_delete_own" on public.post_saves for delete using (auth.uid() = user_id);

-- POST REPLIES
drop policy if exists "replies_select_all" on public.post_replies;
create policy "replies_select_all" on public.post_replies for select using (true);
drop policy if exists "replies_insert_own" on public.post_replies;
create policy "replies_insert_own" on public.post_replies for insert with check (auth.uid() = user_id);
drop policy if exists "replies_delete_own_or_admin" on public.post_replies;
create policy "replies_delete_own_or_admin" on public.post_replies for delete
  using (auth.uid() = user_id or public.is_admin());

-- CONNECTIONS
drop policy if exists "connections_select_involved" on public.connections;
create policy "connections_select_involved" on public.connections for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "connections_insert_own" on public.connections;
create policy "connections_insert_own" on public.connections for insert
  with check (auth.uid() = requester_id);
drop policy if exists "connections_update_involved" on public.connections;
create policy "connections_update_involved" on public.connections for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "connections_delete_involved" on public.connections;
create policy "connections_delete_involved" on public.connections for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- MESSAGES
drop policy if exists "messages_select_involved" on public.messages;
create policy "messages_select_involved" on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);
drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own" on public.messages for insert
  with check (auth.uid() = sender_id);
drop policy if exists "messages_update_involved" on public.messages;
create policy "messages_update_involved" on public.messages for update
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- GROUP MESSAGES
drop policy if exists "group_select_all" on public.group_messages;
create policy "group_select_all" on public.group_messages for select using (auth.uid() is not null);
drop policy if exists "group_insert_own" on public.group_messages;
create policy "group_insert_own" on public.group_messages for insert with check (auth.uid() = user_id);

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.group_messages;
alter publication supabase_realtime add table public.posts;

-- ============================================================
-- STORAGE: avatars bucket
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar_read" on storage.objects;
create policy "avatar_read" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatar_insert" on storage.objects;
create policy "avatar_insert" on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatar_update" on storage.objects;
create policy "avatar_update" on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid() is not null);

drop policy if exists "avatar_delete" on storage.objects;
create policy "avatar_delete" on storage.objects for delete
  using (bucket_id = 'avatars' and auth.uid() is not null);
