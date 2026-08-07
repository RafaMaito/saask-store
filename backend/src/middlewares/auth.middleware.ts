import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User.js';

interface JWTPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  company_id?: string;
}

/**
 * Middleware de Autenticação de Token JWT (JWT Authentication Verification Middleware)
 */
export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acesso negado. Token não fornecido (Access denied. Bearer token missing)',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error('[Security] JWT_SECRET não configurado nas variáveis de ambiente');
      return res.status(500).json({
        error: 'Erro de configuração do servidor (Server configuration error)',
      });
    }
    const decoded = jwt.verify(token, secret) as JWTPayload;

    req.user = {
      id: decoded.id,
      name: decoded.name,
      email: decoded.email,
      role: decoded.role,
      company_id: decoded.company_id,
    };

    // Define o escopo padrão do tenant (Default Tenant Scope Context Assignment)
    req.companyId = decoded.company_id;

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Token inválido ou expirado (Invalid or expired authentication token)',
    });
  }
};
