-- Persistent user-owned artifact library, including editable research reports.
-- This migration is additive and should be applied only after the project owner approves
-- the target Supabase environment. IDs remain text because client-created resources use prefixed IDs.
create table if not exists public.library_items (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text not null default '',
  category text not null default 'documents',
  type text not null default 'document',
  url text,
  content text,
  metadata jsonb not null default '{}'::jsonb,
  mime_type text,
  tags text[] not null default '{}',
  project_id text,
  is_favorite boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.library_items enable row level security;
drop policy if exists "Users can view own library items" on public.library_items;
create policy "Users can view own library items"
  on public.library_items for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "Users can insert own library items" on public.library_items;
create policy "Users can insert own library items"
  on public.library_items for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "Users can update own library items" on public.library_items;
create policy "Users can update own library items"
  on public.library_items for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
drop policy if exists "Users can delete own library items" on public.library_items;
create policy "Users can delete own library items"
  on public.library_items for delete to authenticated
  using (auth.uid() = user_id);

create index if not exists library_items_user_updated_idx
  on public.library_items(user_id, updated_at desc);
create index if not exists library_items_user_project_idx
  on public.library_items(user_id, project_id);
