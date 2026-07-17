-- dispatchers using the system
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'dispatcher',
  created_at timestamptz default now()
);

-- carriers: the trucking companies we dispatch for (our clients)
create table carriers (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  mc_number text,
  dot_number text,
  authority_active boolean default false,
  insurance_coi_url text,
  insurance_expiry date,
  dispatch_agreement_url text,
  dispatch_agreement_signed boolean default false,
  fee_percent numeric default 6.0,
  status text not null default 'pending',
  assigned_dispatcher uuid references profiles(id),
  created_at timestamptz default now()
);

-- trucks and trailers per carrier
create table equipment (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references carriers(id) on delete cascade,
  unit_number text,
  type text,
  created_at timestamptz default now()
);

-- drivers per carrier
create table drivers (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references carriers(id) on delete cascade,
  full_name text not null,
  phone text,
  cdl_number text,
  created_at timestamptz default now()
);

-- brokers: freight sources, with credit tracking
create table brokers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  mc_number text,
  credit_score int,
  notes text,
  created_at timestamptz default now()
);

-- loads: the core operational record
create table loads (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid not null references carriers(id),
  broker_id uuid references brokers(id),
  driver_id uuid references drivers(id),
  equipment_id uuid references equipment(id),
  origin_city text,
  origin_state text,
  dest_city text,
  dest_state text,
  pickup_date date,
  delivery_date date,
  rate numeric not null default 0,
  loaded_miles numeric default 0,
  deadhead_miles numeric default 0,
  rate_per_mile numeric generated always as
    (case when loaded_miles > 0 then rate / loaded_miles else 0 end) stored,
  status text not null default 'booked',
  ratecon_url text,
  created_at timestamptz default now()
);

-- document vault
create table documents (
  id uuid primary key default gen_random_uuid(),
  carrier_id uuid references carriers(id) on delete cascade,
  load_id uuid references loads(id) on delete cascade,
  kind text,
  url text not null,
  created_at timestamptz default now()
);
