import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Lock, Mail, UserPlus, LogIn, AlertTriangle } from 'lucide-react';

export default function Login({ onLoginSuccess }) {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);
    const [msgType, setMsgType] = useState('error'); // 'error' | 'success' | 'warn'

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        try {
            if (isSignUp) {
                // SIGNUP
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                setMsgType('success');
                setMsg('Cadastro realizado! Aguarde a aprovação do Administrador.');
            } else {
                // LOGIN
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                // Check Profile Approval
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();

                if (profileError) {
                    // Se não achar perfil, tenta criar (fallback se trigger falhou ou user antigo)
                    console.log("Perfil não encontrado, verificando acesso...");
                }

                if (profile && !profile.approved) {
                    await supabase.auth.signOut();
                    setMsgType('warn');
                    setMsg('Seu login está pendente de aprovação pelo Administrador.');
                    return;
                }

                // Success
                onLoginSuccess();
            }
        } catch (err) {
            setMsgType('error');
            setMsg(err.message === 'Invalid login credentials' ? 'Email ou senha incorretos.' : err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
                <div className="text-center mb-8">
                    <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
                        {isSignUp ? <UserPlus size={32} /> : <Lock size={32} />}
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isSignUp ? 'Criar Conta' : 'Acesso Restrito'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Day-Off Manager</p>
                </div>

                {msg && (
                    <div className={`p-4 rounded-lg mb-6 text-sm flex items-start gap-2 ${msgType === 'error' ? 'bg-red-50 text-red-700 border border-red-100' :
                            msgType === 'success' ? 'bg-green-50 text-green-700 border border-green-100' :
                                'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                        <AlertTriangle size={16} className={`mt-0.5 min-w-[16px] ${msgType === 'success' ? 'text-green-500' : msgType === 'error' ? 'text-red-500' : 'text-yellow-500'
                            }`} />
                        <span>{msg}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="email"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
                            <input
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="••••••••"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md mt-4"
                    >
                        {loading ? 'Processando...' : isSignUp ? 'Solicitar Acesso' : 'Entrar no Sistema'}
                        {!loading && (isSignUp ? <UserPlus size={18} /> : <LogIn size={18} />)}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-500">
                    {isSignUp ? 'Já tem uma conta?' : 'Ainda não tem acesso?'}
                    <button
                        onClick={() => { setIsSignUp(!isSignUp); setMsg(null); }}
                        className="ml-2 text-indigo-600 font-bold hover:underline"
                    >
                        {isSignUp ? 'Fazer Login' : 'Cadastre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
}
