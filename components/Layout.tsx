
import React from 'react';
import { UserRole } from '../types';
import { LayoutDashboard, Users, FileText, Settings, LogOut, ShieldCheck } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: { name: string, role: UserRole };
  onLogout: () => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: [UserRole.ADMIN, UserRole.RH, UserRole.DELIVERY] },
    { id: 'candidates', label: 'Candidatos', icon: FileText, roles: [UserRole.ADMIN, UserRole.RH] },
    { id: 'users', label: 'Gestão de Usuários', icon: Users, roles: [UserRole.ADMIN] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold tracking-tight">SAPTA <span className="text-blue-400">AI</span></span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          {menuItems.filter(item => item.roles.includes(user.role)).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3 px-4 py-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold uppercase">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-slate-500">{user.role}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h1>
          <div className="flex items-center space-x-4">
             <span className="bg-blue-100 text-blue-700 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider">
               Ambiente LGPD Compliance
             </span>
          </div>
        </header>
        {children}
      </main>
    </div>
  );
};

export default Layout;
