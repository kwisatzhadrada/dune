-- Security fixes: storage policies, connections self-accept, is_admin self-escalation

-- 1. Fix avatar storage policies — scope to owner's folder prefix
drop policy if exists "avatar_insert" on storage.objects;
create policy "avatar_insert" on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid() is not null
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_update" on storage.objects;
create policy "avatar_update" on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatar_delete" on storage.objects;
create policy "avatar_delete" on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Fix connections update policy — only addressee can accept/decline, requester cannot self-accept
drop policy if exists "connections_update_involved" on public.connections;
create policy "connections_update_involved" on public.connections for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id and status in ('accepted', 'declined'));

-- 3. Prevent is_admin self-escalation — users cannot change their own is_admin flag
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    -- is_admin cannot be changed via this policy (admins use service role)
    and is_admin = (select is_admin from public.profiles where id = auth.uid())
  );
