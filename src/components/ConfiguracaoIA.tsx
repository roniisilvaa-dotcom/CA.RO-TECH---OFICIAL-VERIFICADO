import React, { useState, useEffect } from 'react';
import {
  Bot,
  Brain,
  Check,
  Cpu,
  FileText,
  Play,
  Save,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { ConfiguracaoIA as IConfiguracaoIA } from '../types';

interface ConfiguracaoIAProps {
  empresaId: string;
}

export const ConfiguracaoIA: React.FC<ConfiguracaoIAProps> = ({ empresaId }) => {
  const [config, setConfig] = useState<IConfiguracaoIA | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [testQuery, setTestQuery] = useState('Quais os valores e como funciona?');
  const [testResult, setTestResult] = useState('');
  const [testing, setTesting] = useState(false);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/configuracao-ia', { headers: { 'x-empresa-id': empresaId } });
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Erro ao carregar configuracao IA:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [empresaId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!config) return;
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/configuracao-ia', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaId },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Erro ao salvar configuracao IA:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestIA = async () => {
    if (!testQuery.trim()) return;
    setTesting(true);
    setTestResult('');
    try {
      const res = await fetch('/api/test-ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-empresa-id': empresaId },
        body: JSON.stringify({ mensagem: testQuery }),
      });
      const data = await res.json();
      setTestResult(data.resposta);
    } catch (err) {
      console.error('Erro no teste de IA:', err);
      setTestResult('Erro ao conectar com o motor de IA.');
    } finally {
      setTesting(false);
    }
  };

  if (loading || !config) {
    return <div className="max-w-7xl mx-auto p-8 text-center text-slate-400 text-xs">Carregando configurações da IA...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
          <Bot className="w-5 h-5 text-[#D4AF37]" />
          Configuração da Secretária Virtual com IA
        </h1>
        <p className="text-xs text-[#94A3B8] font-sans mt-0.5">
          Ensine sua IA como atender seus clientes no WhatsApp sem precisar escrever código.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <form onSubmit={handleSave} className="lg:col-span-7 space-y-6">
          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-6 space-y-5 shadow-2xl backdrop-blur-md">
            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-[#D4AF37]" />
                Nome da Assistente Virtual
              </label>
              <input type="text" value={config.nomeAssistente} onChange={(e) => setConfig({ ...config, nomeAssistente: e.target.value })} placeholder="Ex: Sofia, Amanda, Atendente Virtual..." className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]" />
              <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">Como a IA se apresentará para o cliente nas mensagens.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                Tom de Voz e Personalidade
              </label>
              <input type="text" value={config.tomDeVoz} onChange={(e) => setConfig({ ...config, tomDeVoz: e.target.value })} placeholder="Ex: cordial, objetivo, dinâmico e focado em vendas..." className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]" />
              <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">Define o comportamento e linguagem usada nas respostas.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5 justify-between">
                <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <Brain className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Base de Conhecimento da Empresa
                </span>
              </label>
              <textarea rows={9} value={config.baseConhecimento} onChange={(e) => setConfig({ ...config, baseConhecimento: e.target.value })} placeholder="Cole aqui todas as informações da sua empresa: produtos, serviços, preços, endereço, horários, perguntas frequentes, políticas de garantia e formas de pagamento..." className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl p-3.5 text-xs text-[#F8FAFC] font-mono leading-relaxed focus:outline-none focus:border-[#D4AF37] scrollbar-thin" />
              <p className="text-[11px] text-[#94A3B8] mt-1 font-sans">A IA usará estritamente estes dados para responder ao WhatsApp.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#D4AF37]" />
                Regras de Escalonamento (Transferência para Humano)
              </label>
              <textarea rows={3} value={config.regrasEscalonamento} onChange={(e) => setConfig({ ...config, regrasEscalonamento: e.target.value })} placeholder="Ex: Se o cliente disser 'falar com humano', 'atendente' ou pedir avaliação técnica, transferir para a equipe humana..." className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl p-3.5 text-xs text-[#F8FAFC] focus:outline-none focus:border-[#D4AF37]" />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#F8FAFC] mb-1.5 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-[#D4AF37]" />
                Motor de Inteligência Artificial
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => setConfig({ ...config, llmProvider: 'gemini' })} className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 uppercase tracking-wider text-[10px] ${config.llmProvider === 'gemini' ? 'bg-[#D4AF37] text-[#050B14] border-[#D4AF37] shadow-md' : 'bg-[#15243F] border-[#D4AF37]/20 text-[#94A3B8] hover:text-[#F8FAFC]'}`}>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Gemini 3.6 Flash</span>
                </button>
                <button type="button" onClick={() => setConfig({ ...config, llmProvider: 'anthropic' })} className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 uppercase tracking-wider text-[10px] ${config.llmProvider === 'anthropic' ? 'bg-[#D4AF37] text-[#050B14] border-[#D4AF37] shadow-md' : 'bg-[#15243F] border-[#D4AF37]/20 text-[#94A3B8] hover:text-[#F8FAFC]'}`}>
                  <Bot className="w-3.5 h-3.5" />
                  <span>Claude 3.5</span>
                </button>
                <button type="button" onClick={() => setConfig({ ...config, llmProvider: 'openai' })} className={`p-3 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 uppercase tracking-wider text-[10px] ${config.llmProvider === 'openai' ? 'bg-[#D4AF37] text-[#050B14] border-[#D4AF37] shadow-md' : 'bg-[#15243F] border-[#D4AF37]/20 text-[#94A3B8] hover:text-[#F8FAFC]'}`}>
                  <Cpu className="w-3.5 h-3.5" />
                  <span>GPT-4o</span>
                </button>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <button type="submit" disabled={saving} className="bg-[#D4AF37] hover:bg-[#F3E5AB] disabled:opacity-50 text-[#050B14] font-bold px-6 py-3 rounded-xl uppercase tracking-wider text-[10px] transition flex items-center gap-2 shadow-md hover:shadow-[#D4AF37]/20">
                <Save className="w-4 h-4 text-[#050B14]" />
                <span>{saving ? 'Salvando...' : 'Salvar Configurações da IA'}</span>
              </button>
              {saveSuccess && (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 font-sans">
                  <Check className="w-4 h-4 text-emerald-400" /> Configurações salvas com sucesso!
                </span>
              )}
            </div>
          </div>
        </form>

        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0E182A]/90 rounded-2xl border border-[#D4AF37]/30 p-6 shadow-2xl backdrop-blur-md flex flex-col h-full">
            <div className="flex items-center justify-between mb-3 border-b border-[#D4AF37]/20 pb-3">
              <h2 className="text-sm font-serif font-bold text-[#F8FAFC] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Playground: Teste sua IA ao Vivo
              </h2>
              <span className="text-[9px] bg-[#15243F] text-[#D4AF37] border border-[#D4AF37]/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-mono font-bold">Simulador</span>
            </div>

            <p className="text-xs text-[#94A3B8] mb-4 font-sans">
              Digite uma mensagem como se fosse um cliente no WhatsApp para ver exatamente como sua assistente responderá com base na base de conhecimento.
            </p>

            <div className="mb-4">
              <label className="block text-[10px] uppercase tracking-wider font-semibold text-[#D4AF37] mb-1">Mensagem de teste do cliente:</label>
              <div className="flex gap-2">
                <input type="text" value={testQuery} onChange={(e) => setTestQuery(e.target.value)} placeholder="Ex: Qual o horário de funcionamento e valor?" className="flex-1 bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]" />
                <button onClick={handleTestIA} disabled={testing || !testQuery.trim()} className="bg-[#D4AF37] hover:bg-[#F3E5AB] text-[#050B14] font-bold uppercase tracking-wider text-[10px] px-4 py-2 rounded-xl flex items-center gap-1 transition shadow-md">
                  <Play className="w-3.5 h-3.5 text-[#050B14] fill-current" />
                  <span>Testar</span>
                </button>
              </div>
            </div>

            <div className="flex-1 bg-[#050B14] border border-[#D4AF37]/20 rounded-xl p-4 flex flex-col">
              <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider mb-2 flex items-center gap-1">
                <Bot className="w-3 h-3 text-[#D4AF37]" /> Resposta da Assistente:
              </span>
              {testing ? (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8] text-xs gap-2 font-sans">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  Gerando resposta via Gemini...
                </div>
              ) : testResult ? (
                <div className="bg-[#0E182A] border border-[#D4AF37]/30 rounded-xl p-3.5 text-xs text-[#F8FAFC] leading-relaxed whitespace-pre-wrap font-sans">{testResult}</div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-[#94A3B8]/60 text-xs text-center font-sans">Clique em "Testar" para ver o comportamento da assistente.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
