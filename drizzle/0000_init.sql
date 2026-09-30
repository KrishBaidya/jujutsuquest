-- Cursed Mission Board: 9 core tables + 2 gallery tables.
-- Keep in sync with lib/db/schema.ts. Applied with `npm run db:migrate`.

create extension if not exists pgcrypto;

create table if not exists hostels (
  id text primary key,
  name text not null,
  crest text not null,
  color text not null
);

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  uid text not null unique,
  name text not null,
  department text not null,
  hostel_id text references hostels(id),
  role text not null default 'student' check (role in ('student', 'reviewer')),
  ce integer not null default 0,
  grade text not null default 'g4' check (grade in ('g4', 'g3', 'g2', 'semi1', 'g1')),
  created_at timestamptz not null default now()
);
create index if not exists users_ce_idx on users (ce desc);

create table if not exists locations (
  id text primary key,
  name text not null,
  kanji text not null,
  lat double precision not null,
  lng double precision not null,
  image_url text,
  -- server only: never select these into anything sent to the browser
  reference_description text not null default '',
  qr_token_hash text,
  created_at timestamptz not null default now()
);

create table if not exists quests (
  id text primary key,
  title text not null,
  description text not null,
  category text not null check (category in ('explore', 'wellness', 'social', 'skill', 'event')),
  grade text not null check (grade in ('g4', 'g3', 'g2', 'semi1', 'g1')),
  ce integer not null check (ce > 0),
  location_id text not null references locations(id),
  verification text not null check (verification in ('photo', 'qr')),
  verify_hint text not null default '',
  is_bounty boolean not null default false,
  expires_at timestamptz,
  status text not null default 'open' check (status in ('open', 'pending', 'closed')),
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

create table if not exists missions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  quest_id text not null references quests(id) on delete cascade,
  status text not null default 'accepted'
    check (status in ('accepted', 'in_review', 'completed', 'rejected')),
  accepted_at timestamptz not null default now(),
  completed_at timestamptz,
  unique (user_id, quest_id)
);

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null references missions(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  quest_id text not null references quests(id) on delete cascade,
  method text not null check (method in ('photo', 'qr')),
  photo_key text,
  status text not null check (status in ('approved', 'rejected', 'in_review')),
  confidence real,
  reason text,
  black_flash boolean not null default false,
  reviewed_by uuid references users(id),
  created_at timestamptz not null default now()
);
create index if not exists submissions_status_idx on submissions (status, created_at);

create table if not exists ce_ledger (
  id bigserial primary key,
  user_id uuid not null references users(id) on delete cascade,
  amount integer not null,
  reason text not null check (reason in ('quest', 'black_flash', 'badge', 'seed', 'adjust')),
  quest_id text references quests(id) on delete set null,
  submission_id uuid references submissions(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists ce_ledger_user_idx on ce_ledger (user_id, created_at desc);
create index if not exists ce_ledger_created_idx on ce_ledger (created_at);
-- one quest payout per submission, so a retried action cannot pay twice
create unique index if not exists ce_ledger_submission_reason_idx
  on ce_ledger (submission_id, reason) where submission_id is not null;

create table if not exists badges (
  id text primary key,
  name text not null,
  kanji text not null,
  description text not null,
  sort integer not null default 0
);

create table if not exists user_badges (
  user_id uuid not null references users(id) on delete cascade,
  badge_id text not null references badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

create table if not exists archive_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  location_id text references locations(id) on delete set null,
  image_key text not null,
  caption text not null default '',
  status text not null default 'visible' check (status in ('visible', 'in_review', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists archive_likes (
  post_id uuid not null references archive_posts(id) on delete cascade,
  user_id uuid not null references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- The ledger is the single source of truth. App code only inserts ledger rows;
-- this trigger keeps users.ce and users.grade in step. Thresholds mirror
-- GRADE_THRESHOLDS in lib/grades.ts. Special Grade is not stored: it is the top
-- four Grade 1 users by CE, computed at query time.
create or replace function grade_for_ce(total integer) returns text
language sql immutable as $$
  select case
    when total >= 5000 then 'g1'
    when total >= 3000 then 'semi1'
    when total >= 1500 then 'g2'
    when total >= 500 then 'g3'
    else 'g4'
  end
$$;

create or replace function apply_ce_ledger() returns trigger
language plpgsql as $$
begin
  update users
     set ce = greatest(ce + new.amount, 0),
         grade = grade_for_ce(greatest(ce + new.amount, 0))
   where id = new.user_id;
  return new;
end
$$;

drop trigger if exists ce_ledger_apply on ce_ledger;
create trigger ce_ledger_apply
  after insert on ce_ledger
  for each row execute function apply_ce_ledger();
