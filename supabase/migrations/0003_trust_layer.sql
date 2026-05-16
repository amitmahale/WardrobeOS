create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  closet_id uuid references public.closets(id) on delete cascade,
  event_type text not null,
  severity text not null default 'info' check (severity in ('info','warning','error')),
  route text,
  item_id uuid references public.items(id) on delete set null,
  upload_id text,
  message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_app_events_user_created_at on public.app_events(user_id, created_at desc);
create index if not exists idx_app_events_closet_created_at on public.app_events(closet_id, created_at desc);
create index if not exists idx_app_events_upload_id on public.app_events(upload_id);

create table if not exists public.upload_recovery_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  closet_id uuid not null references public.closets(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,
  upload_id text not null,
  filename text not null,
  storage_path text,
  public_url text,
  status text not null default 'pending' check (status in ('pending','saved','failed','recovered','ignored')),
  stage text not null default 'selected',
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, upload_id)
);

create index if not exists idx_upload_recovery_user_status on public.upload_recovery_entries(user_id, status, updated_at desc);
create index if not exists idx_upload_recovery_closet_updated_at on public.upload_recovery_entries(closet_id, updated_at desc);

alter table public.app_events enable row level security;
alter table public.upload_recovery_entries enable row level security;

create policy "app_events_member_select"
  on public.app_events for select
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.closet_members m
      where m.closet_id = app_events.closet_id and m.user_id = auth.uid()
    )
  );

create policy "upload_recovery_member_access"
  on public.upload_recovery_entries for all
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.closet_members m
      where m.closet_id = upload_recovery_entries.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    or exists (
      select 1 from public.closet_members m
      where m.closet_id = upload_recovery_entries.closet_id and m.user_id = auth.uid()
    )
  );
