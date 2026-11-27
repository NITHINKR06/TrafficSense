-- Commuter feedback ("Still there" / "Cleared") + photo attachment fallback
-- When 3+ commuters mark an incident as cleared, status transitions to 'cleared'
-- and read_active_live_incidents() returns it for 6h so the map can show a subtle cleared dot
-- until someone reports the incident again.

alter table public.incidents
  drop constraint if exists incidents_status_check;

alter table public.incidents
  add constraint incidents_status_check
  check (status in ('open', 'cleared', 'resolved', 'expired'));

alter table public.incidents
  add column if not exists cleared_at timestamptz,
  add column if not exists clear_count integer not null default 0,
  add column if not exists confirm_count integer not null default 0;

create table if not exists public.incident_feedback (
  id uuid primary key default gen_random_uuid(),
  incident_id uuid not null references public.incidents (id) on delete cascade,
  user_id uuid not null,
  vote text not null check (vote in ('confirm', 'clear')),
  updated_at timestamptz not null default clock_timestamp(),
  unique (incident_id, user_id)
);

create index if not exists idx_incident_feedback_incident on public.incident_feedback (incident_id);

alter table public.incident_feedback enable row level security;

revoke all on public.incident_feedback from anon, authenticated;
grant select on public.incident_feedback to anon, authenticated;

drop policy if exists "Anyone can read incident feedback" on public.incident_feedback;
create policy "Anyone can read incident feedback" on public.incident_feedback
  for select to anon, authenticated using (true);

create or replace function public.submit_incident_feedback(
  p_incident_id uuid,
  p_vote text
) returns jsonb
language plpgsql
security definer
set search_path = ''
set timezone = 'UTC'
as $$
declare
  caller_id uuid;
  v_clear_count integer;
  v_confirm_count integer;
  v_status text;
  v_cleared_at timestamptz;
begin
  caller_id := (select auth.uid());
  if caller_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_vote not in ('confirm', 'clear') then
    return jsonb_build_object('ok', false, 'error', 'Invalid feedback vote');
  end if;

  if not exists (
    select 1 from public.incidents where id = p_incident_id and status in ('open', 'cleared')
  ) then
    return jsonb_build_object('ok', false, 'error', 'Incident is not active');
  end if;

  insert into public.incident_feedback (incident_id, user_id, vote, updated_at)
  values (p_incident_id, caller_id, p_vote, clock_timestamp())
  on conflict (incident_id, user_id) do update
    set vote = excluded.vote,
        updated_at = clock_timestamp();

  select
    count(*) filter (where vote = 'clear')::integer,
    count(*) filter (where vote = 'confirm')::integer
  into v_clear_count, v_confirm_count
  from public.incident_feedback
  where incident_id = p_incident_id;

  if v_clear_count >= 3 then
    update public.incidents
    set status = 'cleared',
        cleared_at = coalesce(cleared_at, clock_timestamp()),
        clear_count = v_clear_count,
        confirm_count = v_confirm_count,
        level_reason = 'Cleared by commuters (' || v_clear_count || ' reports)'
    where id = p_incident_id
    returning status, cleared_at into v_status, v_cleared_at;
  else
    update public.incidents
    set status = 'open',
        cleared_at = null,
        clear_count = v_clear_count,
        confirm_count = v_confirm_count,
        last_confirmed_at = case when p_vote = 'confirm' then clock_timestamp() else last_confirmed_at end
    where id = p_incident_id
    returning status, cleared_at into v_status, v_cleared_at;
  end if;

  return jsonb_build_object(
    'ok', true,
    'incident_id', p_incident_id,
    'status', v_status,
    'clear_count', v_clear_count,
    'confirm_count', v_confirm_count,
    'cleared_at', v_cleared_at
  );
end;
$$;

revoke all on function public.submit_incident_feedback(uuid, text) from public;
grant execute on function public.submit_incident_feedback(uuid, text) to authenticated;

create or replace function public.attach_incident_photo(
  p_incident_id uuid,
  p_photo_data_url text
) returns jsonb
language plpgsql
security definer
set search_path = ''
set timezone = 'UTC'
as $$
declare
  caller_id uuid;
begin
  caller_id := (select auth.uid());
  if caller_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if p_photo_data_url is null or length(p_photo_data_url) > 1200000 then
    return jsonb_build_object('ok', false, 'error', 'Photo payload missing or too large');
  end if;

  if not exists (
    select 1 from public.incident_reports
    where incident_id = p_incident_id and reporter_id = caller_id
  ) then
    raise exception 'Only a reporter of this incident can attach photo evidence.' using errcode = '42501';
  end if;

  update public.incident_reports
  set photo_data_url = p_photo_data_url
  where incident_id = p_incident_id and reporter_id = caller_id;

  update public.incidents
  set photo_data_url = coalesce(photo_data_url, p_photo_data_url)
  where id = p_incident_id and status = 'open';

  return jsonb_build_object('ok', true);
end;
$$;

revoke all on function public.attach_incident_photo(uuid, text) from public;
grant execute on function public.attach_incident_photo(uuid, text) to authenticated;

create or replace function public.read_active_live_incidents()
returns jsonb
language plpgsql
security definer
set search_path = ''
set timezone = 'UTC'
as $$
declare
  result jsonb;
begin
  update public.incidents
  set status = 'expired',
      level_reason = 'Expired due to inactivity (3 hours without confirmation)'
  where status = 'open'
    and last_confirmed_at < (clock_timestamp() - interval '3 hours');

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', i.id,
    'category', i.category,
    'lat', i.lat,
    'lng', i.lng,
    'status', i.status,
    'level', i.level,
    'level_reason', i.level_reason,
    'first_reported_at', i.first_reported_at,
    'last_confirmed_at', i.last_confirmed_at,
    'cleared_at', i.cleared_at,
    'clear_count', coalesce(i.clear_count, 0),
    'confirm_count', coalesce(i.confirm_count, 0),
    'provenance', i.provenance,
    'photo_data_url', i.photo_data_url,
    'photo_confidence', i.photo_confidence,
    'report_count', (
      select count(*) from public.incident_reports r where r.incident_id = i.id
    )
  ) order by i.last_confirmed_at desc), '[]'::jsonb)
  into result
  from public.incidents i
  where i.status = 'open'
     or (
       i.status = 'cleared'
       and i.cleared_at is not null
       and i.cleared_at > (clock_timestamp() - interval '6 hours')
       and not exists (
         select 1 from public.incidents o
         where o.status = 'open'
           and o.category = i.category
           and o.first_reported_at > i.cleared_at
           and public.meter_distance(o.lat, o.lng, i.lat, i.lng) <= 300
       )
     );

  return result;
end;
$$;

revoke all on function public.read_active_live_incidents() from public;
grant execute on function public.read_active_live_incidents() to anon, authenticated;
