import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

/**
 * Middleware de Autorização por Papel (RBAC Enforcement Authorization Middleware)
 * @param allowedRoles Lista de papéis autorizados para a rota (List of allowed roles for the endpoint)
 */
export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Usuário não autenticado (Unauthenticated user request)',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Acesso proibido para o papel '${req.user.role}' (Access forbidden for role '${req.user.role}')`,
      });
    }

    next();
  };
};
