import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { User, UserRole } from '../models/User.js';

/**
 * Controlador de Gestão de Identidades e Usuários (Identity & User Provisioning Controller)
 */
export class UserController {
  /**
   * Criação/Provisionamento de Usuário (Provision User Account - Admin / Superadmin Scope)
   */
  static async createUser(req: Request, res: Response) {
    try {
      const { name, email, password, role, company_id } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios (Missing required fields)' });
      }

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'E-mail já está em uso no sistema (Email is already in use)' });
      }

      let targetRole: UserRole = role || 'user';
      let targetCompanyId = req.companyId;

      // Se for Admin normal, ele só pode criar contas do tipo 'user' na sua própria empresa
      if (req.user?.role === 'admin') {
        targetRole = 'user';
        targetCompanyId = req.user.company_id;
      } else if (req.user?.role === 'superadmin' && company_id) {
        targetCompanyId = company_id;
      }

      // Hash da senha (Password Hashing)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: targetRole,
        company_id: targetCompanyId,
      });

      return res.status(201).json({
        message: 'Usuário criado com sucesso (User provisioned successfully)',
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          company_id: newUser.company_id,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Listagem de Usuários da Empresa (Get Scoped Users List)
   */
  static async getUsers(req: Request, res: Response) {
    try {
      let filterQuery: any = {};

      if (req.user?.role === 'admin') {
        filterQuery.company_id = req.user.company_id;
      } else if (req.user?.role === 'superadmin' && req.query.company_id) {
        filterQuery.company_id = req.query.company_id;
      }

      const users = await User.find(filterQuery)
        .select('-password')
        .populate('company_id', 'name slug')
        .sort({ createdAt: -1 })
        .lean();

      return res.status(200).json({ users });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
