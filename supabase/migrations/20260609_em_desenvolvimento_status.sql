-- Adiciona o status "Em Desenvolvimento" ao enum project_status.
-- Rodar no Supabase SQL Editor.
ALTER TYPE public.project_status ADD VALUE IF NOT EXISTS 'Em Desenvolvimento';
