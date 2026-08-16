-- Supabase SQL Editor-da işlədin

-- Profiles: hər istifadəçinin ictimai profili (username)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are publicly viewable" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Projects: description, view_count əlavə et
alter table public.projects add column if not exists description text;
alter table public.projects add column if not exists view_count integer not null default 0;

-- Layihələr artıq hər kəsə görünə bilsin (public feed üçün)
drop policy if exists "Users can view own projects" on public.projects;
create policy "Anyone can view projects" on public.projects for select using (true);

-- Likes
create table if not exists public.likes (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
alter table public.likes enable row level security;
create policy "Likes are publicly viewable" on public.likes for select using (true);
create policy "Users can like as themselves" on public.likes for insert with check (auth.uid() = user_id);
create policy "Users can unlike their own like" on public.likes for delete using (auth.uid() = user_id);

-- Comments
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
alter table public.comments enable row level security;
create policy "Comments are publicly viewable" on public.comments for select using (true);
create policy "Users can comment as themselves" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users can delete own comments" on public.comments for delete using (auth.uid() = user_id);
