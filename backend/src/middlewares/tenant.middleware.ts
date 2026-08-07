import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Resolução e Validação de Contexto Multi-Tenant (Multi-Tenant Context Resolution & Enforcement Middleware)
 */
export const enforceTenantContext = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Contexto de usuário ausente (Missing user session context)',
    });
  }

  // Superadmin pode trocar de tenant via cabeçalho x-tenant-id (Superadmin cross-tenant context override)
  if (req.user.role === 'superadmin') {
    const overrideTenant = req.headers['x-tenant-id'] as string;
    if (overrideTenant) {
      req.companyId = overrideTenant;
    } else {
      req.companyId = req.user.company_id; // Pode ser undefined para operações globais (Can be undefined for global platform scope)
    }
    return next();
  }

  // Para Admin e User, o escopo do tenant é estritamente fixado (For Admin and User, tenant scope is strictly locked)
  if (!req.user.company_id) {
    return res.status(400).json({
      error: 'Usuário não está associado a nenhuma empresa/tenant (User is not associated with any company tenant)',
    });
  }

  req.companyId = req.user.company_id;
  next();
};
