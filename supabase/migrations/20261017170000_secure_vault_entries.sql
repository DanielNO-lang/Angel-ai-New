-- Secure Vault ciphertext storage. Client-generated plaintext keys never leave the browser.
create table if not exists public.vault_entries (
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('task', 'memory')),
  id text not null,
  encrypted_payload jsonb not null,
  version integer not null default 1 check (version >= 1),
  updated_at timestamptz not null default now(),
  primary key (user_id, entry_type, id)
);

create index if not exists vault_entries_user_updated_idx
  on public.vault_entries (user_id, updated_at desc);

alter table public.vault_entries enable row level security;

drop policy if exists "Users can read their own vault entries" on public.vault_entries;
create policy "Users can read their own vault entries"
  on public.vault_entries for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own vault entries" on public.vault_entries;
create policy "Users can create their own vault entries"
  on public.vault_entries for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own vault entries" on public.vault_entries;
create policy "Users can update their own vault entries"
  on public.vault_entries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own vault entries" on public.vault_entries;
create policy "Users can delete their own vault entries"
  on public.vault_entries for delete
  using (auth.uid() = user_id);

comment on table public.vault_entries is
  'Stores client-encrypted task and memory payloads. The server stores ciphertext only; clients hold the passphrase-derived AES-GCM key.';
