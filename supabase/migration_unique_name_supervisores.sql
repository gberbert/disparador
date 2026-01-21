-- Adicionar constraint UNIQUE para o campo nome na tabela supervisores
-- Isso permite atualizar dados do supervisor (telefone/email) automaticamente durante a importação
ALTER TABLE supervisores ADD CONSTRAINT supervisores_nome_key UNIQUE (nome);
