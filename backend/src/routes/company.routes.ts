import { Router } from 'express';
import { CompanyController } from '../controllers/company.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Apenas Superadmin pode listar, criar, alterar status e deletar empresas
router.get('/', authorizeRoles('superadmin'), CompanyController.getCompanies);
router.post('/', authorizeRoles('superadmin'), CompanyController.createCompany);
router.patch('/:id/status', authorizeRoles('superadmin'), CompanyController.toggleCompanyStatus);
router.delete('/:id', authorizeRoles('superadmin'), CompanyController.deleteCompany);
router.get('/:id', authorizeRoles('superadmin', 'admin'), CompanyController.getCompanyById);

export default router;
