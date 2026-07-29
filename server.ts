import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { prisma } from './server/prisma.js';
import { gerarRespostaIA } from './server/gemini.js';
import { seedSeNecessario } from './server/seed.js';
import {
  verificarSenha,
  assinarSessao,
  definirCookieSessao,
  limparCookieSessao,
  carregarSessao,
  exigirLogin,
  exigirSuperAdmin,
} from './server/auth.js';

dotenv.config();

function sanitizeUsuario(u: any) {
  const { senhaHash, ...rest } = u;
  return rest;
}

async function startServer() {
  try {
    await seedSeNecessario();
  } catch (err) {
    console.error('[Seed] Falha ao rodar seed automático:', err);
  }

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());
  app.use(cookieParser());
  app.use(carregarSessao);

  // ==========================================
  // 1. WHATSAPP META WEBHOOK (Graph API v20)
  // ==========================================

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

      const numero = await prisma.numeroWhatsapp.findUnique({ where: { phoneNumberId } });
      if (!numero) {
        console.log(`[Webhook Meta] Número ${phoneNumberId} não cadastrado.`);
        res.status(200).send('OK');
        return;
      }

      const telefoneContato = message.from;
      const nomeContatoMeta = change?.contacts?.[0]?.profile?.name || `Contato (${telefoneContato})`;
      const textoRecebido = message.text?.body || '[Mensagem com mídia ou botão]';

      await processarMensagemEntrante(numero.empresaId, telefoneContato, nomeContatoMeta, textoRecebido, numero);

      res.status(200).send('OK');
    } catch (err) {
      console.error('[Webhook Meta Error]:', err);
      res.status(500).send('Internal Error');
    }
  });

  async function enviarMensagemMeta(numero: { phoneNumberId: string; tokenAcesso: string }, to: string, texto: string) {
    // Fallback: se o token salvo no banco ainda for o placeholder, usa o token
    // permanente configurado via variável de ambiente (META_TOKEN_CAROTECH) no Railway.
    const tokenReal =
      !numero.tokenAcesso || numero.tokenAcesso === 'SUBSTITUIR_PELO_TOKEN_PERMANENTE'
        ? process.env.META_TOKEN_CAROTECH
        : numero.tokenAcesso;

    if (!tokenReal) {
      console.log('[Meta API] Token ainda não configurado - envio real pulado (modo simulação).');
      return;
    }
    try {
      const url = `https://graph.facebook.com/v20.0/${numero.phoneNumberId}/messages`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenReal}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          type: 'text',
          text: { body: texto },
        }),
      });
    } catch (err) {
      console.error('[Meta API] Erro ao enviar mensagem real:', err);
    }
  }

  async function processarMensagemEntrante(
    empresaId: string,
    telefoneContato: string,
    nomeContato: string,
    textoRecebido: string,
    numero?: { phoneNumberId: string; tokenAcesso: string } | null
  ) {
    let contato = await prisma.contato.findUnique({
      where: { empresaId_telefone: { empresaId, telefone: telefoneContato } },
    });
    if (!contato) {
      contato = await prisma.contato.create({
        data: { empresaId, telefone: telefoneContato, nome: nomeContato },
      });
    } else if (!contato.nome || contato.nome.startsWith('Contato (')) {
      contato = await prisma.contato.update({ where: { id: contato.id }, data: { nome: nomeContato } });
    }

    let conversa = await prisma.conversa.findFirst({
      where: { empresaId, contatoId: contato.id, status: 'aberta' },
    });
    if (!conversa) {
      conversa = await prisma.conversa.create({
        data: {
          empresaId,
          contatoId: contato.id,
          atendidoPor: 'ia',
          ultimaMensagem: textoRecebido,
          ultimaMensagemData: new Date(),
        },
      });
    } else {
      conversa = await prisma.conversa.update({
        where: { id: conversa.id },
        data: { ultimaMensagem: textoRecebido, ultimaMensagemData: new Date() },
      });
    }

    await prisma.mensagem.create({
      data: { conversaId: conversa.id, direcao: 'in', conteudo: textoRecebido, enviadoPor: 'contato' },
    });

    const configIA = await prisma.configuracaoIA.findUnique({ where: { empresaId } });
    const regrasEscalonamento = configIA?.regrasEscalonamento || '';

    const gatilhosHumano = ['humano', 'atendente', 'falar com pessoa', 'vendedor', 'suporte humano', 'reclamação', 'cancelar'];
    const gatilhoPersonalizado =
      regrasEscalonamento &&
      regrasEscalonamento
        .toLowerCase()
        .split(/[,;\n]/)
        .some((regra) => regra.trim() && textoRecebido.toLowerCase().includes(regra.trim()));

    const precisaHumano = gatilhosHumano.some((g) => textoRecebido.toLowerCase().includes(g)) || gatilhoPersonalizado;

    if (precisaHumano) {
      conversa = await prisma.conversa.update({ where: { id: conversa.id }, data: { atendidoPor: 'humano' } });

      await prisma.mensagem.create({
        data: {
          conversaId: conversa.id,
          direcao: 'out',
          conteudo: '[Escalonamento Automático]: Atendimento transferido para a equipe humana conforme solicitação do cliente.',
          enviadoPor: 'ia',
        },
      });

      const leadExistente = await prisma.lead.findFirst({ where: { empresaId, contatoId: contato.id } });
      if (!leadExistente) {
        await prisma.lead.create({
          data: {
            empresaId,
            contatoId: contato.id,
            etapaFunil: 'novo',
            valorEstimado: 1500,
            observacoes: `Solicitou atendimento humano no WhatsApp: "${textoRecebido}"`,
          },
        });
      }
    } else if (conversa.atendidoPor === 'ia') {
      const historico = await prisma.mensagem.findMany({
        where: { conversaId: conversa.id },
        orderBy: { criadaEm: 'asc' },
      });
      const respostaIA = await gerarRespostaIA(configIA as any, textoRecebido, historico as any);

      await prisma.mensagem.create({
        data: { conversaId: conversa.id, direcao: 'out', conteudo: respostaIA, enviadoPor: 'ia' },
      });

      conversa = await prisma.conversa.update({
        where: { id: conversa.id },
        data: { ultimaMensagem: respostaIA, ultimaMensagemData: new Date() },
      });

      if (numero) {
        await enviarMensagemMeta(numero, telefoneContato, respostaIA);
      }
    }

    return { conversa, contato };
  }

  // ==========================================
  // 2. SIMULADOR (usado dentro do painel, sem WhatsApp real)
  // ==========================================
  app.post('/api/simulator/send', exigirLogin, async (req: any, res: Response) => {
    try {
      const empresaId = req.empresaId;
      const { telefone, nome, mensagem } = req.body;
      if (!telefone || !mensagem) {
        res.status(400).json({ error: 'Telefone e mensagem são obrigatórios.' });
        return;
      }

      const result = await processarMensagemEntrante(empresaId, telefone, nome || `Cliente (${telefone})`, mensagem);
      const mensagensAtualizadas = await prisma.mensagem.findMany({
        where: { conversaId: result.conversa.id },
        orderBy: { criadaEm: 'asc' },
      });

      res.json({ success: true, conversa: result.conversa, contato: result.contato, mensagens: mensagensAtualizadas });
    } catch (err) {
      console.error('Erro no simulador:', err);
      res.status(500).json({ error: 'Erro ao processar simulação de mensagem.' });
    }
  });

  // ==========================================
  // 3. AUTENTICAÇÃO (com senha real)
  // ==========================================
  app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, senha } = req.body;
    if (!email || !senha) {
      res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
      return;
    }

    const usuario = await prisma.usuarioPainel.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!usuario) {
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      return;
    }

    const senhaOk = await verificarSenha(senha, usuario.senhaHash);
    if (!senhaOk) {
      res.status(401).json({ error: 'E-mail ou senha inválidos.' });
      return;
    }

    const token = assinarSessao(usuario.id);
    definirCookieSessao(res, token);

    const empresa = usuario.empresaId ? await prisma.empresa.findUnique({ where: { id: usuario.empresaId } }) : null;
    res.json({ usuario: sanitizeUsuario(usuario), empresaAtiva: empresa });
  });

  app.post('/api/auth/logout', (req: Request, res: Response) => {
    limparCookieSessao(res);
    res.json({ success: true });
  });

  app.get('/api/auth/me', exigirLogin, async (req: any, res: Response) => {
    const empresaId = req.empresaId;
    const empresa = empresaId ? await prisma.empresa.findUnique({ where: { id: empresaId } }) : null;
    res.json({ usuario: sanitizeUsuario(req.user), empresaAtiva: empresa });
  });

  // ==========================================
  // 4. SUPER ADMIN (/api/admin/*)
  // ==========================================
  app.get('/api/admin/empresas', exigirLogin, exigirSuperAdmin, async (_req: any, res: Response) => {
    const empresas = await prisma.empresa.findMany({ orderBy: { criadoEm: 'asc' } });
    res.json(empresas);
  });

  app.post('/api/admin/empresas', exigirLogin, exigirSuperAdmin, async (req: any, res: Response) => {
    const { nome, cnpj, plano, emailAdmin, nomeAdmin } = req.body;
    if (!nome) {
      res.status(400).json({ error: 'Nome da empresa é obrigatório.' });
      return;
    }

    const novaEmpresa = await prisma.empresa.create({
      data: { nome, cnpj: cnpj || '', plano: plano || 'padrao' },
    });

    await prisma.configuracaoIA.create({
      data: {
        empresaId: novaEmpresa.id,
        nomeAssistente: `Assistente ${nome}`,
        tomDeVoz: 'cordial, rápido e prestativo',
        baseConhecimento: `Empresa ${nome}. Atendimento via WhatsApp.`,
        regrasEscalonamento: 'Se disser humano ou atendente, transferir.',
        llmProvider: 'gemini',
      },
    });

    if (emailAdmin) {
      const bcrypt = await import('bcryptjs');
      const senhaTemporaria = Math.random().toString(36).slice(-10);
      const senhaHash = await bcrypt.hash(senhaTemporaria, 10);
      await prisma.usuarioPainel.create({
        data: {
          empresaId: novaEmpresa.id,
          nome: nomeAdmin || `Gestor ${nome}`,
          email: emailAdmin,
          senhaHash,
          perfil: 'CLIENTE_ADMIN',
        },
      });
      // eslint-disable-next-line no-console
      console.log(`[Admin] Usuário ${emailAdmin} criado com senha temporária: ${senhaTemporaria} (envie para o cliente trocar no primeiro acesso)`);
    }

    res.status(201).json(novaEmpresa);
  });

  app.put('/api/admin/empresas/:id', exigirLogin, exigirSuperAdmin, async (req: any, res: Response) => {
    const data: any = {};
    if (req.body.ativo !== undefined) data.ativo = req.body.ativo;
    if (req.body.nome) data.nome = req.body.nome;
    if (req.body.plano) data.plano = req.body.plano;

    try {
      const empresa = await prisma.empresa.update({ where: { id: req.params.id }, data });
      res.json(empresa);
    } catch {
      res.status(404).json({ error: 'Empresa não encontrada.' });
    }
  });

  app.delete('/api/admin/empresas/:id', exigirLogin, exigirSuperAdmin, async (req: any, res: Response) => {
    await prisma.empresa.delete({ where: { id: req.params.id } }).catch(() => null);
    res.json({ success: true });
  });

  app.get('/api/admin/numeros', exigirLogin, async (req: any, res: Response) => {
    if (req.user.perfil === 'SUPER_ADMIN') {
      const numeros = await prisma.numeroWhatsapp.findMany();
      res.json(numeros);
    } else {
      const numeros = await prisma.numeroWhatsapp.findMany({ where: { empresaId: req.empresaId } });
      res.json(numeros);
    }
  });

  app.post('/api/admin/numeros', exigirLogin, exigirSuperAdmin, async (req: any, res: Response) => {
    const { empresaId, phoneNumberId, wabaId, numeroExibicao, tokenAcesso } = req.body;
    if (!empresaId || !phoneNumberId || !tokenAcesso) {
      res.status(400).json({ error: 'Empresa ID, Phone Number ID e Token de Acesso são obrigatórios.' });
      return;
    }

    const novoNumero = await prisma.numeroWhatsapp.create({
      data: {
        empresaId,
        phoneNumberId,
        wabaId: wabaId || 'WABA_' + phoneNumberId,
        numeroExibicao: numeroExibicao || '+55 11 90000-0000',
        tokenAcesso,
        status: 'conectado',
      },
    });

    res.status(201).json(novoNumero);
  });

  // ==========================================
  // 5. ÁREA DO CLIENTE (multi-tenant, escopo por empresaId da sessão)
  // ==========================================
  app.get('/api/configuracao-ia', exigirLogin, async (req: any, res: Response) => {
    const config = await prisma.configuracaoIA.findUnique({ where: { empresaId: req.empresaId } });
    res.json(config);
  });

  app.put('/api/configuracao-ia', exigirLogin, async (req: any, res: Response) => {
    if (req.user.perfil === 'CLIENTE_OPERADOR') {
      res.status(403).json({ error: 'Operadores não têm permissão para reconfigurar a IA.' });
      return;
    }

    const { nomeAssistente, tomDeVoz, baseConhecimento, regrasEscalonamento, llmProvider } = req.body;
    const config = await prisma.configuracaoIA.update({
      where: { empresaId: req.empresaId },
      data: {
        ...(nomeAssistente && { nomeAssistente }),
        ...(tomDeVoz && { tomDeVoz }),
        ...(baseConhecimento !== undefined && { baseConhecimento }),
        ...(regrasEscalonamento !== undefined && { regrasEscalonamento }),
        ...(llmProvider && { llmProvider }),
      },
    });

    res.json(config);
  });

  app.post('/api/test-ia', exigirLogin, async (req: any, res: Response) => {
    const { mensagem } = req.body;
    const config = await prisma.configuracaoIA.findUnique({ where: { empresaId: req.empresaId } });
    const resposta = await gerarRespostaIA(config as any, mensagem || 'Olá, quais os serviços de vocês?');
    res.json({ resposta });
  });

  app.get('/api/conversas', exigirLogin, async (req: any, res: Response) => {
    const conversas = await prisma.conversa.findMany({
      where: { empresaId: req.empresaId },
      include: { contato: true },
      orderBy: { iniciadaEm: 'desc' },
    });
    res.json(conversas);
  });

  app.get('/api/conversas/:id/mensagens', exigirLogin, async (req: any, res: Response) => {
    const conversa = await prisma.conversa.findFirst({ where: { id: req.params.id, empresaId: req.empresaId } });
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }
    const mensagens = await prisma.mensagem.findMany({ where: { conversaId: conversa.id }, orderBy: { criadaEm: 'asc' } });
    const contato = await prisma.contato.findUnique({ where: { id: conversa.contatoId } });
    res.json({ conversa, contato, mensagens });
  });

  app.post('/api/conversas/:id/mensagens', exigirLogin, async (req: any, res: Response) => {
    const conversa = await prisma.conversa.findFirst({ where: { id: req.params.id, empresaId: req.empresaId } });
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }
    const { conteudo } = req.body;
    if (!conteudo) {
      res.status(400).json({ error: 'Conteúdo da mensagem é obrigatório.' });
      return;
    }

    await prisma.conversa.update({
      where: { id: conversa.id },
      data: { atendidoPor: 'humano', ultimaMensagem: conteudo, ultimaMensagemData: new Date() },
    });

    const novaMensagem = await prisma.mensagem.create({
      data: { conversaId: conversa.id, direcao: 'out', conteudo, enviadoPor: 'humano' },
    });

    const numero = await prisma.numeroWhatsapp.findFirst({ where: { empresaId: req.empresaId } });
    const contato = await prisma.contato.findUnique({ where: { id: conversa.contatoId } });
    if (numero && contato) {
      await enviarMensagemMeta(numero, contato.telefone, conteudo);
    }

    res.status(201).json(novaMensagem);
  });

  app.put('/api/conversas/:id/status', exigirLogin, async (req: any, res: Response) => {
    const conversa = await prisma.conversa.findFirst({ where: { id: req.params.id, empresaId: req.empresaId } });
    if (!conversa) {
      res.status(404).json({ error: 'Conversa não encontrada.' });
      return;
    }
    const data: any = {};
    if (req.body.status) data.status = req.body.status;
    if (req.body.atendidoPor) data.atendidoPor = req.body.atendidoPor;

    const atualizado = await prisma.conversa.update({ where: { id: conversa.id }, data });
    res.json(atualizado);
  });

  app.get('/api/leads', exigirLogin, async (req: any, res: Response) => {
    const leads = await prisma.lead.findMany({
      where: { empresaId: req.empresaId },
      include: { contato: true },
      orderBy: { atualizadoEm: 'desc' },
    });
    res.json(leads);
  });

  app.post('/api/leads', exigirLogin, async (req: any, res: Response) => {
    const { contatoId, nomeContato, telefoneContato, etapaFunil, valorEstimado, observacoes } = req.body;
    const empresaId = req.empresaId;

    let targetContatoId = contatoId;
    if (!targetContatoId && telefoneContato) {
      let contato = await prisma.contato.findUnique({
        where: { empresaId_telefone: { empresaId, telefone: telefoneContato } },
      });
      if (!contato) {
        contato = await prisma.contato.create({
          data: { empresaId, telefone: telefoneContato, nome: nomeContato || `Contato (${telefoneContato})` },
        });
      }
      targetContatoId = contato.id;
    }

    if (!targetContatoId) {
      res.status(400).json({ error: 'Contato ou telefone é obrigatório.' });
      return;
    }

    const novoLead = await prisma.lead.create({
      data: {
        empresaId,
        contatoId: targetContatoId,
        etapaFunil: etapaFunil || 'novo',
        valorEstimado: valorEstimado ? parseFloat(valorEstimado) : 0,
        observacoes: observacoes || '',
      },
      include: { contato: true },
    });

    res.status(201).json(novoLead);
  });

  app.put('/api/leads/:id', exigirLogin, async (req: any, res: Response) => {
    const lead = await prisma.lead.findFirst({ where: { id: req.params.id, empresaId: req.empresaId } });
    if (!lead) {
      res.status(404).json({ error: 'Lead não encontrado.' });
      return;
    }

    const data: any = {};
    if (req.body.etapaFunil) data.etapaFunil = req.body.etapaFunil;
    if (req.body.valorEstimado !== undefined) data.valorEstimado = parseFloat(req.body.valorEstimado);
    if (req.body.observacoes !== undefined) data.observacoes = req.body.observacoes;

    const atualizado = await prisma.lead.update({ where: { id: lead.id }, data, include: { contato: true } });
    res.json(atualizado);
  });

  app.delete('/api/leads/:id', exigirLogin, async (req: any, res: Response) => {
    await prisma.lead.deleteMany({ where: { id: req.params.id, empresaId: req.empresaId } });
    res.json({ success: true });
  });

  app.get('/api/equipe', exigirLogin, async (req: any, res: Response) => {
    const equipe = await prisma.usuarioPainel.findMany({ where: { empresaId: req.empresaId } });
    res.json(equipe.map(sanitizeUsuario));
  });

  app.post('/api/equipe', exigirLogin, async (req: any, res: Response) => {
    if (req.user.perfil === 'CLIENTE_OPERADOR') {
      res.status(403).json({ error: 'Apenas administradores podem convidar operadores.' });
      return;
    }
    const { nome, email, perfil } = req.body;
    if (!nome || !email) {
      res.status(400).json({ error: 'Nome e e-mail são obrigatórios.' });
      return;
    }

    const bcrypt = await import('bcryptjs');
    const senhaTemporaria = Math.random().toString(36).slice(-10);
    const senhaHash = await bcrypt.hash(senhaTemporaria, 10);

    const novoUsuario = await prisma.usuarioPainel.create({
      data: { empresaId: req.empresaId, nome, email, senhaHash, perfil: perfil || 'CLIENTE_OPERADOR' },
    });
    console.log(`[Equipe] Usuário ${email} criado com senha temporária: ${senhaTemporaria}`);

    res.status(201).json(sanitizeUsuario(novoUsuario));
  });

  app.get('/api/stats', exigirLogin, async (req: any, res: Response) => {
    const isSuperAdminGlobal = req.user.perfil === 'SUPER_ADMIN' && !req.headers['x-empresa-id'];

    if (isSuperAdminGlobal) {
      const [totalEmpresasAtivas, totalNumerosConectados, totalConversas, totalMensagensMes, totalLeadsGerados] = await Promise.all([
        prisma.empresa.count({ where: { ativo: true } }),
        prisma.numeroWhatsapp.count({ where: { status: 'conectado' } }),
        prisma.conversa.count(),
        prisma.mensagem.count(),
        prisma.lead.count(),
      ]);
      res.json({ totalEmpresasAtivas, totalNumerosConectados, totalConversas, totalMensagensMes, totalLeadsGerados });
    } else {
      const empresaId = req.empresaId;
      const [conversasIA, conversasHumano, totalLeads, leads] = await Promise.all([
        prisma.conversa.count({ where: { empresaId, atendidoPor: 'ia' } }),
        prisma.conversa.count({ where: { empresaId, atendidoPor: 'humano' } }),
        prisma.lead.count({ where: { empresaId } }),
        prisma.lead.findMany({ where: { empresaId } }),
      ]);

      res.json({
        totalConversas: conversasIA + conversasHumano,
        conversasIA,
        conversasHumano,
        totalLeads,
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
  // VITE DEV MIDDLEWARE / STATIC ASSETS
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
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
