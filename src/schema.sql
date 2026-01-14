create table public.admin_actions (
  id uuid not null default gen_random_uuid (),
  admin_id uuid null,
  report_id uuid null,
  previous_status text not null,
  new_status text not null,
  created_at timestamp with time zone not null default now(),
  constraint admin_actions_pkey primary key (id),
  constraint admin_actions_admin_id_fkey foreign KEY (admin_id) references auth.users (id) on delete CASCADE,
  constraint admin_actions_report_id_fkey foreign KEY (report_id) references incidents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_admin_actions_admin on public.admin_actions using btree (admin_id) TABLESPACE pg_default;

create index IF not exists idx_admin_actions_report on public.admin_actions using btree (report_id) TABLESPACE pg_default;

create index IF not exists idx_admin_actions_created_at on public.admin_actions using btree (created_at desc) TABLESPACE pg_default;


create table public.citizen_activity (
  id uuid not null default gen_random_uuid (),
  citizen_id uuid not null,
  report_id uuid null,
  activity_type text not null,
  points_awarded integer not null default 0,
  description text null,
  created_at timestamp with time zone not null default now(),
  constraint citizen_activity_pkey primary key (id),
  constraint citizen_activity_citizen_id_fkey foreign KEY (citizen_id) references citizens (id) on delete CASCADE,
  constraint citizen_activity_report_id_fkey foreign KEY (report_id) references incidents (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_citizen_activity_citizen on public.citizen_activity using btree (citizen_id, created_at desc) TABLESPACE pg_default;

create index IF not exists idx_citizen_activity_report on public.citizen_activity using btree (report_id) TABLESPACE pg_default;


create table public.citizens (
  id uuid not null,
  full_name text not null,
  avatar_url text null,
  total_points integer not null default 0,
  current_level integer not null default 1,
  rank_title text not null default 'Eco Starter'::text,
  total_reports integer not null default 0,
  resolved_reports integer not null default 0,
  neighborhood text null,
  city text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint citizens_pkey primary key (id),
  constraint citizens_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_citizens_points on public.citizens using btree (total_points desc) TABLESPACE pg_default;

create index IF not exists idx_citizens_city on public.citizens using btree (city) TABLESPACE pg_default;

create index IF not exists idx_citizens_neighborhood on public.citizens using btree (neighborhood) TABLESPACE pg_default;

create index IF not exists idx_citizens_level on public.citizens using btree (current_level desc) TABLESPACE pg_default;

create trigger update_citizens_updated_at BEFORE
update on citizens for EACH row
execute FUNCTION update_updated_at_column ();


create table public.incidents (
  id uuid not null default gen_random_uuid (),
  image_url text not null,
  latitude double precision not null,
  longitude double precision not null,
  street_name text not null,
  city text not null,
  description text null,
  status public.report_status not null default 'open'::report_status,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  resolved_at timestamp with time zone null,
  waste_type text not null default 'general'::text,
  urgency text not null default 'medium'::text,
  zone text null default 'Konkan'::text,
  citizen_id uuid null,
  severity text null default 'medium'::text,
  category text null default 'general'::text,
  constraint reports_pkey primary key (id),
  constraint reports_citizen_id_fkey foreign KEY (citizen_id) references citizens (id) on delete set null,
  constraint incidents_severity_check check (
    (
      severity = any (
        array[
          'low'::text,
          'medium'::text,
          'high'::text,
          'critical'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_reports_citizen on public.incidents using btree (citizen_id) TABLESPACE pg_default;

create index IF not exists idx_reports_status on public.incidents using btree (status) TABLESPACE pg_default;

create index IF not exists idx_reports_street on public.incidents using btree (street_name) TABLESPACE pg_default;

create index IF not exists idx_reports_created_at on public.incidents using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_reports_location on public.incidents using btree (latitude, longitude) TABLESPACE pg_default;

create trigger create_notification_on_status_change
after
update on incidents for EACH row when (new.status is distinct from old.status)
execute FUNCTION create_status_change_notification ();

create trigger set_reports_resolved_at BEFORE
update on incidents for EACH row when (new.status is distinct from old.status)
execute FUNCTION set_resolved_at ();

create trigger trigger_on_report_created
after INSERT on incidents for EACH row
execute FUNCTION on_report_created ();

create trigger trigger_on_report_status_changed
after
update on incidents for EACH row when (old.status is distinct from new.status)
execute FUNCTION on_report_status_changed ();

create trigger trigger_set_zone BEFORE INSERT on incidents for EACH row
execute FUNCTION set_zone_from_city ();

create trigger update_reports_updated_at BEFORE
update on incidents for EACH row
execute FUNCTION update_updated_at_column ();


create table public.notifications (
  id uuid not null default gen_random_uuid (),
  report_id uuid null,
  message text not null,
  type text not null,
  is_read boolean null default false,
  created_at timestamp with time zone not null default now(),
  citizen_id uuid null,
  constraint notifications_pkey primary key (id),
  constraint notifications_citizen_id_fkey foreign KEY (citizen_id) references citizens (id) on delete CASCADE,
  constraint notifications_report_id_fkey foreign KEY (report_id) references incidents (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_notifications_is_read on public.notifications using btree (is_read) TABLESPACE pg_default;

create index IF not exists idx_notifications_created_at on public.notifications using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_notifications_citizen on public.notifications using btree (citizen_id, is_read) TABLESPACE pg_default;


create table public.resources (
  id uuid not null default gen_random_uuid (),
  name text not null,
  type text not null,
  quantity integer null default 1,
  latitude double precision not null,
  longitude double precision not null,
  status text null default 'available'::text,
  contact_info text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint resources_pkey primary key (id),
  constraint resources_status_check check (
    (
      status = any (
        array[
          'available'::text,
          'dispatched'::text,
          'depleted'::text,
          'maintenance'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;