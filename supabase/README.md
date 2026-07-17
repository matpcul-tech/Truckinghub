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

After running the migrations, copy the project URL and anon key into
`.env.local` (see `.env.local.example` at the repo root).

The first authenticated user does not automatically get a row in `profiles`.
Insert one manually for now:

```sql
insert into profiles (id, full_name, role)
values ('<the user id from auth.users>', 'Your Name', 'dispatcher');
```
