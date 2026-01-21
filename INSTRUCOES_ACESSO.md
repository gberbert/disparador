# Instruções de Acesso e Login 🔐

## 1. Primeiro Acesso (ADMIN)

Como este é o primeiro acesso, você precisa **criar a conta** que será a Administradora. Configurei o sistema para reconhecer um email específico automaticamente.

1. Abra o app (`npm run dev`).
2. Na tela de Login, clique em **Cadastre-se** (no rodapé do cartão).
3. Preencha com os dados mestre:
   - **Email**: `_#adm@disparador.com.br`
   - **Senha**: `Closable9-Paralyses6-Font9-Kindness8-Reclining5`
4. Clique em **Solicitar Acesso**.

> **O que acontece agora?**
> Graças ao script SQL que criamos, o banco de dados vai identificar esse email e automaticamente definir:
> - `role`: 'admin'
> - `approved`: true

5. Volte para a aba **Login** e entre com as credenciais. Você verá o menu "Aprovações".

---

## 2. Aprovar Outros Usuários

Para outros usuários (ex: sua equipe):
1. Eles se cadastram com o email deles.
2. O sistema dirá: *"Cadastro realizado! Aguarde a aprovação"*.
3. Eles **não** conseguirão entrar ainda.
4. **Você (Admin)** entra no seu painel.
5. Vai na aba lateral **Aprovações** (só visível para Admins).
6. Clica em **Aprovar** ao lado do email deles.
7. Pronto! Agora eles podem logar.

---

## ⚠️ Supabase: Confirmação de Email

Se ao tentar logar aparecer erro de "Email not confirmed":
1. Vá no painel do **Supabase** (site).
2. Menu **Authentication** > **Providers** > **Email**.
3. **Desative** a opção **"Confirm email"** (Enable Email Confirmations).
4. Ou, vá em **Users** e confirme o usuário manualmente.
