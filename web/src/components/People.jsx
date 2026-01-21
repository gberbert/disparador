import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Trash2, Edit2, Plus, X, Save, Phone, Mail, User, Briefcase, Calendar } from 'lucide-react';

export default function People() {
    const [people, setPeople] = useState([]);
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null); // ID ou null
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        nome: '',
        whatsapp: '',
        data_nascimento: '',
        email: '',
        empresa: '',
        supervisor_id: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        // Fetch Profissionais
        const { data: pros } = await supabase
            .from('profissionais')
            .select(`*, supervisores (id, nome, email)`)
            .order('nome');
        if (pros) setPeople(pros);

        // Fetch Supervisores para Dropdown
        const { data: sups } = await supabase
            .from('supervisores')
            .select('*')
            .order('nome');
        if (sups) setSupervisors(sups);

        setLoading(false);
    };

    const handleCreate = () => {
        setFormData({ nome: '', whatsapp: '', data_nascimento: '', email: '', empresa: '', supervisor_id: '' });
        setEditing(null);
        setIsCreating(true);
    };

    const handleEdit = (p) => {
        setFormData({
            nome: p.nome,
            whatsapp: p.whatsapp,
            data_nascimento: p.data_nascimento,
            email: p.email || '',
            empresa: p.empresa || '',
            supervisor_id: p.supervisor_id || ''
        });
        setEditing(p.id);
        setIsCreating(true); // Abre o modal/form
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza? Isso excluirá o profissional.')) return;
        const { error } = await supabase.from('profissionais').delete().eq('id', id);
        if (!error) fetchData();
        else alert('Erro ao excluir: ' + error.message);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            supervisor_id: formData.supervisor_id || null // Trata vazio como null
        };

        let error;
        if (editing) {
            // Update
            const { error: err } = await supabase
                .from('profissionais')
                .update(payload)
                .eq('id', editing);
            error = err;
        } else {
            // Create
            const { error: err } = await supabase
                .from('profissionais')
                .insert(payload);
            error = err;
        }

        if (error) {
            alert('Erro ao salvar: ' + error.message);
        } else {
            setIsCreating(false);
            setEditing(null);
            fetchData();
        }
        setLoading(false);
    };

    // Filter Logic
    const filteredPeople = people.filter(p =>
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.supervisores?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPhone = (phone) => {
        if (!phone) return '-';
        const p = phone.replace(/\D/g, '');
        if (p.length > 11) return p;
        if (p.length === 13) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 9)}-${p.slice(9)}`;
        if (p.length === 12) return `+${p.slice(0, 2)} (${p.slice(2, 4)}) ${p.slice(4, 8)}-${p.slice(8)}`;
        if (p.length === 11) return `(${p.slice(0, 2)}) ${p.slice(2, 7)}-${p.slice(7)}`;
        return phone;
    };

    const cleanPhone = (val) => val.replace(/\D/g, '');

    const getInitials = (name) => {
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    const getRandomColor = (name) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Profissionais
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Gerencie sua equipe e supervisores</p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-sm transition-shadow hover:shadow-md"
                        />
                        <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-lg flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
                    >
                        <Plus size={20} /> <span className="">Novo</span>
                    </button>
                </div>
            </div>

            {loading && !isCreating && <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}

            {/* List and Table */}
            {!isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

                    {/* MOBILE CARDS */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filteredPeople.map((p) => (
                            <div key={p.id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getRandomColor(p.nome)}`}>
                                            {getInitials(p.nome)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{p.nome}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Briefcase size={10} /> {p.empresa || 'Empresa não inf.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(p)} className="p-2 text-indigo-600 bg-indigo-50 rounded-full"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 bg-red-50 rounded-full"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="bg-gray-50 p-2 rounded flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Contato</span>
                                        <a href={`https://wa.me/${p.whatsapp}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-green-700 font-medium">
                                            <Phone size={12} /> {formatPhone(p.whatsapp)}
                                        </a>
                                        {p.email && (
                                            <span className="flex items-center gap-1.5 text-gray-600 text-xs truncate">
                                                <Mail size={12} /> {p.email}
                                            </span>
                                        )}
                                    </div>
                                    <div className="bg-gray-50 p-2 rounded flex flex-col gap-1">
                                        <span className="text-[10px] text-gray-400 font-bold uppercase">Supervisor</span>
                                        {p.supervisores ? (
                                            <>
                                                <span className="flex items-center gap-1.5 text-gray-800 font-medium">
                                                    <User size={12} /> {p.supervisores.nome.split(' ')[0]}
                                                </span>
                                                <span className='text-xs text-gray-500 truncate'>{p.supervisores.email}</span>
                                            </>
                                        ) : <span className="text-gray-400 italic text-xs">Sem supervisor</span>}
                                    </div>
                                </div>
                                {p.data_nascimento && (
                                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded w-fit">
                                        <Calendar size={12} />
                                        Aniversário: <strong>{new Date(p.data_nascimento).toLocaleDateString()}</strong>
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredPeople.length === 0 && !loading && (
                            <div className="p-8 text-center text-gray-400">
                                <Users size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhum profissional</p>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-[#f8fafc]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Profissional</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Aniversário</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Supervisor</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filteredPeople.map((p) => (
                                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getRandomColor(p.nome)}`}>
                                                    {getInitials(p.nome)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{p.nome}</div>
                                                    <div className="text-xs text-gray-500 font-medium bg-gray-100 inline-block px-2 py-0.5 rounded mt-0.5">{p.empresa || 'Não informado'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-medium">{formatPhone(p.whatsapp)}</div>
                                            {p.email && <div className="text-xs text-indigo-500 hover:underline cursor-pointer" title={p.email}>{p.email.length > 25 ? p.email.substring(0, 25) + '...' : p.email}</div>}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600 bg-gray-50 px-3 py-1 rounded border border-gray-100 inline-block">
                                                {p.data_nascimento ? new Date(p.data_nascimento).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {p.supervisores ? (
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">{p.supervisores.nome}</span>
                                                    {p.supervisores.email && <span className="text-xs text-gray-500">{p.supervisores.email}</span>}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Sem supervisor</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filteredPeople.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Users size={48} className="mb-4 opacity-20" />
                                                <p>Nenhum profissional encontrado.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {isCreating && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Profissional' : 'Novo Profissional'}</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data_nascimento}
                                        onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp (com DDD)</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="5511999999999"
                                        value={formData.whatsapp}
                                        onChange={e => setFormData({ ...formData, whatsapp: cleanPhone(e.target.value) })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                    <input
                                        type="text"
                                        value={formData.empresa}
                                        onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                                <select
                                    value={formData.supervisor_id}
                                    onChange={e => {
                                        const supId = e.target.value;
                                        const selectedSup = supervisors.find(s => s.id === supId);
                                        setFormData(prev => ({
                                            ...prev,
                                            supervisor_id: supId,
                                            empresa: selectedSup ? selectedSup.empresa : prev.empresa
                                        }));
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                                >
                                    <option value="">Selecione um supervisor...</option>
                                    {supervisors.map(s => (
                                        <option key={s.id} value={s.id}>{s.nome}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">
                                    Ao selecionar um supervisor, a empresa será preenchida automaticamente.
                                </p>
                            </div>

                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsCreating(false)}
                                    className="text-gray-600 hover:text-gray-800 px-4 py-2"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg shadow flex items-center gap-2"
                                >
                                    <Save size={18} /> {editing ? 'Atualizar' : 'Salvar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
