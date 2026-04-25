# Supabase Setup

Apply these migrations once in the Supabase SQL editor, in order:

```text
supabase/migrations/0001_initial_schema.sql
supabase/migrations/0002_gpt_actions_oauth.sql
```

Steps:

1. Open Supabase Dashboard.
2. Select the Wardrobe OS project.
3. Open SQL Editor.
4. Paste the full contents of each migration.
5. Run the SQL.

The migration creates:

- wardrobe tables and indexes
- row-level security policies
- starter purchase candidate rows
- public `item-images` storage bucket
- storage policies scoped to each authenticated user's folder
- Custom GPT OAuth grant tables

After applying it, magic-link auth can bootstrap a default profile and closet on first app load.
