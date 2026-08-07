import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { Company } from '../models/Company.js';
import { User } from '../models/User.js';

/**
 * Controlador do Domínio de Tenants/Empresas (Tenant Management Controller)
 */
export class CompanyController {
  /**
   * Listagem de todas as Empresas (List All Tenants - Superadmin Scope)
   */
  static async getCompanies(req: Request, res: Response) {
    try {
      const companies = await Company.find().sort({ createdAt: -1 }).lean();
      return res.status(200).json({ companies });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Criação de nova Empresa com Administrador Responsável (Tenant Provisioning com Admin User Creation)
   */
  static async createCompany(req: Request, res: Response) {
    try {
      const { name, adminName, adminEmail, adminPassword } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nome da empresa é obrigatório (Company name is required)' });
      }

      // Validação do usuário Admin caso os campos sejam informados
      if (adminEmail || adminName || adminPassword) {
        if (!adminName || !adminEmail || !adminPassword) {
          return res.status(400).json({
            error: 'Para cadastrar o Administrador Responsável, informe Nome, E-mail e Senha completos.',
          });
        }

        const existingUser = await User.findOne({ email: adminEmail.toLowerCase().trim() });
        if (existingUser) {
          return res.status(400).json({
            error: 'Este e-mail de administrador já está em uso por outro usuário no sistema.',
          });
        }
      }

      const slug =
        name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') +
        '-' +
        Date.now();

      const company = await Company.create({
        name: name.trim(),
        slug,
        active: true,
      });

      let adminUser = null;
      if (adminName && adminEmail && adminPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const createdUser = await User.create({
          name: adminName.trim(),
          email: adminEmail.toLowerCase().trim(),
          password: hashedPassword,
          role: 'admin',
          company_id: company._id,
        });

        adminUser = {
          _id: createdUser._id,
          name: createdUser.name,
          email: createdUser.email,
          role: createdUser.role,
        };
      }

      return res.status(201).json({
        message: 'Empresa e usuário administrador criados com sucesso!',
        company,
        adminUser,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Obter Empresa por ID (Get Tenant by ID)
   */
  static async getCompanyById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const company = await Company.findById(id).lean();
      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada (Tenant not found)' });
      }
      return res.status(200).json({ company });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Ativar / Desativar Empresa com validação obrigatória de senha do Superadmin
   */
  static async toggleCompanyStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'A senha de confirmação do Superadmin é obrigatória.' });
      }

      // Validar a senha do Superadmin requisitante
      const currentUser = await User.findById(req.user?.id).select('+password');
      if (!currentUser) {
        return res.status(404).json({ error: 'Usuário administrador não encontrado.' });
      }

      const isPasswordValid = await bcrypt.compare(password, currentUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Senha incorreta do Superadmin. Operação não autorizada.' });
      }

      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      company.active = !company.active;
      await company.save();

      return res.status(200).json({
        message: `Empresa "${company.name}" ${company.active ? 'ativada' : 'desativada'} com sucesso!`,
        company,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  /**
   * Deletar Empresa com validação obrigatória de senha do Superadmin
   */
  static async deleteCompany(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'A senha de confirmação do Superadmin é obrigatória para excluir a empresa.' });
      }

      // Validar a senha do Superadmin requisitante
      const currentUser = await User.findById(req.user?.id).select('+password');
      if (!currentUser) {
        return res.status(404).json({ error: 'Usuário administrador não encontrado.' });
      }

      const isPasswordValid = await bcrypt.compare(password, currentUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Senha incorreta do Superadmin. Operação não autorizada.' });
      }

      const company = await Company.findByIdAndDelete(id);
      if (!company) {
        return res.status(404).json({ error: 'Empresa não encontrada.' });
      }

      // Deletar apenas usuários vinculados (exceto Superadmin)
      await User.deleteMany({ company_id: id, role: { $ne: 'superadmin' } });

      // Se houver algum Superadmin associado a esta empresa, remove o vínculo (empresa nula)
      await User.updateMany({ company_id: id, role: 'superadmin' }, { $unset: { company_id: 1 } });

      return res.status(200).json({
        message: `Empresa "${company.name}" foi excluída com sucesso! Usuários vinculados foram removidos.`,
        companyId: id,
      });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
