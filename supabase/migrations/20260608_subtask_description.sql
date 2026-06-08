-- Descrição opcional das subtarefas.
-- Permite que cada subtarefa de uma task diária tenha detalhes próprios,
-- exibidos no popup ao clicar na subtarefa.
--
-- Como aplicar: cole no SQL Editor do projeto Supabase (umoggotbrwpmgnvvnmwa) e execute.
-- Seguro de rodar mesmo antes do deploy: a coluna é opcional e o app a trata como vazia.

alter table public.subtasks
  add column if not exists description text;
