-- storage bucket for dispatch agreements, COIs, and rate confirmations
insert into storage.buckets (id, name, public)
values ('carrier-docs', 'carrier-docs', false)
on conflict (id) do nothing;

-- Phase 1: any authenticated user (the dispatch team) can read and write
-- files in carrier-docs. Per-dispatcher scoping comes later.
create policy "authenticated read carrier-docs" on storage.objects
  for select to authenticated using (bucket_id = 'carrier-docs');

create policy "authenticated upload carrier-docs" on storage.objects
  for insert to authenticated with check (bucket_id = 'carrier-docs');

create policy "authenticated update carrier-docs" on storage.objects
  for update to authenticated using (bucket_id = 'carrier-docs');

create policy "authenticated delete carrier-docs" on storage.objects
  for delete to authenticated using (bucket_id = 'carrier-docs');
