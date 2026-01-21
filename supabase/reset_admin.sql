-- Execute este comando no SQL Editor do Supabase para remover o usuário admin atual.
-- Isso permitirá que você se cadastre novamente com o mesmo email e uma NOVA senha.

DELETE FROM auth.users WHERE email = '_#adm@disparador.com.br';

-- Se você precisar tornar outro usuário admin manualmente, use o comando abaixo:
-- UPDATE public.profiles SET role = 'admin', approved = TRUE WHERE email = 'seu@email.com';
