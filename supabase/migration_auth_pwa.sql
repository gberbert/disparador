-- Tabela de Perfis (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user', -- 'admin' ou 'user'
  approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de Segurança
-- 1. Leitura: Usuários podem ler seu próprio perfil. Admins podem ler todos.
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT
USING (auth.uid() = id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 2. Update: Apenas Admins podem alterar (para aprovar).
CREATE POLICY "Admins can update profiles" ON public.profiles FOR UPDATE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Trigger para criar perfil automaticamente ao se cadastrar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, approved)
  VALUES (
    new.id,
    new.email,
    -- Se for o email do ADM mestre, já nasce Admin e Aprovado
    CASE WHEN new.email = '_#adm@disparador.com.br' THEN 'admin' ELSE 'user' END,
    CASE WHEN new.email = '_#adm@disparador.com.br' THEN TRUE ELSE FALSE END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger se existir para recriar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
