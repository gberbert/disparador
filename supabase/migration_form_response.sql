-- Adicionar colunas para controle de resposta do formulário
ALTER TABLE fila_envios ADD COLUMN IF NOT EXISTS profissional_id text;
ALTER TABLE fila_envios ADD COLUMN IF NOT EXISTS data_confirmada text;
