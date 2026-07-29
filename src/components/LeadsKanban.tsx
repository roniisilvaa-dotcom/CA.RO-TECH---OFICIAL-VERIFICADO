import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Kanban as KanbanIcon,
  Plus,
  Trash2,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';
import { EtapaFunil, Lead } from '../types';

interface LeadsKanbanProps {
  empresaId: string;
}

export const LeadsKanban: React.FC<LeadsKanbanProps> = ({ empresaId }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Lead Form State
  const [nomeContato, setNomeContato] = useState('');
  const [telefone, setTelefone] = useState('');
  const [etapaFunil, setEtapaFunil] = useState<EtapaFunil>('novo');
  const [valorEstimado, setValorEstimado] = useState('2000');
  const [observacoes, setObservacoes] = useState('');

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/leads', {
        headers: { 'x-empresa-id': empresaId },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setLeads(data);
      }
    } catch (err) {
      console.error('Erro ao carregar leads:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [empresaId]);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefone.trim()) return;

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({
          nomeContato,
          telefoneContato: telefone,
          etapaFunil,
          valorEstimado,
          observacoes,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNomeContato('');
        setTelefone('');
        setObservacoes('');
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    }
  };

  const handleMoveStage = async (leadId: string, novaEtapa: EtapaFunil) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({ etapaFunil: novaEtapa }),
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao mover lead:', err);
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'DELETE',
        headers: { 'x-empresa-id': empresaId },
      });
      if (res.ok) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Erro ao deletar lead:', err);
    }
  };

  const colunas: { id: EtapaFunil; titulo: string; cor: string; badgeCor: string; icon: any }[] = [
    {
      id: 'novo',
      titulo: 'Novo Lead',
      cor: 'border-[#C5A059]/20 bg-[#111C33]',
      badgeCor: 'bg-[#162442] text-[#F1F5F9] border-[#C5A059]/30',
      icon: Clock,
    },
    {
      id: 'em_negociacao',
      titulo: 'Em Negociação',
      cor: 'border-[#C5A059]/35 bg-[#111C33]',
      badgeCor: 'bg-[#C5A059]/20 text-[#D4AF37] border-[#C5A059]/40',
      icon: KanbanIcon,
    },
    {
      id: 'ganho',
      titulo: 'Ganho / Venda Fechada',
      cor: 'border-emerald-700/40 bg-[#111C33]',
      badgeCor: 'bg-emerald-950/80 text-emerald-300 border-emerald-700/50',
      icon: CheckCircle2,
    },
    {
      id: 'perdido',
      titulo: 'Perdido / Desistiu',
      cor: 'border-slate-800 bg-[#111C33]',
      badgeCor: 'bg-slate-800 text-slate-400 border-slate-700',
      icon: XCircle,
    },
  ];

  const formatBRL = (val?: number) => {
    if (!val) return 'R$ 0,00';
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F1F5F9] flex items-center gap-2">
            <KanbanIcon className="w-5 h-5 text-[#C5A059]" />
            Funil de Vendas e CRM de Leads
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Gerencie os clientes capturados pela secretária virtual ao longo do funil de vendas.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md hover:shadow-[#D4AF37]/20"
        >
          <Plus className="w-4 h-4 text-[#050B14]" />
          <span>Novo Lead Manual</span>
        </button>
      </div>

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {colunas.map((col) => {
          const leadsDaColuna = leads.filter((l) => l.etapaFunil === col.id);
          const totalValor = leadsDaColuna.reduce((sum, l) => sum + (l.valorEstimado || 0), 0);
          const IconComp = col.icon;

          return (
            <div
              key={col.id}
              className={`border border-[#D4AF37]/25 rounded-2xl p-4 flex flex-col min-h-[500px] shadow-2xl backdrop-blur-md bg-[#0E182A]/90`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#D4AF37]/20">
                <div className="flex items-center space-x-2">
                  <IconComp className="w-4 h-4 text-[#D4AF37]" />
                  <span className="font-serif font-bold text-xs text-[#F8FAFC]">{col.titulo}</span>
                  <span className={`text-[9px] px-2.5 py-0.5 font-bold uppercase tracking-wider border rounded-full ${col.badgeCor}`}>
                    {leadsDaColuna.length}
                  </span>
                </div>
                <span className="text-[11px] font-mono font-bold text-[#D4AF37]">{formatBRL(totalValor)}</span>
              </div>

              {/* Cards List */}
              <div className="flex-1 space-y-3 overflow-y-auto scrollbar-thin">
                {leadsDaColuna.length === 0 ? (
                  <div className="text-center text-[#94A3B8] text-xs py-10 font-sans">Sem leads nesta etapa.</div>
                ) : (
                  leadsDaColuna.map((lead) => {
                    const nome = lead.contato?.nome || 'Cliente sem nome';
                    const fone = lead.contato?.telefone || '';

                    return (
                      <div
                        key={lead.id}
                        className="bg-[#15243F]/90 rounded-xl border border-[#D4AF37]/20 hover:border-[#D4AF37]/50 p-3.5 transition group shadow-md hover:shadow-lg"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold font-serif text-[#F8FAFC] text-xs flex items-center gap-1">
                              <User className="w-3 h-3 text-[#D4AF37]" /> {nome}
                            </p>
                            <p className="text-[10px] text-[#94A3B8] font-mono flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#94A3B8]/60" /> +{fone}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1 rounded-lg text-[#94A3B8]/50 hover:text-rose-400 hover:bg-[#0E182A] transition"
                            title="Excluir Lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {lead.observacoes && (
                          <p className="text-[11px] text-[#E2E8F0] bg-[#080F1D] p-2.5 rounded-lg mb-2.5 line-clamp-2 border border-[#D4AF37]/15 font-sans">
                            {lead.observacoes}
                          </p>
                        )}

                        <div className="flex items-center justify-between border-t border-[#D4AF37]/15 pt-2.5">
                          <span className="text-xs font-bold font-mono text-[#D4AF37] flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-[#D4AF37]" />
                            {formatBRL(lead.valorEstimado)}
                          </span>

                          {/* Move Stage Selector */}
                          <select
                            value={lead.etapaFunil}
                            onChange={(e) => handleMoveStage(lead.id, e.target.value as EtapaFunil)}
                            className="bg-[#0E182A] text-[#F8FAFC] border border-[#D4AF37]/30 rounded-lg text-[10px] px-2 py-1 font-medium uppercase tracking-wider focus:outline-none cursor-pointer"
                          >
                            <option value="novo">Novo</option>
                            <option value="em_negociacao">Em Negociação</option>
                            <option value="ganho">Ganho</option>
                            <option value="perdido">Perdido</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Lead Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#050B14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E182A] border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-serif font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#D4AF37]" /> Adicionar Lead ao Funil
            </h2>

            <form onSubmit={handleCreateLead} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nome do Contato:</label>
                <input
                  type="text"
                  value={nomeContato}
                  onChange={(e) => setNomeContato(e.target.value)}
                  placeholder="Ex: João Pereira"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Telefone WhatsApp (DDD + Número):</label>
                <input
                  type="text"
                  value={telefone}
                  onChange={(e) => setTelefone(e.target.value)}
                  placeholder="5511999998888"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Etapa do Funil:</label>
                <select
                  value={etapaFunil}
                  onChange={(e) => setEtapaFunil(e.target.value as EtapaFunil)}
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="novo">Novo Lead</option>
                  <option value="em_negociacao">Em Negociação</option>
                  <option value="ganho">Ganho / Venda Fechada</option>
                  <option value="perdido">Perdido</option>
                </select>
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Valor Estimado (R$):</label>
                <input
                  type="number"
                  value={valorEstimado}
                  onChange={(e) => setValorEstimado(e.target.value)}
                  placeholder="2000"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37] font-mono"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Observações:</label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Detalhes do orçamento ou produtos de interesse..."
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl p-3 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-[#F8FAFC] uppercase tracking-wider text-[10px] font-semibold hover:bg-[#15243F] transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050B14] font-bold uppercase tracking-wider text-[10px] hover:bg-[#F3E5AB] transition shadow-md"
                >
                  Salvar Lead
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
