import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ConversasLive } from './components/ConversasLive';
import { LeadsKanban } from './components/LeadsKanban';
import { ConfiguracaoIA } from './components/ConfiguracaoIA';
import { SimuladorWhatsapp } from './components/SimuladorWhatsapp';
import { DashboardStats } from './components/DashboardStats';
import { AdminEmpresas } from './components/AdminEmpresas';
import { AdminNumeros } from './components/AdminNumeros';
import { EquipeManager } from './components/EquipeManager';
import { Login } from './components/Login';
import { Empresa, UsuarioPainel } from './types';

export default function App() {
  const [usuario, setUsuario] = useState<UsuarioPainel | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<Empresa | null>(null);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [activeTab, setActiveTab] = useState<string>('conversas');
  const [loading, setLoading] = useState<boolean>(true);
  const [autenticado, setAutenticado] = useState<boolean>(false);

  const fetchSession = async (overrideEmpresaId?: string) => {
    try {
      setLoading(true);
      const headers: any = {};
      if (overrideEmpresaId) headers['x-empresa-id'] = overrideEmpresaId;

      const meRes = await fetch('/api/auth/me', { headers });
      if (!meRes.ok) {
        setAutenticado(false);
        setUsuario(null);
        return;
      }
      const data = await meRes.json();
      setUsuario(data.usuario);
      setEmpresaAtiva(data.empresaAtiva);
      setAutenticado(true);

      if (data.usuario.perfil === 'SUPER_ADMIN') {
        const empRes = await fetch('/api/admin/empresas');
        if (empRes.ok) {
          const empData = await empRes.json();
          if (Array.isArray(empData)) setEmpresas(empData);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar sessão do painel:', err);
      setAutenticado(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const handleSelectEmpresa = (empresaId: string) => {
    const emp = empresas.find((e) => e.id === empresaId);
    if (emp) {
      setEmpresaAtiva(emp);
      fetchSession(empresaId);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setAutenticado(false);
    setUsuario(null);
    setEmpresaAtiva(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A1120] text-[#F1F5F9] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 bg-[#111C33] border border-[#C5A059]/40 text-[#D4AF37] animate-pulse flex items-center justify-center font-serif font-bold text-xl shadow-lg shadow-[#C5A059]/10 mb-4">
          CA
        </div>
        <p className="text-xs text-[#94A3B8] font-medium">Carregando Painel CA.RO TECH...</p>
      </div>
    );
  }

  if (!autenticado || !usuario || !empresaAtiva) {
    return <Login onLoginSuccess={() => fetchSession()} />;
  }

  const activeEmpresaId = empresaAtiva.id;

  return (
    <div className="min-h-screen bg-[#0A1120] text-[#F1F5F9] font-sans flex flex-col selection:bg-[#C5A059]/30 selection:text-[#FFFFFF]">
      <Header
        usuario={usuario}
        empresaAtiva={empresaAtiva}
        empresas={empresas}
        onSelectEmpresa={handleSelectEmpresa}
        onLogout={handleLogout}
      />

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} usuario={usuario} />

      <main className="flex-1 pb-12">
        {activeTab === 'conversas' && (
          <ConversasLive empresaId={activeEmpresaId} onLeadCreated={() => setActiveTab('leads')} />
        )}
        {activeTab === 'leads' && <LeadsKanban empresaId={activeEmpresaId} />}
        {activeTab === 'config-ia' && <ConfiguracaoIA empresaId={activeEmpresaId} />}
        {activeTab === 'simulador' && (
          <SimuladorWhatsapp empresaId={activeEmpresaId} onMessageSent={() => {}} />
        )}
        {activeTab === 'dashboard' && (
          <DashboardStats empresaId={activeEmpresaId} usuario={usuario} empresaAtiva={empresaAtiva} />
        )}
        {activeTab === 'equipe' && <EquipeManager empresaId={activeEmpresaId} usuarioAtual={usuario} />}
        {activeTab === 'admin-empresas' && usuario.perfil === 'SUPER_ADMIN' && (
          <AdminEmpresas
            empresas={empresas}
            onRefresh={() => fetchSession()}
            onSelectEmpresa={(id) => {
              handleSelectEmpresa(id);
              setActiveTab('conversas');
            }}
          />
        )}
        {activeTab === 'admin-numeros' && usuario.perfil === 'SUPER_ADMIN' && (
          <AdminNumeros empresas={empresas} />
        )}
      </main>

      <footer className="bg-[#0D1629] border-t border-[#C5A059]/20 text-[#94A3B8] text-xs py-4 px-6 text-center flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>© 2026 CA.RO TECH • Tecnologia em Secretárias Virtuais com IA para WhatsApp Business.</p>
        <p className="font-mono text-[11px] text-[#C5A059]/80">Barueri, SP • Meta Cloud API Partner Engine</p>
      </footer>
    </div>
  );
}
