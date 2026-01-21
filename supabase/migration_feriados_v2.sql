-- Recriar tabela feriados para suportar apenas Dia e Mês (Recorrente)
DROP TABLE IF EXISTS feriados;

CREATE TABLE feriados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    dia INTEGER NOT NULL CHECK (dia >= 1 AND dia <= 31),
    mes INTEGER NOT NULL CHECK (mes >= 1 AND mes <= 12),
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(dia, mes)
);
