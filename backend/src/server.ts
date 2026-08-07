import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

/**
 * Inicialização e Escuta do Servidor HTTP (HTTP Server Initialization & Bootstrapper)
 */
const startServer = async () => {
  // Conecta ao banco de dados (Establish Database Connection)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`[API Gateway] Servidor executando na porta (Server running on port): ${PORT}`);
    console.log(`[API Environment] Modo de execução (Environment): ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

startServer();
