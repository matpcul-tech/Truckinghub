create table lane_benchmarks (
  id uuid primary key default gen_random_uuid(),
  origin_state text not null,
  dest_state text not null,
  equipment_type text not null,
  benchmark_rpm numeric not null,
  updated_at timestamptz default now(),
  unique (origin_state, dest_state, equipment_type)
);

alter table lane_benchmarks enable row level security;
create policy "authenticated full access" on lane_benchmarks
  for all to authenticated using (true) with check (true);
