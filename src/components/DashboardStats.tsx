import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Bot,
  Building2,
  DollarSign,
  Kanban,
  MessageSquare,
  PhoneCall,
  TrendingUp,
  UserCheck,
  Zap,
} from 'lucide-react';
import { Empresa, UsuarioPainel } from '../types';

interface DashboardStatsProps {
  empresaId: string;
  usuario: UsuarioPainel;
  empresaAtiva?: Empresa;
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({
  empresaId,
  usuario,
  empresaAtiva,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdminGlobal = usuario.perfil === 'SUPER_ADMIN' && empresaId === 'emp_carotech';

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/stats', {
        headers: { 'x-empresa-id': empresaId },
      });
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Erro ao buscar estatisticas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [empresaId]);

  if (loading || !stats) {
    return <div className="p-8 text-center text-slate-500 text-xs">Carregando métricas em tempo real...</div>;
  }

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#D4AF37]" />
          Métricas e Desempenho {isSuperAdminGlobal ? 'Global CA.RO' : `- ${empresaAtiva?.nome}`}
        </h1>
        <p className="text-xs text-[#94A3B8] font-sans mt-0.5">Visão analítica em tempo real de mensagens, conversões e eficácia da inteligência artificial.</p>
      </div>

      {isSuperAdminGlobal ? (
        /* SUPER ADMIN GLOBAL CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Empresas Clientes</span>
              <Building2 className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.totalEmpresasAtivas}</p>
            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Tenants Ativos no SaaS</span>
          </div>

          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Números Meta Conectados</span>
              <PhoneCall className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.totalNumerosConectados}</p>
            <span className="text-[10px] text-[#94A3B8] font-mono">Meta Cloud API v20</span>
          </div>

          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Total Mensagens Trocadas</span>
              <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.totalMensagensMes}</p>
            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Mensagens Atendidas</span>
          </div>

          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Total Leads Gerados</span>
              <Kanban className="w-4 h-4 text-[#D4AF37]" />
            </div>
            <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.totalLeadsGerados}</p>
            <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Capturados no Zap</span>
          </div>
        </div>
      ) : (
        /* CLIENT TENANT METRICS CARDS */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Atendidos por IA</span>
                <Bot className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.conversasIA}</p>
              <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Respostas Automáticas</span>
            </div>

            <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Transbordo Humano</span>
                <UserCheck className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-3xl font-serif font-bold text-[#F8FAFC]">{stats.conversasHumano}</p>
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider">Transferidos p/ Atendente</span>
            </div>

            <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Total de Leads</span>
                <Kanban className="w-4 h-4 text-[#D4AF37]" />
              </div>
              <p className="text-3xl font-serif font-bold gold-gradient-text">{stats.totalLeads}</p>
              <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-wider">Oportunidades de Negócio</span>
            </div>

            <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase tracking-wider font-bold text-[#94A3B8]">Pipeline de Vendas</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-bold text-[#F8FAFC]">{formatBRL(stats.valorTotalLeads)}</p>
              <span className="text-[10px] text-[#94A3B8] font-sans">Valor Estimado em Negociação</span>
            </div>
          </div>

          {/* Funnel Breakdown Progress */}
          {stats.leadsPorEtapa && (
            <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-6 shadow-2xl backdrop-blur-md">
              <h2 className="text-sm font-serif font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" /> Distribuição do Funil de Leads
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#15243F] p-4 rounded-xl border border-[#D4AF37]/20">
                  <span className="text-[10px] uppercase tracking-wider text-[#94A3B8] font-bold block mb-1">Novo Lead</span>
                  <p className="text-2xl font-mono font-bold text-[#F8FAFC]">{stats.leadsPorEtapa.novo}</p>
                </div>
                <div className="bg-[#15243F] p-4 rounded-xl border border-[#D4AF37]/30">
                  <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-bold block mb-1">Em Negociação</span>
                  <p className="text-2xl font-mono font-bold text-[#D4AF37]">{stats.leadsPorEtapa.em_negociacao}</p>
                </div>
                <div className="bg-[#15243F] p-4 rounded-xl border border-emerald-700/40">
                  <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold block mb-1">Vendas Ganhas</span>
                  <p className="text-2xl font-mono font-bold text-emerald-400">{stats.leadsPorEtapa.ganho}</p>
                </div>
                <div className="bg-[#15243F] p-4 rounded-xl border border-slate-700">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block mb-1">Perdidos</span>
                  <p className="text-2xl font-mono font-bold text-slate-400">{stats.leadsPorEtapa.perdido}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
