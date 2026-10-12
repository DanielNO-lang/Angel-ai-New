-- Private, user-owned media artifacts and binary storage for Angel AI.
create table if not exists public.media_artifacts (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  prompt text not null,
  negative_prompt text,
  type text not null check (type in ('image','video','document','creation')),
  category text not null check (category in ('images','documents','creations','templates')),
  storage_path text,
  url text not null default '',
  mime_type text not null default 'application/octet-stream',
  aspect_ratio text not null default '16:9',
  model_id text not null,
  status text not null default 'queued' check (status in ('queued','processing','completed','failed')),
  progress integer not null default 0 check (progress between 0 and 100),
  tags text[] not null default '{}',
  project_id text,
  task_id text,
  conversation_id text,
  file_size_bytes bigint,
  width integer,
  height integer,
  duration_sec numeric,
  seed bigint,
  metadata jsonb not null default '{}'::jsonb,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists media_artifacts_user_created_idx
  on public.media_artifacts (user_id, created_at desc);
create index if not exists media_artifacts_user_project_idx
  on public.media_artifacts (user_id, project_id)
  where project_id is not null;

alter table public.media_artifacts enable row level security;
drop policy if exists media_artifacts_self_access on public.media_artifacts;
create policy media_artifacts_self_access on public.media_artifacts
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('angel-media', 'angel-media', false, 20971520,
  array['image/png','image/jpeg','image/webp','video/mp4','application/pdf'])
on conflict (id) do nothing;

drop policy if exists angel_media_select_own on storage.objects;
create policy angel_media_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'angel-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists angel_media_insert_own on storage.objects;
create policy angel_media_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'angel-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists angel_media_update_own on storage.objects;
create policy angel_media_update_own on storage.objects
  for update to authenticated
  using (bucket_id = 'angel-media' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'angel-media' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists angel_media_delete_own on storage.objects;
create policy angel_media_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'angel-media' and (storage.foldername(name))[1] = (select auth.uid())::text);
