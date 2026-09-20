create extension if not exists pgcrypto;

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  phone text not null,
  service text not null,
  preferred_date date not null,
  preferred_time time not null,
  notes text,
  status text not null default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now()
);

create unique index if not exists bookings_slot_unique
  on bookings (preferred_date, preferred_time)
  where status in ('pending','confirmed');

create index if not exists bookings_date_idx on bookings (preferred_date);
create index if not exists bookings_status_idx on bookings (status);
