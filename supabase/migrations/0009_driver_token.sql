alter table loads add column driver_token uuid default gen_random_uuid();

-- security definer functions so a driver can act on exactly one load via
-- its token, without an account and without seeing anything else

create or replace function get_load_by_driver_token(token uuid)
returns table (
  id uuid,
  origin_city text,
  origin_state text,
  dest_city text,
  dest_state text,
  pickup_date date,
  delivery_date date,
  status text,
  carrier_id uuid
)
language sql
security definer
set search_path = public
as $$
  select id, origin_city, origin_state, dest_city, dest_state,
         pickup_date, delivery_date, status, carrier_id
  from loads
  where driver_token = token;
$$;

grant execute on function get_load_by_driver_token(uuid) to anon, authenticated;

create or replace function advance_load_status_by_driver_token(token uuid, new_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if new_status not in ('dispatched', 'in_transit', 'delivered') then
    raise exception 'Invalid status for driver update';
  end if;

  update loads set status = new_status where driver_token = token;

  if not found then
    raise exception 'Invalid driver link';
  end if;
end;
$$;

grant execute on function advance_load_status_by_driver_token(uuid, text) to anon, authenticated;

create or replace function insert_pod_by_driver_token(token uuid, doc_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_load_id uuid;
  target_carrier_id uuid;
begin
  select id, carrier_id into target_load_id, target_carrier_id
  from loads where driver_token = token;

  if target_load_id is null then
    raise exception 'Invalid driver link';
  end if;

  insert into documents (carrier_id, load_id, kind, url)
  values (target_carrier_id, target_load_id, 'pod', doc_url);
end;
$$;

grant execute on function insert_pod_by_driver_token(uuid, text) to anon, authenticated;
