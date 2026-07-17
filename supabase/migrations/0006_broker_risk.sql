alter table brokers add column days_to_pay int;
alter table brokers add column risk_flag text default 'unknown';
alter table brokers add column last_load_at timestamptz;
