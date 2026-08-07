import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

/**
 * Conexão com o Banco de Dados MongoDB (Database Connection Bootstrapper)
 */
export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/saask_store_ai';
    const conn = await mongoose.connect(mongoURI);
    console.log(`[Database Connection] MongoDB conectado com sucesso (MongoDB Connected): ${conn.connection.host}`);

    // Garantir que o usuário Superadmin Global exista sempre e possa logar sem empresa
    await ensureSuperadmin();
  } catch (error) {
    console.error('[Database Connection Error] Erro ao conectar ao MongoDB (Failed to connect to MongoDB):', error);
    process.exit(1);
  }
};

const ensureSuperadmin = async () => {
  try {
    const superadminEmail = 'superadmin@admin.com';
    let superUser = await User.findOne({ email: superadminEmail });

    if (!superUser) {
      console.log('[System Self-Healing] Criando/Restaurando usuário Superadmin Global...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      await User.create({
        name: 'Super Admin',
        email: superadminEmail,
        password: hashedPassword,
        role: 'superadmin',
        company_id: undefined,
      });
      console.log('[System Self-Healing] Superadmin Global restaurado (superadmin@admin.com / password123)');
    }
  } catch (err) {
    console.error('[System Self-Healing Error] Erro ao restaurar Superadmin:', err);
  }
};
