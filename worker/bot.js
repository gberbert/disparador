const { createClient } = require('@supabase/supabase-js');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const nodemailer = require('nodemailer');
require('dotenv').config();

// Configuração Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Custom fetch with increased timeout
const customFetch = (url, options = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000); // 30s timeout
    return fetch(url, { ...options, signal: controller.signal })
        .finally(() => clearTimeout(id));
};

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        persistSession: false
    },
    global: {
        fetch: customFetch
    }
});

// Configuração Email (Nodemailer)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: process.env.SMTP_PORT || 587,
    secure: false, // true para 465, false para outras
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

// Configuração WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code recebido, escaneie por favor!');
});

client.on('ready', () => {
    console.log('WhatsApp Conectado! Iniciando processamento da fila...');
    processQueue();
});

client.initialize();

async function processQueue() {
    console.log('Verificando fila...');

    // Buscar itens PENDENTE (WhatsApp ou Email)
    const { data: queue, error } = await supabase
        .from('fila_envios')
        .select('*')
        .eq('status', 'PENDENTE')
        .limit(5); // Processa em lotes pequenos

    if (error) {
        console.error('Erro ao buscar fila:', error);
        setTimeout(processQueue, 10000);
        return;
    }

    if (queue && queue.length > 0) {
        for (const item of queue) {
            console.log(`Processando item ${item.id} - Canal: ${item.canal || 'WHATSAPP'}`);

            try {
                if (item.canal === 'EMAIL') {
                    // Logica de Envio de Email
                    if (!item.destinatario_email) throw new Error('Email de destino vazio');

                    await transporter.sendMail({
                        from: process.env.SMTP_FROM || process.env.SMTP_USER,
                        to: item.destinatario_email,
                        subject: item.assunto || 'Aviso Day-Off',
                        text: item.mensagem_texto
                    });

                    console.log(`Email enviado para ${item.destinatario_email}`);
                } else {
                    // Logica de Envio de WhatsApp (Padrão)
                    const number = item.destinatario_whatsapp.replace(/\D/g, '');
                    const chatId = `${number}@c.us`;

                    await client.sendMessage(chatId, item.mensagem_texto);
                    console.log(`WhatsApp enviado para ${number}`);
                }

                // Atualizar Status para ENVIADO
                await supabase
                    .from('fila_envios')
                    .update({
                        status: 'ENVIADO',
                        updated_at: new Date()
                    })
                    .eq('id', item.id);

            } catch (err) {
                console.error(`Falha no item ${item.id}:`, err.message);

                // Atualizar Status para ERRO
                await supabase
                    .from('fila_envios')
                    .update({
                        status: 'ERRO',
                        log_erro: err.message,
                        updated_at: new Date()
                    })
                    .eq('id', item.id);
            }

            // Pequeno delay para evitar bloqueio
            await new Promise(r => setTimeout(r, 2000));
        }

        // Se encontrou itens, continua processando a fila rapidamente
        console.log('Lote de 5 finalizado. Verificando se há mais itens...');
        setTimeout(processQueue, 5000); // 5 segundos antes do próximo lote

    } else {
        console.log('Fila vazia ou sem itens pendentes.');

        if (process.env.EXIT_ON_EMPTY === 'true') {
            console.log('✅ Modo Execução Única: Tarefas finalizadas. Encerrando...');
            try { await client.destroy(); } catch (e) { }
            process.exit(0);
        }

        console.log('Aguardando...');
        // Se a fila estava vazia, aguarda um tempo maior para verificar novamente
        setTimeout(processQueue, 60000); // Verifica a cada 1 minuto
    }
}
