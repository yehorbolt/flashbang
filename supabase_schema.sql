-- Create categories table
create table public.categories (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  name text not null,
  original_language text not null default 'de',
  translation_language text not null default 'en',
  is_system boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- Create words table
create table public.words (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null default auth.uid (),
  category_id uuid null,
  german_word text not null,
  german_spelling text null,
  translation text not null,
  image_url text null,
  next_review timestamp with time zone null default now(),
  interval float not null default 0,
  ease_factor float not null default 2.5,
  consecutive_correct int not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint words_pkey primary key (id),
  constraint words_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
  constraint words_category_id_fkey foreign key (category_id) references public.categories (id) on delete set null
);

-- Enable RLS
alter table public.categories enable row level security;
alter table public.words enable row level security;

-- Policies for categories
create policy "Users can view their own categories" on public.categories
  for select using (auth.uid() = user_id);

create policy "Users can insert their own categories" on public.categories
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own categories" on public.categories
  for update using (auth.uid() = user_id);

create policy "Users can delete their own categories" on public.categories
  for delete using (auth.uid() = user_id);

-- Policies for words
create policy "Users can view their own words" on public.words
  for select using (auth.uid() = user_id);

create policy "Users can insert their own words" on public.words
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own words" on public.words
  for update using (auth.uid() = user_id);

create policy "Users can delete their own words" on public.words
  for delete using (auth.uid() = user_id);
