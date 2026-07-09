-- RepUp initial schema — see docs/TD.md for the design this implements.
-- Run once against the Supabase project (SQL Editor, or `supabase db push`
-- once the project is linked locally).

create extension if not exists pgcrypto;

-- ============================================================== enums ===
create type goal_enum as enum ('lose_weight','build_muscle','get_stronger','endurance','stay_healthy');
create type equipment_enum as enum ('none','basic','full_gym');
create type unit_enum as enum ('metric','imperial');
create type visibility_enum as enum ('friends','private');
create type dose_type_enum as enum ('reps','time');
create type workout_status_enum as enum ('in_progress','complete','abandoned');
create type event_type_enum as enum ('session_completed','badge_earned','streak_milestone','joined');
create type request_status_enum as enum ('pending','accepted','declined');
create type badge_section_enum as enum ('streaks','milestones','volume','social','special');
create type plan_status_enum as enum ('active','superseded');

-- =========================================================== profiles ===
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  handle text unique,
  display_name text,
  avatar_url text,
  age int,
  height_cm numeric,
  weight_kg numeric,
  unit_pref unit_enum not null default 'metric',
  goal goal_enum,
  target_weight_kg numeric,
  days_per_week int,
  weekday_availability int[] not null default '{}',
  equipment equipment_enum not null default 'none',
  limitations text[] not null default '{}',
  activity_visibility visibility_enum not null default 'friends',
  created_at timestamptz not null default now()
);

-- ========================================================== plan data ===
create table plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  name text not null,
  week_start_date date not null,
  status plan_status_enum not null default 'active',
  generated_at timestamptz not null default now()
);

create table plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references plans(id) on delete cascade,
  day_of_week int not null check (day_of_week between 0 and 6),
  is_rest_day boolean not null default false,
  session_title text,
  focus_muscles text[] not null default '{}',
  est_duration_min int
);

-- ============================================ exercise library (seed) ===
create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  muscle_groups text[] not null default '{}',
  equipment equipment_enum not null default 'none',
  difficulty int not null check (difficulty between 1 and 3),
  demo_keyframes jsonb not null default '{}',
  form_cues text,
  common_mistakes text[] not null default '{}',
  adaptations jsonb not null default '{}'
);

create table session_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references plan_days(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  order_index int not null,
  is_warmup boolean not null default false,
  is_cooldown boolean not null default false,
  is_optional boolean not null default false,
  dose_type dose_type_enum not null default 'reps',
  sets int,
  reps_min int,
  reps_max int,
  seconds int,
  rest_seconds int
);

-- ============================================================ logging ===
create table workout_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  plan_day_id uuid references plan_days(id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status workout_status_enum not null default 'in_progress',
  total_reps int not null default 0,
  duration_seconds int
);

create table exercise_logs (
  id uuid primary key default gen_random_uuid(),
  workout_log_id uuid not null references workout_logs(id) on delete cascade,
  exercise_id uuid not null references exercises(id),
  sets_completed jsonb not null default '[]',
  removed boolean not null default false,
  removed_reason text
);

create table weigh_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  weight_kg numeric not null,
  logged_at timestamptz not null default now()
);

-- ============================================================ badges ====
create table streaks (
  user_id uuid primary key references profiles(user_id) on delete cascade,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  freeze_count int not null default 0 check (freeze_count between 0 and 2),
  last_credited_date date,
  updated_at timestamptz not null default now()
);

create table badges (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  section badge_section_enum not null,
  name text not null,
  description text not null,
  unlock_rule jsonb not null
);

create table user_badges (
  user_id uuid not null references profiles(user_id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  earned_at timestamptz,
  progress jsonb not null default '{}',
  primary key (user_id, badge_id)
);

-- ============================================================= social ===
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references profiles(user_id) on delete cascade,
  addressee_id uuid not null references profiles(user_id) on delete cascade,
  status request_status_enum not null default 'pending',
  created_at timestamptz not null default now(),
  check (requester_id <> addressee_id)
);

create table friendships (
  user_a uuid not null references profiles(user_id) on delete cascade,
  user_b uuid not null references profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(user_id) on delete cascade,
  type event_type_enum not null,
  payload jsonb not null default '{}',
  visible_to_friends boolean not null default true,
  created_at timestamptz not null default now()
);

-- Fan-out table: one row per (recipient, event), written by the trigger
-- below, so feed reads and Realtime subscriptions filter on a single
-- `recipient_id = auth.uid()` equality instead of an `IN (friend_ids)` list.
create table feed_entries (
  recipient_id uuid not null references profiles(user_id) on delete cascade,
  event_id uuid not null references activity_events(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recipient_id, event_id)
);

create table fist_bumps (
  event_id uuid not null references activity_events(id) on delete cascade,
  from_user_id uuid not null references profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, from_user_id)
);

create table notification_prefs (
  user_id uuid primary key references profiles(user_id) on delete cascade,
  workout_reminder_enabled boolean not null default true,
  workout_reminder_time time,
  friend_activity_enabled boolean not null default true,
  badge_earned_enabled boolean not null default true,
  streak_risk_enabled boolean not null default true
);

-- ======================================================== functions =====

-- New auth.users row -> bootstrap profile/prefs/streak (docs/TD.md — Auth flow).
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id) values (new.id);
  insert into public.notification_prefs (user_id) values (new.id);
  insert into public.streaks (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- New activity_events row -> fan out to every friend's feed (if visible).
create function public.fanout_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visible_to_friends then
    insert into public.feed_entries (recipient_id, event_id)
    select case when f.user_a = new.user_id then f.user_b else f.user_a end, new.id
    from public.friendships f
    where f.user_a = new.user_id or f.user_b = new.user_id;
  end if;
  return new;
end;
$$;

create trigger on_activity_event_created
  after insert on activity_events
  for each row execute procedure public.fanout_activity_event();

-- Shared visibility check used by RLS below: can the current user see this event?
create function public.can_view_event(p_event_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from activity_events e
    where e.id = p_event_id
      and (
        e.user_id = auth.uid()
        or exists (
          select 1 from feed_entries fe
          where fe.event_id = e.id and fe.recipient_id = auth.uid()
        )
      )
  );
$$;

-- ============================================================ RLS =======
alter table profiles enable row level security;
alter table plans enable row level security;
alter table plan_days enable row level security;
alter table exercises enable row level security;
alter table session_exercises enable row level security;
alter table workout_logs enable row level security;
alter table exercise_logs enable row level security;
alter table weigh_ins enable row level security;
alter table streaks enable row level security;
alter table badges enable row level security;
alter table user_badges enable row level security;
alter table friend_requests enable row level security;
alter table friendships enable row level security;
alter table activity_events enable row level security;
alter table feed_entries enable row level security;
alter table fist_bumps enable row level security;
alter table notification_prefs enable row level security;

-- Public read-only catalogs (seeded via migration/service role, never client-written)
create policy "exercises are public read" on exercises for select using (true);
create policy "badges are public read" on badges for select using (true);

-- Strict owner-only tables
create policy "own profile" on profiles for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own plans" on plans for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own plan days" on plan_days for all
  using (exists (select 1 from plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()))
  with check (exists (select 1 from plans p where p.id = plan_days.plan_id and p.user_id = auth.uid()));

create policy "own session exercises" on session_exercises for all
  using (exists (
    select 1 from plan_days pd join plans p on p.id = pd.plan_id
    where pd.id = session_exercises.plan_day_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from plan_days pd join plans p on p.id = pd.plan_id
    where pd.id = session_exercises.plan_day_id and p.user_id = auth.uid()
  ));

create policy "own workout logs" on workout_logs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own exercise logs" on exercise_logs for all
  using (exists (select 1 from workout_logs w where w.id = exercise_logs.workout_log_id and w.user_id = auth.uid()))
  with check (exists (select 1 from workout_logs w where w.id = exercise_logs.workout_log_id and w.user_id = auth.uid()));

create policy "own weigh ins" on weigh_ins for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own streak" on streaks for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own badge progress" on user_badges for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own notification prefs" on notification_prefs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Social: both parties can see/act on a request
create policy "parties see friend requests" on friend_requests for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "requester creates request" on friend_requests for insert
  with check (auth.uid() = requester_id);
create policy "parties update request" on friend_requests for update
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy "parties delete request" on friend_requests for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

create policy "parties see friendship" on friendships for select
  using (auth.uid() = user_a or auth.uid() = user_b);
create policy "parties create friendship" on friendships for insert
  with check (auth.uid() = user_a or auth.uid() = user_b);
create policy "parties remove friendship" on friendships for delete
  using (auth.uid() = user_a or auth.uid() = user_b);

-- Activity feed: own events, or a friend's event that fanned out to you.
-- No client insert policy — events are written by trusted server actions
-- using the service role (docs/TD.md), so the anon/authenticated role never
-- needs write access here.
create policy "view own or friend-visible events" on activity_events for select
  using (public.can_view_event(id));

create policy "view own feed entries" on feed_entries for select
  using (recipient_id = auth.uid());

create policy "view bumps on visible events" on fist_bumps for select
  using (public.can_view_event(event_id));
create policy "bump a visible event" on fist_bumps for insert
  with check (from_user_id = auth.uid() and public.can_view_event(event_id));
create policy "un-bump own bump" on fist_bumps for delete
  using (from_user_id = auth.uid());

-- ========================================================= seed data ====
-- Badge catalog (FD.md §12.2). unlock_rule.type is dispatched by the
-- single evaluate_badges() rule engine (docs/TD.md — Badge/streak logic),
-- not implemented per-badge.
insert into badges (key, section, name, description, unlock_rule) values
  ('first_rep', 'milestones', 'First Rep', 'Complete your first session', '{"type":"total_sessions_gte","threshold":1}'),
  ('10_workouts', 'milestones', '10 Workouts', 'Complete 10 total sessions', '{"type":"total_sessions_gte","threshold":10}'),
  ('50_workouts', 'milestones', '50 Workouts', 'Complete 50 total sessions', '{"type":"total_sessions_gte","threshold":50}'),
  ('100_workouts', 'milestones', '100 Workouts', 'Complete 100 total sessions', '{"type":"total_sessions_gte","threshold":100}'),
  ('full_week', 'milestones', 'Full Week', 'Complete 100% of a week''s scheduled sessions', '{"type":"full_week"}'),
  ('comeback', 'milestones', 'Comeback', 'Complete a session after a 7+ day gap', '{"type":"comeback_gap_days","threshold":7}'),
  ('goal_getter', 'milestones', 'Goal Getter', 'Reach your target weight', '{"type":"goal_reached"}'),
  ('streak_3', 'streaks', '3-Day Streak', 'Reach a 3-day streak', '{"type":"streak_length_gte","threshold":3}'),
  ('streak_7', 'streaks', '7-Day Streak', 'Reach a 7-day streak', '{"type":"streak_length_gte","threshold":7}'),
  ('streak_30', 'streaks', '30-Day Streak', 'Reach a 30-day streak', '{"type":"streak_length_gte","threshold":30}'),
  ('streak_100', 'streaks', '100-Day Streak', 'Reach a 100-day streak', '{"type":"streak_length_gte","threshold":100}'),
  ('reps_1000', 'volume', '1,000 Reps', 'Log 1,000 cumulative reps', '{"type":"cumulative_reps_gte","threshold":1000}'),
  ('reps_10000', 'volume', '10,000 Reps', 'Log 10,000 cumulative reps', '{"type":"cumulative_reps_gte","threshold":10000}'),
  ('minutes_500', 'volume', '500 Minutes', 'Log 500 cumulative session minutes', '{"type":"cumulative_minutes_gte","threshold":500}'),
  ('first_ally', 'social', 'First Ally', 'Add your first friend', '{"type":"friend_count_gte","threshold":1}'),
  ('hype_machine', 'social', 'Hype Machine', 'Give 25 fist-bumps', '{"type":"fistbumps_given_gte","threshold":25}'),
  ('early_bird', 'special', 'Early Bird', 'Complete a session started before 7:00', '{"type":"session_time_before","threshold":"07:00"}'),
  ('night_owl', 'special', 'Night Owl', 'Complete a session started after 22:00', '{"type":"session_time_after","threshold":"22:00"}'),
  ('perfect_form', 'special', 'Perfect Form', 'Complete every exercise of a session without reducing any target', '{"type":"perfect_form"}');
