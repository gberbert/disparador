-- Create Supervisors table if it doesn't exist
create table if not exists public.supervisores (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  nome text not null,
  empresa text,
  email text
);

-- Add RLS policies (simple public access for now as requested by user context typically implied)
alter table public.supervisores enable row level security;

create policy "Enable read access for all users"
on public.supervisores for select
using (true);

create policy "Enable insert for authenticated users only"
on public.supervisores for insert
with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users only"
on public.supervisores for update
using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users only"
on public.supervisores for delete
using (auth.role() = 'authenticated');
