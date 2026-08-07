import mongoose, { Schema, Document } from 'mongoose';

/**
 * Papéis de Usuário no Sistema (System Role Types)
 */
export type UserRole = 'superadmin' | 'admin' | 'user';

/**
 * Interface do Modelo de Usuário e Credenciais (User Identity Domain Model Interface)
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  company_id?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema Mongoose para Entidade de Usuário (User Entity Mongoose Schema)
 */
const UserSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome do usuário é obrigatório (User name is required)'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'E-mail do usuário é obrigatório (User email is required)'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória (Password hash is required)'],
      select: false, // Esconde a senha por padrão nas consultas (Hides password hash by default)
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'user'],
      default: 'user',
      required: true,
    },
    company_id: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: function (this: IUser) {
        // Superadmin não precisa estar atrelado a um tenant (Superadmin does not require tenant association)
        return this.role !== 'superadmin';
      },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);
