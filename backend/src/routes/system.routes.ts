import { Router } from 'express';
import { SystemController } from '../controllers/system.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { authorizeRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

router.use(authenticateJWT);

// Obter Configuração de IA (Get System AI Configuration)
router.get('/config', SystemController.getConfig);

// Atualizar Configuração Global de IA (Update Global Platform AI Configuration - Superadmin Only)
router.put('/config', authorizeRoles('superadmin'), SystemController.updateConfig);

export default router;
