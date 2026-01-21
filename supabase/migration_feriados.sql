-- Tabela de Feriados / Datas Comemorativas
CREATE TABLE feriados (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    data DATE NOT NULL UNIQUE,
    descricao TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);
