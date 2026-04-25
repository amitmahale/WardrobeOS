-- Wardrobe OS — initial schema
-- Designed for Supabase/Postgres
-- UUID generation assumed via pgcrypto or gen_random_uuid()

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  climate_region text,
  default_dress_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.closets (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  slug text,
  is_default boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.closet_members (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner','editor','viewer')),
  created_at timestamptz not null default now(),
  unique (closet_id, user_id)
);

create table if not exists public.person_profiles (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  name text not null,
  relationship_label text,
  style_profile jsonb not null default '{}'::jsonb,
  sizes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  wearer_profile_id uuid references public.person_profiles(id) on delete set null,
  name text not null,
  category text not null,
  subcategory text,
  primary_color text not null,
  secondary_color text,
  pattern text,
  material text,
  warmth smallint not null default 2 check (warmth between 1 and 5),
  formality smallint not null default 2 check (formality between 1 and 5),
  seasons text[] not null default '{}',
  occasions text[] not null default '{}',
  fit_notes text,
  brand text,
  purchase_date date,
  purchase_price numeric(10,2),
  currency text default 'USD',
  wear_count integer not null default 0,
  last_worn_at timestamptz,
  status text not null default 'active' check (status in ('active','stored','donated','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_items_closet_id on public.items(closet_id);
create index if not exists idx_items_category on public.items(category);
create index if not exists idx_items_primary_color on public.items(primary_color);

create table if not exists public.item_images (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  original_path text not null,
  display_path text,
  thumb_path text,
  mime_type text,
  width integer,
  height integer,
  size_bytes bigint,
  checksum text,
  processing_status text not null default 'pending' check (processing_status in ('pending','processing','ready','failed')),
  processing_error text,
  ai_suggestion_status text not null default 'not_requested' check (ai_suggestion_status in ('not_requested','pending','ready','failed')),
  average_color_hex text,
  ai_suggestions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_outfits (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  name text,
  source text not null default 'manual' check (source in ('manual','recommendation')),
  occasion text,
  season text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_outfit_items (
  id uuid primary key default gen_random_uuid(),
  outfit_id uuid not null references public.saved_outfits(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete cascade,
  slot text not null,
  unique (outfit_id, item_id, slot)
);

create table if not exists public.recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  target_type text not null check (target_type in ('outfit_recommendation','purchase_recommendation')),
  target_key text not null,
  feedback text not null check (feedback in ('thumbs_up','thumbs_down','saved','wore','dismissed')),
  note text,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.closet_insight_snapshots (
  id uuid primary key default gen_random_uuid(),
  closet_id uuid not null references public.closets(id) on delete cascade,
  summary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.purchase_candidate_library (
  key text primary key,
  name text not null,
  category text not null,
  subcategory text,
  default_color text,
  default_pattern text,
  default_material text,
  seasons text[] not null default '{}',
  occasions text[] not null default '{}',
  formality smallint not null default 2,
  warmth smallint not null default 2,
  price_band text,
  metadata jsonb not null default '{}'::jsonb
);

alter table public.profiles enable row level security;
alter table public.closets enable row level security;
alter table public.closet_members enable row level security;
alter table public.person_profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_images enable row level security;
alter table public.saved_outfits enable row level security;
alter table public.saved_outfit_items enable row level security;
alter table public.recommendation_feedback enable row level security;
alter table public.closet_insight_snapshots enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "closets_member_access"
  on public.closets for select
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = id and m.user_id = auth.uid()
    )
  );

create policy "closets_owner_insert"
  on public.closets for insert
  with check (owner_user_id = auth.uid());

create policy "closet_members_member_access"
  on public.closet_members for select
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = closet_id and m.user_id = auth.uid()
    )
  );

create policy "person_profiles_member_access"
  on public.person_profiles for all
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = person_profiles.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = person_profiles.closet_id and m.user_id = auth.uid()
    )
  );

create policy "items_member_access"
  on public.items for all
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = items.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = items.closet_id and m.user_id = auth.uid()
    )
  );

create policy "item_images_member_access"
  on public.item_images for all
  using (
    exists (
      select 1
      from public.items i
      join public.closet_members m on m.closet_id = i.closet_id
      where i.id = item_images.item_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.items i
      join public.closet_members m on m.closet_id = i.closet_id
      where i.id = item_images.item_id and m.user_id = auth.uid()
    )
  );

create policy "saved_outfits_member_access"
  on public.saved_outfits for all
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = saved_outfits.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = saved_outfits.closet_id and m.user_id = auth.uid()
    )
  );

create policy "saved_outfit_items_member_access"
  on public.saved_outfit_items for all
  using (
    exists (
      select 1
      from public.saved_outfits o
      join public.closet_members m on m.closet_id = o.closet_id
      where o.id = saved_outfit_items.outfit_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.saved_outfits o
      join public.closet_members m on m.closet_id = o.closet_id
      where o.id = saved_outfit_items.outfit_id and m.user_id = auth.uid()
    )
  );

create policy "feedback_member_access"
  on public.recommendation_feedback for all
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = recommendation_feedback.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = recommendation_feedback.closet_id and m.user_id = auth.uid()
    )
  );

create policy "insight_snapshots_member_access"
  on public.closet_insight_snapshots for all
  using (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = closet_insight_snapshots.closet_id and m.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.closet_members m
      where m.closet_id = closet_insight_snapshots.closet_id and m.user_id = auth.uid()
    )
  );

insert into public.purchase_candidate_library (key, name, category, subcategory, default_color, default_pattern, default_material, seasons, occasions, formality, warmth, price_band, metadata)
values
('cream_trouser', 'Cream trousers', 'bottom', 'trousers', 'cream', 'solid', 'cotton', array['spring','summer','fall'], array['smart-casual','work','dinner'], 3, 2, 'medium', '{"style":"bridge"}'),
('olive_chino', 'Olive chinos', 'bottom', 'chinos', 'olive', 'solid', 'cotton', array['spring','fall'], array['casual','smart-casual','travel'], 2, 2, 'medium', '{"style":"bridge"}'),
('white_ocbd', 'White OCBD', 'top', 'button-down-shirt', 'white', 'solid', 'cotton', array['all'], array['work','smart-casual','dinner'], 3, 2, 'medium', '{"style":"staple"}'),
('brown_suede_loafers', 'Brown suede loafers', 'shoes', 'loafers', 'brown', 'solid', 'suede', array['spring','summer','fall'], array['smart-casual','dinner'], 3, 2, 'medium', '{"style":"upgrade"}'),
('charcoal_merino_crewneck', 'Charcoal merino crewneck', 'layer', 'sweater', 'charcoal', 'solid', 'merino', array['fall','winter','spring'], array['work','smart-casual','travel'], 3, 3, 'medium', '{"style":"staple"}')
on conflict (key) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'item-images',
  'item-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "item_images_public_read"
  on storage.objects for select
  using (bucket_id = 'item-images');

create policy "item_images_authenticated_insert"
  on storage.objects for insert
  with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_owner_update"
  on storage.objects for update
  using (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "item_images_owner_delete"
  on storage.objects for delete
  using (
    bucket_id = 'item-images'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
