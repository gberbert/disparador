import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { RefreshCw, Send, CheckSquare, Clock, XCircle, Trash2, Mail, MessageSquare, ThumbsUp } from 'lucide-react';

export default function Dashboard() {
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState('PENDENTE');

    useEffect(() => {
        fetchQueue();
    }, []);

    useEffect(() => {
        const subscription = supabase
            .channel('public:fila_envios')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'fila_envios' }, fetchQueue)
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, []);

    const fetchQueue = async () => {
        setLoading(true);
        // Performance: Limit to recent history if necessary, but fetching all for accurate counts
        const { data, error } = await supabase
            .from('fila_envios')
            .select('*')
            .neq('status', 'INVALID')
            .order('data_criacao', { ascending: false })
            .limit(2000); // Limit to 2000 for performance safety

        if (error) console.error('Erro ao buscar fila:', error);
        else setQueue(data || []);
        setLoading(false);
    };

    const handleClearQueue = async () => {
        if (!confirm('Tem certeza? Isso apagará TODO o histórico de envios e a fila atual.')) return;

        setLoading(true);
        const { error } = await supabase.from('fila_envios').delete().neq('status', 'INVALID');

        if (error) {
            console.error(error);
            alert('Erro ao limpar fila: ' + error.message);
        } else {
            fetchQueue();
        }
        setLoading(false);
    };

    const handleRunScheduler = async () => {
        setProcessing(true);
        try {
            // 1. Fetch Configuration (Templates)
            const { data: configData } = await supabase.from('app_config').select('*');
            const config = {};
            if (configData) {
                configData.forEach(item => config[item.key] = item.value);
            }

            // Default Templates if missing
            const TPL_WHATSAPP = config['TEMPLATE_WHATSAPP'] || 'Olá [NOME SUPERVISOR], o colaborador [NOME PROFISSIONAL] fará aniversário dia [DATA ANIVERSARIO]. Day-Off sugerido: [DATA DAY-OFF] ([REGRA APLICADA]). Confirme: [LINK GOOGLE FORMS]';
            const TPL_EMAIL_SUBJECT = config['TEMPLATE_EMAIL_SUBJECT'] || 'Aviso Day-Off: [NOME PROFISSIONAL]';
            const TPL_EMAIL_BODY = config['TEMPLATE_EMAIL_BODY'] || 'Olá [NOME SUPERVISOR],\n\nO colaborador [NOME PROFISSIONAL] faz aniversário em [DATA ANIVERSARIO].\nDay-Off sugerido: [DATA DAY-OFF].\nMotivo: [REGRA APLICADA].\n\nConfirme aqui: [LINK GOOGLE FORMS]';

            const applyTemplate = (tpl, data) => {
                if (!tpl) return '';

                let regraTexto = '';
                // Logic: If rule is NOT 'Data Original', format full explanation.
                // Using includes to catch 'Data Original' and 'Data Original (Sem ajuste auto)'
                if (data.regra && !data.regra.includes('Data Original')) {
                    regraTexto = `Dia de aniversário será um ${data.regra}, data sugerida no dia útil subsequente. `;
                }

                return tpl
                    .replace(/\[NOME SUPERVISOR\]/g, data.supervisor_nome || '')
                    .replace(/\[NOME PROFISSIONAL\]/g, data.prof_nome || '')
                    .replace(/\[DATA ANIVERSARIO\]/g, data.aniversario || '')
                    .replace(/\[DATA DAY-OFF\]/g, data.dayoff || '')
                    .replace(/\[REGRA APLICADA\]/g, regraTexto)
                    .replace(/\[LINK GOOGLE FORMS\]/g, data.link || '');
            };

            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const endDate = new Date(today);
            endDate.setDate(today.getDate() + 20);
            endDate.setHours(23, 59, 59, 999);

            const { data: feriadosData } = await supabase.from('feriados').select('dia, mes');
            const holidayList = feriadosData || [];

            const { data: pros, error } = await supabase
                .from('profissionais')
                .select(`*, supervisores ( nome, whatsapp, email )`);

            if (error) throw error;

            const upcomingBirthdays = pros.filter(p => {
                if (!p.data_nascimento) return false;
                const parts = p.data_nascimento.split('-');
                const bMonth = parseInt(parts[1], 10) - 1;
                const bDay = parseInt(parts[2], 10);

                const nextBirthday = new Date(today.getFullYear(), bMonth, bDay);
                if (nextBirthday < today) {
                    nextBirthday.setFullYear(today.getFullYear() + 1);
                }

                return nextBirthday >= today && nextBirthday <= endDate;
            });

            if (upcomingBirthdays.length === 0) {
                alert(`Nenhum aniversariante encontrado entre ${today.toLocaleDateString()} e ${endDate.toLocaleDateString()}.`);
                setProcessing(false);
                return;
            }

            let count = 0;
            for (const p of upcomingBirthdays) {
                const parts = p.data_nascimento.split('-');
                const bMonth = parseInt(parts[1], 10) - 1;
                const bDay = parseInt(parts[2], 10);
                let current = new Date(today.getFullYear(), bMonth, bDay);
                if (current < today) current.setFullYear(today.getFullYear() + 1);

                let rule = 'Data Original';
                const originalDate = new Date(current);

                const checkCollision = (date) => {
                    const cDay = date.getDate();
                    const cMonth = date.getMonth() + 1;
                    const dayOfWeek = date.getDay();

                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const isHoliday = holidayList.some(h => h.dia === cDay && h.mes === cMonth);

                    if (!isWeekend && !isHoliday) {
                        return { date: new Date(date), rule };
                    }

                    if (isHoliday) rule = 'Feriado/Recesso';
                    else if (isWeekend && rule === 'Data Original') rule = 'Fim de Semana';
                    return null;
                };

                let suggestion = null;
                let tempDate = new Date(originalDate);
                for (let i = 0; i < 5; i++) {
                    const result = checkCollision(tempDate);
                    if (result) {
                        suggestion = result;
                        break;
                    }
                    tempDate.setDate(tempDate.getDate() + 1);
                }

                if (!suggestion) suggestion = { date: originalDate, rule: 'Data Original (Sem ajuste auto)' };

                const suggestedDate = suggestion.date;
                const realDay = String(bDay).padStart(2, '0');
                const realMonth = String(bMonth + 1).padStart(2, '0');
                const suggestedDayStr = String(suggestedDate.getDate()).padStart(2, '0');
                const suggestedMonthStr = String(suggestedDate.getMonth() + 1).padStart(2, '0');
                const suggestedString = `${suggestedDayStr}/${suggestedMonthStr}/${suggestedDate.getFullYear()}`;

                const diaSugeridoDB = `${suggestedDate.getFullYear()}-${suggestedMonthStr}-${suggestedDayStr}`;
                // Google Forms Update: 7672 parece ser o título 'Id do Profissional'. 1702 sobrou para Data.
                const formsLink = `https://docs.google.com/forms/d/e/1FAIpQLSdVwQuOHxOWhFI7bRdQ3dWKoWBqk8qTRAWG5HekTMJzWO2gig/viewform?usp=pp_url&entry.1543887881=${encodeURIComponent(p.nome)}&entry.767260361=${encodeURIComponent(p.id)}&entry.1702966662=${encodeURIComponent(diaSugeridoDB)}`;

                const templateData = {
                    supervisor_nome: p.supervisores?.nome || 'Supervisor',
                    prof_nome: p.nome,
                    aniversario: `${realDay}/${realMonth}`,
                    dayoff: suggestedString,
                    regra: rule,
                    link: formsLink
                };

                // WhatsApp Message
                const msgWhatsapp = applyTemplate(TPL_WHATSAPP, templateData);

                // Save WhatsApp
                const { error: insertError } = await supabase
                    .from('fila_envios')
                    .insert({
                        canal: 'WHATSAPP',
                        tipo_destino: 'SUPERVISOR',
                        destinatario_whatsapp: p.supervisores?.whatsapp,
                        mensagem_texto: msgWhatsapp,
                        dia_sugerido: diaSugeridoDB,
                        regra_aplicada: rule,
                        colaborador_nome: p.nome,
                        profissional_id: p.id,
                        status: 'PENDENTE'
                    });

                if (p.supervisores?.email) {
                    const subjectEmail = applyTemplate(TPL_EMAIL_SUBJECT, templateData);
                    const bodyEmail = applyTemplate(TPL_EMAIL_BODY, templateData);

                    await supabase
                        .from('fila_envios')
                        .insert({
                            canal: 'EMAIL',
                            tipo_destino: 'SUPERVISOR',
                            destinatario_email: p.supervisores.email,
                            assunto: subjectEmail,
                            mensagem_texto: bodyEmail,
                            dia_sugerido: diaSugeridoDB,
                            regra_aplicada: rule,
                            colaborador_nome: p.nome,
                            profissional_id: p.id,
                            status: 'PENDENTE'
                        });
                }

                if (!insertError) count++;
            }

            if (count === 0 && upcomingBirthdays.length > 0) {
                alert('Atenção: Houve falha ao salvar.');
            } else if (count === 0) {
                alert(`Nenhum aniversariante encontrado.`);
            } else {
                alert(`Concluído! ${count} agendamentos processados.`);
            }

            fetchQueue();
        } catch (err) {
            console.error(err);
            alert('Erro: ' + err.message);
        } finally {
            setProcessing(false);
        }
    };

    const getStatusBadge = (item) => {
        const status = item.status;
        const styles = {
            'ENVIADO': 'bg-green-100 text-green-800 border-green-200',
            'PENDENTE': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'ERRO': 'bg-red-100 text-red-800 border-red-200',
            'RESPONDIDO': 'bg-blue-100 text-blue-800 border-blue-200'
        };
        const icons = {
            'ENVIADO': <CheckSquare size={14} />,
            'PENDENTE': <Clock size={14} />,
            'ERRO': <XCircle size={14} />,
            'RESPONDIDO': <ThumbsUp size={14} />
        };
        return (
            <span
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100'} cursor-help`}
                title={status === 'ERRO' ? item.log_erro : `Status: ${status}`}
            >
                {icons[status]} {status}
            </span>
        );
    };

    // Calculate Counts using useMemo for performance
    const counts = useMemo(() => {
        return {
            PENDENTE: queue.filter(i => i.status === 'PENDENTE' || i.status === 'ERRO').length,
            ENVIADO: queue.filter(i => i.status === 'ENVIADO').length,
            RESPONDIDO: queue.filter(i => i.status === 'RESPONDIDO').length
        };
    }, [queue]);

    // Filter Items based on Active Tab and Search Term
    const displayedQueue = useMemo(() => {
        return queue.filter(item => {
            // Tab Filter
            if (activeTab === 'PENDENTE') {
                if (item.status !== 'PENDENTE' && item.status !== 'ERRO') return false;
            } else {
                if (item.status !== activeTab) return false;
            }

            // Search Filter
            if (!searchTerm) return true;
            const term = searchTerm.toLowerCase();
            return (
                item.destinatario_whatsapp?.includes(term) ||
                item.destinatario_email?.toLowerCase().includes(term) ||
                item.mensagem_texto?.toLowerCase().includes(term) ||
                item.regra_aplicada?.toLowerCase().includes(term) ||
                item.colaborador_nome?.toLowerCase().includes(term)
            );
        });
    }, [queue, activeTab, searchTerm]);

    const tabs = [
        { id: 'PENDENTE', label: 'Pendentes', icon: <Clock size={16} />, count: counts.PENDENTE, color: 'text-yellow-600' },
        { id: 'ENVIADO', label: 'Enviados', icon: <Send size={16} />, count: counts.ENVIADO, color: 'text-green-600' },
        { id: 'RESPONDIDO', label: 'Respondidos', icon: <ThumbsUp size={16} />, count: counts.RESPONDIDO, color: 'text-blue-600' }
    ];

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Painel de Envios</h1>
                    <p className="text-gray-500 text-xs md:text-sm">Gerenciamento da fila de mensagens do RPA</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={handleClearQueue} disabled={loading || processing} className="bg-red-50 hover:bg-red-100 text-red-600 px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all border border-red-200">
                        <Trash2 size={20} /> Limpar
                    </button>
                    <button onClick={handleRunScheduler} disabled={processing} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-md">
                        <RefreshCw className={`w-5 h-5 ${processing ? 'animate-spin' : ''}`} />
                        {processing ? 'Analisando...' : 'Rodar Análise'}
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px] flex flex-col">

                {/* Tabs Header */}
                <div className="flex border-b border-gray-100 bg-gray-50/30 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 md:gap-3 py-3 md:py-4 text-xs md:text-sm font-medium transition-all border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? `border-indigo-500 text-indigo-600 bg-indigo-50/30`
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`${activeTab === tab.id ? tab.color : ''} hidden md:block`}>{tab.icon}</span>
                            {tab.label}
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                                }`}>
                                {tab.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-96">
                        <input
                            type="text"
                            placeholder={`Buscar em ${activeTab.toLowerCase()}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                        />
                    </div>
                </div>

                {/* Responsive Content: Cards for Mobile, Table for Desktop */}
                <div className="flex-1 bg-gray-50 md:bg-white">

                    {/* MOBILE VIEW (Cards) */}
                    <div className="md:hidden p-4 space-y-4">
                        {displayedQueue.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="min-w-0 flex-1 mr-2">
                                        <h3 className="font-bold text-gray-900 line-clamp-2 text-base leading-tight">
                                            {(item.colaborador_nome || 'Sem Nome').toLowerCase().replace(/(^|\s)\S/g, l => l.toUpperCase())}
                                        </h3>
                                        <span className="text-xs text-gray-400">{new Date(item.data_criacao).toLocaleDateString()}</span>
                                    </div>
                                    {getStatusBadge(item)}
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div className="bg-indigo-50 p-2 rounded-lg border border-indigo-100">
                                        <span className="text-[10px] uppercase text-indigo-400 font-bold block mb-1">Day-Off Sugerido</span>
                                        <span className="text-sm font-bold text-indigo-700">
                                            {item.dia_sugerido ? item.dia_sugerido.split('-').reverse().join('/') : '-'}
                                        </span>
                                        {item.data_confirmada && activeTab === 'RESPONDIDO' && (
                                            <div className="mt-1 pt-1 border-t border-indigo-100">
                                                <span className="text-[10px] text-green-600 font-bold block">Confirmado</span>
                                                <span className="text-xs text-green-700">{item.data_confirmada}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded-lg border border-gray-100 flex flex-col justify-center">
                                        <span className="text-[10px] uppercase text-gray-400 font-bold block mb-1">Regra</span>
                                        <span className="text-xs font-medium text-gray-600">{item.regra_aplicada || '-'}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-white p-2 rounded border border-gray-100">
                                        {item.canal === 'EMAIL' ? <Mail size={14} className="text-blue-500" /> : <MessageSquare size={14} className="text-green-500" />}
                                        <span className="truncate">{item.destinatario_email || item.destinatario_whatsapp || '-'}</span>
                                    </div>
                                    {item.mensagem_texto && (
                                        <div className="text-xs text-gray-400 italic px-1 truncate">
                                            "{item.mensagem_texto}"
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {displayedQueue.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <p>Nenhum registro encontrado</p>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP VIEW (Table) */}
                    <div className="hidden md:block overflow-x-auto h-full">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50 text-gray-500 font-semibold uppercase tracking-wider text-xs sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left shadow-sm">Status</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Colaborador</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Day-Off Sugerido</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Regra</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Destino</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Mensagem</th>
                                    <th className="px-6 py-4 text-left shadow-sm">Criado em</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {displayedQueue.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(item)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                                            {item.colaborador_nome || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-700 text-base">
                                                    {item.dia_sugerido ? item.dia_sugerido.split('-').reverse().join('/') : '-'}
                                                </span>
                                                {item.data_confirmada && activeTab === 'RESPONDIDO' && (
                                                    <span className="text-xs text-green-600 font-semibold">Confirmado: {item.data_confirmada}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {item.regra_aplicada ? (
                                                <span className={`px-2 py-1 rounded text-xs font-medium border ${item.regra_aplicada === 'Data Original'
                                                    ? 'bg-gray-100 text-gray-600 border-gray-200'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                    {item.regra_aplicada}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                                            <div className="flex items-center gap-2">
                                                {item.canal === 'EMAIL' ? <Mail size={16} className="text-blue-500" /> : <MessageSquare size={16} className="text-green-500" />}
                                                <span className="font-medium">{item.destinatario_email || item.destinatario_whatsapp || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs truncate text-gray-500" title={item.mensagem_texto}>
                                                {item.mensagem_texto}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-xs">
                                            {new Date(item.data_criacao).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {displayedQueue.length === 0 && (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <div className="bg-gray-100 p-3 rounded-full mb-3">
                                                    <XCircle className="w-6 h-6 text-gray-400" />
                                                </div>
                                                <p>Nenhum registro em "{tabs.find(t => t.id === activeTab)?.label}"</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
