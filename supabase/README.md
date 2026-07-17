# Supabase setup

Run the files in `migrations/` in order, in the Supabase SQL editor, against
a new Supabase project:

1. `0001_schema.sql` - core tables (profiles, carriers, equipment, drivers, brokers, loads, documents)
2. `0002_compliance_gate.sql` - carrier activation trigger and active-carrier-required trigger on loads
3. `0003_rls.sql` - row level security, one authenticated-full-access policy per table
4. `0004_storage.sql` - creates the `carrier-docs` storage bucket and its access policies

After running the migrations, copy the project URL and anon key into
`.env.local` (see `.env.local.example` at the repo root).

The first authenticated user does not automatically get a row in `profiles`.
Insert one manually for now:

```sql
insert into profiles (id, full_name, role)
values ('<the user id from auth.users>', 'Your Name', 'dispatcher');
```
