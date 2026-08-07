import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore.js';
import { useThemeStore } from '../../store/themeStore.js';
import {
  LayoutDashboard,
  Bot,
  Building2,
  Settings,
  LogOut,
  Moon,
  Sun,
  ShieldCheck,
  UserCheck,
  Eye,
  ChevronDown,
  Sparkles,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Componente do Esqueleto de Layout da Aplicação (App Shell Layout Component com suporte a Dark/Light Mode e Responsividade Mobile)
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const location = useLocation();
  const navigate = useNavigate();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fecha o menu mobile ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [location.pathname]);

  // Fecha o menu de usuário ao clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'superadmin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-3 h-3" /> Superadmin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <UserCheck className="w-3 h-3" /> Admin
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Eye className="w-3 h-3" /> User
          </span>
        );
    }
  };

  const activeCompanyName = user?.role === 'superadmin' ? 'Superadmin Global' : user?.company?.name || 'Sua Empresa';

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 dark:bg-[#06080d] text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Cabeçalho Mobile (Top Header for Mobile Viewport) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-[#0c101b] border-b border-slate-200 dark:border-slate-800 z-30 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Menu de Navegação"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Saask Store</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Badge do Papel do Usuário no Mobile */}
          {getRoleBadge()}

          {/* Toggle de Tema no Mobile */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? 'Ativar Modo Claro' : 'Ativar Modo Escuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* Backdrop Overlay Escuro para Fechar o Drawer Mobile ao Clicar Fora */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Barra Lateral de Navegação (Sidebar Drawer no Mobile, Sidebar Fixa no Desktop) */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0c101b]/95 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/90 
          flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out
          md:static md:w-64 md:translate-x-0 md:z-20 md:flex-shrink-0
          ${isMobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div>
          {/* Botão de Fechar Exclusivo para o Drawer Mobile */}
          <div className="md:hidden flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Navegação
              </span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Perfil do Usuário e Empresa Ativa na Barra Lateral */}
          <div className="relative mb-6" ref={menuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-2xl bg-slate-100/70 dark:bg-slate-900/70 hover:bg-slate-200/80 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 transition-all text-left focus:outline-none group"
              title="Opções de Perfil e Conta"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="overflow-hidden flex-1">
                <h1
                  className="font-bold text-sm tracking-tight text-slate-900 dark:text-white truncate"
                  title={user?.name}
                >
                  {user?.name || 'Usuário'}
                </h1>
                <span
                  className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block truncate"
                  title={activeCompanyName}
                >
                  {activeCompanyName}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors flex-shrink-0" />
            </button>

            {/* Menu Popover suspenso com Opções de Conta */}
            {isUserMenuOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 rounded-2xl bg-white dark:bg-[#0c101b] border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3">
                {/* Informações detalhadas do Usuário */}
                <div className="pb-3 border-b border-slate-200 dark:border-slate-800/80">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white truncate">{user?.name}</span>
                    {getRoleBadge()}
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
                    {user?.email}
                  </span>
                </div>

                {/* Opção de Alternar Modo Claro / Modo Escuro */}
                <button
                  onClick={() => {
                    toggleTheme();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
                    {isDark ? 'Modo Claro' : 'Modo Escuro'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {isDark ? 'Ativar Claro' : 'Ativar Escuro'}
                  </span>
                </button>

                {/* Divisória */}
                <div className="border-t border-slate-200 dark:border-slate-800/80" />

                {/* Opção de Sair da Conta */}
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sair da Conta
                </button>
              </div>
            )}
          </div>

          {/* Links de Navegação Principal (Main Navigation Links) */}
          <nav className="space-y-1 mb-6">
            {user?.role === 'superadmin' ? (
              <>
                {/* Menu exclusivo do Superadmin: apenas gestão global */}
                <Link
                  to="/companies"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    location.pathname === '/companies'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Building2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Gestão de Empresas
                </Link>

                <Link
                  to="/settings"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    location.pathname === '/settings'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Settings className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Configurações de IA
                </Link>
              </>
            ) : (
              <>
                {/* Menu Padrão para Admin e User */}
                <Link
                  to="/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    location.pathname === '/dashboard'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Catálogo de Produtos
                </Link>

                <Link
                  to="/chat"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                    location.pathname === '/chat'
                      ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Agente IA
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/analytics"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      location.pathname === '/analytics'
                        ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 font-semibold border border-purple-500/30 shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    Performance de Produtos
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        {/* Rodapé da Barra Lateral */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 text-center font-medium flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Saask Store</span>
        </div>
      </aside>

      {/* Área de Conteúdo Principal (Main Content Viewport) */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-[#06080d] overflow-y-auto relative transition-colors">
        <div className="p-4 sm:p-6 flex-1 max-w-full">{children}</div>
      </main>
    </div>
  );
};
