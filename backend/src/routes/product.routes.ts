import { Router } from 'express';
import { ProductController } from '../controllers/product.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';
import { enforceTenantContext } from '../middlewares/tenant.middleware.js';
import { authorizeRoles } from '../middlewares/rbac.middleware.js';

const router = Router();

// Aplica autenticação e verificação de tenant a todas as rotas de produtos (Apply JWT Auth & Tenant Context)
router.use(authenticateJWT);
router.use(enforceTenantContext);

// Leitura de Produtos - Permitida para superadmin, admin e user (Read Products Endpoint)
router.get('/', ProductController.getProducts);
router.get('/:id', ProductController.getProductById);

// Registro de visualizações/cliques do produto
router.post('/:id/click', ProductController.trackProductClick);

// Mutações CRUD de Produtos - Permitidas apenas para superadmin e admin (Write/Mutate Products - Admin & Superadmin only)
router.post('/', authorizeRoles('superadmin', 'admin'), ProductController.createProduct);
router.put('/:id', authorizeRoles('superadmin', 'admin'), ProductController.updateProduct);
router.delete('/:id', authorizeRoles('superadmin', 'admin'), ProductController.deleteProduct);

export default router;
