import React, { useState } from 'react';
import {
  Bot,
  Send,
  Smartphone,
  Sparkles,
  User,
  Zap,
} from 'lucide-react';
import { Mensagem } from '../types';

interface SimuladorWhatsappProps {
  empresaId: string;
  onMessageSent?: () => void;
}

export const SimuladorWhatsapp: React.FC<SimuladorWhatsappProps> = ({ empresaId, onMessageSent }) => {
  const [telefone, setTelefone] = useState('5511988887777');
  const [nomeCliente, setNomeCliente] = useState('Cliente Teste');
  const [mensagemText, setMensagemText] = useState('Olá! Quais os produtos/serviços disponíveis e horários?');
  const [chatLog, setChatLog] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSimulateMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mensagemText.trim()) return;

    const query = mensagemText;
    setMensagemText('');
    setLoading(true);

    try {
      const res = await fetch('/api/simulator/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-empresa-id': empresaId,
        },
        body: JSON.stringify({
          telefone,
          nome: nomeCliente,
          mensagem: query,
        }),
      });

      const data = await res.json();
      if (data.mensagens) {
        setChatLog(data.mensagens);
        if (onMessageSent) onMessageSent();
      }
    } catch (err) {
      console.error('Erro na simulação do WhatsApp:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-[#D4AF37]" />
          Simulador Interativo do WhatsApp
        </h1>
        <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
          Envie mensagens como um cliente do WhatsApp para testar o Webhook, o gatilho de transbordo e as respostas da IA em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Options Card */}
        <div className="lg:col-span-5 bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <h2 className="font-serif font-bold text-[#F8FAFC] text-sm flex items-center gap-2 border-b border-[#D4AF37]/20 pb-2">
            <Zap className="w-4 h-4 text-[#D4AF37]" /> Dados do Cliente Simulado
          </h2>

          <div>
            <label className="block text-xs text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Nome do Cliente:</label>
            <input
              type="text"
              value={nomeCliente}
              onChange={(e) => setNomeCliente(e.target.value)}
              className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-xs text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider">Telefone WhatsApp (com DDD):</label>
            <input
              type="text"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2 text-xs text-[#F8FAFC] font-mono focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="bg-[#15243F] border border-[#D4AF37]/20 rounded-xl p-3.5 text-xs space-y-2 text-[#F8FAFC]">
            <span className="font-bold text-[#D4AF37] block mb-1 uppercase tracking-wider text-[10px]">Gatilhos para Testar:</span>
            <button
              onClick={() => setMensagemText('Qual o valor do iPhone 15 e formas de pagamento?')}
              className="w-full text-left bg-[#0E182A] hover:bg-[#1a2e52] p-2.5 rounded-lg text-[11px] text-[#F8FAFC] transition border border-[#D4AF37]/20 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>1. Pergunta sobre produtos/preços</span>
            </button>
            <button
              onClick={() => setMensagemText('Quero falar com um humano para avaliar meu seminovo')}
              className="w-full text-left bg-[#0E182A] hover:bg-[#1a2e52] p-2.5 rounded-lg text-[11px] text-[#D4AF37] font-semibold transition border border-[#D4AF37]/40 flex items-center gap-2"
            >
              <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>2. Gatilho de Atendente Humano ("falar com humano")</span>
            </button>
            <button
              onClick={() => setMensagemText('Qual o endereço e horário de funcionamento?')}
              className="w-full text-left bg-[#0E182A] hover:bg-[#1a2e52] p-2.5 rounded-lg text-[11px] text-[#F8FAFC] transition border border-[#D4AF37]/20 flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>3. Dúvida sobre localização e horários</span>
            </button>
          </div>
        </div>

        {/* Right WhatsApp Mobile Device Frame */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[380px] bg-[#080F1D] border-4 border-[#0E182A] rounded-[32px] shadow-2xl flex flex-col h-[620px] overflow-hidden">
            {/* Phone Top Speaker & Camera notch */}
            <div className="bg-[#080F1D] h-6 flex items-center justify-center pt-1">
              <div className="w-16 h-2 bg-[#D4AF37]/30 rounded-full" />
            </div>

            {/* WhatsApp App Header */}
            <div className="bg-[#0E182A] text-[#F8FAFC] border-b border-[#D4AF37]/25 p-3.5 flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37] text-[#050B14] flex items-center justify-center font-bold font-serif text-xs shadow-md">
                CA
              </div>
              <div>
                <h3 className="font-serif font-bold text-xs leading-tight text-[#F8FAFC]">CA.RO TECH — WhatsApp Business</h3>
                <p className="text-[9px] uppercase tracking-wider text-[#D4AF37] font-semibold">Online • Secretária Virtual IA</p>
              </div>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-[#050B14] scrollbar-thin">
              {chatLog.length === 0 ? (
                <div className="text-center text-[#94A3B8] text-[11px] font-sans mt-20 p-4">
                  Envie uma mensagem abaixo para simular a conversa no WhatsApp em tempo real.
                </div>
              ) : (
                chatLog.map((msg) => {
                  const isIncoming = msg.direcao === 'in';

                  return (
                    <div key={msg.id} className={`flex ${isIncoming ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[85%] p-3 text-xs border shadow-md rounded-2xl ${
                          isIncoming
                            ? 'bg-[#15243F] text-[#F8FAFC] border-[#D4AF37]/30 rounded-tr-xs'
                            : 'bg-[#0E182A] text-[#F8FAFC] border-[#D4AF37]/50 rounded-tl-xs'
                        }`}
                      >
                        <div className="text-[9px] uppercase tracking-wider mb-1 font-bold flex items-center gap-1 opacity-90">
                          {isIncoming ? (
                            <>
                              <User className="w-3 h-3 text-[#D4AF37]" /> <span className="text-[#D4AF37]">{nomeCliente}</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-[#D4AF37]" />{' '}
                              <span className="text-[#F8FAFC]">{msg.enviadoPor === 'ia' ? 'Secretária IA' : 'Atendente Humano'}</span>
                            </>
                          )}
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed text-[11px] font-sans">{msg.conteudo}</p>
                        <span className="text-[8px] font-mono text-[#94A3B8] block text-right mt-1">
                          {new Date(msg.criadaEm).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSimulateMessage} className="p-3 bg-[#0E182A] border-t border-[#D4AF37]/25 flex items-center space-x-2">
              <input
                type="text"
                value={mensagemText}
                onChange={(e) => setMensagemText(e.target.value)}
                placeholder="Mensagem do cliente no Zap..."
                className="flex-1 bg-[#15243F] text-[#F8FAFC] placeholder-[#94A3B8] text-xs px-3.5 py-2 rounded-xl focus:outline-none border border-[#D4AF37]/30 focus:border-[#D4AF37]"
              />
              <button
                type="submit"
                disabled={loading || !mensagemText.trim()}
                className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] p-2.5 rounded-xl transition disabled:opacity-40 shadow-md"
              >
                <Send className="w-4 h-4 text-[#050B14]" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
