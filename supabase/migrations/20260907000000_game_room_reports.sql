begin;

create table if not exists public.game_reports (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.online_games(id),
  reporter_id uuid not null references auth.users(id),
  reported_id uuid not null references auth.users(id),
  reason text not null check (reason in ('abuse', 'spam', 'fair_play', 'other')),
  note text not null default '' check (char_length(note) <= 500),
  chat_snapshot jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  unique (game_id, reporter_id),
  check (reporter_id <> reported_id)
);
alter table public.game_reports enable row level security;
revoke all on public.game_reports from anon, authenticated;
grant select, insert, update, delete on public.game_reports to service_role;

create or replace function public.game_room_capabilities()
returns jsonb language sql security invoker set search_path = public
as $$ select jsonb_build_object('reports', true); $$;
revoke all on function public.game_room_capabilities() from public, anon, authenticated;
grant execute on function public.game_room_capabilities() to service_role;

commit;
