import {
  Empresa,
  NumeroWhatsapp,
  ConfiguracaoIA,
  Contato,
  Conversa,
  Mensagem,
  Lead,
  UsuarioPainel,
} from '../src/types.js';

// Pre-seeded multi-tenant database
class DatabaseStore {
  empresas: Empresa[] = [
    {
      id: 'emp_carotech',
      nome: 'CA.RO TECH (Camila & Roni)',
      cnpj: '48.912.345/0001-90',
      plano: 'interno',
      ativo: true,
      criadoEm: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'emp_techstore',
      nome: 'Tech Store Celulares',
      cnpj: '12.345.678/0001-00',
      plano: 'premium',
      ativo: true,
      criadoEm: '2026-02-15T14:30:00.000Z',
    },
    {
      id: 'emp_odontocare',
      nome: 'OdontoCare Barueri',
      cnpj: '98.765.432/0001-11',
      plano: 'padrao',
      ativo: true,
      criadoEm: '2026-03-01T09:15:00.000Z',
    },
  ];

  usuarios: UsuarioPainel[] = [
    {
      id: 'usr_superadmin',
      empresaId: 'emp_carotech',
      empresaNome: 'CA.RO TECH (Camila & Roni)',
      nome: 'RONI SILVA',
      email: 'admin@carotech.com.br',
      perfil: 'SUPER_ADMIN',
      criadoEm: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 'usr_techadmin',
      empresaId: 'emp_techstore',
      empresaNome: 'Tech Store Celulares',
      nome: 'Lucas Silva (Gestor Tech Store)',
      email: 'gestor@techstore.com.br',
      perfil: 'CLIENTE_ADMIN',
      criadoEm: '2026-02-15T14:30:00.000Z',
    },
    {
      id: 'usr_techop',
      empresaId: 'emp_techstore',
      empresaNome: 'Tech Store Celulares',
      nome: 'Maria Atendente',
      email: 'atendente@techstore.com.br',
      perfil: 'CLIENTE_OPERADOR',
      criadoEm: '2026-02-16T08:00:00.000Z',
    },
    {
      id: 'usr_odonto',
      empresaId: 'emp_odontocare',
      empresaNome: 'OdontoCare Barueri',
      nome: 'Dra. Patricia Lima',
      email: 'patricia@odontocare.com.br',
      perfil: 'CLIENTE_ADMIN',
      criadoEm: '2026-03-01T09:15:00.000Z',
    },
  ];

  numeros: NumeroWhatsapp[] = [
    {
      id: 'num_carotech',
      empresaId: 'emp_carotech',
      phoneNumberId: '109823471928374',
      wabaId: '203948571029384',
      numeroExibicao: '+55 11 91228-2810',
      tokenAcesso: 'EAA1234567890CAROTECHTOKENPERMANENTE',
      status: 'conectado',
      criadoEm: '2026-01-10T10:05:00.000Z',
    },
    {
      id: 'num_techstore',
      empresaId: 'emp_techstore',
      phoneNumberId: '105551234567890',
      wabaId: '208881234567890',
      numeroExibicao: '+55 11 98888-7777',
      tokenAcesso: 'EAA9876543210TECHSTORETOKENPERMANENTE',
      status: 'conectado',
      criadoEm: '2026-02-15T15:00:00.000Z',
    },
  ];

  configuracoesIA: ConfiguracaoIA[] = [
    {
      id: 'cfg_carotech',
      empresaId: 'emp_carotech',
      nomeAssistente: 'Secretária Virtual CA.RO TECH',
      tomDeVoz: 'altamente profissional, tecnológico, acolhedor e consultivo',
      baseConhecimento: `A CA.RO TECH desenvolve secretárias virtuais inteligentes com IA integradas ao WhatsApp Business Oficial para empresas em Barueri, Alphaville e todo o Brasil.
Nossos diferenciais:
1. Atendimento 24/7 sem fila de espera.
2. Transferência inteligente para atendentes humanos quando necessário.
3. Funil de vendas automático com Kanban de leads.
4. Planos: Padrão (R$ 490/mês) e Premium com consultoria de prospecção (R$ 890/mês).
Endereço: Alameda Rio Negro, 500 - Alphaville, Barueri - SP.`,
      regrasEscalonamento: 'Se o cliente disser "quero falar com atendente", "humano", "suporte técnico" ou "cancelar", transferir imediatamente.',
      llmProvider: 'gemini',
      atualizadoEm: '2026-07-28T10:00:00.000Z',
    },
    {
      id: 'cfg_techstore',
      empresaId: 'emp_techstore',
      nomeAssistente: 'Sofia da Tech Store',
      tomDeVoz: 'amigável, dinâmico, transparente e focado em fechar negócios',
      baseConhecimento: `Tech Store Celulares - A melhor loja de smartphones novos e seminovos de Barueri!
Serviços e Ofertas:
- Vendas de iPhones do iPhone 11 ao iPhone 16 Pro Max.
- Compra e Troca com Troco: Avaliamos o seu seminovo no ato!
- Garantia de 1 ano em todos os aparelhos com Nota Fiscal.
- Pagamento em até 18x no cartão de crédito ou à vista via PIX com 5% de desconto.
- Horário de Funcionamento: Segunda a Sábado das 09h às 20h.
- Endereço: Av. Henriqueta Mendes Guerra, 320 - Centro, Barueri - SP.`,
      regrasEscalonamento: 'Se o cliente solicitar avaliação específica do celular usado ou disser "humano", "vendedor", "falar com alguém", transferir para a equipe humana.',
      llmProvider: 'gemini',
      atualizadoEm: '2026-07-28T14:20:00.000Z',
    },
    {
      id: 'cfg_odontocare',
      empresaId: 'emp_odontocare',
      nomeAssistente: 'Dra. Bia OdontoCare',
      tomDeVoz: 'cordial, empático, tranqüilizador e direto',
      baseConhecimento: `OdontoCare Barueri - Clínica Odontológica Especializada.
Tratamentos: Ortodontia (Aparelhos e Alinhadores), Clareamento a Laser, Implantes, Próteses e Limpeza Preventiva.
Convênios Aceitos: Amil Dental, SulAmérica e Bradesco Dental.
Atendimento de Urgência de Segunda a Sexta das 08h às 19h.`,
      regrasEscalonamento: 'Se disser "urgência", "dor de dente", "falar com Dra", "atendente", transferir.',
      llmProvider: 'gemini',
      atualizadoEm: '2026-07-27T09:00:00.000Z',
    },
  ];

  contatos: Contato[] = [
    {
      id: 'ct_1',
      empresaId: 'emp_techstore',
      telefone: '5511977771111',
      nome: 'Roberto Camargo',
      criadoEm: '2026-07-29T08:00:00.000Z',
    },
    {
      id: 'ct_2',
      empresaId: 'emp_techstore',
      telefone: '5511966662222',
      nome: 'Juliana Mendes',
      criadoEm: '2026-07-29T08:10:00.000Z',
    },
    {
      id: 'ct_3',
      empresaId: 'emp_carotech',
      telefone: '5511955553333',
      nome: 'Dr. Fernando Mello',
      criadoEm: '2026-07-29T07:30:00.000Z',
    },
  ];

  conversas: Conversa[] = [
    {
      id: 'cv_1',
      empresaId: 'emp_techstore',
      contatoId: 'ct_1',
      status: 'aberta',
      atendidoPor: 'ia',
      iniciadaEm: '2026-07-29T08:00:00.000Z',
      ultimaMensagem: 'Qual o valor do iPhone 15 128GB à vista no PIX?',
      ultimaMensagemData: '2026-07-29T08:02:00.000Z',
    },
    {
      id: 'cv_2',
      empresaId: 'emp_techstore',
      contatoId: 'ct_2',
      status: 'aberta',
      atendidoPor: 'humano',
      iniciadaEm: '2026-07-29T08:10:00.000Z',
      ultimaMensagem: 'Quero falar com um vendedor para avaliar meu iPhone 13 na troca.',
      ultimaMensagemData: '2026-07-29T08:11:00.000Z',
    },
    {
      id: 'cv_3',
      empresaId: 'emp_carotech',
      contatoId: 'ct_3',
      status: 'aberta',
      atendidoPor: 'ia',
      iniciadaEm: '2026-07-29T07:30:00.000Z',
      ultimaMensagem: 'Gostaria de agendar uma demonstração da secretária virtual para minha clínica.',
      ultimaMensagemData: '2026-07-29T07:32:00.000Z',
    },
  ];

  mensagens: Mensagem[] = [
    {
      id: 'msg_1',
      conversaId: 'cv_1',
      direcao: 'in',
      conteudo: 'Olá! Vocês aceitam meu celular usado na troca de um iPhone novo?',
      enviadoPor: 'contato',
      criadaEm: '2026-07-29T08:00:00.000Z',
    },
    {
      id: 'msg_2',
      conversaId: 'cv_1',
      direcao: 'out',
      conteudo: 'Olá, Roberto! Sim, na Tech Store fazemos troca com troco! Avaliamos seu seminovo na hora. Qual modelo você possui atualmente e qual gostaria de adquirir?',
      enviadoPor: 'ia',
      criadaEm: '2026-07-29T08:00:05.000Z',
    },
    {
      id: 'msg_3',
      conversaId: 'cv_1',
      direcao: 'in',
      conteudo: 'Qual o valor do iPhone 15 128GB à vista no PIX?',
      enviadoPor: 'contato',
      criadaEm: '2026-07-29T08:02:00.000Z',
    },
    {
      id: 'msg_4',
      conversaId: 'cv_2',
      direcao: 'in',
      conteudo: 'Quero falar com um vendedor para avaliar meu iPhone 13 na troca.',
      enviadoPor: 'contato',
      criadaEm: '2026-07-29T08:11:00.000Z',
    },
    {
      id: 'msg_5',
      conversaId: 'cv_2',
      direcao: 'out',
      conteudo: 'Perfeito, Juliana! Estou transferindo seu atendimento para um de nossos especialistas humanos. Um momento, por favor.',
      enviadoPor: 'ia',
      criadaEm: '2026-07-29T08:11:02.000Z',
    },
    {
      id: 'msg_6',
      conversaId: 'cv_3',
      direcao: 'in',
      conteudo: 'Gostaria de agendar uma demonstração da secretária virtual para minha clínica.',
      enviadoPor: 'contato',
      criadaEm: '2026-07-29T07:30:00.000Z',
    },
    {
      id: 'msg_7',
      conversaId: 'cv_3',
      direcao: 'out',
      conteudo: 'Olá, Dr. Fernando! Será um prazer apresentar a secretária virtual da CA.RO TECH. Nossas automações ajudam clínicas a reduzirem faltas e aumentarem os agendamentos. Qual o melhor dia e horário para conversarmos?',
      enviadoPor: 'ia',
      criadaEm: '2026-07-29T07:30:08.000Z',
    },
  ];

  leads: Lead[] = [
    {
      id: 'ld_1',
      empresaId: 'emp_techstore',
      contatoId: 'ct_1',
      etapaFunil: 'em_negociacao',
      valorEstimado: 4890,
      observacoes: 'Interessado no iPhone 15 128GB Lacrado. Possui iPhone 11 64GB para dar de entrada.',
      criadoEm: '2026-07-29T08:03:00.000Z',
      atualizadoEm: '2026-07-29T08:03:00.000Z',
    },
    {
      id: 'ld_2',
      empresaId: 'emp_techstore',
      contatoId: 'ct_2',
      etapaFunil: 'novo',
      valorEstimado: 3500,
      observacoes: 'Aguardando avaliação técnica do iPhone 13.',
      criadoEm: '2026-07-29T08:12:00.000Z',
      atualizadoEm: '2026-07-29T08:12:00.000Z',
    },
    {
      id: 'ld_3',
      empresaId: 'emp_carotech',
      contatoId: 'ct_3',
      etapaFunil: 'em_negociacao',
      valorEstimado: 890,
      observacoes: 'Dono de clínica de ortodontia com 4 dentistas. Proposta enviada.',
      criadoEm: '2026-07-29T07:35:00.000Z',
      atualizadoEm: '2026-07-29T07:35:00.000Z',
    },
  ];

  // Helper Methods with Strict Tenant Isolation
  getEmpresaById(id: string): Empresa | undefined {
    return this.empresas.find((e) => e.id === id);
  }

  getNumeroByPhoneNumberId(phoneNumberId: string): NumeroWhatsapp | undefined {
    return this.numeros.find((n) => n.phoneNumberId === phoneNumberId);
  }

  getConfiguracaoIAByEmpresaId(empresaId: string): ConfiguracaoIA | undefined {
    let config = this.configuracoesIA.find((c) => c.empresaId === empresaId);
    if (!config) {
      config = {
        id: `cfg_${Date.now()}`,
        empresaId,
        nomeAssistente: 'Assistente Virtual',
        tomDeVoz: 'cordial e objetivo',
        baseConhecimento: 'Empresa especializada em atendimento.',
        regrasEscalonamento: 'Se disser humano ou atendente, transferir.',
        llmProvider: 'gemini',
        atualizadoEm: new Date().toISOString(),
      };
      this.configuracoesIA.push(config);
    }
    return config;
  }

  getConversasByEmpresaId(empresaId: string): Conversa[] {
    return this.conversas
      .filter((c) => c.empresaId === empresaId)
      .map((c) => ({
        ...c,
        contato: this.contatos.find((ct) => ct.id === c.contatoId),
      }))
      .sort((a, b) => new Date(b.iniciadaEm).getTime() - new Date(a.iniciadaEm).getTime());
  }

  getMensagensByConversaId(conversaId: string): Mensagem[] {
    return this.mensagens
      .filter((m) => m.conversaId === conversaId)
      .sort((a, b) => new Date(a.criadaEm).getTime() - new Date(b.criadaEm).getTime());
  }

  getLeadsByEmpresaId(empresaId: string): Lead[] {
    return this.leads
      .filter((l) => l.empresaId === empresaId)
      .map((l) => ({
        ...l,
        contato: this.contatos.find((ct) => ct.id === l.contatoId),
      }))
      .sort((a, b) => new Date(b.atualizadoEm).getTime() - new Date(a.atualizadoEm).getTime());
  }

  getUsuariosByEmpresaId(empresaId: string): UsuarioPainel[] {
    return this.usuarios.filter((u) => u.empresaId === empresaId);
  }
}

export const db = new DatabaseStore();
