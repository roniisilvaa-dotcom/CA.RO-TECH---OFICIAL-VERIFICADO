import React from 'react';
import {
  BarChart3,
  Bot,
  Building2,
  Kanban,
  MessageSquare,
  PhoneCall,
  Smartphone,
  Users,
} from 'lucide-react';
import { UsuarioPainel } from '../types';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  usuario: UsuarioPainel;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  usuario,
}) => {
  const isSuperAdmin = usuario.perfil === 'SUPER_ADMIN';
  const isOperador = usuario.perfil === 'CLIENTE_OPERADOR';

  return (
    <nav className="bg-[#080F1D] border-b border-[#D4AF37]/25 text-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2.5 scrollbar-none">
          <button
            onClick={() => setActiveTab('conversas')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
              activeTab === 'conversas'
                ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Conversas Ao Vivo</span>
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
              activeTab === 'leads'
                ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
            }`}
          >
            <Kanban className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Funil de Leads</span>
          </button>

          {!isOperador && (
            <button
              onClick={() => setActiveTab('config-ia')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
                activeTab === 'config-ia'
                  ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                  : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Configurar IA</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('simulador')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
              activeTab === 'simulador'
                ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Simulador WhatsApp</span>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
              activeTab === 'dashboard'
                ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('equipe')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
              activeTab === 'equipe'
                ? 'bg-[#15243F] text-[#D4AF37] border-[#D4AF37] gold-glow shadow-md shadow-[#D4AF37]/10'
                : 'bg-[#0E182A]/40 text-[#94A3B8] border-transparent hover:text-[#F8FAFC] hover:bg-[#0E182A]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Equipe</span>
          </button>

          {isSuperAdmin && (
            <div className="flex items-center pl-2 ml-2 border-l border-[#D4AF37]/30 space-x-2">
              <button
                onClick={() => setActiveTab('admin-empresas')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
                  activeTab === 'admin-empresas'
                    ? 'bg-[#D4AF37] text-[#050B14] border-[#F3E5AB] font-black gold-glow shadow-md shadow-[#D4AF37]/20'
                    : 'bg-[#0E182A] text-[#E2E8F0] border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#15243F]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Empresas (Tenants)</span>
              </button>

              <button
                onClick={() => setActiveTab('admin-numeros')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all duration-200 whitespace-nowrap border ${
                  activeTab === 'admin-numeros'
                    ? 'bg-[#D4AF37] text-[#050B14] border-[#F3E5AB] font-black gold-glow shadow-md shadow-[#D4AF37]/20'
                    : 'bg-[#0E182A] text-[#E2E8F0] border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#15243F]'
                }`}
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Números Meta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
