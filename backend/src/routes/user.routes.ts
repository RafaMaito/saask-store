import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Apenas admin e superadmin podem criar e visualizar contas de usuários (Admin and Superadmin only endpoints)
router.get('/', authorizeRoles('superadmin', 'admin'), UserController.getUsers);
router.post('/', authorizeRoles('superadmin', 'admin'), UserController.createUser);

export default router;
