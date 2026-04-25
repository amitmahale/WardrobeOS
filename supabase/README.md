# Supabase Setup

Apply this migration once in the Supabase SQL editor:

```text
supabase/migrations/0001_initial_schema.sql
```

Steps:

1. Open Supabase Dashboard.
2. Select the Wardrobe OS project.
3. Open SQL Editor.
4. Paste the full contents of `supabase/migrations/0001_initial_schema.sql`.
5. Run the SQL.

The migration creates:

- wardrobe tables and indexes
- row-level security policies
- starter purchase candidate rows
- public `item-images` storage bucket
- storage policies scoped to each authenticated user's folder

After applying it, magic-link auth can bootstrap a default profile and closet on first app load.
