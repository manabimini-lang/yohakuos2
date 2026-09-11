alter table public.yui_notification_settings
  add column if not exists notification_level text not null default 'standard'
  check (notification_level in ('light', 'standard'));

grant select, insert, update on table public.yui_notification_settings to authenticated, service_role;
