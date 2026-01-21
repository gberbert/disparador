import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Trash2, Plus, Save, MessageSquare, Mail, AlertCircle, Eye } from 'lucide-react';

export default function Settings() {
    const [holidays, setHolidays] = useState([]);
    const [newDay, setNewDay] = useState('');
    const [newMonth, setNewMonth] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [loading, setLoading] = useState(false);

    // Templates State
    const [templates, setTemplates] = useState({
        TEMPLATE_WHATSAPP: '',
        TEMPLATE_EMAIL_SUBJECT: '',
        TEMPLATE_EMAIL_BODY: ''
    });
    const [loadingTemplates, setLoadingTemplates] = useState(false);

    useEffect(() => {
        fetchHolidays();
        fetchTemplates();
    }, []);

    const fetchHolidays = async () => {
        const { data, error } = await supabase
            .from('feriados')
            .select('*')
            .order('mes', { ascending: true })
            .order('dia', { ascending: true });
        if (data) setHolidays(data);
    };

    const fetchTemplates = async () => {
        const { data, error } = await supabase.from('app_config').select('*');
        if (data && data.length > 0) {
            const map = { ...templates };
            data.forEach(item => {
                if (map.hasOwnProperty(item.key)) {
                    map[item.key] = item.value;
                }
            });
            setTemplates(map);
        }
    };

    const handleAddHoliday = async (e) => {
        e.preventDefault();
        if (!newDay || !newMonth) return;
        setLoading(true);

        const { error } = await supabase
            .from('feriados')
            .insert({
                dia: parseInt(newDay),
                mes: parseInt(newMonth),
                descricao: newDesc
            });

        if (error) {
            alert('Erro ao adicionar: ' + error.message);
        } else {
            setNewDay('');
            setNewMonth('');
            setNewDesc('');
            fetchHolidays();
        }
        setLoading(false);
    };

    const handleDeleteHoliday = async (id) => {
        if (!confirm('Remover esta data?')) return;
        const { error } = await supabase.from('feriados').delete().eq('id', id);
        if (!error) fetchHolidays();
    };

    const handleSaveTemplates = async () => {
        setLoadingTemplates(true);
        const updates = Object.keys(templates).map(key => ({
            key,
            value: templates[key]
        }));

        const { error } = await supabase.from('app_config').upsert(updates);
        if (error) alert('Erro ao salvar templates: ' + error.message);
        else alert('Templates salvos com sucesso!');

        setLoadingTemplates(false);
    };

    const getPreview = (template) => {
        if (!template) return '';
        return template
            .replace(/\[NOME SUPERVISOR\]/g, 'Mario Augusto')
            .replace(/\[NOME PROFISSIONAL\]/g, 'Maria de Fátima')
            .replace(/\[DATA ANIVERSARIO\]/g, '25/12')
            .replace(/\[DATA DAY-OFF\]/g, '26/12/2024')
            .replace(/\[REGRA APLICADA\]/g, 'Dia de aniversário será um final de semana, data sugerida no dia útil subsequente')
            .replace(/\[LINK GOOGLE FORMS\]/g, 'https://docs.google.com/forms/d/e/1FAIpQLSdVwQuOHxOWhFI7bRdQ3dWKoWBqk8qTRAWG5HekTMJzWO2gig/viewform?usp=pp_url&entry.1543887881=KAIO%20OLIVEIRA%20SERAPHIM&entry.767260361=7ab969df-0a05-4b9b-a44d-3bc177b0faa2&entry.1702966662=2025-12-22');
    };

    const months = [
        { v: 1, l: 'Janeiro' }, { v: 2, l: 'Fevereiro' }, { v: 3, l: 'Março' },
        { v: 4, l: 'Abril' }, { v: 5, l: 'Maio' }, { v: 6, l: 'Junho' },
        { v: 7, l: 'Julho' }, { v: 8, l: 'Agosto' }, { v: 9, l: 'Setembro' },
        { v: 10, l: 'Outubro' }, { v: 11, l: 'Novembro' }, { v: 12, l: 'Dezembro' }
    ];

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-12 mb-12">

            {/* Section: Templates */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <MessageSquare className="w-8 h-8 text-indigo-600" />
                    Modelos de Mensagem
                </h1>

                {/* Instructions / Tags */}
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-6">
                    <strong className="flex items-center gap-2 mb-2 text-indigo-900 text-sm">
                        <AlertCircle size={16} /> Instruções de Uso
                    </strong>
                    <p className="text-xs text-indigo-800 mb-3">
                        Utilize as tags abaixo para personalizar suas mensagens. Elas serão substituídas automaticamente pelos dados reais no momento do envio.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs font-mono font-medium text-indigo-700">
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[NOME PROFISSIONAL]</span>
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[DATA DAY-OFF]</span>
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[REGRA APLICADA]</span>
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[LINK GOOGLE FORMS]</span>
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[NOME SUPERVISOR]</span>
                        <span className="bg-white px-2 py-1 rounded border border-indigo-200 block text-center select-all cursor-pointer hover:bg-indigo-100" title="Clique para copiar">[DATA ANIVERSARIO]</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* WhatsApp Template */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-full">
                        <div className="flex items-center gap-2 mb-4 text-green-600 font-bold border-b pb-2">
                            <MessageSquare size={20} /> Template WhatsApp
                        </div>
                        <textarea
                            className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none mb-4"
                            value={templates.TEMPLATE_WHATSAPP}
                            onChange={e => setTemplates({ ...templates, TEMPLATE_WHATSAPP: e.target.value })}
                            placeholder="Ex: Olá [NOME SUPERVISOR], o colaborador [NOME PROFISSIONAL]..."
                        />
                        {/* Preview Box */}
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100 text-xs text-gray-700 mt-auto">
                            <span className="flex items-center gap-1 font-bold text-green-800 mb-1 text-[10px] uppercase">
                                <Eye size={12} /> Pré-visualização:
                            </span>
                            <div className="whitespace-pre-wrap">{getPreview(templates.TEMPLATE_WHATSAPP) || '...'}</div>
                        </div>
                    </div>

                    {/* Email Template */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-4 text-blue-600 font-bold border-b pb-2">
                            <Mail size={20} /> Template E-mail
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Assunto</label>
                                <input
                                    type="text"
                                    className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                    value={templates.TEMPLATE_EMAIL_SUBJECT}
                                    onChange={e => setTemplates({ ...templates, TEMPLATE_EMAIL_SUBJECT: e.target.value })}
                                />
                                <div className="bg-blue-50 px-3 py-2 rounded border border-blue-100 text-xs text-gray-600">
                                    <span className="font-bold text-blue-800">Preview:</span> {getPreview(templates.TEMPLATE_EMAIL_SUBJECT)}
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Corpo do E-mail</label>
                                <textarea
                                    className="w-full h-32 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none mb-2"
                                    value={templates.TEMPLATE_EMAIL_BODY}
                                    onChange={e => setTemplates({ ...templates, TEMPLATE_EMAIL_BODY: e.target.value })}
                                />
                                <div className="bg-blue-50 p-3 rounded border border-blue-100 text-xs text-gray-600 whitespace-pre-wrap">
                                    <span className="font-bold text-blue-800 block mb-1">Preview Corpo:</span>
                                    {getPreview(templates.TEMPLATE_EMAIL_BODY)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Save Button */}
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleSaveTemplates}
                        disabled={loadingTemplates}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-md transition-all whitespace-nowrap"
                    >
                        <Save size={18} /> Salvar Modelos
                    </button>
                </div>
            </div>


            <hr className="border-gray-200" />


            {/* Section: Feriados */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                    Feriados e Datas
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Card: Adicionar Feriado */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700">Adicionar Data Recorrente</h2>
                        <form onSubmit={handleAddHoliday} className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-1/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Dia</label>
                                    <input
                                        type="number"
                                        min="1" max="31"
                                        required
                                        placeholder="DD"
                                        value={newDay}
                                        onChange={(e) => setNewDay(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
                                    <select
                                        required
                                        value={newMonth}
                                        onChange={(e) => setNewMonth(e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    >
                                        <option value="">Selecione...</option>
                                        {months.map(m => (
                                            <option key={m.v} value={m.v}>{m.l}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <input
                                    type="text"
                                    placeholder="Ex: Natal"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-800 hover:bg-gray-900 text-white py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                <Plus size={18} /> Adicionar Data
                            </button>
                        </form>
                    </div>

                    {/* Card: Lista de Feriados */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col h-[350px]">
                        <h2 className="text-lg font-semibold mb-4 text-gray-700">Datas Cadastradas</h2>
                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                            {holidays.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                    <Calendar size={32} className="opacity-20 mb-2" />
                                    <p>Nenhuma data cadastrada.</p>
                                </div>
                            ) : (
                                holidays.map((h) => (
                                    <div key={h.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border border-gray-100 hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-center gap-3">
                                            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded">
                                                {String(h.dia).padStart(2, '0')}/{String(h.mes).padStart(2, '0')}
                                            </span>
                                            <span className="text-gray-700 text-sm font-medium">{h.descricao}</span>
                                        </div>
                                        <button
                                            onClick={() => handleDeleteHoliday(h.id)}
                                            className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
