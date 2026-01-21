-- Solução para Erro de Permissão / Recursão Infinita

-- 1. Função auxiliar segura para checar se é Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Read access" ON public.profiles;
DROP POLICY IF EXISTS "Update access" ON public.profiles;

-- 3. Novas Políticas Simplificadas

-- LEITURA: Pode ler seu próprio perfil OU se for admin (usando a função segura)
CREATE POLICY "Read access" ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_admin());

-- ATUALIZAÇÃO: Apenas Admin pode editar (para aprovar contas)
CREATE POLICY "Update access" ON public.profiles FOR UPDATE
USING (public.is_admin());

-- INSERÇÃO: O próprio usuário pode criar seu perfil (caso o trigger falhe)
CREATE POLICY "Insert access" ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Garantir RLS ativado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
