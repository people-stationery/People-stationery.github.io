-- Studio People email subscriptions
-- Run this in Supabase Dashboard > SQL Editor.
-- RLS is enabled and no anon/authenticated policies are created:
-- only the server-side Apps Script service-role key can read/write this table.

create table if not exists public.email_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique,
  confirmed boolean not null default false,
  unsubscribed boolean not null default false,
  confirm_token text unique,
  unsubscribe_token text not null unique,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  constraint email_subscribers_email_format
    check (email = lower(trim(email)) and email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$')
);

create index if not exists email_subscribers_delivery_idx
  on public.email_subscribers (confirmed, unsubscribed);

alter table public.email_subscribers enable row level security;

revoke all on table public.email_subscribers from anon, authenticated;
