-- drop the open policies first
drop policy "authenticated full access" on carriers;
drop policy "authenticated full access" on loads;

-- owners see everything, dispatchers see only carriers assigned to them
create policy "carrier scope" on carriers
  for all to authenticated
  using (
    assigned_dispatcher = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  )
  with check (
    assigned_dispatcher = auth.uid()
    or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
  );

-- loads follow the carrier they belong to
create policy "load scope" on loads
  for all to authenticated
  using (
    exists (
      select 1 from carriers c
      where c.id = loads.carrier_id
        and (
          c.assigned_dispatcher = auth.uid()
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
        )
    )
  )
  with check (
    exists (
      select 1 from carriers c
      where c.id = loads.carrier_id
        and (
          c.assigned_dispatcher = auth.uid()
          or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'owner')
        )
    )
  );
