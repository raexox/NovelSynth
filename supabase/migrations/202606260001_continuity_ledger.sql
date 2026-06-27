create table if not exists public.continuity_facts (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  scene_id uuid references public.scenes(id) on delete set null,
  chapter_id uuid references public.chapters(id) on delete set null,
  entity_type text not null check (entity_type in ('character', 'location', 'faction', 'powerSystem', 'object', 'timeline', 'relationship')),
  entity_id uuid null references public.story_bible_items(id) on delete set null,
  entity_name text not null default '',
  fact_type text not null default '',
  fact_text text not null default '',
  status text not null default 'active' check (status in ('active', 'superseded', 'resolved', 'contradicted')),
  starts_at_scene_id uuid references public.scenes(id) on delete set null,
  ends_at_scene_id uuid references public.scenes(id) on delete set null,
  source text not null default 'memory' check (source in ('memory', 'bible_edit')),
  created_at timestamptz not null default now()
);

create index if not exists continuity_facts_book_id_idx on public.continuity_facts(book_id);
create index if not exists continuity_facts_entity_idx on public.continuity_facts(book_id, entity_type, entity_id);
create index if not exists continuity_facts_scene_idx on public.continuity_facts(book_id, starts_at_scene_id, ends_at_scene_id);

create table if not exists public.bible_item_versions (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  bible_item_id uuid not null references public.story_bible_items(id) on delete cascade,
  category text not null check (category in ('characters', 'locations', 'factions', 'powerSystems')),
  name text not null default '',
  data jsonb not null default '{}'::jsonb,
  source_scene_id uuid references public.scenes(id) on delete set null,
  reason text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists bible_item_versions_book_id_idx on public.bible_item_versions(book_id);
create index if not exists bible_item_versions_item_idx on public.bible_item_versions(book_id, bible_item_id, created_at desc);
