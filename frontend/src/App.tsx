import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { ChatPage } from './pages/ChatPage.js';
import { CompaniesPage } from './pages/CompaniesPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { AnalyticsPage } from './pages/AnalyticsPage.js';
import { UserRole } from './types/index.js';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

/**
 * Componente de Guarda de Rota Protegida (Guarded Protected Route Component)
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redireciona baseado no papel: superadmin vai para companies, outros para dashboard
    return <Navigate to={user.role === 'superadmin' ? '/companies' : '/dashboard'} replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

/**
 * Redireciona baseado no papel do usuário (Role-based root redirect)
 */
const RoleBasedRedirect: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'superadmin') {
    return <Navigate to="/companies" replace />;
  }

  return <Navigate to="/dashboard" replace />;
};

/**
 * Componente Principal de Roteamento da Aplicação (Main Application Router Component)
 */
export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas (Public Endpoints) */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas Protegidas de Usuário e Admin (não acessível ao superadmin) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute allowedRoles={['admin', 'user']}>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        {/* Rota de Analytics — exclusiva para Admin */}
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* Rotas Protegidas de Superadmin (Superadmin Only Guarded Routes) */}
        <Route
          path="/companies"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <CompaniesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['superadmin']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* Redirecionamento da raiz baseado no papel do usuário */}
        <Route path="/" element={<RoleBasedRedirect />} />

        {/* Catch-all: qualquer rota não mapeada redireciona conforme o papel */}
        <Route path="*" element={<RoleBasedRedirect />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
