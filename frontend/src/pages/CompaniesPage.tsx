import React, { useEffect, useState } from 'react';
import { companyApi } from '../api/company.api.js';
import { ICompany } from '../types/index.js';
import { PageHeader } from '../components/common/PageHeader.js';
import {
  Building2,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  UserCheck,
  Mail,
  Lock,
  User,
  Sparkles,
  Power,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  X,
  ShieldAlert,
} from 'lucide-react';

type ModalActionType = 'activate' | 'deactivate' | 'delete' | null;

/**
 * Painel de Gestão Global de Tenants (Superadmin Tenant Management Viewport)
 */
export const CompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<ICompany[]>([]);
  const [loading, setLoading] = useState(true);

  // Campos do formulário de criação
  const [newCompanyName, setNewCompanyName] = useState('');
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [successInfo, setSuccessInfo] = useState<{
    companyName: string;
    adminName?: string;
    adminEmail?: string;
  } | null>(null);

  // Estado do Modal de Confirmação com Senha (Toggle / Delete)
  const [selectedCompany, setSelectedCompany] = useState<ICompany | null>(null);
  const [modalAction, setModalAction] = useState<ModalActionType>(null);
  const [superadminPassword, setSuperadminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await companyApi.getCompanies();
      setCompanies(res.companies);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao buscar lista de empresas.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;

    setCreating(true);
    setError('');
    setSuccessInfo(null);

    try {
      const res = await companyApi.createCompany({
        name: newCompanyName.trim(),
        adminName: adminName.trim() || undefined,
        adminEmail: adminEmail.trim() || undefined,
        adminPassword: adminPassword || undefined,
      });

      setSuccessInfo({
        companyName: res.company.name,
        adminName: res.adminUser?.name,
        adminEmail: res.adminUser?.email,
      });

      // Limpa os campos
      setNewCompanyName('');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');

      fetchCompanies();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Erro ao cadastrar nova empresa.'
      );
    } finally {
      setCreating(false);
    }
  };

  // Abrir Modal de Confirmação
  const openConfirmModal = (company: ICompany, action: ModalActionType) => {
    setSelectedCompany(company);
    setModalAction(action);
    setSuperadminPassword('');
    setModalError('');
    setShowPassword(false);
  };

  // Fechar Modal
  const closeConfirmModal = () => {
    setSelectedCompany(null);
    setModalAction(null);
    setSuperadminPassword('');
    setModalError('');
  };

  // Executar Ação Confirmada com Senha
  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !modalAction || !superadminPassword) return;

    setProcessingAction(true);
    setModalError('');

    try {
      if (modalAction === 'activate' || modalAction === 'deactivate') {
        await companyApi.toggleCompanyStatus(selectedCompany._id, superadminPassword);
      } else if (modalAction === 'delete') {
        await companyApi.deleteCompany(selectedCompany._id, superadminPassword);
      }

      closeConfirmModal();
      fetchCompanies();
    } catch (err: unknown) {
      setModalError(
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ||
          'Erro ao processar alteração na empresa.'
      );
    } finally {
      setProcessingAction(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      {/* Cabeçalho Padronizado */}
      <PageHeader
        icon={Building2}
        title="Gestão de Empresas"
        subtitle="Painel exclusivo do Superadmin para cadastro, auditoria, alteração de status e exclusão de empresas."
        actions={
          <button
            onClick={fetchCompanies}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white shadow-sm transition-colors"
            title="Atualizar Lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        }
      />

      {/* Card de Mensagem de Sucesso */}
      {successInfo && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-start gap-3 shadow-md animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 text-sm">
            <p className="font-bold">
              Empresa <strong>"{successInfo.companyName}"</strong> cadastrada com sucesso!
            </p>
            {successInfo.adminEmail ? (
              <p className="text-xs text-emerald-800 dark:text-emerald-400">
                👤 Administrador criado: <strong>{successInfo.adminName}</strong> (<span>{successInfo.adminEmail}</span>
                ). Agora ele já pode acessar a plataforma!
              </p>
            ) : (
              <p className="text-xs opacity-90">Nenhum usuário administrador foi vinculado durante o cadastro.</p>
            )}
          </div>
        </div>
      )}

      {/* Formulário de Criação de Nova Empresa + Administrador */}
      <div className="bg-white dark:bg-slate-900/60 backdrop-blur-md rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" /> Cadastrar Nova Empresa & Administrador
          Responsável
        </h2>

        {error && (
          <div className="p-3 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleCreateCompany} className="space-y-4">
          {/* Seção 1: Dados da Empresa */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              1. Dados da Empresa (Tenant)
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
                placeholder="Nome da empresa (ex: Confeitaria Doce Mel)"
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Seção 2: Dados do Usuário Administrador */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-purple-500" /> 2. Administrador Responsável da Empresa
            </label>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Nome do Admin */}
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  placeholder="Nome do Administrador"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              {/* E-mail do Admin */}
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="E-mail do Administrador"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>

              {/* Senha do Admin */}
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Senha de Acesso"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={creating || !newCompanyName.trim() || !adminName.trim() || !adminEmail.trim() || !adminPassword}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-purple-500/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {creating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Provisionando...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Cadastrar Empresa & Criar Admin
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tabela de Empresas Cadastradas (Tenants Audit Table com Ativação/Desativação e Exclusão) */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-200">Empresas Cadastradas no Sistema</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {companies.length} empresa(s) registrada(s)
          </span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">Carregando empresas...</div>
        ) : companies.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">Nenhuma empresa encontrada.</div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
            {companies.map((company) => (
              <div
                key={company._id}
                className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-sm ${
                      company.active !== false
                        ? 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400'
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}
                  >
                    {company.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{company.name}</h4>
                      {company.active !== false ? (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Ativa
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <XCircle className="w-3 h-3" /> Inativa
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">slug: {company.slug}</span>
                  </div>
                </div>

                {/* Ações do Superadmin: Ativar/Desativar e Deletar */}
                <div className="flex items-center gap-2">
                  {company.active !== false ? (
                    <button
                      onClick={() => openConfirmModal(company, 'deactivate')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold transition-all flex items-center gap-1.5"
                      title="Desativar Empresa"
                    >
                      <Power className="w-3.5 h-3.5" /> Desativar
                    </button>
                  ) : (
                    <button
                      onClick={() => openConfirmModal(company, 'activate')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold transition-all flex items-center gap-1.5"
                      title="Ativar Empresa"
                    >
                      <Power className="w-3.5 h-3.5" /> Ativar
                    </button>
                  )}

                  <button
                    onClick={() => openConfirmModal(company, 'delete')}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 transition-all text-xs flex items-center gap-1"
                    title="Excluir Empresa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pop-up / Modal de Confirmação com Senha do Superadmin */}
      {selectedCompany && modalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                {modalAction === 'delete' ? (
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/20">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                )}
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {modalAction === 'delete'
                    ? 'Excluir Empresa'
                    : modalAction === 'deactivate'
                      ? 'Desativar Empresa'
                      : 'Ativar Empresa'}
                </h3>
              </div>
              <button
                onClick={closeConfirmModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <p className="text-slate-700 dark:text-slate-300">
                Você realmente deseja{' '}
                {modalAction === 'delete' ? 'excluir' : modalAction === 'deactivate' ? 'desativar' : 'ativar'} a empresa{' '}
                <strong className="text-slate-900 dark:text-white font-extrabold">"{selectedCompany.name}"</strong>?
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                {modalAction === 'delete'
                  ? '⚠️ Atenção: Esta ação é irreversível e excluirá a empresa juntamente com todos os usuários vinculados.'
                  : modalAction === 'deactivate'
                    ? '⚠️ A empresa ficará inativa e nenhum usuário desta empresa conseguirá acessar a plataforma até que seja reativada.'
                    : 'ℹ️ A empresa será reativada e todos os seus usuários voltarão a ter acesso normal ao sistema.'}
              </p>
            </div>

            {modalError && (
              <div className="p-3 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Digite sua senha de Superadmin para confirmar *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={superadminPassword}
                    onChange={(e) => setSuperadminPassword(e.target.value)}
                    placeholder="Sua senha de Superadmin"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeConfirmModal}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                  disabled={processingAction}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processingAction || !superadminPassword}
                  className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-lg transition-all flex items-center gap-1.5 disabled:opacity-50 ${
                    modalAction === 'delete'
                      ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/25'
                      : 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/25'
                  }`}
                >
                  {processingAction ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processando...
                    </>
                  ) : modalAction === 'delete' ? (
                    'Confirmar Exclusão'
                  ) : modalAction === 'deactivate' ? (
                    'Confirmar Desativação'
                  ) : (
                    'Confirmar Ativação'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
