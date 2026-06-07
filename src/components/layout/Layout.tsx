import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu } from 'lucide-react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  /** Quando definido, mostra a seta de voltar à esquerda do cabeçalho. */
  back?: { to: string; label: string };
}

export function Layout({ children, title, subtitle, action, back }: LayoutProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg)' }}>
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Backdrop do drawer (apenas mobile) */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <div className="md:ml-52 lg:ml-56 min-h-screen flex flex-col">
        {/* Page header */}
        <header
          className="sticky top-0 z-30 h-[73px] flex items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 lg:px-8 border-b border-base"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Botão de menu (apenas mobile) */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden shrink-0 -ml-1 p-2 rounded-md text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors"
            >
              <Menu size={22} />
            </button>

            {back && (
              <Link
                to={back.to}
                title={`Voltar para ${back.label}`}
                className="shrink-0 inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-md text-sm font-medium text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors"
              >
                <ArrowLeft size={18} />
                <span className="hidden sm:inline">{back.label}</span>
              </Link>
            )}
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-base-primary tracking-tight truncate">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-base-muted mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">{children}</main>
      </div>
    </div>
  );
}
