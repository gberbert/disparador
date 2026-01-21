import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { appVersion } from './version';
import Upload from './components/Upload';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import People from './components/People';
import Supervisors from './components/Supervisors';
import Login from './components/Login';
import AdminPanel from './components/AdminPanel';
import { LayoutDashboard, UploadCloud, Menu, Settings as SettingsIcon, Users, LogOut, ShieldCheck, UserCheck } from 'lucide-react';

function App() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [debugRole, setDebugRole] = useState('Checking...');

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkUserRole(session.user.id);
      else setLoadingSession(false);
    });

    // 2. Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) checkUserRole(session.user.id);
      else {
        setIsAdmin(false);
        setLoadingSession(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserRole = async (userId) => {
    // console.log("Fazendo fetch do role para:", userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) console.error("Erro role:", error);

    // Debug info
    setDebugRole(data ? data.role : (error ? error.message : 'null'));

    if (data?.role === 'admin') {
      setIsAdmin(true);
    }
    setLoadingSession(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setActiveTab('dashboard');
  };

  if (loadingSession) {
    return <div className="flex h-screen items-center justify-center bg-gray-100 text-gray-500">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto mb-2"></div>
        Carregando Sessão...
      </div>
    </div>;
  }

  if (!session) {
    return <Login onLoginSuccess={() => { }} />;
  }

  const NavItem = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => { setActiveTab(tab); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${activeTab === tab
        ? 'bg-indigo-600 text-white shadow-lg'
        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
        }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
      {tab === 'admin' && (
        <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 rounded font-bold">ADM</span>
      )}
    </button>
  );

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        flex flex-col shadow-2xl md:shadow-none
      `}>
        <div className="p-6 relative">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Day-Off Manager
          </h1>
          <p className="text-gray-500 text-sm mt-1 truncate" title={session.user.email}>{session.user.email}</p>

          {/* Close Button Mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-gray-500 hover:text-white md:hidden"
          >
            <Menu size={20} className="transform rotate-90" /> {/* Simulating X or close with rotation if needed, or better use X Icon */}
          </button>
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <NavItem tab="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem tab="people" icon={Users} label="Profissionais" />
          <NavItem tab="supervisors" icon={UserCheck} label="Supervisores" />
          <NavItem tab="upload" icon={UploadCloud} label="Importar" />
          <NavItem tab="settings" icon={SettingsIcon} label="Configurações" />

          {isAdmin && (
            <>
              <div className="my-4 border-t border-gray-800"></div>
              <NavItem tab="admin" icon={ShieldCheck} label="Aprovações" />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-900/20 hover:text-red-300 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>

        <div className="p-6 pt-2 text-xs text-gray-600 flex justify-between items-center">
          <span>&copy; 2024 Antigravity</span>
          <div className="text-right">
            <span className="opacity-40 font-mono block">v{appVersion}</span>
            <span className="opacity-30 font-mono text-[10px] block text-yellow-500">
              DB-Role: {String(debugRole)}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative w-full">
        {/* Mobile Header */}
        <header className="bg-white shadow-sm md:hidden p-4 flex items-center justify-between sticky top-0 z-30">
          <h2 className="font-bold text-gray-800">Day-Off Manager</h2>
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-md">
            <Menu size={24} />
          </button>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === 'dashboard' && <div className="animate-fade-in-up"><Dashboard /></div>}
          {activeTab === 'people' && <div className="animate-fade-in-up"><People /></div>}
          {activeTab === 'supervisors' && <div className="animate-fade-in-up"><Supervisors /></div>}
          {activeTab === 'upload' && <div className="animate-fade-in-up"><Upload /></div>}
          {activeTab === 'settings' && <div className="animate-fade-in-up"><Settings /></div>}
          {activeTab === 'admin' && isAdmin && <div className="animate-fade-in-up"><AdminPanel /></div>}
        </div>
      </main>
    </div>
  );
}

export default App;
