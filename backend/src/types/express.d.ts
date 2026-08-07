import { IUser, UserRole } from '../models/User.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: UserRole;
        company_id?: string;
      };
      companyId?: string;
    }
  }
}
