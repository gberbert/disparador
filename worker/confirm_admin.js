const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRO: Variáveis de ambiente não configuradas no woker/.env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function confirmAdmin() {
    const email = '_#adm@disparador.com.br';
    console.log(`🔍 Buscando usuário ${email}...`);

    // Listar usuários (Admin API)
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error('❌ Erro ao listar usuários:', error.message);
        return;
    }

    const user = users.find(u => u.email === email);

    if (!user) {
        console.error('❌ Usuário não encontrado no Auth do Supabase. Cadastre-se primeiro!');
        return;
    }

    if (user.email_confirmed_at) {
        console.log('✅ Este usuário JÁ está confirmado.');
    } else {
        console.log(`🔨 Confirmando email para ID: ${user.id}...`);

        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { email_confirm: true }
        );

        if (updateError) {
            console.error('❌ Erro ao confirmar:', updateError.message);
        } else {
            console.log('✅ SUCESSO! Email confirmado.');
        }
    }

    // Check Profile Approval status too just in case
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profile) {
        console.log(`📊 Status do Perfil: Approved=${profile.approved}, Role=${profile.role}`);
        if (!profile.approved || profile.role !== 'admin') {
            console.log('🔧 Forçando Admin/Approved no perfil...');
            await supabase.from('profiles').update({ approved: true, role: 'admin' }).eq('id', user.id);
            console.log('✅ Perfil atualizado para Admin.');
        }
    }
}

confirmAdmin();
