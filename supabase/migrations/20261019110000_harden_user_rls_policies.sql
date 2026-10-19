-- Remove redundant legacy policies and keep one indexed, user-scoped policy per table.
-- This migration is safe to re-run and preserves the existing user ownership boundary.
drop policy if exists "Users can manage own agents" on public.agents;
drop policy if exists "Users can manage own conversations" on public.conversations;
drop policy if exists "Users can manage own library items" on public.library_items;
drop policy if exists "Users can manage own memories" on public.memories;
drop policy if exists "Users can manage own messages" on public.messages;
drop policy if exists "Users can manage own projects" on public.projects;
drop policy if exists "Users can manage own tasks" on public.tasks;
drop policy if exists "Users can manage own workflows" on public.workflows;

-- Explicitly scope the user-owned policies to authenticated users.
alter policy agents_self_access on public.agents to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy conversations_self_access on public.conversations to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy library_self_access on public.library_items to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy memories_self_access on public.memories to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy projects_self_access on public.projects to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy tasks_self_access on public.tasks to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy workflows_self_access on public.workflows to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy executions_self_access on public.executions to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy settings_self_access on public.settings to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
alter policy profiles_self_access on public.profiles to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Messages must belong to the caller AND to a conversation owned by the caller.
-- The prior permissive duplicate policy could otherwise OR-bypass this relationship check.
drop policy if exists messages_self_access on public.messages;
create policy messages_self_access on public.messages
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = (select auth.uid())
    )
  );
