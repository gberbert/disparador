-- Adaptação da tabela fila_envios para suportar E-mail
-- 1. Remover a obrigatoriedade do telefone (pois envio de email não tem telefone)
ALTER TABLE fila_envios ALTER COLUMN destinatario_whatsapp DROP NOT NULL;

-- 2. Adicionar coluna para definir o canal (WHATSAPP ou EMAIL)
ALTER TABLE fila_envios ADD COLUMN canal TEXT DEFAULT 'WHATSAPP';

-- 3. Adicionar colunas para E-mail
ALTER TABLE fila_envios ADD COLUMN destinatario_email TEXT;
ALTER TABLE fila_envios ADD COLUMN assunto TEXT;

-- 4. Garantir que os dados novos existam (redundância do script anterior se não rodou)
ALTER TABLE fila_envios ADD COLUMN IF NOT EXISTS dia_sugerido DATE;
ALTER TABLE fila_envios ADD COLUMN IF NOT EXISTS regra_aplicada TEXT;
ALTER TABLE fila_envios ADD COLUMN IF NOT EXISTS colaborador_nome TEXT;
