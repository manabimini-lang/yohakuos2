create table if not exists public.yui_unified_action_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  action_id text not null,
  feedback text not null check (feedback in ('helpful', 'dismissed')),
  dismiss_reason text check (dismiss_reason in ('busy', 'not_relevant', 'later')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, action_id)
);

alter table public.yui_unified_action_feedback
  add column if not exists dismiss_reason text
  check (dismiss_reason in ('busy', 'not_relevant', 'later'));

create index if not exists idx_yui_unified_action_feedback_user_feedback
  on public.yui_unified_action_feedback (user_id, feedback);

alter table public.yui_unified_action_feedback enable row level security;

create policy "yui_unified_action_feedback_select_own"
  on public.yui_unified_action_feedback for select
  using (auth.uid()::text = user_id);

create policy "yui_unified_action_feedback_insert_own"
  on public.yui_unified_action_feedback for insert
  with check (auth.uid()::text = user_id);

create policy "yui_unified_action_feedback_update_own"
  on public.yui_unified_action_feedback for update
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);

grant select, insert, update on table public.yui_unified_action_feedback to authenticated, service_role;
