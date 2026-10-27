create table if not exists public.users (
  tg_id bigint primary key, username text, first_name text,
  balance bigint not null default 0, energy int not null default 500, max_energy int not null default 500,
  tap_power int not null default 1, energy_ts timestamptz not null default now(),
  referred_by bigint references public.users(tg_id),
  last_daily timestamptz, streak int not null default 0,
  created_at timestamptz not null default now()
);
-- اگه جدول از قبل ساخته شده، این دو خط جدید رو اجرا کن:
alter table public.users add column if not exists last_daily timestamptz;
alter table public.users add column if not exists streak int not null default 0;
create index if not exists users_balance_idx on public.users (balance desc);
create index if not exists users_ref_idx on public.users (referred_by);
alter table public.users enable row level security;
grant all on public.users to service_role;
