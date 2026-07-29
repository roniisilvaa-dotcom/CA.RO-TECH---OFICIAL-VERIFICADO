import React, { useState } from 'react';
import {
  Building2,
  CheckCircle,
  Plus,
  Shield,
  Trash2,
  XCircle,
  Eye,
  CreditCard,
  Mail,
} from 'lucide-react';
import { Empresa } from '../types';

interface AdminEmpresasProps {
  empresas: Empresa[];
  onRefresh: () => void;
  onSelectEmpresa: (empresaId: string) => void;
}

export const AdminEmpresas: React.FC<AdminEmpresasProps> = ({
  empresas,
  onRefresh,
  onSelectEmpresa,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [nome, setNome] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [plano, setPlano] = useState<'padrao' | 'premium'>('padrao');
  const [emailAdmin, setEmailAdmin] = useState('');
  const [nomeAdmin, setNomeAdmin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateEmpresa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/admin/empresas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          cnpj,
          plano,
          emailAdmin,
          nomeAdmin,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNome('');
        setCnpj('');
        setEmailAdmin('');
        setNomeAdmin('');
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao criar empresa:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAtivo = async (empresaId: string, atualAtivo: boolean) => {
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ativo: !atualAtivo }),
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao alterar status:', err);
    }
  };

  const handleDelete = async (empresaId: string) => {
    if (!confirm('Tem certeza que deseja remover esta empresa cliente?')) return;
    try {
      const res = await fetch(`/api/admin/empresas/${empresaId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Erro ao deletar empresa:', err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#D4AF37]" />
            Gestão de Empresas Clientes (Tenants Multi-Tenant)
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Painel exclusivo da CA.RO TECH para cadastrar e gerenciar licenças de empresas no sistema.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md hover:shadow-[#D4AF37]/20"
        >
          <Plus className="w-4 h-4 text-[#050B14]" />
          <span>Cadastrar Nova Empresa</span>
        </button>
      </div>

      {/* Companies Table */}
      <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#080F1D] border-b border-[#D4AF37]/20 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
              <th className="p-4">Empresa / Cliente</th>
              <th className="p-4">CNPJ</th>
              <th className="p-4">Plano</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4AF37]/10 text-xs">
            {empresas.map((emp) => (
              <tr key={emp.id} className="hover:bg-[#15243F]/50 transition">
                <td className="p-4 font-bold text-[#F8FAFC] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold font-serif text-xs shadow-sm">
                    {emp.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-[#F8FAFC] font-serif font-bold">{emp.nome}</p>
                    <p className="text-[10px] text-[#94A3B8] font-mono">ID: {emp.id}</p>
                  </div>
                </td>
                <td className="p-4 text-[#94A3B8] font-mono">{emp.cnpj || 'Não informado'}</td>
                <td className="p-4">
                  {emp.plano === 'interno' ? (
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      Uso Interno
                    </span>
                  ) : emp.plano === 'premium' ? (
                    <span className="bg-[#D4AF37] text-[#050B14] border border-[#F3E5AB] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
                      Plano Premium (R$ 890/mês)
                    </span>
                  ) : (
                    <span className="bg-[#15243F] text-[#F8FAFC] border border-[#D4AF37]/30 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      Plano Padrão (R$ 490/mês)
                    </span>
                  )}
                </td>
                <td className="p-4">
                  {emp.ativo ? (
                    <button
                      onClick={() => handleToggleAtivo(emp.id, emp.ativo)}
                      className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 shadow-xs"
                    >
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Ativa
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleAtivo(emp.id, emp.ativo)}
                      className="bg-slate-800 text-slate-400 border border-slate-700 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"
                    >
                      <XCircle className="w-3 h-3 text-slate-500" /> Desativada
                    </button>
                  )}
                </td>
                <td className="p-4 text-right space-x-2">
                  <button
                    onClick={() => onSelectEmpresa(emp.id)}
                    className="bg-[#15243F] hover:bg-[#1a2e52] text-[#D4AF37] border border-[#D4AF37]/40 font-semibold px-3 py-1.5 rounded-xl uppercase text-[10px] tracking-wider transition inline-flex items-center gap-1 shadow-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Entrar no Painel</span>
                  </button>

                  {emp.plano !== 'interno' && (
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-[#15243F] transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Nova Empresa */}
      {showModal && (
        <div className="fixed inset-0 bg-[#050B14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E182A] border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-serif font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#D4AF37]" /> Cadastrar Empresa Cliente
            </h2>

            <form onSubmit={handleCreateEmpresa} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nome Fantasia da Empresa:</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Tech Store Celulares"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">CNPJ:</label>
                <input
                  type="text"
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  placeholder="12.345.678/0001-90"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Plano Comercial:</label>
                <select
                  value={plano}
                  onChange={(e) => setPlano(e.target.value as any)}
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="padrao">Padrão - R$ 490/mês</option>
                  <option value="premium">Premium com Consultoria - R$ 890/mês</option>
                </select>
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nome do Gestor/Admin Cliente:</label>
                <input
                  type="text"
                  value={nomeAdmin}
                  onChange={(e) => setNomeAdmin(e.target.value)}
                  placeholder="Ex: Lucas Silva"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">E-mail de Login do Gestor:</label>
                <input
                  type="email"
                  value={emailAdmin}
                  onChange={(e) => setEmailAdmin(e.target.value)}
                  placeholder="gestor@cliente.com.br"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
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
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-[#D4AF37] text-[#050B14] font-bold uppercase tracking-wider text-[10px] hover:bg-[#F3E5AB] transition shadow-md"
                >
                  {loading ? 'Cadastrando...' : 'Criar Empresa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
