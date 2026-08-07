import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser, UserRole } from '../models/User.js';
import { Company } from '../models/Company.js';

/**
 * Controlador de Autenticação e Gestão de Sessões (Authentication & Session Management Controller)
 */
export class AuthController {
  /**
   * Registro de Conta de Usuário (User Account Registration)
   */
  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, companyName } = req.body;

      if (!name || !email || !password) {
        return res
          .status(400)
          .json({ error: 'Campos obrigatórios ausentes: nome, e-mail e senha (Missing required fields)' });
      }

      // Verifica se o e-mail já está em uso (Check email uniqueness)
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ error: 'E-mail já está cadastrado no sistema (Email is already registered)' });
      }

      // O registro público é estritamente restrito a 'admin' com nova empresa dedicada (Prevents privilege escalation)
      const targetRole: UserRole = 'admin';

      const nameForCompany = companyName || `${name} Store`;
      const slug =
        nameForCompany
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') +
        '-' +
        Date.now();
      const newCompany = await Company.create({
        name: nameForCompany,
        slug,
      });
      const companyIdToAssign = newCompany._id.toString();

      // Hash de senha com bcrypt (Bcrypt Password Hashing)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: targetRole,
        company_id: companyIdToAssign,
      });

      // Emissão de Token JWT (JWT Token Issuance)
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ error: 'Erro de configuração do servidor (JWT_SECRET missing)' });
      }
      const token = jwt.sign(
        {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          company_id: newUser.company_id,
        },
        secret,
        { expiresIn: '7d' }
      );

      return res.status(201).json({
        message: 'Usuário registrado com sucesso (User registered successfully)',
        token,
        user: {
          id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          company_id: newUser.company_id,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao registrar usuário (Registration error)' });
    }
  }

  /**
   * Login de Usuário (User Authentication Login)
   */
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'E-mail e senha são obrigatórios (Email and password are required)' });
      }

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({ error: 'Credenciais inválidas (Invalid credentials)' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciais inválidas (Invalid credentials)' });
      }

      // Emissão de Token JWT (JWT Token Issuance)
      const secret = process.env.JWT_SECRET;
      if (!secret) {
        return res.status(500).json({ error: 'Erro de configuração do servidor (JWT_SECRET missing)' });
      }
      const token = jwt.sign(
        {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
        },
        secret,
        { expiresIn: '7d' }
      );

      let companyInfo = null;
      if (user.company_id) {
        companyInfo = await Company.findById(user.company_id).lean();
      }

      return res.status(200).json({
        message: 'Login realizado com sucesso (Login successful)',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          company: companyInfo,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message || 'Erro ao realizar login (Login execution error)' });
    }
  }

  /**
   * Perfil do Usuário Autenticado (Authenticated User Profile Endpoint)
   */
  static async getMe(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Não autenticado (Unauthenticated)' });
      }

      const user = await User.findById(req.user.id).lean();
      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado (User not found)' });
      }

      let companyInfo = null;
      if (user.company_id) {
        companyInfo = await Company.findById(user.company_id).lean();
      }

      return res.status(200).json({
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          company_id: user.company_id,
          company: companyInfo,
        },
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
