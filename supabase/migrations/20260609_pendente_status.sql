-- Adiciona os status "Em Desenvolvimento" e "Pendente" ao enum project_status.
-- Rodar no Supabase SQL Editor (cada ADD VALUE é uma instrução própria; não rode
-- dentro de uma transação manual, pois ALTER TYPE ... ADD VALUE não pode ser usado
-- na mesma transação em que é criado).
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'Em Desenvolvimento';
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'Pendente';
