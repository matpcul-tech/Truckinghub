alter table profiles enable row level security;
alter table carriers enable row level security;
alter table equipment enable row level security;
alter table drivers enable row level security;
alter table brokers enable row level security;
alter table loads enable row level security;
alter table documents enable row level security;

-- Phase 1: small team, every authenticated user gets full access.
-- Per-dispatcher scoping comes in the multi-dispatcher phase.
create policy "authenticated full access" on profiles
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on carriers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on equipment
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on drivers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on brokers
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on loads
  for all to authenticated using (true) with check (true);

create policy "authenticated full access" on documents
  for all to authenticated using (true) with check (true);
