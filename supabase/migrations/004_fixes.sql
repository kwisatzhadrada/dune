-- Fix handle_new_user trigger to read Google OAuth 'picture' key for avatar
-- Google sends picture, not avatar_url, in raw_user_meta_data
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- Add missing index on connections.addressee_id for accept/decline queries
create index if not exists connections_addressee_id_idx
  on public.connections (addressee_id);

-- Add partial index on messages(receiver_id, read) for unread count queries
create index if not exists messages_receiver_unread_idx
  on public.messages (receiver_id, read)
  where read = false;
