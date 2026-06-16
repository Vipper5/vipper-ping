import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  back?: { to: string; label: string };
}

function getSavedCollapsed(): boolean {
  try { return localStorage.getItem('sidebar-collapsed') === 'true'; } catch { return false; }
}

export function Layout({ children, title, subtitle, action, back }: LayoutProps) {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [collapsed, setCollapsed]     = useState(getSavedCollapsed);
  const navigate = useNavigate();

  const handleToggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem('sidebar-collapsed', String(next)); } catch {}
      return next;
    });
  };

  /* Larguras */
  const sidebarW     = collapsed ? 68  : 220;   // px
  const sidebarWMd   = collapsed ? 68  : 208;
  const sidebarWLg   = collapsed ? 68  : 220;

  return (
    <div className="min-h-screen relative" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Blobs fixos de fundo — aparecem por baixo do glass da sidebar */}
      <div className="bg-blob bg-blob-1" aria-hidden />
      <div className="bg-blob bg-blob-2" aria-hidden />

      <Sidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Backdrop drawer mobile */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      {/* ─── CONTENT ─── */}
      <div
        className="min-h-screen flex flex-col relative z-10 transition-all duration-300"
        style={{ marginLeft: `${sidebarW}px` }}
      >
        {/* ─── PAGE HEADER ─── */}
        <header
          className="sticky top-0 z-30 h-[68px] flex items-center justify-between gap-3 sm:gap-4 px-5 sm:px-6 lg:px-8"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            backgroundColor: 'var(--surface)',
            borderBottom: '0.5px solid var(--border)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {/* Botão menu mobile */}
            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menu"
              className="md:hidden shrink-0 -ml-1 p-2 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#4A11A2')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <i className="ph-light ph-list" style={{ fontSize: '22px', lineHeight: 1 }} />
            </button>

            {back && (
              <button
                onClick={() => navigate(-1)}
                title={`Voltar para ${back.label}`}
                className="shrink-0 inline-flex items-center gap-1.5 -ml-2 px-2 py-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#4A11A2')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                <i className="ph-light ph-arrow-left" style={{ fontSize: '17px' }} />
                <span className="hidden sm:inline font-label text-[11px] tracking-[0.10em]">
                  {back.label.toUpperCase()}
                </span>
              </button>
            )}

            <div className="min-w-0">
              <h1
                className="font-titulo truncate"
                style={{ fontSize: 'clamp(16px, 2vw, 22px)', color: 'var(--text-primary)' }}
              >
                {typeof title === 'string' ? title.toUpperCase() : title}
              </h1>
              {subtitle && (
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {action && <div className="shrink-0">{action}</div>}
        </header>

        {/* ─── CONTENT ─── */}
        <main className="flex-1 px-5 sm:px-6 lg:px-8 py-5 sm:py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
