-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Supervisores
CREATE TABLE supervisores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Tabela de Profissionais
CREATE TABLE profissionais (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nome TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    data_nascimento DATE NOT NULL,
    email TEXT,
    empresa TEXT,
    supervisor_id UUID REFERENCES supervisores(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Fila de Envios (RPA)
CREATE TABLE fila_envios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tipo_destino TEXT CHECK (tipo_destino IN ('SUPERVISOR', 'PROFISSIONAL')),
    destinatario_whatsapp TEXT NOT NULL,
    mensagem_texto TEXT NOT NULL,
    status TEXT DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'ENVIADO', 'ERRO')),
    data_criacao TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    log_erro TEXT
);

-- Habilitar Realtime para fila_envios (Opcional, mas recomendado para o bot reagir rápido)
alter publication supabase_realtime add table fila_envios;
