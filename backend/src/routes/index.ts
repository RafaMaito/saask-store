import { Router } from 'express';
import authRoutes from './auth.routes.js';
import companyRoutes from './company.routes.js';
import systemRoutes from './system.routes.js';
import productRoutes from './product.routes.js';
import userRoutes from './user.routes.js';
import chatRoutes from './chat.routes.js';

const router = Router();

// Rota Raiz da API (/api)
router.get('/', (req, res) => {
  res.json({
    name: 'Saask Store AI REST API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      products: '/api/products',
      companies: '/api/companies',
      users: '/api/users',
      system: '/api/system',
      chat: '/api/chat',
    },
  });
});

// Registro dos Módulos de Rotas (API Modules Route Registrar)
router.use('/auth', authRoutes);
router.use('/companies', companyRoutes);
router.use('/system', systemRoutes);
router.use('/products', productRoutes);
router.use('/users', userRoutes);
router.use('/chat', chatRoutes);

export default router;
