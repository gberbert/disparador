-- Adicionar constraint UNIQUE para email na tabela profissionais
ALTER TABLE profissionais ADD CONSTRAINT profissionais_email_key UNIQUE (email);

-- Adicionar constraint UNIQUE para email na tabela supervisores (boa prática também)
ALTER TABLE supervisores ADD CONSTRAINT supervisores_email_key UNIQUE (email);
