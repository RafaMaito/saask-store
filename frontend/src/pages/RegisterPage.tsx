import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authApi } from '../api/auth.api.js';
import { useAuthStore } from '../store/authStore.js';
import { ThemeToggle } from '../components/ThemeToggle.js';
import { Sparkles, Lock, Mail, User as UserIcon, Building2, ArrowRight } from 'lucide-react';

/**
 * Tela de Auto-registro de Empresas e Administradores (Registration Viewport com suporte a Light/Dark Mode)
 */
export const RegisterPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password || !companyName) {
      setError('Por favor, preencha todos os campos obrigatórios (Fill all mandatory fields).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authApi.register({
        name,
        email,
        password,
        companyName,
      });

      setAuth(response.user, response.token);
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao realizar o cadastro. Tente novamente.'
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

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 dark:bg-blue-600/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-blue-500/25 mx-auto mb-4">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Cadastrar Empresa</h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Crie sua plataforma SaaS multi-tenant e gerencie produtos com IA
          </p>
        </div>

        <div className="bg-white dark:bg-[#0c101b]/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Nome da Empresa (Tenant Name)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Ex: Minha Loja Eletrônicos"
                  className="w-full bg-slate-50 dark:bg-[#06080d] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Seu Nome Completo
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu Nome"
                  className="w-full bg-slate-50 dark:bg-[#06080d] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@sualoja.com"
                  className="w-full bg-slate-50 dark:bg-[#06080d] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
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
                  className="w-full bg-slate-50 dark:bg-[#06080d] border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2.5 pl-10 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
                  required
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? 'Cadastrando...' : 'Criar Empresa & Entrar'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Já possui uma conta?{' '}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
