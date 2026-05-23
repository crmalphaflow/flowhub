create table if not exists public.leads (
  id text primary key,
  created_at timestamptz not null default now(),
  source text,
  page text,
  name text not null,
  company text,
  email text not null,
  phone text,
  message text,
  audit_summary text,
  status text not null default 'new'
);

alter table public.leads enable row level security;

drop policy if exists "Allow public lead inserts" on public.leads;
create policy "Allow public lead inserts"
on public.leads
for insert
to anon, authenticated
with check (true);

drop policy if exists "Allow authenticated admins to read leads" on public.leads;
create policy "Allow authenticated admins to read leads"
on public.leads
for select
to authenticated
using (
  auth.jwt() ->> 'email' in ('princg86@gmail.com')
);

drop policy if exists "Allow authenticated admins to update leads" on public.leads;
create policy "Allow authenticated admins to update leads"
on public.leads
for update
to authenticated
using (
  auth.jwt() ->> 'email' in ('princg86@gmail.com')
)
with check (
  auth.jwt() ->> 'email' in ('princg86@gmail.com')
);
