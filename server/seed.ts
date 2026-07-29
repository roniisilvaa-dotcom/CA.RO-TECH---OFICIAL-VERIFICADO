import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SENHA_PADRAO = process.env.SEED_SENHA_PADRAO || 'CaroTech#2026';

/**
 * Roda o seed apenas se o banco estiver vazio (nenhum UsuarioPainel cadastrado).
 * Chamado automaticamente no boot do server.ts para que o primeiro deploy
 * (Railway, Render, etc.) já suba com dados iniciais, sem precisar de acesso
 * a shell/CLI para rodar `npm run db:seed` manualmente.
 */
export async function seedSeNecessario() {
  const totalUsuarios = await prisma.usuarioPainel.count();
  if (totalUsuarios > 0) {
    console.log(`[Seed] Banco já possui ${totalUsuarios} usuário(s) — pulando seed automático.`);
    return;
  }
  console.log('[Seed] Banco vazio detectado — rodando seed inicial automaticamente...');
  await main();
}

async function main() {
  console.log('Seeding banco de dados...');
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 10);

  // Empresa interna CA.RO TECH
  const caroTech = await prisma.empresa.upsert({
    where: { id: 'emp_carotech' },
    update: {},
    create: {
      id: 'emp_carotech',
      nome: 'CA.RO TECH (Camila & Roni)',
      cnpj: '25.983.085/0001-04',
      plano: 'interno',
      ativo: true,
    },
  });

  const techStore = await prisma.empresa.upsert({
    where: { id: 'emp_techstore' },
    update: {},
    create: {
      id: 'emp_techstore',
      nome: 'Tech Store Celulares',
      cnpj: '12.345.678/0001-00',
      plano: 'premium',
      ativo: true,
    },
  });

  const odontoCare = await prisma.empresa.upsert({
    where: { id: 'emp_odontocare' },
    update: {},
    create: {
      id: 'emp_odontocare',
      nome: 'OdontoCare Barueri',
      cnpj: '98.765.432/0001-11',
      plano: 'padrao',
      ativo: true,
    },
  });

  // Usuários (todos com a mesma senha padrão inicial - trocar depois do primeiro login)
  await prisma.usuarioPainel.upsert({
    where: { email: 'admin@carotech.com.br' },
    update: {},
    create: {
      empresaId: caroTech.id,
      nome: 'RONI SILVA',
      email: 'admin@carotech.com.br',
      senhaHash,
      perfil: 'SUPER_ADMIN',
    },
  });

  await prisma.usuarioPainel.upsert({
    where: { email: 'gestor@techstore.com.br' },
    update: {},
    create: {
      empresaId: techStore.id,
      nome: 'Lucas Silva (Gestor Tech Store)',
      email: 'gestor@techstore.com.br',
      senhaHash,
      perfil: 'CLIENTE_ADMIN',
    },
  });

  await prisma.usuarioPainel.upsert({
    where: { email: 'atendente@techstore.com.br' },
    update: {},
    create: {
      empresaId: techStore.id,
      nome: 'Maria Atendente',
      email: 'atendente@techstore.com.br',
      senhaHash,
      perfil: 'CLIENTE_OPERADOR',
    },
  });

  await prisma.usuarioPainel.upsert({
    where: { email: 'patricia@odontocare.com.br' },
    update: {},
    create: {
      empresaId: odontoCare.id,
      nome: 'Dra. Patricia Lima',
      email: 'patricia@odontocare.com.br',
      senhaHash,
      perfil: 'CLIENTE_ADMIN',
    },
  });

  // Configurações de IA
  await prisma.configuracaoIA.upsert({
    where: { empresaId: caroTech.id },
    update: {},
    create: {
      empresaId: caroTech.id,
      nomeAssistente: 'Secretária Virtual CA.RO TECH',
      tomDeVoz: 'altamente profissional, tecnológico, acolhedor e consultivo',
      baseConhecimento: `A CA.RO TECH desenvolve secretárias virtuais inteligentes com IA integradas ao WhatsApp Business Oficial para empresas em Barueri, Alphaville e todo o Brasil.
Diferenciais: atendimento 24/7, transferência inteligente para humano, funil de vendas automático com Kanban.
Endereço: Alameda Rio Negro, Alameda Itapecuru - 515, Barueri, SP, 06454-000.`,
      regrasEscalonamento: 'Se o cliente disser "quero falar com atendente", "humano", "suporte técnico" ou "cancelar", transferir imediatamente.',
      llmProvider: 'gemini',
    },
  });

  await prisma.configuracaoIA.upsert({
    where: { empresaId: techStore.id },
    update: {},
    create: {
      empresaId: techStore.id,
      nomeAssistente: 'Sofia da Tech Store',
      tomDeVoz: 'amigável, dinâmico, transparente e focado em fechar negócios',
      baseConhecimento: `Tech Store Celulares - loja de smartphones novos e seminovos de Barueri.
Vendas de iPhones, compra e troca com avaliação na hora, garantia de 1 ano, pagamento em até 18x ou PIX com 5% de desconto.
Horário: Segunda a Sábado, 09h às 20h. Endereço: Av. Henriqueta Mendes Guerra, 320, Centro, Barueri - SP.`,
      regrasEscalonamento: 'Se o cliente solicitar avaliação específica do celular usado ou disser "humano", "vendedor", "falar com alguém", transferir.',
      llmProvider: 'gemini',
    },
  });

  await prisma.configuracaoIA.upsert({
    where: { empresaId: odontoCare.id },
    update: {},
    create: {
      empresaId: odontoCare.id,
      nomeAssistente: 'Dra. Bia OdontoCare',
      tomDeVoz: 'cordial, empático, tranquilizador e direto',
      baseConhecimento: `OdontoCare Barueri - Clínica Odontológica. Tratamentos: Ortodontia, Clareamento a Laser, Implantes, Próteses.
Convênios: Amil Dental, SulAmérica, Bradesco Dental. Urgência de Segunda a Sexta, 08h às 19h.`,
      regrasEscalonamento: 'Se disser "urgência", "dor de dente", "falar com Dra", "atendente", transferir.',
      llmProvider: 'gemini',
    },
  });

  // Número real da CA.RO TECH (phone_number_id e wabaId reais; token é placeholder
  // até gerar o token permanente via System User no Meta Business Suite)
  await prisma.numeroWhatsapp.upsert({
    where: { phoneNumberId: '1270160249503985' },
    update: {},
    create: {
      empresaId: caroTech.id,
      phoneNumberId: '1270160249503985',
      wabaId: '825884573825227',
      numeroExibicao: '+55 11 92076-7894',
      tokenAcesso: process.env.META_TOKEN_CAROTECH || 'SUBSTITUIR_PELO_TOKEN_PERMANENTE',
      status: 'pendente',
    },
  });

  console.log('Seed concluído.');
  console.log(`Senha padrão de todos os usuários seed: ${SENHA_PADRAO} (troque depois do primeiro login)`);
}

// Só roda automaticamente quando o arquivo é executado diretamente
// (ex: `npm run db:seed`). Quando importado por server.ts (seedSeNecessario),
// isso é ignorado e o import não dispara uma segunda execução.
const isMainModule = process.argv[1] && process.argv[1].endsWith('seed.ts');

if (isMainModule) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

async function noop() {}
noop()
  .catch(() => {})
  .finally(async () => {
    await prisma.$disconnect();
  });
