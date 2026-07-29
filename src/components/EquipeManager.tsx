import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { UsuarioPainel } from '../types';

interface EquipeManagerProps {
  empresaId: string;
  usuarioAtual: UsuarioPainel;
}

export const EquipeManager: React.FC<EquipeManagerProps> = ({ empresaId, usuarioAtual }) => {
  const [equipe, setEquipe] = useState<UsuarioPainel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [perfil, setPerfil] = useState<'CLIENTE_OPERADOR' | 'CLIENTE_ADMIN'>('CLIENTE_OPERADOR');

  const fetchEquipe = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/equipe', {
        headers: { 'x-empresa-id': empresaId },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setEquipe(data);
      }
    } catch (err) {
      console.error('Erro ao carregar equipe:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipe();
  }, [empresaId]);

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim()) return;

    try {
      const res = await fetch('/api/equipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({
          nome,
          email,
          perfil,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setNome('');
        setEmail('');
        fetchEquipe();
      }
    } catch (err) {
      console.error('Erro ao convidar operador:', err);
    }
  };

  const isOperador = usuarioAtual.perfil === 'CLIENTE_OPERADOR';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#D4AF37]" />
            Gestão de Atendentes da Equipe
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Atendentes cadastrados que podem assumir conversas no WhatsApp quando houver transbordo humano.
          </p>
        </div>

        {!isOperador && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md hover:shadow-[#D4AF37]/20"
          >
            <UserPlus className="w-4 h-4 text-[#050B14]" />
            <span>Convidar Novo Atendente</span>
          </button>
        )}
      </div>

      {/* Operators List */}
      <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#080F1D] border-b border-[#D4AF37]/20 text-[10px] font-bold text-[#D4AF37] uppercase tracking-wider">
              <th className="p-4">Nome do Atendente</th>
              <th className="p-4">E-mail de Acesso</th>
              <th className="p-4">Perfil</th>
              <th className="p-4">Data de Cadastro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D4AF37]/10 text-xs">
            {equipe.map((usr) => (
              <tr key={usr.id} className="hover:bg-[#15243F]/50 transition">
                <td className="p-4 font-bold text-[#F8FAFC] flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold font-serif text-xs shadow-sm">
                    {usr.nome.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-serif font-bold text-[#F8FAFC]">{usr.nome}</span>
                </td>
                <td className="p-4 text-[#94A3B8] font-mono flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#D4AF37]/70" />
                  {usr.email}
                </td>
                <td className="p-4">
                  {usr.perfil === 'SUPER_ADMIN' ? (
                    <span className="bg-[#D4AF37] text-[#050B14] border border-[#F3E5AB] px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
                      SUPER ADMIN CA.RO
                    </span>
                  ) : usr.perfil === 'CLIENTE_ADMIN' ? (
                    <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      GESTOR DA EMPRESA
                    </span>
                  ) : (
                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">
                      ATENDENTE OPERADOR
                    </span>
                  )}
                </td>
                <td className="p-4 text-[#94A3B8] font-mono">
                  {new Date(usr.criadoEm).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Convidar Operador */}
      {showModal && (
        <div className="fixed inset-0 bg-[#050B14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E182A] border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-serif font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-[#D4AF37]" /> Convidar Atendente da Equipe
            </h2>

            <form onSubmit={handleConvidar} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nome Completo:</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Atendente"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">E-mail de Login:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="atendente@empresa.com.br"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nível de Permissão:</label>
                <select
                  value={perfil}
                  onChange={(e) => setPerfil(e.target.value as any)}
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="CLIENTE_OPERADOR">Atendente Operador (Apenas Conversas e Leads)</option>
                  <option value="CLIENTE_ADMIN">Gestor Admin (Acesso a Configurações da IA)</option>
                </select>
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
                  Adicionar à Equipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
