# Supabase setup

Run the files in `migrations/` in order, in the Supabase SQL editor, against
a new Supabase project:

1. `0001_schema.sql` - core tables (profiles, carriers, equipment, drivers, brokers, loads, documents)
2. `0002_compliance_gate.sql` - carrier activation trigger and active-carrier-required trigger on loads
3. `0003_rls.sql` - row level security, one authenticated-full-access policy per table
4. `0004_storage.sql` - creates the `carrier-docs` storage bucket and its access policies
5. `0005_lane_benchmarks.sql` - lane rate benchmark table used for load scoring
6. `0006_broker_risk.sql` - broker risk flag, days to pay, and last load date
7. `0007_equipment_costs.sql` - fixed weekly cost and cost per mile on equipment, used by the Trucks P&L report
8. `0008_dispatcher_scope.sql` - replaces the open carrier and load policies with per-dispatcher scoping, owners see everything
9. `0009_driver_token.sql` - per-load driver token plus security definer functions the public driver link uses to read and update exactly one load
10. `0010_invoice_seq.sql` - per-carrier invoice sequence used to number invoice packets

After running the migrations, copy the project URL and anon key into
`.env.local` (see `.env.local.example` at the repo root). Also copy the
project's service role key into `SUPABASE_SERVICE_ROLE_KEY`. It is used
server-side only, for inviting dispatchers and for the driver proof of
delivery upload route, and must never be exposed to the browser.

The first authenticated user does not automatically get a row in `profiles`.
Insert one manually for now, with role `owner` so you can invite the rest
of the team from the Team page:

```sql
insert into profiles (id, full_name, role)
values ('<the user id from auth.users>', 'Your Name', 'owner');
```
