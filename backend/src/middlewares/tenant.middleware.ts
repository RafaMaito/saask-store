import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Company } from '../models/Company.js';

/**
 * Middleware de Resolução e Validação de Contexto Multi-Tenant (Multi-Tenant Context Resolution & Enforcement Middleware)
 */
export const enforceTenantContext = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Contexto de usuário ausente (Missing user session context)',
    });
  }

  // Superadmin pode trocar de tenant via cabeçalho x-tenant-id (Superadmin cross-tenant context override)
  if (req.user.role === 'superadmin') {
    const overrideTenant = req.headers['x-tenant-id'] as string;
    if (overrideTenant) {
      if (!mongoose.Types.ObjectId.isValid(overrideTenant)) {
        return res.status(400).json({
          error: 'ID de tenant inválido no cabeçalho x-tenant-id (Invalid tenant ID in x-tenant-id header)',
        });
      }

      const companyExists = await Company.findById(overrideTenant);
      if (!companyExists) {
        return res.status(404).json({
          error: 'Empresa/Tenant especificado no cabeçalho x-tenant-id não encontrado (Tenant company not found)',
        });
      }

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
