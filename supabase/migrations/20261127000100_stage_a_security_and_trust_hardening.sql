-- Stage A: Immediate security, privacy, and trust-ladder hardening
-- 1. Revoke direct authenticated/anon execution of apply_incident_photo_verification (server-only via service_role)
-- 2. Prevent strangers from clearing L6 incidents or extending 3h expiry indefinitely via feedback
-- 3. Anchor incident lat/lng at first report (stop coordinate drift) & widen cluster radius to 100m
-- 4. Make L3 sticky until incident closes
-- 5. Remove public anon/authenticated SELECT on incident_reports & incident_feedback; remove email-pattern bypass on authority_notifications
-- 6. Make read_active_live_incidents() pure read-only (no UPDATE on read)

-- ---------------------------------------------------------------------------
-- 1. RLS Privacy Fixes
-- ---------------------------------------------------------------------------
drop policy if exists "Anyone can read reports" on public.incident_reports;
drop policy if exists "Anyone can read incident feedback" on public.incident_feedback;

drop policy if exists "Authorities can view notifications" on public.authority_notifications;
create policy "Authorities can view notifications"
  on public.authority_notifications
  for select
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'authority'
    )
  );

drop policy if exists "Authorities can update notifications" on public.authority_notifications;
create policy "Authorities can update notifications"
  on public.authority_notifications
  for update
  to authenticated
  using (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'authority'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = (select auth.uid()) and role = 'authority'
    )
  );

-- ---------------------------------------------------------------------------
-- 2. Anchor pin, 100m cluster radius, sticky L3
-- ---------------------------------------------------------------------------
create or replace function public.submit_live_incident_report_internal(
  p_category text,
  p_lat double precision,
  p_lng double precision,
  p_gps_accuracy_m double precision default null::double precision,
  p_gps_fix_at timestamp with time zone default null::timestamp with time zone,
  p_note text default null::text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
set "TimeZone" to 'UTC'
as $function$
declare
  caller_id uuid;
  recent_count integer;
  target_incident_id uuid;
  target_incident record;
  distinct_reporters integer;
  has_valid_gps boolean;
  computed_level text := 'L1';
  computed_reason text := 'Report submitted by commuter (unconfirmed)';
begin
  caller_id := (select auth.uid());
  if caller_id is null then
    raise exception 'Authentication required to report an incident.' using errcode = '42501';
  end if;

  if p_lng < 74.70 or p_lng > 75.05 or p_lat < 12.75 or p_lat > 13.05 then
    raise exception 'Location is outside the supported Mangaluru service area.' using errcode = '22023';
  end if;

  if p_category not in (
    'accident', 'road_repair', 'festival', 'strike', 'vip_movement',
    'landslide', 'heavy_rain', 'flood', 'signal_failure', 'breakdown',
    'road_closed', 'bridge_maintenance', 'police_restriction', 'fallen_tree',
    'heavy_traffic', 'other', 'unknown'
  ) then
    raise exception 'Invalid incident category.' using errcode = '22023';
  end if;

  select count(*) into recent_count
  from public.incident_reports
  where reporter_id = caller_id
    and submitted_at > (clock_timestamp() - interval '1 hour');

  if recent_count >= 5 then
    raise exception 'Rate limit exceeded: maximum 5 reports per hour.' using errcode = 'P0001';
  end if;

  -- Cluster within 100m of anchored incident
  select id into target_incident_id
  from public.incidents
  where category = p_category
    and status = 'open'
    and public.meter_distance(lat, lng, p_lat, p_lng) <= 100.0
  order by public.meter_distance(lat, lng, p_lat, p_lng) asc
  limit 1;

  if target_incident_id is null then
    insert into public.incidents (
      category, lat, lng, first_reported_at, last_confirmed_at, status, level, level_reason
    ) values (
      p_category, p_lat, p_lng, clock_timestamp(), clock_timestamp(), 'open', 'L1', 'Reported by commuter (unconfirmed)'
    )
    returning id into target_incident_id;
  else
    -- Anchor lat/lng at first report; only refresh last_confirmed_at
    update public.incidents
    set last_confirmed_at = clock_timestamp()
    where id = target_incident_id;
  end if;

  insert into public.incident_reports (
    incident_id, reporter_id, category, lat, lng, gps_accuracy_m, gps_fix_at, submitted_at, note
  ) values (
    target_incident_id, caller_id, p_category, p_lat, p_lng, p_gps_accuracy_m, p_gps_fix_at, clock_timestamp(), p_note
  )
  on conflict (incident_id, reporter_id) do update set
    lat = excluded.lat,
    lng = excluded.lng,
    gps_accuracy_m = excluded.gps_accuracy_m,
    gps_fix_at = excluded.gps_fix_at,
    submitted_at = clock_timestamp(),
    note = coalesce(excluded.note, public.incident_reports.note);

  select * into target_incident
  from public.incidents
  where id = target_incident_id;

  -- Preserve L6 and L5
  if target_incident.level in ('L6', 'L5') then
    return jsonb_build_object(
      'ok', true,
      'incident_id', target_incident_id,
      'level', target_incident.level,
      'level_reason', target_incident.level_reason
    );
  end if;

  -- Sticky L3: once L3 is reached, never downgrade back to L2/L1
  if target_incident.level = 'L3' then
    select count(distinct reporter_id) into distinct_reporters
    from public.incident_reports
    where incident_id = target_incident_id;

    return jsonb_build_object(
      'ok', true,
      'incident_id', target_incident_id,
      'level', 'L3',
      'level_reason', target_incident.level_reason,
      'distinct_reporters', distinct_reporters
    );
  end if;

  select count(distinct reporter_id) into distinct_reporters
  from public.incident_reports
  where incident_id = target_incident_id
    and submitted_at >= (clock_timestamp() - interval '15 minutes');

  select exists (
    select 1 from public.incident_reports
    where incident_id = target_incident_id
      and gps_fix_at is not null
      and gps_fix_at >= (submitted_at - interval '2 minutes')
      and gps_accuracy_m is not null
      and gps_accuracy_m <= 50.0
      and public.meter_distance(lat, lng, target_incident.lat, target_incident.lng) <= 200.0
  ) into has_valid_gps;

  if distinct_reporters >= 3 then
    computed_level := 'L3';
    computed_reason := format('Verified by %s independent commuters within 15 minutes', distinct_reporters);
  elsif has_valid_gps then
    computed_level := 'L2';
    computed_reason := 'Location verified by high-accuracy device GPS (<= 50m)';
  else
    computed_level := 'L1';
    computed_reason := 'Report submitted by commuter (unconfirmed)';
  end if;

  update public.incidents
  set level = computed_level,
      level_reason = computed_reason,
      provenance = case when computed_level in ('L3', 'L4', 'L6') then 'verified' else 'reported' end
  where id = target_incident_id;

  return jsonb_build_object(
    'ok', true,
    'incident_id', target_incident_id,
    'level', computed_level,
    'level_reason', computed_reason,
    'distinct_reporters', distinct_reporters
  );
end;
$function$;

-- ---------------------------------------------------------------------------
-- 3. Lock down L5 RPC to service_role only (plus optional p_reporter_id)
-- ---------------------------------------------------------------------------
drop function if exists public.apply_incident_photo_verification(uuid, text, text, text);

create or replace function public.apply_incident_photo_verification(
  p_incident_id uuid,
  p_summary text default null::text,
  p_photo_data_url text default null::text,
  p_confidence_tier text default 'moderate'::text,
  p_reporter_id uuid default null::uuid
)
returns jsonb
language plpgsql
security definer
set search_path to ''
set "TimeZone" to 'UTC'
as $function$
declare
  caller_id uuid;
  new_reason text;
  best_photo text;
  best_conf text;
  affected integer;
begin
  caller_id := coalesce(p_reporter_id, (select auth.uid()));
  if caller_id is null then
    raise exception 'Authentication required.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.incident_reports
    where incident_id = p_incident_id and reporter_id = caller_id
  ) then
    raise exception 'Only a reporter of this incident can attach photo evidence.' using errcode = '42501';
  end if;

  if p_photo_data_url is not null and length(p_photo_data_url) <= 1200000 then
    update public.incident_reports
    set photo_data_url = p_photo_data_url,
        photo_confidence = coalesce(p_confidence_tier, 'moderate')
    where incident_id = p_incident_id and reporter_id = caller_id;
  end if;

  select r.photo_data_url, r.photo_confidence
  into best_photo, best_conf
  from public.incident_reports r
  where r.incident_id = p_incident_id
    and r.photo_data_url is not null
  order by
    case r.photo_confidence
      when 'high' then 3
      when 'moderate' then 2
      else 1
    end desc,
    r.submitted_at desc
  limit 1;

  new_reason := case
    when p_summary is null or length(trim(p_summary)) = 0
      then 'L5 AI Vision corroborated photo evidence'
    else 'L5 AI Vision corroborated: ' || left(trim(p_summary), 140)
  end;

  update public.incidents
  set level = case when level = 'L6' then 'L6' else 'L5' end,
      level_reason = case when level = 'L6' then level_reason else new_reason end,
      provenance = case when level = 'L6' then provenance else 'verified' end,
      photo_data_url = coalesce(best_photo, photo_data_url),
      photo_confidence = coalesce(best_conf, photo_confidence),
      last_confirmed_at = clock_timestamp()
  where id = p_incident_id
    and status = 'open';
  get diagnostics affected = row_count;

  return jsonb_build_object(
    'ok', affected > 0,
    'level', 'L5',
    'level_reason', new_reason,
    'photo_data_url', best_photo,
    'photo_confidence', best_conf
  );
end;
$function$;

revoke all on function public.apply_incident_photo_verification(uuid, text, text, text, uuid) from public, anon, authenticated;
grant execute on function public.apply_incident_photo_verification(uuid, text, text, text, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- 4. Protect submit_incident_feedback: block strangers, protect L6, cap confirm expiry
-- ---------------------------------------------------------------------------
create or replace function public.submit_incident_feedback(
  p_incident_id uuid,
  p_vote text,
  p_lat double precision default null::double precision,
  p_lng double precision default null::double precision
)
returns jsonb
language plpgsql
security definer
set search_path to ''
set "TimeZone" to 'UTC'
as $function$
declare
  caller_id uuid;
  caller_role text;
  target_incident record;
  has_reported boolean;
  is_near boolean := false;
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

  select * into target_incident
  from public.incidents
  where id = p_incident_id and status in ('open', 'cleared');

  if target_incident.id is null then
    return jsonb_build_object('ok', false, 'error', 'Incident is not active');
  end if;

  select role into caller_role from public.profiles where id = caller_id;

  -- Never allow commuter votes to clear an Authority-confirmed (L6) incident
  if p_vote = 'clear' and target_incident.level = 'L6' and caller_role is distinct from 'authority' then
    return jsonb_build_object('ok', false, 'error', 'Authority-confirmed (L6) incidents can only be resolved by Traffic Authority.');
  end if;

  select exists (
    select 1 from public.incident_reports
    where incident_id = p_incident_id and reporter_id = caller_id
  ) into has_reported;

  if p_lat is not null and p_lng is not null then
    is_near := public.meter_distance(target_incident.lat, target_incident.lng, p_lat, p_lng) <= 300.0;
  end if;

  if caller_role is distinct from 'authority' and not has_reported and not is_near then
    return jsonb_build_object('ok', false, 'error', 'Only nearby commuters or prior reporters can vote on this incident.');
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

  if v_clear_count >= 3 and target_incident.level <> 'L6' then
    update public.incidents
    set status = 'cleared',
        cleared_at = coalesce(cleared_at, clock_timestamp()),
        clear_count = v_clear_count,
        confirm_count = v_confirm_count,
        level_reason = 'Cleared by commuters (' || v_clear_count || ' reports)'
    where id = p_incident_id
    returning status, cleared_at into v_status, v_cleared_at;
  else
    -- Confirm votes cannot extend expiry past 3h from first_reported_at + 1h max grace
    update public.incidents
    set status = 'open',
        cleared_at = null,
        clear_count = v_clear_count,
        confirm_count = v_confirm_count,
        last_confirmed_at = case
          when p_vote = 'confirm' then least(clock_timestamp(), target_incident.first_reported_at + interval '3 hours')
          else last_confirmed_at
        end
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
$function$;

-- ---------------------------------------------------------------------------
-- 5. Pure read-only read_active_live_incidents() (no UPDATE on read)
-- ---------------------------------------------------------------------------
create or replace function public.read_active_live_incidents()
returns jsonb
language plpgsql
security definer
set search_path to ''
set "TimeZone" to 'UTC'
as $function$
declare
  result jsonb;
begin
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
  where (
       i.status = 'open'
       and i.last_confirmed_at >= (clock_timestamp() - interval '3 hours')
     )
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
$function$;
