-- Studio People email subscribers
-- Run this in Supabase Dashboard > SQL Editor.
-- Public clients must not be able to read/write this table directly.
create table if not exists public.email_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  confirmed boolean not null default false,
  unsubscribed boolean not null default false,
  confirmation_token_hash text,
  unsubscribe_token_hash text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

alter table public.email_subscribers enable row level security;

-- Intentionally create no anon/authenticated policies here.
-- Only a trusted server using the Supabase service-role key may access this table.
-- Never place the service-role key in a public website or client-side JavaScript.

create index if not exists email_subscribers_delivery_idx
  on public.email_subscribers (confirmed, unsubscribed)
  where confirmed = true and unsubscribed = false;
