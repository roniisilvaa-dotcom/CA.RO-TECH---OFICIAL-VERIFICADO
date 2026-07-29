import React, { useState } from 'react';
import {
  Bot,
  Building2,
  Check,
  Copy,
  Globe,
  LogOut,
  UserCheck,
} from 'lucide-react';
import { Empresa, UsuarioPainel } from '../types';

interface HeaderProps {
  usuario: UsuarioPainel;
  empresaAtiva: Empresa;
  empresas: Empresa[];
  onSelectEmpresa: (empresaId: string) => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  usuario,
  empresaAtiva,
  empresas,
  onSelectEmpresa,
  onLogout,
}) => {
  const [copied, setCopied] = useState(false);
  const webhookUrl = typeof window !== 'undefined' ? `${window.location.origin}/api/webhook` : '/api/webhook';

  const copyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRoleBadge = (perfil: string) => {
    switch (perfil) {
      case 'SUPER_ADMIN':
        return <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold gold-glow">SUPER ADMIN</span>;
      case 'CLIENTE_ADMIN':
        return <span className="bg-slate-800/90 text-slate-200 border border-slate-700 text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">GESTOR EMPRESA</span>;
      default:
        return <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-semibold">ATENDENTE</span>;
    }
  };

  return (
    <header className="bg-[#080F1D]/90 border-b border-[#D4AF37]/25 text-[#F8FAFC] sticky top-0 z-40 shadow-xl backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl border border-[#D4AF37] bg-gradient-to-br from-[#0E182A] to-[#15243F] text-[#D4AF37] flex items-center justify-center font-serif text-xl font-bold gold-glow shadow-lg transition-transform hover:scale-105">
            CA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-extrabold text-2xl tracking-tight gold-gradient-text">CA.RO</span>
              <span className="bg-[#D4AF37]/15 text-[#D4AF37] text-[9px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-[0.18em] border border-[#D4AF37]/40">
                Sistemas & IA
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5 font-sans font-medium">
              <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
              Secretárias Virtuais por <strong className="text-[#F8FAFC]">Camila & Roni</strong>
            </p>
          </div>
        </div>

        <div className="hidden lg:flex items-center bg-[#0E182A]/80 rounded-xl border border-[#D4AF37]/25 px-3 py-1.5 text-xs text-[#E2E8F0] shadow-inner">
          <Globe className="w-3.5 h-3.5 text-[#D4AF37] mr-2 shrink-0 animate-pulse" />
          <span className="text-[#D4AF37] uppercase tracking-wider text-[10px] font-bold mr-2">Webhook Meta:</span>
          <code className="text-[#F8FAFC] font-mono font-medium truncate max-w-[220px]">{webhookUrl}</code>
          <button onClick={copyWebhook} className="ml-2.5 p-1 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#15243F] transition" title="Copiar URL do Webhook Meta">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {usuario.perfil === 'SUPER_ADMIN' && empresas.length > 0 && (
            <div className="flex items-center bg-[#0E182A]/90 rounded-xl border border-[#D4AF37]/30 px-3 py-1.5 text-xs shadow-sm">
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37] mr-2 shrink-0" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-wider font-bold mr-1.5 hidden sm:inline">Empresa:</span>
              <select
                value={empresaAtiva?.id || ''}
                onChange={(e) => onSelectEmpresa(e.target.value)}
                className="bg-transparent text-[#F8FAFC] font-semibold focus:outline-none cursor-pointer text-xs"
              >
                {empresas.map((emp) => (
                  <option key={emp.id} value={emp.id} className="bg-[#0E182A] text-[#F8FAFC]">
                    {emp.nome} {emp.id === 'emp_carotech' ? '(Interno)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2.5 bg-[#0E182A]/90 rounded-xl border border-[#D4AF37]/30 p-1.5 pr-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold text-xs font-serif shadow-xs">
              {usuario.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#F8FAFC] leading-tight">{usuario.nome}</p>
              <div className="mt-0.5">{getRoleBadge(usuario.perfil)}</div>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="bg-[#0E182A]/90 hover:bg-[#15243F] text-[#F8FAFC] text-xs px-3 py-1.5 rounded-xl border border-[#D4AF37]/35 flex items-center space-x-1.5 font-medium transition shadow-sm"
            title="Sair da conta"
          >
            <LogOut className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden sm:inline uppercase text-[10px] tracking-wider font-bold">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
