-- Run this once in Supabase SQL Editor.
-- It lets auth users claim player profiles and records who submitted each rating.

alter table public.players
  add column if not exists email text,
  add column if not exists user_id uuid references auth.users(id) on delete set null,
  add column if not exists claim_code text,
  add column if not exists claimed_at timestamptz;

alter table public.ratings
  add column if not exists voter_id uuid references auth.users(id) on delete cascade;

create unique index if not exists players_email_unique
  on public.players (lower(email))
  where email is not null;

create unique index if not exists players_user_id_unique
  on public.players (user_id)
  where user_id is not null;

create unique index if not exists players_claim_code_unique
  on public.players (upper(claim_code))
  where claim_code is not null;

create unique index if not exists ratings_one_vote_per_user_player
  on public.ratings (match_id, voter_id, player_id)
  where voter_id is not null;

update public.players
set claim_code =
  upper(
    coalesce(
      nullif(substr(regexp_replace(name, '[^a-zA-Z0-9]', '', 'g'), 1, 8), ''),
      'PLAYER'
    )
  )
  || '-'
  || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 4))
where claim_code is null;

-- Optional but recommended once your admin workflow is ready for RLS:
-- alter table public.ratings enable row level security;
--
-- create policy "Anyone can read ratings"
--   on public.ratings for select
--   using (true);
--
-- create policy "Match players can insert their own ratings"
--   on public.ratings for insert
--   with check (
--     auth.uid() = voter_id
--     and exists (
--       select 1
--       from public.players p
--       join public.match_players mp on mp.player_id = p.id
--       where p.user_id = auth.uid()
--         and mp.match_id = ratings.match_id
--     )
--   );
