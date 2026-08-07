import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api.js';
import { useAuthStore } from '../store/authStore.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Sparkles, Lock, Mail, ShieldCheck, ArrowRight } from 'lucide-react';

/**
 * Tela de Autenticação e Entrada (User Authentication & Login Viewport com suporte a Light/Dark Mode)
 */
export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha (Fill in email and password).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Credenciais inválidas ou erro no servidor.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Botões de Acesso Rápido para Teste Imediato (Quick Demo Login Credentials for Instant Setup Evaluation < 5 min)
  const quickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setLoading(true);
    setError('');
    try {
      const response = await authApi.login({ email: demoEmail, password: 'password123' });
      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao realizar login rápido. Verifique se o seed foi executado (npm run seed).'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#06080d] flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans transition-colors">
      {/* Botão de Alternância de Tema Claro / Escuro */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      {/* Elementos de Brilho de Fundo (Background Ambient Glow Effects) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/10 dark:bg-purple-600/15 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        {/* Marca & Cabeçalho (Brand Logo Header) */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/25 mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Saask Store</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Plataforma Multi-tenant com Agente IA</p>
        </div>

        {/* Card do Formulário (Form Card Container) */}
        <div className="bg-white dark:bg-[#0c101b]/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Acessar Conta</h2>

          {error && (
            <div className="mb-4 p-3 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Autenticando...' : 'Entrar no Sistema'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Atalhos de Login Demonstrativo para Avaliadores (Instant Setup Quick Demo Credentials) */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800/80">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Acesso Rápido para Avaliação:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => quickLogin('superadmin@admin.com')}
                className="col-span-2 p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-center font-semibold transition-colors"
              >
                Superadmin Global
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin@automotors.com')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 text-left font-medium transition-colors"
              >
                Admin (AutoMotors)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('user@automotors.com')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 text-left font-medium transition-colors"
              >
                User (AutoMotors)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('admin@hospitech.com')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 text-left font-medium transition-colors"
              >
                Admin (HospiTech)
              </button>
              <button
                type="button"
                onClick={() => quickLogin('user@hospitech.com')}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 hover:bg-purple-500/10 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800 hover:border-purple-500/30 text-left font-medium transition-colors"
              >
                User (HospiTech)
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Não possui uma empresa cadastrada?{' '}
            <Link to="/register" className="text-purple-600 dark:text-purple-400 hover:underline font-semibold">
              Criar Empresa & Conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
