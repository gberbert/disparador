# Guia de Deploy no Render.com 🚀

Este guia explica como colocar seu sistema (Site + Robô) no ar usando o Render conectado ao seu GitHub.

## 1. Preparação do Código

Certifique-se de que seu projeto está no GitHub.
Estrutura esperada:
```
/
  web/     (Seu painel React)
  worker/  (Seu robô Node.js)
```

---

## 2. Deploy do Painel (Frontend)

1. No Render, clique em **New +** > **Static Site**.
2. Conecte seu repositório do GitHub.
3. Preencha as configurações:
   - **Name**: `disparador-web` (exemplo)
   - **Root Directory**: `web`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. **Environment Variables** (Variáveis de Ambiente):
   Adicione as chaves do Supabase (as mesmas do seu `.env` local):
   - `VITE_SUPABASE_URL`: `https://...`
   - `VITE_SUPABASE_ANON_KEY`: `eyJ...`
5. Clique em **Create Static Site**.

---

## 3. Deploy do Robô (Backend / Worker)

O robô precisa rodar continuamente. No Render, usaremos um **Background Worker** ou **Web Service**. Recomendamos **Web Service** para ver os logs mais fácil.

1. No Render, clique em **New +** > **Web Service**.
2. Conecte o mesmo repositório.
3. Preencha as configurações:
   - **Name**: `disparador-bot`
   - **Root Directory**: `worker`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `node bot.js`
4. **Environment Variables**:
   - `SUPABASE_URL`: `https://...`
   - `SUPABASE_SERVICE_ROLE_KEY`: `eyJ...` (Chave secreta `service_role`, NÃO a anon!)
   - `SMTP_HOST`: `smtp.gmail.com`
   - `SMTP_USER`: `seu-email@gmail.com`
   - `SMTP_PASS`: `sua-senha-de-app`
   - `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD`: `true` (Opcional, se usar Chrome do sistema, mas deixe padrão primeiro).

### ⚠️ Importante: WhatsApp e Puppeteer no Render

O WhatsApp usa um navegador oculto (Puppeteer). No Render, você precisa configurar os argumentos corretos para ele rodar no Linux sem interface gráfica.
Já configuramos o código com `--no-sandbox`.

Se der erro de "Bibliotecas ausentes" (Missing libraries), você precisará adicionar um **Environment Variable** no Render:
- `PUPPETEER_CACHE_DIR`: `/opt/render/project/.chrome`

### 📱 Escaneando o QR Code

1. Assim que o serviço iniciar, clique na aba **Logs** do Render.
2. O QR Code aparecerá no terminal (em formato de texto).
3. Pode ser necessário dar zoom ou copiar o texto para um visualizador se ficar quebrado, mas geralmente funciona.
4. **Persistência**: O Render apaga os arquivos quando reinicia. Para não ter que escanear o QR Code todo dia, você deve adicionar um **Disk** (Pago) no Render montado em `/opt/render/project/src/worker/.wwebjs_auth`.
   - Se usar a versão gratuita, terá que escanear sempre que o deploy reiniciar.

---
## Resumo
1. **Web**: Static Site (`npm run build`).
2. **Worker**: Web Service (`node bot.js`).
3. **Escaneie o QR** pelos Logs do Render.
