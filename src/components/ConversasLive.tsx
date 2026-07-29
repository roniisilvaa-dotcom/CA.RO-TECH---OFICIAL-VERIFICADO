import React, { useState, useEffect } from 'react';
import {
  Bot,
  CheckCircle,
  Filter,
  Kanban,
  MessageSquare,
  RefreshCw,
  Send,
  User,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import { Conversa, Mensagem } from '../types';

interface ConversasLiveProps {
  empresaId: string;
  onLeadCreated?: () => void;
}

export const ConversasLive: React.FC<ConversasLiveProps> = ({ empresaId, onLeadCreated }) => {
  const [conversas, setConversas] = useState<Conversa[]>([]);
  const [selectedConversaId, setSelectedConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [selectedContato, setSelectedContato] = useState<any>(null);
  const [filter, setFilter] = useState<'todas' | 'ia' | 'humano' | 'encerrada'>('todas');
  const [inputMensagem, setInputMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingLead, setCreatingLead] = useState(false);
  const [leadSuccessMsg, setLeadSuccessMsg] = useState('');

  // Fetch conversations for tenant
  const fetchConversas = async () => {
    try {
      const res = await fetch('/api/conversas', {
        headers: { 'x-empresa-id': empresaId },
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setConversas(data);
        if (!selectedConversaId && data.length > 0) {
          setSelectedConversaId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Erro ao carregar conversas:', err);
    }
  };

  // Fetch messages for selected conversation
  const fetchMensagens = async (conversaId: string) => {
    try {
      const res = await fetch(`/api/conversas/${conversaId}/mensagens`, {
        headers: { 'x-empresa-id': empresaId },
      });
      const data = await res.json();
      if (data.mensagens) {
        setMensagens(data.mensagens);
        setSelectedContato(data.contato);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    }
  };

  useEffect(() => {
    fetchConversas();
    const interval = setInterval(fetchConversas, 3000); // Live polling for real-time messages
    return () => clearInterval(interval);
  }, [empresaId]);

  useEffect(() => {
    if (selectedConversaId) {
      fetchMensagens(selectedConversaId);
    }
  }, [selectedConversaId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMensagem.trim() || !selectedConversaId) return;

    const textToSend = inputMensagem;
    setInputMensagem('');

    try {
      const res = await fetch(`/api/conversas/${selectedConversaId}/mensagens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({ conteudo: textToSend }),
      });
      if (res.ok) {
        fetchMensagens(selectedConversaId);
        fetchConversas();
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    }
  };

  const handleToggleAtendimento = async (novoAtendente: 'ia' | 'humano') => {
    if (!selectedConversaId) return;
    try {
      const res = await fetch(`/api/conversas/${selectedConversaId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({ atendidoPor: novoAtendente }),
      });
      if (res.ok) {
        fetchConversas();
        fetchMensagens(selectedConversaId);
      }
    } catch (err) {
      console.error('Erro ao alterar atendente:', err);
    }
  };

  const handleEncerrarConversa = async () => {
    if (!selectedConversaId) return;
    try {
      const res = await fetch(`/api/conversas/${selectedConversaId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({ status: 'encerrada' }),
      });
      if (res.ok) {
        fetchConversas();
        fetchMensagens(selectedConversaId);
      }
    } catch (err) {
      console.error('Erro ao encerrar conversa:', err);
    }
  };

  const handleCriarLeadRapido = async () => {
    if (!selectedContato) return;
    setCreatingLead(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({
          contatoId: selectedContato.id,
          etapaFunil: 'novo',
          valorEstimado: 2500,
          observacoes: `Lead criado diretamente do chat do WhatsApp (${selectedContato.nome}).`,
        }),
      });
      if (res.ok) {
        setLeadSuccessMsg('Lead adicionado ao Kanban!');
        setTimeout(() => setLeadSuccessMsg(''), 3000);
        if (onLeadCreated) onLeadCreated();
      }
    } catch (err) {
      console.error('Erro ao criar lead:', err);
    } finally {
      setCreatingLead(false);
    }
  };

  const filteredConversas = conversas.filter((c) => {
    if (filter === 'ia') return c.atendidoPor === 'ia' && c.status === 'aberta';
    if (filter === 'humano') return c.atendidoPor === 'humano' && c.status === 'aberta';
    if (filter === 'encerrada') return c.status === 'encerrada';
    return true;
  });

  const selectedConversaObj = conversas.find((c) => c.id === selectedConversaId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-[#F1F5F9] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#C5A059]" />
            Central de Conversas em Tempo Real
          </h1>
          <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
            Acompanhe a interação da IA com os clientes e assuma o atendimento a qualquer momento.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center space-x-1.5 bg-[#0E182A] border border-[#D4AF37]/30 p-1.5 rounded-2xl text-xs shadow-md">
          <button
            onClick={() => setFilter('todas')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition text-[10px] uppercase tracking-wider ${
              filter === 'todas' ? 'bg-[#D4AF37] text-[#050B14] font-bold shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Todas ({conversas.length})
          </button>
          <button
            onClick={() => setFilter('ia')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 text-[10px] uppercase tracking-wider ${
              filter === 'ia' ? 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/40 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
            Por IA ({conversas.filter((c) => c.atendidoPor === 'ia' && c.status === 'aberta').length})
          </button>
          <button
            onClick={() => setFilter('humano')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition flex items-center gap-1 text-[10px] uppercase tracking-wider ${
              filter === 'humano' ? 'bg-[#15243F] text-[#F8FAFC] border border-[#D4AF37]/30 font-bold shadow-sm' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <User className="w-3.5 h-3.5 text-slate-300" />
            Por Humano ({conversas.filter((c) => c.atendidoPor === 'humano' && c.status === 'aberta').length})
          </button>
          <button
            onClick={() => setFilter('encerrada')}
            className={`px-3.5 py-1.5 rounded-xl font-medium transition text-[10px] uppercase tracking-wider ${
              filter === 'encerrada' ? 'bg-[#15243F] text-[#F8FAFC]' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            Encerradas
          </button>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[680px]">
        {/* Left List Column */}
        <div className="lg:col-span-4 bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
          <div className="p-3.5 bg-[#080F1D] border-b border-[#D4AF37]/20 flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="font-bold uppercase tracking-wider text-[10px] text-[#D4AF37]">Contatos ({filteredConversas.length})</span>
            <button onClick={fetchConversas} className="p-1 rounded-lg hover:bg-[#15243F] hover:text-[#D4AF37] transition" title="Atualizar conversas">
              <RefreshCw className="w-3.5 h-3.5 text-[#D4AF37]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#D4AF37]/10 p-1">
            {filteredConversas.length === 0 ? (
              <div className="p-8 text-center text-[#94A3B8] text-xs font-sans">Nenhuma conversa encontrada neste filtro.</div>
            ) : (
              filteredConversas.map((conversa) => {
                const isSelected = conversa.id === selectedConversaId;
                const nomeContato = conversa.contato?.nome || 'Contato WhatsApp';

                return (
                  <button
                    key={conversa.id}
                    onClick={() => setSelectedConversaId(conversa.id)}
                    className={`w-full text-left p-3.5 rounded-xl my-0.5 transition flex items-start space-x-3 ${
                      isSelected ? 'bg-[#15243F] border border-[#D4AF37]/50 shadow-md' : 'hover:bg-[#15243F]/50 border border-transparent'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold text-xs font-serif shrink-0 shadow-sm">
                      {nomeContato.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="font-bold text-[#F8FAFC] text-xs truncate">{nomeContato}</span>
                        <span className="text-[10px] text-[#94A3B8] font-mono">
                          {conversa.ultimaMensagemData
                            ? new Date(conversa.ultimaMensagemData).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#94A3B8] truncate mb-1.5">{conversa.ultimaMensagem || 'Sua conversa iniciou...'}</p>
                      <div className="flex items-center space-x-1.5 text-[9px]">
                        {conversa.atendidoPor === 'ia' ? (
                          <span className="bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1">
                            <Bot className="w-3 h-3 text-[#D4AF37]" /> IA Secretária
                          </span>
                        ) : (
                          <span className="bg-slate-800 text-slate-200 border border-slate-700 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-300" /> Humano
                          </span>
                        )}
                        {conversa.status === 'encerrada' && (
                          <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full uppercase tracking-wider">Encerrada</span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Active Chat Window */}
        <div className="lg:col-span-8 bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 flex flex-col overflow-hidden shadow-2xl backdrop-blur-md">
          {selectedConversaObj ? (
            <>
              {/* Chat Header */}
              <div className="p-4 bg-[#080F1D] border-b border-[#D4AF37]/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-serif font-bold text-sm shadow-md">
                    {selectedContato?.nome ? selectedContato.nome.substring(0, 2).toUpperCase() : 'WA'}
                  </div>
                  <div>
                    <h2 className="font-bold font-serif text-[#F8FAFC] text-sm">{selectedContato?.nome || 'Contato'}</h2>
                    <p className="text-xs text-[#94A3B8] font-mono">+{selectedContato?.telefone || ''}</p>
                  </div>
                </div>

                {/* Operator Actions Toolbar */}
                <div className="flex items-center space-x-2">
                  {selectedConversaObj.atendidoPor === 'ia' ? (
                    <button
                      onClick={() => handleToggleAtendimento('humano')}
                      className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] text-xs uppercase tracking-wider font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-md hover:shadow-[#D4AF37]/20"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Assumir Atendimento</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleAtendimento('ia')}
                      className="bg-[#15243F] hover:bg-[#1a2e52] text-[#D4AF37] border border-[#D4AF37]/40 text-xs uppercase tracking-wider font-semibold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 transition shadow-sm"
                    >
                      <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Devolver p/ IA</span>
                    </button>
                  )}

                  <button
                    onClick={handleCriarLeadRapido}
                    disabled={creatingLead}
                    className="bg-[#15243F] hover:bg-[#1a2e52] text-[#F8FAFC] border border-[#D4AF37]/30 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1 transition uppercase tracking-wider text-[10px] shadow-sm"
                  >
                    <Kanban className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Criar Lead</span>
                  </button>

                  <button
                    onClick={handleEncerrarConversa}
                    className="bg-[#0E182A] hover:bg-[#15243F] text-[#94A3B8] border border-slate-700 text-[10px] font-semibold uppercase tracking-wider px-3 py-2 rounded-xl transition"
                  >
                    Encerrar
                  </button>
                </div>
              </div>

              {leadSuccessMsg && (
                <div className="bg-emerald-950/90 border-b border-emerald-700/50 text-emerald-300 text-xs px-4 py-2 flex items-center space-x-2 font-medium">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{leadSuccessMsg}</span>
                </div>
              )}

              {/* Message Timeline */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#050B14]/80 scrollbar-thin">
                {mensagens.map((msg) => {
                  const isIncoming = msg.direcao === 'in';

                  return (
                    <div key={msg.id} className={`flex flex-col ${isIncoming ? 'items-start' : 'items-end'}`}>
                      <div
                        className={`max-w-[80%] p-4 text-xs shadow-md ${
                          isIncoming
                            ? 'bg-[#0E182A] text-[#F8FAFC] border border-[#D4AF37]/30 rounded-2xl rounded-tl-sm'
                            : msg.enviadoPor === 'ia'
                            ? 'bg-[#15243F] text-[#F8FAFC] border border-[#D4AF37]/50 rounded-2xl rounded-tr-sm'
                            : 'bg-gradient-to-r from-[#D4AF37] to-[#B89326] text-[#050B14] font-medium rounded-2xl rounded-tr-sm'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1.5 text-[9px] uppercase tracking-wider opacity-90">
                          <span className="font-bold flex items-center gap-1">
                            {msg.enviadoPor === 'contato' && <User className="w-3 h-3 text-[#D4AF37]" />}
                            {msg.enviadoPor === 'ia' && <Bot className="w-3 h-3 text-[#D4AF37]" />}
                            {msg.enviadoPor === 'humano' && <UserCheck className="w-3 h-3 text-[#050B14]" />}
                            {msg.enviadoPor === 'contato'
                              ? 'Cliente'
                              : msg.enviadoPor === 'ia'
                              ? 'IA Secretária'
                              : 'Atendente Humano'}
                          </span>
                          <span className="font-mono">{new Date(msg.criadaEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-xs">{msg.conteudo}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Footer */}
              <form onSubmit={handleSendMessage} className="p-3 bg-[#080F1D] border-t border-[#D4AF37]/20 flex items-center space-x-2">
                <input
                  type="text"
                  value={inputMensagem}
                  onChange={(e) => setInputMensagem(e.target.value)}
                  placeholder={
                    selectedConversaObj.atendidoPor === 'ia'
                      ? 'Ao enviar mensagem, o atendimento passa automaticamente para Humano...'
                      : 'Digite a mensagem para enviar ao WhatsApp do cliente...'
                  }
                  className="flex-1 bg-[#0E182A] border border-[#D4AF37]/30 rounded-xl px-4 py-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]"
                />
                <button
                  type="submit"
                  disabled={!inputMensagem.trim()}
                  className="bg-[#D4AF37] hover:bg-[#F3E5AB] disabled:opacity-40 text-[#050B14] font-bold uppercase tracking-wider text-[10px] px-5 py-2.5 rounded-xl transition flex items-center space-x-1.5 shadow-md hover:shadow-[#D4AF37]/20"
                >
                  <span>Enviar</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] text-xs p-8 font-sans">
              <MessageSquare className="w-10 h-10 text-[#C5A059]/40 mb-3" />
              <p>Selecione uma conversa ao lado para visualizar as mensagens.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
