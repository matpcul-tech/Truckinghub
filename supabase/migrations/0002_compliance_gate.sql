-- a carrier can only go active with agreement + authority + live insurance
create or replace function enforce_carrier_activation()
returns trigger as $$
begin
  if new.status = 'active' then
    if not new.dispatch_agreement_signed
       or not new.authority_active
       or new.insurance_expiry is null
       or new.insurance_expiry <= current_date then
      raise exception 'Carrier cannot be activated: requires signed dispatch agreement, active authority, and unexpired insurance.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger carriers_activation_gate
before update on carriers
for each row execute function enforce_carrier_activation();

-- no load can be created for a carrier that is not active
create or replace function enforce_active_carrier()
returns trigger as $$
begin
  if (select status from carriers where id = new.carrier_id) <> 'active' then
    raise exception 'Cannot create load: carrier is not active.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger loads_require_active_carrier
before insert on loads
for each row execute function enforce_active_carrier();
