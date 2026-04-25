-- Wardrobe OS - Custom GPT Actions OAuth support

create table if not exists public.gpt_oauth_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null,
  redirect_uri text not null,
  scopes text[] not null default '{}',
  code_challenge text,
  code_challenge_method text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_gpt_oauth_codes_user_id on public.gpt_oauth_codes(user_id);
create index if not exists idx_gpt_oauth_codes_expires_at on public.gpt_oauth_codes(expires_at);

create table if not exists public.gpt_oauth_refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  refresh_token_hash text not null unique,
  user_id uuid not null references public.profiles(id) on delete cascade,
  client_id text not null,
  scopes text[] not null default '{}',
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_gpt_oauth_refresh_tokens_user_id on public.gpt_oauth_refresh_tokens(user_id);
create index if not exists idx_gpt_oauth_refresh_tokens_expires_at on public.gpt_oauth_refresh_tokens(expires_at);

alter table public.gpt_oauth_codes enable row level security;
alter table public.gpt_oauth_refresh_tokens enable row level security;

-- No user-facing RLS policies are added on purpose. These tables are written
-- only by server routes using the Supabase service role.
