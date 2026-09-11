alter table public.yui_notification_settings
  alter column enabled set default false,
  alter column morning_enabled set default false;

-- Older rows were silently created with this exact default shape. Disable only
-- those rows so scheduled AI/external sync starts after an explicit user choice.
update public.yui_notification_settings
set
  enabled = false,
  morning_enabled = false,
  updated_at = now()
where enabled = true
  and morning_enabled = true
  and evening_enabled = false
  and morning_time = '07:00'
  and evening_time = '20:00'
  and timezone = 'Asia/Tokyo';
