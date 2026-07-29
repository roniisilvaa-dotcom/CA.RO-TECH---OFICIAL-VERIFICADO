import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Key,
  Lock,
  PhoneCall,
  Plus,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { Empresa, NumeroWhatsapp } from '../types';

interface AdminNumerosProps {
  empresas: Empresa[];
}

export const AdminNumeros: React.FC<AdminNumerosProps> = ({ empresas }) => {
  const [numeros, setNumeros] = useState<NumeroWhatsapp[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [empresaId, setEmpresaId] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [numeroExibicao, setNumeroExibicao] = useState('');
  const [tokenAcesso, setTokenAcesso] = useState('');

  const fetchNumeros = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/numeros', {
        headers: { 'x-user-id': 'usr_superadmin' },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setNumeros(data);
      }
    } catch (err) {
      console.error('Erro ao buscar números:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNumeros();
    if (empresas.length > 0) {
      setEmpresaId(empresas[0].id);
    }
  }, [empresas]);

  const handleConnectNumero = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumberId || !tokenAcesso || !empresaId) return;

    try {
      const res = await fetch('/api/admin/numeros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': 'usr_superadmin',
        },
        body: JSON.stringify({
          empresaId,
          phoneNumberId,
          wabaId,
          numeroExibicao: numeroExibicao || '+55 11 90000-0000',
          tokenAcesso,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setPhoneNumberId('');
        setWabaId('');
        setNumeroExibicao('');
        setTokenAcesso('');
        fetchNumeros();
      }
    } catch (err) {
      console.error('Erro ao conectar número:', err);
    }
  };

  const maskToken = (token: string) => {
    if (!token) return '••••••••';
    return token.substring(0, 6) + '••••••••••••' + token.substring(token.length - 4);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
            <PhoneCall className="w-5 h-5 text-[#D4AF37]" />
            Conexão de Números WhatsApp Meta (Cloud API v20)
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Associe e gerencie as credenciais da API Oficial da Meta para cada empresa cadastrada.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] font-bold px-4 py-2.5 rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1.5 transition shadow-md hover:shadow-[#D4AF37]/20"
        >
          <Plus className="w-4 h-4 text-[#050B14]" />
          <span>Conectar Novo Número Meta</span>
        </button>
      </div>

      {/* Numbers List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {numeros.map((num) => {
          const emp = empresas.find((e) => e.id === num.empresaId);

          return (
            <div key={num.id} className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold shadow-md">
                    <Smartphone className="w-5 h-5 text-[#050B14]" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#F8FAFC] text-sm">{num.numeroExibicao}</h3>
                    <p className="text-xs text-[#D4AF37] font-semibold">{emp?.nome || num.empresaId}</p>
                  </div>
                </div>

                <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-700/50 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full flex items-center gap-1 shadow-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Meta Conectado
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="bg-[#15243F] rounded-xl p-3 border border-[#D4AF37]/15 flex items-center justify-between">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider">Phone Number ID:</span>
                  <span className="text-[#F8FAFC] font-bold">{num.phoneNumberId}</span>
                </div>

                <div className="bg-[#15243F] rounded-xl p-3 border border-[#D4AF37]/15 flex items-center justify-between">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider">WABA ID:</span>
                  <span className="text-[#F8FAFC]">{num.wabaId}</span>
                </div>

                <div className="bg-[#15243F] rounded-xl p-3 border border-[#D4AF37]/15 flex items-center justify-between">
                  <span className="text-[#94A3B8] text-[10px] uppercase tracking-wider flex items-center gap-1">
                    <Lock className="w-3 h-3 text-[#D4AF37]" /> Token:
                  </span>
                  <span className="text-[#F8FAFC] font-mono text-[10px]">{maskToken(num.tokenAcesso)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[#050B14]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0E182A] border border-[#D4AF37]/40 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-base font-serif font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-[#D4AF37]" /> Conectar Número Meta API
            </h2>

            <form onSubmit={handleConnectNumero} className="space-y-4 text-xs font-sans">
              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Empresa Cliente:</label>
                <select
                  value={empresaId}
                  onChange={(e) => setEmpresaId(e.target.value)}
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
                >
                  {empresas.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Número de Exibição (com DDD):</label>
                <input
                  type="text"
                  value={numeroExibicao}
                  onChange={(e) => setNumeroExibicao(e.target.value)}
                  placeholder="Ex: +55 11 91228-2810"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Phone Number ID (Meta):</label>
                <input
                  type="text"
                  value={phoneNumberId}
                  onChange={(e) => setPhoneNumberId(e.target.value)}
                  placeholder="109823471928374"
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">WABA ID (WhatsApp Business Account):</label>
                <input
                  type="text"
                  value={wabaId}
                  onChange={(e) => setWabaId(e.target.value)}
                  placeholder="203948571029384"
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-[#F8FAFC] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Token de Acesso Permanente Meta:</label>
                <textarea
                  rows={3}
                  value={tokenAcesso}
                  onChange={(e) => setTokenAcesso(e.target.value)}
                  placeholder="EAA..."
                  required
                  className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl p-3 text-[#F8FAFC] placeholder-[#94A3B8] font-mono focus:outline-none focus:border-[#D4AF37] text-[11px]"
                />
                <p className="text-[10px] text-[#94A3B8] mt-1">
                  O token será criptografado no banco de dados e nunca exposto ao frontend.
                </p>
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
                  Salvar Conexão Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
