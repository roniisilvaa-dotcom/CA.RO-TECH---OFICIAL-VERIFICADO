import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.js';

const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-troque-em-producao';
const COOKIE_NAME = 'caro_session';

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 10);
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash);
}

export function assinarSessao(usuarioId: string): string {
  return jwt.sign({ sub: usuarioId }, SESSION_SECRET, { expiresIn: '30d' });
}

export function definirCookieSessao(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
}

export function limparCookieSessao(res: Response) {
  res.clearCookie(COOKIE_NAME);
}

// Middleware: carrega o usuário autenticado (via cookie) em req.user
// Não bloqueia rotas sem sessão aqui - isso é feito rota a rota com exigirLogin().
export async function carregarSessao(req: any, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const payload = jwt.verify(token, SESSION_SECRET) as { sub: string };
    const usuario = await prisma.usuarioPainel.findUnique({ where: { id: payload.sub } });
    if (!usuario) return next();

    req.user = usuario;

    const activeEmpresaHeader = req.headers['x-empresa-id'] as string | undefined;
    if (usuario.perfil === 'SUPER_ADMIN' && activeEmpresaHeader) {
      req.empresaId = activeEmpresaHeader;
    } else {
      req.empresaId = usuario.empresaId || undefined;
    }
  } catch {
    // token inválido/expirado - segue sem sessão
  }
  next();
}

export function exigirLogin(req: any, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    return;
  }
  next();
}

export function exigirSuperAdmin(req: any, res: Response, next: NextFunction) {
  if (!req.user || req.user.perfil !== 'SUPER_ADMIN') {
    res.status(403).json({ error: 'Acesso restrito à equipe CA.RO TECH.' });
    return;
  }
  next();
}
