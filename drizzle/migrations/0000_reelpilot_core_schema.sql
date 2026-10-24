-- ReelPilot core schema

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  email text,
  plan text not null default 'pro',
  created_at timestamptz not null default now()
);

create table public.agent_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  niche text not null default 'AI tools & creator productivity',
  tone text not null default 'Punchy, friendly, no fluff',
  language text not null default 'English',
  video_length integer not null default 40,
  frequency integer not null default 2,
  time_slots text[] not null default '{"09:00","18:30"}',
  platforms text[] not null default '{"youtube","instagram","tiktok"}',
  mode text not null default 'review',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.platform_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  platform_id text not null,
  name text not null,
  handle text,
  color text,
  status text not null default 'disconnected',
  followers bigint not null default 0,
  custom boolean not null default false,
  auth_type text,
  base_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.provider_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('video','voice','llm','music')),
  provider text not null,
  label text not null default '',
  encrypted_key text not null,
  key_hint text not null,
  endpoint text,
  custom_headers jsonb,
  status text not null default 'active',
  is_default boolean not null default false,
  usage_count integer not null default 0,
  quota integer not null default 1000,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  topic text not null default '',
  script text not null default '',
  scenes jsonb not null default '[]',
  duration text not null default '00:40',
  status text not null default 'draft',
  platforms text[] not null default '{}',
  views bigint not null default 0,
  hue integer not null default 300,
  video_url text,
  thumb_url text,
  created_at timestamptz not null default now()
);

create table public.scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id uuid references public.videos(id) on delete cascade,
  title text not null,
  post_date date not null,
  post_time text not null,
  platforms text[] not null default '{}',
  status text not null default 'pending',
  retries integer not null default 0,
  hue integer not null default 300,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  detail text not null default '',
  tone text not null default 'info',
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  key_id uuid references public.provider_keys(id) on delete set null,
  category text not null,
  provider text not null,
  amount integer not null default 1,
  created_at timestamptz not null default now()
);

create table public.run_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null,
  result text not null default 'success',
  created_at timestamptz not null default now()
);

-- GRANTS
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select, insert, update, delete on public.agent_settings to authenticated;
grant all on public.agent_settings to service_role;
grant select, insert, update, delete on public.platform_connections to authenticated;
grant all on public.platform_connections to service_role;
grant select, insert, update, delete on public.provider_keys to authenticated;
grant all on public.provider_keys to service_role;
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
grant select, insert, update, delete on public.scheduled_posts to authenticated;
grant all on public.scheduled_posts to service_role;
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
grant select, insert on public.usage_log to authenticated;
grant all on public.usage_log to service_role;
grant select, insert, delete on public.run_history to authenticated;
grant all on public.run_history to service_role;

-- RLS
alter table public.profiles enable row level security;
alter table public.agent_settings enable row level security;
alter table public.platform_connections enable row level security;
alter table public.provider_keys enable row level security;
alter table public.videos enable row level security;
alter table public.scheduled_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.usage_log enable row level security;
alter table public.run_history enable row level security;

create policy "Users can view own profile" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users manage own settings" on public.agent_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own connections" on public.platform_connections for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own keys" on public.provider_keys for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own videos" on public.videos for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own posts" on public.scheduled_posts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users manage own notifications" on public.notifications for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Users insert own usage" on public.usage_log for insert to authenticated with check (user_id = auth.uid());
create policy "Users view own usage" on public.usage_log for select to authenticated using (user_id = auth.uid());
create policy "Users manage own run history" on public.run_history for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Signup trigger: create profile + seed defaults and demo content
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.agent_settings (user_id) values (new.id) on conflict (user_id) do nothing;

  insert into public.platform_connections (user_id, platform_id, name, handle, color, status, followers) values
    (new.id, 'youtube', 'YouTube Shorts', '@reelpilot.studio', 'oklch(0.65 0.22 25)', 'connected', 18420),
    (new.id, 'instagram', 'Instagram Reels', '@reelpilot', 'oklch(0.7 0.2 350)', 'connected', 24870),
    (new.id, 'tiktok', 'TikTok', '@reelpilot', 'oklch(0.78 0.15 200)', 'connected', 40310),
    (new.id, 'facebook', 'Facebook', 'ReelPilot Page', 'oklch(0.66 0.17 255)', 'expired', 7120);

  insert into public.videos (user_id, title, topic, duration, status, platforms, views, hue, script, scenes) values
    (new.id, '3 AI tools that replaced my editor', 'AI productivity', '00:38', 'published', '{"youtube","instagram","tiktok"}', 84200, 300,
     'Most creators burn six hours on one reel. These three AI tools replaced my editor entirely.', '[{"visual":"Fast zoom on a glowing phone screen","duration":5,"line":"Most creators burn 6 hours on one reel."},{"visual":"Split screen: tired editor vs automated dashboard","duration":7,"line":"Your agent does the same job while you sleep."},{"visual":"Creator smiling at rising analytics chart","duration":5,"line":"Three tools. One autopilot."}]'),
    (new.id, 'Why your reels stop at 200 views', 'Creator growth', '00:44', 'published', '{"instagram","tiktok"}', 51800, 340,
     'Your reels stop at 200 views because the hook loses people in the first three seconds.', '[{"visual":"Analytics graph flatlining","duration":5,"line":"Two hundred views. Every single time."},{"visual":"Phone thumb scrolling fast","duration":6,"line":"The hook loses them in three seconds."},{"visual":"Rewritten hook on screen","duration":6,"line":"Fix the first line, everything changes."}]'),
    (new.id, 'The 5-second hook formula', 'Copywriting', '00:31', 'scheduled', '{"youtube","facebook"}', 0, 265,
     'Here is the five-second hook formula that works on every platform.', '[{"visual":"Countdown timer 5-4-3-2-1","duration":5,"line":"Five seconds decide everything."},{"visual":"Text overlay of the formula","duration":6,"line":"Question, promise, proof."}]'),
    (new.id, 'Automate your whole content week', 'Automation', '00:52', 'published', '{"youtube","tiktok","instagram"}', 129400, 210,
     'You can automate your entire content week with one autonomous agent.', '[{"visual":"Dashboard filling with scheduled posts","duration":6,"line":"One setup. A whole week of reels."},{"visual":"Calendar view animating","duration":6,"line":"It writes, renders and posts for you."},{"visual":"Follower counter rising","duration":5,"line":"While you sleep, it grows."}]'),
    (new.id, 'Faceless channels: honest numbers', 'Creator economy', '00:47', 'failed', '{"facebook"}', 0, 20,
     'Faceless channels are real, but the numbers are not what gurus promise.', '[{"visual":"Dark room with only monitor glow","duration":5,"line":"No face. No camera. Still working."}]'),
    (new.id, 'Script templates that always work', 'Copywriting', '00:35', 'draft', '{}', 0, 160,
     'These three script templates work on any niche.', '[]');

  insert into public.scheduled_posts (user_id, video_id, title, post_date, post_time, platforms, status, hue)
  select s.user_id, s.video_id, s.title, s.post_date, s.post_time, s.platforms, s.status, s.hue
  from (
    select new.id as user_id, v.id as video_id, v.title, (current_date + 1)::date as post_date, '18:30' as post_time, v.platforms, 'pending' as status, v.hue
    from public.videos v where v.user_id = new.id and v.status = 'scheduled'
    union all
    select new.id, v.id, v.title, (current_date + 2)::date, '09:00', array['tiktok','instagram'], 'pending', v.hue
    from public.videos v where v.user_id = new.id and v.status = 'draft' limit 1
  ) s;

  insert into public.scheduled_posts (user_id, video_id, title, post_date, post_time, platforms, status, retries, hue)
  select new.id, v.id, v.title, (current_date)::date, '20:00', v.platforms, 'failed', 2, v.hue
  from public.videos v where v.user_id = new.id and v.status = 'failed';

  insert into public.notifications (user_id, title, detail, tone) values
    (new.id, 'Reel ready', 'Your first demo reels finished rendering.', 'success'),
    (new.id, 'Publish failed', 'Facebook token expired — reconnect the account.', 'error'),
    (new.id, 'Welcome to ReelPilot', 'Set your niche, add an API key and put your reels on autopilot.', 'info');

  insert into public.run_history (user_id, action, result) values
    (new.id, 'Daily generation run', 'success'),
    (new.id, 'Published to 3 platforms', 'success'),
    (new.id, 'Publish to Facebook', 'failed');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
