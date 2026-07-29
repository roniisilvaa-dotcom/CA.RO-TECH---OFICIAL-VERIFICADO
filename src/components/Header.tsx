import React, { useState } from 'react';
import {
  Bot,
  Building2,
  Check,
  Copy,
  Globe,
  LogOut,
  ShieldAlert,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Empresa, UsuarioPainel } from '../types';

interface HeaderProps {
  usuario: UsuarioPainel;
  empresaAtiva: Empresa;
  empresas: Empresa[];
  onSelectEmpresa: (empresaId: string) => void;
  onQuickLogin: (email: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  usuario,
  empresaAtiva,
  empresas,
  onSelectEmpresa,
  onQuickLogin,
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
        {/* Brand Logo Header */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl border border-[#D4AF37] bg-gradient-to-br from-[#0E182A] to-[#15243F] text-[#D4AF37] flex items-center justify-center font-serif text-xl font-bold gold-glow shadow-lg transition-transform hover:scale-105">
            CA
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-serif font-extrabold text-2xl tracking-tight gold-gradient-text">
                CA.RO
              </span>
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

        {/* Webhook Meta URL Box */}
        <div className="hidden lg:flex items-center bg-[#0E182A]/80 rounded-xl border border-[#D4AF37]/25 px-3 py-1.5 text-xs text-[#E2E8F0] shadow-inner">
          <Globe className="w-3.5 h-3.5 text-[#D4AF37] mr-2 shrink-0 animate-pulse" />
          <span className="text-[#D4AF37] uppercase tracking-wider text-[10px] font-bold mr-2">Webhook Meta:</span>
          <code className="text-[#F8FAFC] font-mono font-medium truncate max-w-[220px]">{webhookUrl}</code>
          <button
            onClick={copyWebhook}
            className="ml-2.5 p-1 rounded-lg text-[#94A3B8] hover:text-[#D4AF37] hover:bg-[#15243F] transition"
            title="Copiar URL do Webhook Meta"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Multi-Tenant Switcher & User Profile Controls */}
        <div className="flex items-center space-x-3">
          {/* Super Admin Tenant Impersonation Selector */}
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

          {/* User Badge */}
          <div className="flex items-center space-x-2.5 bg-[#0E182A]/90 rounded-xl border border-[#D4AF37]/30 p-1.5 pr-3 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold text-xs font-serif shadow-xs">
              {usuario.nome.substring(0, 2).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-[#F8FAFC] leading-tight">{usuario.nome}</p>
              <div className="mt-0.5">{getRoleBadge(usuario.perfil)}</div>
            </div>
          </div>

          {/* Quick Demo Login Preset Menu */}
          <div className="relative group">
            <button className="bg-[#0E182A]/90 hover:bg-[#15243F] text-[#F8FAFC] text-xs px-3 py-1.5 rounded-xl border border-[#D4AF37]/35 flex items-center space-x-1.5 font-medium transition shadow-sm hover:shadow-[#D4AF37]/20">
              <UserCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden sm:inline uppercase text-[10px] tracking-wider font-bold">Trocar Conta</span>
            </button>
            <div className="absolute right-0 mt-2 w-64 bg-[#0E182A] rounded-xl border border-[#D4AF37]/40 shadow-2xl p-2 hidden group-hover:block z-50 text-xs backdrop-blur-md">
              <div className="px-2 py-1.5 font-bold text-[#D4AF37] uppercase tracking-widest text-[9px] border-b border-[#D4AF37]/20 mb-1">
                Acesso Rápido para Testes
              </div>
              <button
                onClick={() => onQuickLogin('admin@carotech.com.br')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#15243F] text-[#F8FAFC] flex flex-col transition border-b border-[#D4AF37]/10"
              >
                <span className="font-bold text-[#D4AF37]">RONI SILVA (Super Admin CA.RO)</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">admin@carotech.com.br</span>
              </button>
              <button
                onClick={() => onQuickLogin('gestor@techstore.com.br')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#15243F] text-[#F8FAFC] flex flex-col transition border-b border-[#D4AF37]/10"
              >
                <span className="font-semibold text-slate-200">Lucas Silva (Gestor Tech Store)</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">gestor@techstore.com.br</span>
              </button>
              <button
                onClick={() => onQuickLogin('atendente@techstore.com.br')}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-[#15243F] text-[#F8FAFC] flex flex-col transition"
              >
                <span className="font-semibold text-emerald-400">Maria (Operadora Tech Store)</span>
                <span className="text-[10px] text-[#94A3B8] font-mono">atendente@techstore.com.br</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
