insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'yohaku-audio',
  'yohaku-audio',
  false,
  20971520,
  array['audio/wav']::text[]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;
