import React, { useState } from 'react';
import { Lock, LogIn, Mail } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setErro(data.error || 'E-mail ou senha inválidos.');
        return;
      }
      onLoginSuccess();
    } catch {
      setErro('Não foi possível conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A1120] text-[#F1F5F9] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[#0E182A]/90 border border-[#D4AF37]/30 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-xl border border-[#D4AF37] bg-gradient-to-br from-[#0E182A] to-[#15243F] text-[#D4AF37] flex items-center justify-center font-serif text-2xl font-bold gold-glow shadow-lg mb-3">
            CA
          </div>
          <h1 className="font-serif font-extrabold text-xl gold-gradient-text">Painel CA.RO TECH</h1>
          <p className="text-[11px] text-[#94A3B8] mt-1">Entre com seu e-mail e senha</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="seuemail@empresa.com.br"
              className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label className="block text-[#D4AF37] font-semibold mb-1 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-[#15243F] border border-[#D4AF37]/30 rounded-xl px-3.5 py-2.5 text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          {erro && <p className="text-rose-400 text-xs font-medium">{erro}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#D4AF37] hover:bg-[#F3E5AB] disabled:opacity-50 text-[#050B14] font-bold py-2.5 rounded-xl uppercase tracking-wider text-[10px] transition flex items-center justify-center gap-2 shadow-md"
          >
            <LogIn className="w-4 h-4" />
            <span>{loading ? 'Entrando...' : 'Entrar'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
