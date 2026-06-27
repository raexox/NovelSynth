grant select, insert, update, delete on public.continuity_facts to authenticated;
grant select, insert, update, delete on public.bible_item_versions to authenticated;

alter table public.continuity_facts enable row level security;
alter table public.bible_item_versions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'continuity_facts'
      and policyname = 'Users can manage continuity facts for their books'
  ) then
    create policy "Users can manage continuity facts for their books"
      on public.continuity_facts
      for all
      to authenticated
      using (
        exists (
          select 1 from public.books
          where books.id = continuity_facts.book_id
            and books.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.books
          where books.id = continuity_facts.book_id
            and books.user_id = auth.uid()
        )
      );
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'bible_item_versions'
      and policyname = 'Users can manage bible item versions for their books'
  ) then
    create policy "Users can manage bible item versions for their books"
      on public.bible_item_versions
      for all
      to authenticated
      using (
        exists (
          select 1 from public.books
          where books.id = bible_item_versions.book_id
            and books.user_id = auth.uid()
        )
      )
      with check (
        exists (
          select 1 from public.books
          where books.id = bible_item_versions.book_id
            and books.user_id = auth.uid()
        )
      );
  end if;
end
$$;
