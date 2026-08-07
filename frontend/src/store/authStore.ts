import { create } from 'zustand';
import { IUser } from '../types/index.js';

interface AuthState {
  user: IUser | null;
  token: string | null;
  tenantOverride: string | null; // Usado pelo Superadmin para simular/trocar de tenant (Superadmin tenant switcher)
  isAuthenticated: boolean;
  setAuth: (user: IUser, token: string) => void;
  logout: () => void;
  setTenantOverride: (companyId: string | null) => void;
}

const TOKEN_KEY = 'saas_ai_auth_token';
const USER_KEY = 'saas_ai_auth_user';
const TENANT_OVERRIDE_KEY = 'saas_ai_tenant_override';

export const useAuthStore = create<AuthState>((set) => {
  // Inicialização Reativa com Persistência Local (Local Storage Persistence Initialization)
  const savedToken = localStorage.getItem(TOKEN_KEY);
  const savedUser = localStorage.getItem(USER_KEY);
  const savedTenantOverride = localStorage.getItem(TENANT_OVERRIDE_KEY);

  let initialUser: IUser | null = null;
  if (savedUser) {
    try {
      initialUser = JSON.parse(savedUser);
    } catch (e) {
      initialUser = null;
    }
  }

  return {
    user: initialUser,
    token: savedToken,
    tenantOverride: savedTenantOverride || null,
    isAuthenticated: !!(savedToken && initialUser),

    setAuth: (user: IUser, token: string) => {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user, token, isAuthenticated: true });
    },

    logout: () => {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TENANT_OVERRIDE_KEY);
      set({ user: null, token: null, tenantOverride: null, isAuthenticated: false });
    },

    setTenantOverride: (companyId: string | null) => {
      if (companyId) {
        localStorage.setItem(TENANT_OVERRIDE_KEY, companyId);
      } else {
        localStorage.removeItem(TENANT_OVERRIDE_KEY);
      }
      set({ tenantOverride: companyId });
    },
  };
});
