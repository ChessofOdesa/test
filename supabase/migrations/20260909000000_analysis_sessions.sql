-- User-owned annotation data is separate from authoritative game records.
create table public.analysis_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  game_id uuid references public.games(id) on delete set null,
  title text not null check (char_length(title) between 1 and 160),
  pgn text not null check (octet_length(pgn) <= 2000000),
  metadata jsonb not null default '{}'::jsonb check (octet_length(metadata::text) <= 1000000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, game_id)
);
create index analysis_sessions_recent on public.analysis_sessions(user_id, updated_at desc);
alter table public.analysis_sessions enable row level security;
revoke all on public.analysis_sessions from anon;
grant select, insert, update, delete on public.analysis_sessions to authenticated;
create policy "Read own analyses" on public.analysis_sessions for select to authenticated using (user_id = (select auth.uid()));
create policy "Insert own analyses" on public.analysis_sessions for insert to authenticated with check (
  user_id = (select auth.uid()) and (game_id is null or exists (
    select 1 from public.games g where g.id = game_id and g.result in ('1-0', '0-1', '1/2-1/2')
      and ((select auth.uid()) = g.white_player_id or (select auth.uid()) = g.black_player_id)
  ))
);
create policy "Update own analyses" on public.analysis_sessions for update to authenticated
  using (user_id = (select auth.uid())) with check (
    user_id = (select auth.uid()) and (game_id is null or exists (
      select 1 from public.games g where g.id = game_id and g.result in ('1-0', '0-1', '1/2-1/2')
        and ((select auth.uid()) = g.white_player_id or (select auth.uid()) = g.black_player_id)
    ))
  );
create policy "Delete own analyses" on public.analysis_sessions for delete to authenticated using (user_id = (select auth.uid()));
