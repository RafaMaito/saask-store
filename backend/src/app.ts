import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/index.js';
import { errorHandler } from './middlewares/error.middleware.js';

dotenv.config();

/**
 * Bootstrapping da Aplicação Express (Express Application Pipeline Bootstrapper)
 */
const app = express();

// Configuração dos Middlewares Básicos (Base Middleware Pipeline Configuration)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de Health Check (Service Health Check Endpoint)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Saask Store AI Backend Server',
    status: 'online',
    apiDocumentation: '/api',
    health: '/health',
  });
});

// Registro das Rotas da API RESTful (Register Core API Router)
app.use('/api', apiRoutes);

// Pipeline Centralizado de Tratamento de Erros (Global Error Handling Pipeline)
app.use(errorHandler);

export default app;
