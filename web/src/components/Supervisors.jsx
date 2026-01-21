import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Users, Trash2, Edit2, Plus, X, Save, Building, Mail } from 'lucide-react';

export default function Supervisors() {
    const [supervisors, setSupervisors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editing, setEditing] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        nome: '',
        empresa: '',
        email: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('supervisores')
            .select('*')
            .order('nome');

        if (error) console.error('Erro ao buscar supervisores:', error);
        if (data) setSupervisors(data);
        setLoading(false);
    };

    const handleCreate = () => {
        setFormData({ nome: '', empresa: '', email: '' });
        setEditing(null);
        setIsCreating(true);
    };

    const handleEdit = (s) => {
        setFormData({
            nome: s.nome,
            empresa: s.empresa || '',
            email: s.email || ''
        });
        setEditing(s.id);
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Tem certeza? Supervisor será excluído.')) return;
        const { error } = await supabase.from('supervisores').delete().eq('id', id);
        if (!error) fetchData();
        else alert('Erro ao excluir: ' + error.message);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData };
        let error;

        if (editing) {
            const { error: err } = await supabase
                .from('supervisores')
                .update(payload)
                .eq('id', editing);
            error = err;
        } else {
            const { error: err } = await supabase
                .from('supervisores')
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

    const filtered = supervisors.filter(s =>
        s.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.empresa?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Helpers UI
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
            {/* Heather Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div className="w-full md:w-auto">
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <Users className="w-8 h-8 text-indigo-600" />
                        Supervisores
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm md:text-base">Gerencie seus gestores e empresas</p>
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
                        <Plus size={20} /> <span>Novo</span>
                    </button>
                </div>
            </div>

            {loading && !isCreating && <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>}

            {!isCreating && (
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">

                    {/* MOBILE CARDS */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {filtered.map((s) => (
                            <div key={s.id} className="p-4 flex flex-col gap-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getRandomColor(s.nome)}`}>
                                            {getInitials(s.nome)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 leading-tight">{s.nome}</h3>
                                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                                <Building size={10} /> {s.empresa || 'Empresa não inf.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => handleEdit(s)} className="p-2 text-indigo-600 bg-indigo-50 rounded-full"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(s.id)} className="p-2 text-red-500 bg-red-50 rounded-full"><Trash2 size={16} /></button>
                                    </div>
                                </div>

                                {s.email && (
                                    <div className="bg-gray-50 p-2 rounded flex items-center gap-2 text-sm text-gray-600">
                                        <Mail size={12} /> {s.email}
                                    </div>
                                )}
                            </div>
                        ))}
                        {filtered.length === 0 && !loading && (
                            <div className="p-8 text-center text-gray-400">
                                <Users size={32} className="mx-auto mb-2 opacity-20" />
                                <p>Nenhum supervisor encontrado</p>
                            </div>
                        )}
                    </div>

                    {/* DESKTOP TABLE */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead className="bg-[#f8fafc]">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Empresa</th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-50">
                                {filtered.map((s) => (
                                    <tr key={s.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getRandomColor(s.nome)}`}>
                                                    {getInitials(s.nome)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-gray-900">{s.nome}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 text-gray-600">
                                                <Building size={14} className="text-gray-400" />
                                                <span className="text-sm">{s.empresa || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {s.email || '-'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(s)}
                                                    className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-full transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(s.id)}
                                                    className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {filtered.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-gray-400">
                                                <Users size={48} className="mb-4 opacity-20" />
                                                <p>Nenhum supervisor encontrado.</p>
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
                            <h3 className="text-lg font-bold text-gray-800">{editing ? 'Editar Supervisor' : 'Novo Supervisor'}</h3>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <input
                                    required
                                    value={formData.nome}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                                <input
                                    value={formData.empresa}
                                    onChange={e => setFormData({ ...formData, empresa: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                    placeholder="Ex: ACME Corp"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(Opcional)</span></label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                />
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
