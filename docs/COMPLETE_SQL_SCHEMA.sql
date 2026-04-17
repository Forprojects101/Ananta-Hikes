create table public.add_ons (
  id uuid not null default gen_random_uuid (),
  mountain_id uuid not null,
  name character varying(255) not null,
  description text null,
  price numeric(10, 2) null,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint add_ons_pkey primary key (id),
  constraint add_ons_mountain_id_fkey foreign KEY (mountain_id) references mountains (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.audit_logs (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  action character varying(255) not null,
  resource_type character varying(100) null,
  resource_id uuid null,
  ip_address inet null,
  user_agent text null,
  status character varying(50) null default 'success'::character varying,
  details jsonb null,
  created_at timestamp with time zone null default now(),
  constraint audit_logs_pkey primary key (id),
  constraint audit_logs_user_id_fkey foreign KEY (user_id) references users (id),
  constraint audit_logs_status_check check (
    (
      (status)::text = any (
        (
          array[
            'success'::character varying,
            'failed'::character varying,
            'unauthorized'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user on public.audit_logs using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_action on public.audit_logs using btree (action) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_created on public.audit_logs using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_audit_logs_user_action on public.audit_logs using btree (user_id, action) TABLESPACE pg_default;

create table public.bookings (
  id uuid not null default extensions.uuid_generate_v4 (),
  hiker_id uuid not null,
  mountain_id uuid not null,
  hike_type character varying(50) not null,
  start_date date not null,
  end_date date not null,
  participants integer null default 1,
  total_price numeric(10, 2) null,
  status character varying(50) null default 'pending'::character varying,
  guide_id uuid null,
  approved_by uuid null,
  approval_date timestamp with time zone null,
  cancellation_reason text null,
  canceled_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_guide_id_fkey foreign KEY (guide_id) references users (id),
  constraint bookings_approved_by_fkey foreign KEY (approved_by) references users (id),
  constraint bookings_mountain_id_fkey foreign KEY (mountain_id) references mountains (id),
  constraint bookings_hiker_id_fkey foreign KEY (hiker_id) references users (id),
  constraint bookings_hike_type_check check (
    (
      (hike_type)::text = any (
        (
          array[
            'Day'::character varying,
            'Overnight'::character varying,
            'Multi-day'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint bookings_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'approved'::character varying,
            'rejected'::character varying,
            'confirmed'::character varying,
            'completed'::character varying,
            'canceled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bookings_hiker on public.bookings using btree (hiker_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_mountain on public.bookings using btree (mountain_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_guide on public.bookings using btree (guide_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_start_date on public.bookings using btree (start_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_guide_status on public.bookings using btree (guide_id, status) TABLESPACE pg_default;

create table public.bookings (
  id uuid not null default extensions.uuid_generate_v4 (),
  hiker_id uuid not null,
  mountain_id uuid not null,
  hike_type character varying(50) not null,
  start_date date not null,
  end_date date not null,
  participants integer null default 1,
  total_price numeric(10, 2) null,
  status character varying(50) null default 'pending'::character varying,
  guide_id uuid null,
  approved_by uuid null,
  approval_date timestamp with time zone null,
  cancellation_reason text null,
  canceled_at timestamp with time zone null,
  completed_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint bookings_pkey primary key (id),
  constraint bookings_guide_id_fkey foreign KEY (guide_id) references users (id),
  constraint bookings_approved_by_fkey foreign KEY (approved_by) references users (id),
  constraint bookings_mountain_id_fkey foreign KEY (mountain_id) references mountains (id),
  constraint bookings_hiker_id_fkey foreign KEY (hiker_id) references users (id),
  constraint bookings_hike_type_check check (
    (
      (hike_type)::text = any (
        (
          array[
            'Day'::character varying,
            'Overnight'::character varying,
            'Multi-day'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint bookings_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'approved'::character varying,
            'rejected'::character varying,
            'confirmed'::character varying,
            'completed'::character varying,
            'canceled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bookings_hiker on public.bookings using btree (hiker_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_mountain on public.bookings using btree (mountain_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_guide on public.bookings using btree (guide_id) TABLESPACE pg_default;

create index IF not exists idx_bookings_status on public.bookings using btree (status) TABLESPACE pg_default;

create index IF not exists idx_bookings_start_date on public.bookings using btree (start_date) TABLESPACE pg_default;

create index IF not exists idx_bookings_guide_status on public.bookings using btree (guide_id, status) TABLESPACE pg_default;

create table public.group_photos (
  id uuid not null default gen_random_uuid (),
  image_url character varying(500) not null,
  alt_text character varying(255) null,
  title character varying(255) not null,
  location character varying(255) null,
  photo_date date null,
  group_type character varying(255) null,
  mountain_id uuid null,
  created_by uuid null,
  is_featured boolean null default false,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint group_photos_pkey primary key (id),
  constraint group_photos_created_by_fkey foreign KEY (created_by) references users (id),
  constraint group_photos_mountain_id_fkey foreign KEY (mountain_id) references mountains (id) on delete set null
) TABLESPACE pg_default;

create table public.guide_assignments (
  id uuid not null default extensions.uuid_generate_v4 (),
  guide_id uuid not null,
  booking_id uuid not null,
  assigned_date timestamp with time zone null default now(),
  status character varying(50) null default 'assigned'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint guide_assignments_pkey primary key (id),
  constraint guide_assignments_booking_id_fkey foreign KEY (booking_id) references bookings (id),
  constraint guide_assignments_guide_id_fkey foreign KEY (guide_id) references users (id),
  constraint guide_assignments_status_check check (
    (
      (status)::text = any (
        (
          array[
            'assigned'::character varying,
            'confirmed'::character varying,
            'completed'::character varying,
            'canceled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_guide_assignments_guide on public.guide_assignments using btree (guide_id) TABLESPACE pg_default;

create index IF not exists idx_guide_assignments_booking on public.guide_assignments using btree (booking_id) TABLESPACE pg_default;

create table public.hike_types (
  id uuid not null default gen_random_uuid (),
  mountain_id uuid not null,
  name character varying(255) not null,
  description text null,
  duration character varying(100) null,
  fitness character varying(100) null,
  price numeric(10, 2) null,
  multiplier numeric(5, 2) null default 1.0,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint hike_types_pkey primary key (id),
  constraint hike_types_mountain_id_fkey foreign KEY (mountain_id) references mountains (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.hike_types (
  id uuid not null default gen_random_uuid (),
  mountain_id uuid not null,
  name character varying(255) not null,
  description text null,
  duration character varying(100) null,
  fitness character varying(100) null,
  price numeric(10, 2) null,
  multiplier numeric(5, 2) null default 1.0,
  is_active boolean not null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint hike_types_pkey primary key (id),
  constraint hike_types_mountain_id_fkey foreign KEY (mountain_id) references mountains (id) on delete CASCADE
) TABLESPACE pg_default;

create table public.promotions (
  id uuid not null default gen_random_uuid (),
  title character varying(255) not null,
  description text null,
  image_url character varying(500) null,
  link_url character varying(500) null,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint promotions_pkey primary key (id)
) TABLESPACE pg_default;

create table public.permissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  code character varying(255) not null,
  name character varying(255) not null,
  description text null,
  category character varying(100) null,
  created_at timestamp with time zone null default now(),
  constraint permissions_pkey primary key (id),
  constraint permissions_code_key unique (code)
) TABLESPACE pg_default;

create index IF not exists idx_permissions_code on public.permissions using btree (code) TABLESPACE pg_default;

create index IF not exists idx_permissions_category on public.permissions using btree (category) TABLESPACE pg_default;


create table public.promotions (
  id uuid not null default gen_random_uuid (),
  title character varying(255) not null,
  description text null,
  image_url character varying(500) null,
  link_url character varying(500) null,
  start_date timestamp with time zone null,
  end_date timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint promotions_pkey primary key (id)
) TABLESPACE pg_default;

create table public.role_permissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

create table public.role_permissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

create table public.role_permissions (
  id uuid not null default extensions.uuid_generate_v4 (),
  role_id uuid not null,
  permission_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint role_permissions_pkey primary key (id),
  constraint role_permissions_role_id_permission_id_key unique (role_id, permission_id),
  constraint role_permissions_permission_id_fkey foreign KEY (permission_id) references permissions (id) on delete CASCADE,
  constraint role_permissions_role_id_fkey foreign KEY (role_id) references roles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_role on public.role_permissions using btree (role_id) TABLESPACE pg_default;

create index IF not exists idx_role_permissions_permission on public.role_permissions using btree (permission_id) TABLESPACE pg_default;

create table public.verification_codes (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  email character varying(255) null,
  code character varying(10) not null,
  code_type character varying(50) null default 'email_verification'::character varying,
  is_used boolean null default false,
  attempts integer null default 0,
  max_attempts integer null default 5,
  is_locked boolean null default false,
  locked_until timestamp with time zone null,
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone null default now(),
  constraint verification_codes_pkey primary key (id),
  constraint verification_codes_user_id_fkey foreign KEY (user_id) references users (id),
  constraint verification_codes_code_type_check check (
    (
      (code_type)::text = any (
        (
          array[
            'email_verification'::character varying,
            'password_reset'::character varying,
            'phone_verification'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_verification_codes_email on public.verification_codes using btree (email) TABLESPACE pg_default;

create index IF not exists idx_verification_codes_user on public.verification_codes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_verification_codes_expires on public.verification_codes using btree (expires_at) TABLESPACE pg_default;

