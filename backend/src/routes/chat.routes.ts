import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { enforceTenantContext } from '../middlewares/tenant.middleware.js';

const router = Router();

router.use(authenticateJWT);
router.use(enforceTenantContext);

// Endpoint de Comunicação Conversacional com Agente IA (Conversational AI Chat Endpoint)
router.post('/', ChatController.handleChat);
router.post('/stream', ChatController.handleChatStream);

export default router;
