import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Componente Reutilizável de Cabeçalho Padronizado das Páginas (Standardized Page Header Component)
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 mb-6 font-sans">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
              {title}
            </h1>
            {badge}
          </div>
        </div>
        {subtitle && (
          <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 sm:pl-[3.25rem]">
            {subtitle}
          </div>
        )}
      </div>

      {actions && <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">{actions}</div>}
    </div>
  );
};
