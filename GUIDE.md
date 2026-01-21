# Guia de Configuração e Integração

## 1. Configuração do Banco de Dados (Supabase)

1. Crie um projeto no [Supabase](https://supabase.com).
2. Vá em **SQL Editor** e cole o conteúdo do arquivo `supabase/schema.sql`. Execute para criar as tabelas.
3. Vá em **Project Settings > API** e copie:
   - `Project URL`
   - `anon public` key
   - `service_role` key (secret - use apenas no worker/bot)

## 2. Configuração do Frontend (Web)

1. No arquivo `web/src/supabaseClient.js`, preencha a URL e a KEY (anon).
2. Para rodar:
   ```bash
   cd web
   npm install
   npm run dev
   ```
3. Acesse `http://localhost:5173`.
4. Use a aba **Importar Dados** para carregar sua planilha de funcionários.

## 3. Configuração do Worker (Bot WhatsApp)

1. No diretório `worker`, crie um arquivo `.env`:
   ```env
   SUPABASE_URL=sua_url_supabase
   SUPABASE_SERVICE_ROLE_KEY=sua_secret_service_role_key
   ```
2. Para rodar:
   ```bash
   cd worker
   npm install
   node bot.js
   ```
3. Um QR Code aparecerá no terminal. Escaneie com o WhatsApp que fará os disparos.

## 4. Integração Google Forms (Resposta do Supervisor)

Para fechar o ciclo e enviar a mensagem ao profissional após a aprovação do supervisor:

1. **Crie o Google Form**:
   - Pergunta 1: Confirma Day-Off? (Sim/Não)
   - Pergunta 2: ID do Profissional (Campo de texto curto - *Este campo será preenchido automaticamente, você pode ocultá-lo se souber como, ou instruir a não mexer*).
   
2. **Obtenha o Link Preenchido (Pre-filled)**:
   - No Forms, clique nos 3 pontos > "Gerar link preenchido automaticamente".
   - Preencha valores de teste e gere o link.
   - Identifique os IDs dos campos (ex: `entry.12345`).
   - Atualize a linha 74 do arquivo `web/src/components/Dashboard.jsx` com o ID correto do seu form e dos campos.

3. **Google Apps Script (Webhook)**:
   - No editor do Form, clique em 3 pontos > **Editor de Scripts**.
   - Cole o código abaixo para enviar a resposta ao Supabase (ou criar nova mensagem na fila):

```javascript
function onFormSubmit(e) {
  var responses = e.response.getItemResponses();
  var decisao = responses[0].getResponse(); // Ajuste o índice conforme ordem
  var idProfissional = responses[1].getResponse(); // O ID que passamos via URL

  if (decisao === 'Sim') {
    // Chama Supabase para criar envio ao profissional
    var supabaseUrl = 'SUA_URL_SUPABASE';
    var supabaseKey = 'SUA_SERVICE_ROLE_KEY'; // Cuidado, em prod use API Proxy, mas para uso interno ok
    
    var payload = {
      tipo_destino: 'PROFISSIONAL',
      destinatario_whatsapp: 'BUSCAR_DO_DB_OU_PASSAR_NO_FORM', // Ideal ter buscado antes ou passar hidden
      mensagem_texto: 'Seu Day-Off de aniversário foi aprovado! Parabéns!',
      status: 'PENDENTE'
    };
    
    // NOTA: Para simplificar, o Apps Script pode inserir direto na fila_envios
    // ... requer fetch() para REST API do Supabase
    
    var options = {
      method: 'post',
      headers: {
        'apikey': supabaseKey,
        'Authorization': 'Bearer ' + supabaseKey,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      payload: JSON.stringify(payload)
    };
    
    UrlFetchApp.fetch(supabaseUrl + '/rest/v1/fila_envios', options);
  }
}
```
   - Salve e vá em **Acionadores (Triggers)** > Adicionar > Tipo de evento: **Ao enviar o formulário**.

Agora, quando o supervisor responder "Sim", o script insere uma nova mensagem na `fila_envios`, e seu bot Node.js pegará automaticamente e enviará ao profissional!
