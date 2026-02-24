create extension if not exists pgcrypto;

create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  role text,
  hoa_size text,
  source text not null default 'landing_page',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  constraint waitlist_signups_role_check check (role is null or role in ('board_member', 'resident', 'property_manager')),
  constraint waitlist_signups_hoa_size_check check (hoa_size is null or hoa_size in ('1-25', '26-50', '51-100', '101-200', '201+'))
);

create index if not exists waitlist_signups_created_at_idx on public.waitlist_signups (created_at desc);

alter table public.waitlist_signups enable row level security;

revoke all on public.waitlist_signups from anon, authenticated;
grant insert on public.waitlist_signups to anon, authenticated;

create policy "Allow anonymous waitlist insert"
on public.waitlist_signups
for insert
to anon, authenticated
with check (true);
