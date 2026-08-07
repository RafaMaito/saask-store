import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface do Modelo de Tenant/Empresa (Tenant Domain Model Interface)
 */
export interface ICompany extends Document {
  name: string;
  slug: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema Mongoose para Entidade Tenant (Tenant Entity Mongoose Schema)
 */
const CompanySchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Nome da empresa é obrigatório (Company name is required)'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Slug é obrigatório (Slug identifier is required)'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Adiciona campos de auditoria (Timestamps Audit Fields: createdAt, updatedAt)
  }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
