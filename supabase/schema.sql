-- CAF • Gestão Inteligente de Escalas
-- Execute no SQL Editor do projeto Supabase.
create table if not exists public.caf_escalas (
  id text primary key,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.caf_escalas enable row level security;

-- Usuários autenticados podem consultar e atualizar a escala compartilhada.
-- Restrinja o cadastro de usuários no Supabase para somente pessoas autorizadas.
drop policy if exists "caf_escalas_select_authenticated" on public.caf_escalas;
create policy "caf_escalas_select_authenticated"
on public.caf_escalas for select to authenticated using (true);

drop policy if exists "caf_escalas_insert_authenticated" on public.caf_escalas;
create policy "caf_escalas_insert_authenticated"
on public.caf_escalas for insert to authenticated with check (true);

drop policy if exists "caf_escalas_update_authenticated" on public.caf_escalas;
create policy "caf_escalas_update_authenticated"
on public.caf_escalas for update to authenticated using (true) with check (true);

grant select, insert, update on public.caf_escalas to authenticated;
