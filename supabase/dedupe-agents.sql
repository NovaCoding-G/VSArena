-- Run once in Supabase SQL editor: removes duplicate agent names (e.g. 48× Baseline-IK)
-- and adds a unique index so concurrent seed requests cannot recreate them.
--
-- Safe to re-run: after cleanup, the DELETE affects 0 rows and the index already exists.

-- 1. Re-point matches at the canonical agent per name (most matches, then oldest).
with canonical as (
  select distinct on (a.name)
    a.id as keep_id,
    a.name
  from agents a
  order by
    a.name,
    (select count(*)::int from matches m where m.agent_id = a.id) desc,
    a.created_at asc nulls last,
    a.id asc
),
dupes as (
  select a.id as drop_id, c.keep_id
  from agents a
  join canonical c on c.name = a.name and c.keep_id <> a.id
)
update matches m
set agent_id = d.keep_id
from dupes d
where m.agent_id = d.drop_id;

-- 2. Same for leaderboard snapshots (if any).
with canonical as (
  select distinct on (a.name)
    a.id as keep_id,
    a.name
  from agents a
  order by
    a.name,
    (select count(*)::int from matches m where m.agent_id = a.id) desc,
    a.created_at asc nulls last,
    a.id asc
),
dupes as (
  select a.id as drop_id, c.keep_id
  from agents a
  join canonical c on c.name = a.name and c.keep_id <> a.id
)
update leaderboard_snapshots s
set agent_id = d.keep_id
from dupes d
where s.agent_id = d.drop_id;

-- 3. Drop duplicate agent rows.
with canonical as (
  select distinct on (a.name)
    a.id as keep_id,
    a.name
  from agents a
  order by
    a.name,
    (select count(*)::int from matches m where m.agent_id = a.id) desc,
    a.created_at asc nulls last,
    a.id asc
)
delete from agents a
using canonical c
where a.name = c.name
  and a.id <> c.keep_id;

-- 4. Prevent future duplicate names (race on ensureHouseAgents).
create unique index if not exists agents_name_unique on agents (name);
