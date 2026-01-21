-- Corrige a restrição da coluna status para aceitar 'RESPONDIDO'

-- Tenta remover a restrição padrão (o nome pode variar, mas este é o padrão do Supabase)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fila_envios_status_check') THEN 
        ALTER TABLE fila_envios DROP CONSTRAINT fila_envios_status_check; 
    END IF; 
END $$;

-- Recria a restrição aceitando todos os status
ALTER TABLE fila_envios 
ADD CONSTRAINT fila_envios_status_check 
CHECK (status IN ('PENDENTE', 'ENVIADO', 'ERRO', 'RESPONDIDO'));
