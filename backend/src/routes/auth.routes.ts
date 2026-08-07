import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Rota de Cadastro de Nova Conta (Account Self-Registration Endpoint)
router.post('/register', AuthController.register);

// Rota de Login de Usuário (User Authentication Login Endpoint)
router.post('/login', AuthController.login);

// Rota de Perfil Autenticado (Authenticated Profile Endpoint)
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
