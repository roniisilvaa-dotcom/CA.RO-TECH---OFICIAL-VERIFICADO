import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { db } from './server/db.js';
import { gerarRespostaIA } from './server/gemini.js';
import { Empresa, UsuarioPainel } from './src/types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Simple Session / Auth Context helper middleware
  app.use((req: any, _res, next) => {
    // Read headers for auth or fallback to header 'x-user-id'
    const userId = (req.headers['x-user-id'] as string) || 'usr_superadmin';
    const activeEmpresaHeader = req.headers['x-empresa-id'] as string;

    let user = db.usuarios.find((u) => u.id === userId);
    if (!user) {
      user = db.usuarios[0]; // Fallback to Super Admin for default preview ease
    }

    req.user = user;

    // Super admin can switch context or impersonate a company
    if (user.perfil === 'SUPER_ADMIN' && activeEmpresaHeader) {
      req.empresaId = activeEmpresaHeader;
    } else {
      req.empresaId = user.empresaId || 'emp_carotech';
    }

    next();
  });

  // ==========================================
  // 1. WHATSAPP META WEBHOOK (Graph API v20)
  // ==========================================

  // GET: Verification endpoint for Meta Cloud API Webhook
  app.get('/api/webhook', (req: Request, res: Response) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.VERIFY_TOKEN || 'carotech_webhook_token_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('[Webhook Meta] Verification successful!');
      res.status(200).send(challenge);
    } else {
      console.warn('[Webhook Meta] Verification failed. Token mismatch.');
      res.status(403).send('Forbidden');
    }
  });

  // POST: Receiving messages from WhatsApp
  app.post('/api/webhook', async (req: Request, res: Response) => {
    try {
      const body = req.body;
      if (body.object !== 'whatsapp_business_account') {
        res.status(200).send('Not a WhatsApp event');
        return;
      }

      const change = body.entry?.[0]?.changes?.[0]?.value;
      const phoneNumberId = change?.metadata?.phone_number_id;
      const message = change?.messages?.[0];

      if (!phoneNumberId || !message) {
        res.status(200).send('OK');
        return;
      }

      // 1. Identify company by phone_number_id
      const numero = db.getNumeroByPhoneNumberId(phoneNumberId);
      if (!numero) {
        console.log(`[Webhook Meta] Número ${phoneNumberId} não cadastrado.`);
        res.status(200).send('OK');
        return;
      }

      const empresaId = numero.empresaId;
      const telefoneContato = message.from;
      const nomeContatoMeta = change?.contacts?.[0]?.profile?.name || `Contato (${telefoneContato})`;
      const textoRecebido = message.text?.body || '[Mensagem com mídia ou botão]';

      await processarMensagemEntrante(empresaId, telefoneContato, nomeContatoMeta, textoRecebido);

      res.status(200).send('OK');
    } catch (err) {
      console.error('[Webhook Meta Error]:', err);
      res.status(500).send('Internal Error');
    }
  });

  // Helper logic for processing incoming WhatsApp message (Used by Webhook & Simulator)
  async function processarMensagemEntrante(
    empresaId: string,
    telefoneContato: string,
    nomeContato: string,
    textoRecebido: string
  ) {
    // 1. Find or create contact
    let contato = db.contatos.find((c) => c.empresaId === empresaId && c.telefone === telefoneContato);
    if (!contato) {
      contato = {
        id: `ct_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        empresaId,
        telefone: telefoneContato,
        nome: nomeContato,
        criadoEm: new Date().toISOString(),
      };
      db.contatos.push(contato);
    } else if (!contato.nome || contato.nome.startsWith('Contato (')) {
      contato.nome = nomeContato;
    }

    // 2. Find or create open conversation
    let conversa = db.conversas.find((c) => c.empresaId === empresaId && c.contatoId === contato.id && c.status === 'aberta');
    if (!conversa) {
      conversa = {
        id: `cv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        empresaId,
        contatoId: contato.id,
        status: 'aberta',
        atendidoPor: 'ia',
        iniciadaEm: new Date().toISOString(),
        ultimaMensagem: textoRecebido,
        ultimaMensagemData: new Date().toISOString(),
      };
      db.conversas.push(conversa);
    } else {
      conversa.ultimaMensagem = textoRecebido;
      conversa.ultimaMensagemData = new Date().toISOString();
    }

    // 3. Record incoming message
    const msgIn = {
      id: `msg_${Date.now()}_in`,
      conversaId: conversa.id,
      direcao: 'in' as const,
      conteudo: textoRecebido,
      enviadoPor: 'contato' as const,
      criadaEm: new Date().toISOString(),
    };
    db.mensagens.push(msgIn);

    // 4. Check escalation rules for human transfer
    const configIA = db.getConfiguracaoIAByEmpresaId(empresaId);
    const regrasEscalonamento = configIA?.regrasEscalonamento || '';

    // Escalation keywords check
    const gatilhosHumano = ['humano', 'atendente', 'falar com pessoa', 'vendedor', 'suporte humano', 'reclamação', 'cancelar'];
    const gatilhoPersonalizadoEncontrado =
      regrasEscalonamento &&
      regrasEscalonamento
        .toLowerCase()
        .split(/[,;\n]/)
        .some((regra) => regra.trim() && textoRecebido.toLowerCase().includes(regra.trim()));

    const precisaHumano =
      gatilhosHumano.some((g) => textoRecebido.toLowerCase().includes(g)) || gatilhoPersonalizadoEncontrado;

    if (precisaHumano) {
      conversa.atendidoPor = 'humano';
      const msgTransfer = {
        id: `msg_${Date.now()}_sys`,
        conversaId: conversa.id,
        direcao: 'out' as const,
        conteudo: `[Escalonamento Automático]: Atendimento transferido para a equipe humana conforme solicitação do cliente.`,
        enviadoPor: 'ia' as const,
        criadaEm: new Date().toISOString(),
      };
      db.mensagens.push(msgTransfer);

      // Create or update Lead automatically in Kanban
      let leadExistente = db.leads.find((l) => l.empresaId === empresaId && l.contatoId === contato.id);
      if (!leadExistente) {
        db.leads.push({
          id: `ld_${Date.now()}`,
          empresaId,
          contatoId: contato.id,
          etapaFunil: 'novo',
          valorEstimado: 1500,
          observacoes: `Solicitou atendimento humano no WhatsApp: "${textoRecebido}"`,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString(),
        });
      }
    } else if (conversa.atendidoPor === 'ia') {
      // 5. Generate AI Response via Gemini
      const historico = db.getMensagensByConversaId(conversa.id);
      const respostaIA = await gerarRespostaIA(configIA, textoRecebido, historico);

      const msgOut = {
        id: `msg_${Date.now()}_out`,
        conversaId: conversa.id,
        direcao: 'out' as const,
        conteudo: respostaIA,
        enviadoPor: 'ia' as const,
        criadaEm: new Date().toISOString(),
      };
      db.mensagens.push(msgOut);

      conversa.ultimaMensagem = respostaIA;
      conversa.ultimaMensagemData = new Date().toISOString();
    }

    return { conversa, contato };
  }

  // ==========================================
  // 2. WHATSAPP SIMULATOR ENDPOINT (For Panel)
  // ==========================================
  app.post('/api/simulator/send', async (req: any, res: Response) => {
    try {
      const empresaId = req.empresaId;
      const { telefone, nome, mensagem } = req.body;

      if (!telefone || !mensagem) {
        res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
        return;
      }

      const result = await processarMensagemEntrante(
        empresaId,
        telefone,
        nome || `Cliente (${telefone})`,
        mensagem
      );

      const mensagensAtualizadas = db.getMensagensByConversaId(result.conversa.id);

      res.json({
        success: true,
        conversa: result.conversa,
        contato: result.contato,
        mensagens: mensagensAtualizadas,
      });
    } catch (err) {
      console.error('Erro no simulador:', err);
      res.status(500).json({ error: 'Erro ao processar simulação de mensagem.' });
    }
  });

  // ==========================================
  // 3. AUTH & USER MANAGEMENT ENDPOINTS
  // ==========================================
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email } = req.body;
    const user = db.usuarios.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      res.status(401).json({ error: 'Usuário não encontrado. Tente admin@carotech.com.br ou gestor@techstore.com.br' });
      return;
    }

    const empresa = db.getEmpresaById(user.empresaId || 'emp_carotech');
    res.json({ usuario: user, empresaAtiva: empresa });
  });

  app.get('/api/auth/me', (req: any, res: Response) => {
    const empresa = db.getEmpresaById(req.empresaId);
    res.json({ usuario: req.user, empresaAtiva: empresa });
  });

  // ==========================================
  // 4. SUPER ADMIN ENDPOINTS (/api/admin/*)
  // ==========================================

  // List all companies
  app.get('/api/admin/empresas', (req: any, res: Response) => {
    if (req.user.perfil !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso restrito à equipe CA.RO TECH.' });
      return;
    }
    res.json(db.empresas);
  });

  // Create new client company
  app.post('/api/admin/empresas', (req: any, res: Response) => {
    if (req.user.perfil !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso restrito à equipe CA.RO TECH.' });
      return;
    }

    const { nome, cnpj, plano, emailAdmin, nomeAdmin } = req.body;
    if (!nome) {
      res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
      return;
    }

    const novaEmpresa: Empresa = {
      id: `emp_${Date.now()}`,
      nome,
      cnpj: cnpj || '',
      plano: plano || 'padrao',
      ativo: true,
      criadoEm: new Date().toISOString(),
    };
    db.empresas.push(novaEmpresa);

    // Create default AI config
    db.configuracoesIA.push({
      id: `cfg_${Date.now()}`,
      empresaId: novaEmpresa.id,
      nomeAssistente: `Assistente ${nome}`,
      tomDeVoz: 'cordial, rápido e prestativo',
      baseConhecimento: `Empresa ${nome}. Atendimento via WhatsApp.`,
      regrasEscalonamento: 'Se disser humano ou atendente, transferir.',
      llmProvider: 'gemini',
      atualizadoEm: new Date().toISOString(),
    });

    // Create client admin user if email provided
    if (emailAdmin) {
      db.usuarios.push({
        id: `usr_${Date.now()}`,
        empresaId: novaEmpresa.id,
        empresaNome: novaEmpresa.nome,
        nome: nomeAdmin || `Gestor ${nome}`,
        email: emailAdmin,
        perfil: 'CLIENTE_ADMIN',
        criadoEm: new Date().toISOString(),
      });
    }

    res.status(201).json(novaEmpresa);
  });

  // Toggle company active status
  app.put('/api/admin/empresas/:id', (req: any, res: Response) => {
    if (req.user.perfil !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso restrito.' });
      return;
    }
    const empresa = db.getEmpresaById(req.params.id);
    if (!empresa) {
      res.status(404).json({ error: 'Empresa não encontrada.' });
      return;
    }

    if (req.body.ativo !== undefined) empresa.ativo = req.body.ativo;
    if (req.body.nome) empresa.nome = req.body.nome;
    if (req.body.plano) empresa.plano = req.body.plano;

    res.json(empresa);
  });

  // Delete company
  app.delete('/api/admin/empresas/:id', (req: any, res: Response) => {
    if (req.user.perfil !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Acesso restrito.' });
      return;
    }
    db.empresas = db.empresas.filter((e) => e.id !== req.params.id);
    res.json({ success: true });
  });

  // WhatsApp Numbers Management
  app.get('/api/admin/numeros', (req: any, res: Response) => {
    if (req.user.perfil === 'SUPER_ADMIN') {
      res.json(db.numeros);
    } else {
      res.json(db.numeros.filter((n) => n.empresaId === req.empresaId));
    }
  });

  app.post('/api/admin/numeros', (req: any, res: Response) => {
    if (req.user.perfil !== 'SUPER_ADMIN') {
      res.status(403).json({ error: 'Apenas a equipe CA.RO TECH pode conectar números Meta.' });
      return;
    }

    const { empresaId, phoneNumberId, wabaId, numeroExibicao, tokenAcesso } = req.body;
    if (!empresaId || !phoneNumberId || !tokenAcesso) {
      res.status(400).json({ error: 'Empresa ID, Phone Number ID e Token de Acesso são obrigatórios.' });
      return;
    }

    const novoNumero = {
      id: `num_${Date.now()}`,
      empresaId,
      phoneNumberId,
      wabaId: wabaId || 'WABA_' + phoneNumberId,
      numeroExibicao: numeroExibicao || '+55 11 90000-0000',
      tokenAcesso,
      status: 'conectado' as const,
      criadoEm: new Date().toISOString(),
    };

    db.numeros.push(novoNumero);
    res.status(201).json(novoNumero);
  });

  // ==========================================
  // 5. CLIENT AREA TENANT ENDPOINTS (/api/...)
  // ==========================================

  // Get AI Config for current company
  app.get('/api/configuracao-ia', (req: any, res: Response) => {
    const config = db.getConfiguracaoIAByEmpresaId(req.empresaId);
    res.json(config);
  });

  // Update AI Config
  app.put('/api/configuracao-ia', (req: any, res: Response) => {
    if (req.user.perfil === 'CLIENTE_OPERADOR') {
      res.status(403).json({ error: 'Operadores não têm permissão para reconfigurar a IA.' });
      return;
    }

    const config = db.getConfiguracaoIAByEmpresaId(req.empresaId);
    const { nomeAssistente, tomDeVoz, baseConhecimento, regrasEscalonamento, llmProvider } = req.body;

    if (nomeAssistente) config.nomeAssistente = nomeAssistente;
    if (tomDeVoz) config.tomDeVoz = tomDeVoz;
    if (baseConhecimento !== undefined) config.baseConhecimento = baseConhecimento;
    if (regrasEscalonamento !== undefined) config.regrasEscalonamento = regrasEscalonamento;
    if (llmProvider) config.llmProvider = llmProvider;
    config.atualizadoEm = new Date().toISOString();

    res.json(config);
  });

  // Test AI prompt live
  app.post('/api/test-ia', async (req: any, res: Response) => {
    const { mensagem } = req.body;
    const config = db.getConfiguracaoIAByEmpresaId(req.empresaId);
    const resposta = await gerarRespostaIA(config, mensagem || 'Olá, quais os serviços de vocês?');
    res.json({ resposta });
  });

  // Conversations
  app.get('/api/conversas', (req: any, res: Response) => {
    const conversas = db.getConversasByEmpresaId(req.empresaId);
    res.json(conversas);
  });

  app.get('/api/conversas/:id/mensagens', (req: any, res: Response) => {
    const conversa = db.conversas.find((c) => c.id === req.params.id && c.empresaId === req.empresaId);
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }
    const mensagens = db.getMensagensByConversaId(conversa.id);
    const contato = db.contatos.find((ct) => ct.id === conversa.contatoId);
    res.json({ conversa, contato, mensagens });
  });

  // Send manual human operator message
  app.post('/api/conversas/:id/mensagens', (req: any, res: Response) => {
    const conversa = db.conversas.find((c) => c.id === req.params.id && c.empresaId === req.empresaId);
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }

    const { conteudo } = req.body;
    if (!conteudo) {
      res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório.' });
      return;
    }

    // Set atendidoPor to humano when human messages
    conversa.atendidoPor = 'humano';
    conversa.ultimaMensagem = conteudo;
    conversa.ultimaMensagemData = new Date().toISOString();

    const novaMensagem = {
      id: `msg_${Date.now()}_hum`,
      conversaId: conversa.id,
      direcao: 'out' as const,
      conteudo,
      enviadoPor: 'humano' as const,
      criadaEm: new Date().toISOString(),
    };
    db.mensagens.push(novaMensagem);

    res.status(201).json(novaMensagem);
  });

  // Update conversation status or atendidoPor
  app.put('/api/conversas/:id/status', (req: any, res: Response) => {
    const conversa = db.conversas.find((c) => c.id === req.params.id && c.empresaId === req.empresaId);
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }

    if (req.body.status) conversa.status = req.body.status;
    if (req.body.atendidoPor) conversa.atendidoPor = req.body.atendidoPor;

    res.json(conversa);
  });

  // Leads (Kanban)
  app.get('/api/leads', (req: any, res: Response) => {
    const leads = db.getLeadsByEmpresaId(req.empresaId);
    res.json(leads);
  });

  app.post('/api/leads', (req: any, res: Response) => {
    const { contatoId, nomeContato, telefoneContato, etapaFunil, valorEstimado, observacoes } = req.body;
    const empresaId = req.empresaId;

    let targetContatoId = contatoId;
    if (!targetContatoId && telefoneContato) {
      let contato = db.contatos.find((c) => c.empresaId === empresaId && c.telefone === telefoneContato);
      if (!contato) {
        contato = {
          id: `ct_${Date.now()}`,
          empresaId,
          telefone: telefoneContato,
          nome: nomeContato || `Contato (${telefoneContato})`,
          criadoEm: new Date().toISOString(),
        };
        db.contatos.push(contato);
      }
      targetContatoId = contato.id;
    }

    if (!targetContatoId) {
      res.status(400).json({ error: 'Contato ou telefone é obrigatório.' });
      return;
    }

    const novoLead = {
      id: `ld_${Date.now()}`,
      empresaId,
      contatoId: targetContatoId,
      etapaFunil: etapaFunil || 'novo',
      valorEstimado: valorEstimado ? parseFloat(valorEstimado) : 0,
      observacoes: observacoes || '',
      criadoEm: new Date().toISOString(),
      atualizadoEm: new Date().toISOString(),
    };
    db.leads.push(novoLead);

    res.status(201).json({
      ...novoLead,
      contato: db.contatos.find((c) => c.id === targetContatoId),
    });
  });

  app.put('/api/leads/:id', (req: any, res: Response) => {
    const lead = db.leads.find((l) => l.id === req.params.id && l.empresaId === req.empresaId);
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    if (req.body.etapaFunil) lead.etapaFunil = req.body.etapaFunil;
    if (req.body.valorEstimado !== undefined) lead.valorEstimado = parseFloat(req.body.valorEstimado);
    if (req.body.observacoes !== undefined) lead.observacoes = req.body.observacoes;
    lead.atualizadoEm = new Date().toISOString();

    res.json({
      ...lead,
      contato: db.contatos.find((c) => c.id === lead.contatoId),
    });
  });

  app.delete('/api/leads/:id', (req: any, res: Response) => {
    db.leads = db.leads.filter((l) => l.id !== req.params.id || l.empresaId !== req.empresaId);
    res.json({ success: true });
  });

  // Team Operators
  app.get('/api/equipe', (req: any, res: Response) => {
    const equipe = db.getUsuariosByEmpresaId(req.empresaId);
    res.json(equipe);
  });

  app.post('/api/equipe', (req: any, res: Response) => {
    if (req.user.perfil === 'CLIENTE_OPERADOR') {
      res.status(403).json({ error: 'Apenas administradores podem convidar operadores.' });
      return;
    }

    const { nome, email, perfil } = req.body;
    if (!nome || !email) {
      res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      return;
    }

    const novoUsuario: UsuarioPainel = {
      id: `usr_${Date.now()}`,
      empresaId: req.empresaId,
      empresaNome: db.getEmpresaById(req.empresaId)?.nome,
      nome,
      email,
      perfil: perfil || 'CLIENTE_OPERADOR',
      criadoEm: new Date().toISOString(),
    };
    db.usuarios.push(novoUsuario);

    res.status(201).json(novoUsuario);
  });

  // Global Dashboard Statistics Endpoint
  app.get('/api/stats', (req: any, res: Response) => {
    const isSuperAdmin = req.user.perfil === 'SUPER_ADMIN' && !req.headers['x-empresa-id'];

    if (isSuperAdmin) {
      res.json({
        totalEmpresasAtivas: db.empresas.filter((e) => e.ativo).length,
        totalNumerosConectados: db.numeros.filter((n) => n.status === 'conectado').length,
        totalConversas: db.conversas.length,
        totalMensagensMes: db.mensagens.length,
        totalLeadsGerados: db.leads.length,
      });
    } else {
      const conversas = db.getConversasByEmpresaId(req.empresaId);
      const leads = db.getLeadsByEmpresaId(req.empresaId);
      const conversasHumano = conversas.filter((c) => c.atendidoPor === 'humano').length;
      const conversasIA = conversas.filter((c) => c.atendidoPor === 'ia').length;

      res.json({
        totalConversas: conversas.length,
        conversasIA,
        conversasHumano,
        totalLeads: leads.length,
        valorTotalLeads: leads.reduce((sum, l) => sum + (l.valorEstimado || 0), 0),
        leadsPorEtapa: {
          novo: leads.filter((l) => l.etapaFunil === 'novo').length,
          em_negociacao: leads.filter((l) => l.etapaFunil === 'em_negociacao').length,
          ganho: leads.filter((l) => l.etapaFunil === 'ganho').length,
          perdido: leads.filter((l) => l.etapaFunil === 'perdido').length,
        },
      });
    }
  });

  // ==========================================
  // VITE DEVELOPMENT MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Painel CA.RO TECH] Servidor rodando em http://0.0.0.0:${PORT}`);
  });
}

startServer();
