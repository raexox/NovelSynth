create table if not exists public.ai_conversations (
  id text primary key,
  book_id uuid references public.books(id) on delete cascade,
  title text not null default 'New Conversation',
  messages jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_conversations_book_id_idx on public.ai_conversations(book_id);
create index if not exists ai_conversations_updated_at_idx on public.ai_conversations(book_id, updated_at desc);
