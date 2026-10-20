-- Allow authenticated users to use a private Realtime topic scoped to their own user ID.
-- Topic format: angel-devices:<auth.uid()>. Presence payloads contain device labels only,
-- never camera frames, screen content, credentials, or private workspace data.
begin;

drop policy if exists "Users can receive own Angel device presence" on realtime.messages;
create policy "Users can receive own Angel device presence"
on realtime.messages for select to authenticated
using (split_part(realtime.topic(), ':', 2) = auth.uid()::text);

drop policy if exists "Users can publish own Angel device presence" on realtime.messages;
create policy "Users can publish own Angel device presence"
on realtime.messages for insert to authenticated
with check (split_part(realtime.topic(), ':', 2) = auth.uid()::text);

commit;
