-- Cria tabela para configurações gerais do app (Key-Value Store)
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- Habilita RLS (mas permite leitura publica por enquanto ou auth users)
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for anon and authenticated" ON app_config
    FOR ALL USING (true) WITH CHECK (true);

-- Seed Initial Templates if not exist
INSERT INTO app_config (key, value) VALUES 
('TEMPLATE_WHATSAPP', 'Olá {supervisor}, o colaborador {colaborador} fará aniversário dia {data_aniversario}. Sugestão de Day-Off: {data_sugerida}. Confirme: {link_forms}'),
('TEMPLATE_EMAIL_SUBJECT', 'Aviso de Day-Off: {colaborador}'),
('TEMPLATE_EMAIL_BODY', 'Olá {supervisor},\n\nO colaborador {colaborador} faz aniversário em {data_aniversario}.\nData sugerida: {data_sugerida}.\nMotivo: {regra}.\n\nPor favor, confirme no link: {link_forms}')
ON CONFLICT (key) DO NOTHING;
