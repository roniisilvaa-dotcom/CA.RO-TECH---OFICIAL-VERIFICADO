export type PerfilUsuario = 'SUPER_ADMIN' | 'CLIENTE_ADMIN' | 'CLIENTE_OPERADOR';

export interface Empresa {
  id: string;
  nome: string;
  cnpj?: string;
  plano: 'padrao' | 'premium' | 'interno';
  ativo: boolean;
  criadoEm: string;
}

export interface NumeroWhatsapp {
  id: string;
  empresaId: string;
  phoneNumberId: string;
  wabaId: string;
  numeroExibicao: string;
  tokenAcesso: string;
  status: 'conectado' | 'pendente' | 'erro';
  criadoEm: string;
}

export interface ConfiguracaoIA {
  id: string;
  empresaId: string;
  nomeAssistente: string;
  tomDeVoz: string;
  baseConhecimento: string;
  regrasEscalonamento: string;
  llmProvider: 'gemini' | 'anthropic' | 'openai';
  atualizadoEm: string;
}

export interface Contato {
  id: string;
  empresaId: string;
  telefone: string;
  nome?: string;
  criadoEm: string;
}

export interface Conversa {
  id: string;
  empresaId: string;
  contatoId: string;
  contato?: Contato;
  status: 'aberta' | 'encerrada';
  atendidoPor: 'ia' | 'humano';
  iniciadaEm: string;
  mensagens?: Mensagem[];
  ultimaMensagem?: string;
  ultimaMensagemData?: string;
}

export interface Mensagem {
  id: string;
  conversaId: string;
  direcao: 'in' | 'out';
  conteudo: string;
  enviadoPor: 'contato' | 'ia' | 'humano';
  criadaEm: string;
}

export type EtapaFunil = 'novo' | 'em_negociacao' | 'ganho' | 'perdido';

export interface Lead {
  id: string;
  empresaId: string;
  contatoId: string;
  contato?: Contato;
  etapaFunil: EtapaFunil;
  valorEstimado?: number;
  observacoes?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface UsuarioPainel {
  id: string;
  empresaId?: string | null;
  empresaNome?: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  criadoEm: string;
}

export interface AuthSession {
  usuario: UsuarioPainel;
  empresaAtiva: Empresa;
}
