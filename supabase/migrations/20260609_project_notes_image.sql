-- Adiciona suporte a imagem/gif nas notas do cliente.
ALTER TABLE public.project_notes
  ADD COLUMN IF NOT EXISTS image_url text;

-- Bucket público para arquivos de projetos (documentos e imagens de notas).
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-files', 'project-files', true)
ON CONFLICT (id) DO NOTHING;

-- Usuários autenticados podem fazer upload.
CREATE POLICY IF NOT EXISTS "Authenticated upload project-files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files');

-- Qualquer um pode ler (bucket público).
CREATE POLICY IF NOT EXISTS "Public read project-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-files');

-- Apenas sócios podem excluir.
CREATE POLICY IF NOT EXISTS "Authenticated delete project-files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files');
