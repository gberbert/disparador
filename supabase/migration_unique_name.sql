-- Adicionar constraint UNIQUE para o campo nome na tabela profissionais
-- Isso permite usar o nome como chave de identificação na importação via Excel (upsert)
ALTER TABLE profissionais ADD CONSTRAINT profissionais_nome_key UNIQUE (nome);
