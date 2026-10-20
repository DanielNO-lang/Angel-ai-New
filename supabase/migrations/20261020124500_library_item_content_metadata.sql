-- Extend persistent Library items for editable grounded research reports.
-- Additive and safe to apply to databases which already have library_items.
alter table public.library_items
  add column if not exists content text;

alter table public.library_items
  add column if not exists metadata jsonb not null default '{}'::jsonb;

update public.library_items
set metadata = '{}'::jsonb
where metadata is null;

alter table public.library_items
  alter column metadata set default '{}'::jsonb,
  alter column metadata set not null;
