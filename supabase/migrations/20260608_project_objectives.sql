-- Objetivos do projeto (checklist).
-- Substitui o "Objetivo" único (completion_title/completion_description) por uma
-- lista de objetivos reordenáveis, cada um com título, descrição e estado de concluído.
--
-- Como aplicar: cole este arquivo no SQL Editor do projeto Supabase
-- (umoggotbrwpmgnvvnmwa) e execute. É idempotente o suficiente para rodar uma vez.

create table if not exists public.project_objectives (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  done        boolean not null default false,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists project_objectives_project_id_idx
  on public.project_objectives(project_id);

alter table public.project_objectives enable row level security;

-- Leitura: qualquer usuário autenticado (mesmo padrão de notas/docs do projeto).
drop policy if exists project_objectives_select on public.project_objectives;
create policy project_objectives_select on public.project_objectives
  for select to authenticated using (true);

-- Escrita (criar/editar/reordenar/concluir/excluir): apenas sócios.
drop policy if exists project_objectives_modify on public.project_objectives;
create policy project_objectives_modify on public.project_objectives
  for all to authenticated using (public.is_socio()) with check (public.is_socio());

-- Migra o objetivo único existente para a nova lista (uma vez).
insert into public.project_objectives (project_id, title, description, position)
select p.id, p.completion_title, p.completion_description, 0
from public.projects p
where p.completion_title is not null
  and btrim(p.completion_title) <> ''
  and not exists (
    select 1 from public.project_objectives o where o.project_id = p.id
  );
