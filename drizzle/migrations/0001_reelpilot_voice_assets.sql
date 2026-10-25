alter table public.videos add column voice_url text;

-- Storage: users can read/write their own reel-assets objects directly
create policy "Users read own reel assets"
on storage.objects for select to authenticated
using (bucket_id = 'reel-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users upload own reel assets"
on storage.objects for insert to authenticated
with check (bucket_id = 'reel-assets' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own reel assets"
on storage.objects for delete to authenticated
using (bucket_id = 'reel-assets' and (storage.foldername(name))[1] = auth.uid()::text);
