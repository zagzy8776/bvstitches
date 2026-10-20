-- Pieces / products the atelier sells or showcases (images + videos via Cloudinary)
create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text not null default 'Ready-to-wear',
  price_naira integer,
  sale_price_naira integer,
  badge text,
  stock integer not null default 0,
  featured boolean not null default false,
  is_active boolean not null default true,
  images text[] not null default '{}',
  videos text[] not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_idx on products (is_active);
create index if not exists products_featured_idx on products (featured);
create index if not exists products_category_idx on products (category);
create index if not exists products_sort_idx on products (sort_order, created_at desc);
