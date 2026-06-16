import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  socioOnly?: boolean;
  estagiarioOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard',   label: 'Dashboard',  icon: 'ph-squares-four' },
  { to: '/projetos',    label: 'Clientes',   icon: 'ph-folder-notch' },
  { to: '/atividades',  label: 'Tasks',       icon: 'ph-check-square' },
  { to: '/finalizadas', label: 'Finalizadas', icon: 'ph-check-circle' },
  { to: '/agenda',      label: 'Agenda',      icon: 'ph-calendar-blank' },
  { to: '/membros',     label: 'Membros',     icon: 'ph-users' },
  { to: '/relatorios',  label: 'Relatórios',  icon: 'ph-chart-bar', socioOnly: true },
  { to: '/ponto',       label: 'Ponto',       icon: 'ph-clock', estagiarioOnly: true },
];

function UserAvatar({ user, size = 32 }: {
  user: { name: string; initials: string; photo?: string | null };
  size?: number;
}) {
  if (user.photo) {
    return (
      <img
        src={user.photo}
        alt={user.name}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          border: '1.5px solid rgba(74,17,162,0.55)',
        }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      background: 'rgba(74,17,162,0.22)',
      border: '1.5px solid rgba(74,17,162,0.45)',
      color: '#C9B6F0',
      fontFamily: 'Oswald, sans-serif', fontWeight: 500,
      fontSize: `${Math.round(size * 0.34)}px`, letterSpacing: '0.06em',
    }}>
      {user.initials}
    </div>
  );
}

interface SidebarProps {
  open?: boolean;
  onClose?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ITEM_LABEL: React.CSSProperties = {
  fontFamily: 'Oswald, sans-serif',
  fontWeight: 500,
  fontSize: '11.5px',
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
};

export function Sidebar({ open = false, onClose, collapsed = false, onToggleCollapse }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [logoutHover, setLogoutHover] = useState(false);
  const [themeHover,  setThemeHover]  = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isMatheus = user?.name?.toLowerCase().startsWith('matheus');
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.socioOnly && user?.role !== 'socio') return false;
    if (item.estagiarioOnly && user?.role !== 'estagiario') return false;
    if (item.to === '/ponto' && isMatheus) return false;
    return true;
  });

  const muted  = 'rgba(255,255,255,0.35)';
  const bright = 'rgba(255,255,255,0.80)';
  const divider = '0.5px solid rgba(255,255,255,0.06)';

  return (
    <aside
      className={`fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 md:translate-x-0 ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
      style={{
        width: collapsed ? '68px' : '220px',
        background: `
          radial-gradient(ellipse 140% 30% at 50% 0%, rgba(74,17,162,0.30) 0%, transparent 60%),
          rgba(10, 10, 14, 0.84)
        `,
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        borderRight: '0.5px solid rgba(255,255,255,0.07)',
      }}
    >

      {/* ─── HEADER ─── */}
      <div
        className="h-[68px] flex items-center shrink-0"
        style={{
          borderBottom: divider,
          padding: '0 10px 0 16px',
          justifyContent: 'space-between',
        }}
      >
        {collapsed ? (
          /* Compacto: apenas o botão de expandir, centralizado */
          <CollapseButton collapsed={collapsed} onToggle={onToggleCollapse} center />
        ) : (
          /* Expandido: logo à esquerda + botão à direita */
          <>
            <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
              <div className="vipper-logo shrink-0" style={{ width: 32, height: 32 }}>
                <img src="/Vipper - ROXA.png" className="ghost" alt="" />
                <img src="/Vipper - ROXA.png" className="base" alt="Vipper" />
              </div>
              <div className="leading-none">
                <div style={{
                  fontFamily: 'Oswald, sans-serif', fontWeight: 700,
                  fontSize: '15px', letterSpacing: '0.18em',
                  color: '#FFFFFF', textTransform: 'uppercase',
                }}>VIPPER</div>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontWeight: 400,
                  fontSize: '8.5px', color: '#6B28C4',
                  letterSpacing: '0.34em', marginTop: '2px',
                }}>PING</div>
              </div>
            </Link>
            <CollapseButton collapsed={collapsed} onToggle={onToggleCollapse} />
          </>
        )}
      </div>

      {/* ─── NAV ─── */}
      <nav className="flex-1 overflow-y-auto py-5 px-2" style={{ overflowX: 'hidden' }}>
        {visibleItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onClose}>
            {({ isActive }) => (
              <SidebarItem
                icon={item.icon}
                label={item.label}
                isActive={isActive}
                collapsed={collapsed}
                muted={muted}
                bright={bright}
              />
            )}
          </NavLink>
        ))}
      </nav>

      {/* ─── UTILS ─── */}
      <div style={{ borderTop: divider, padding: '4px 8px' }}>
        <button
          onClick={toggle}
          onMouseEnter={() => setThemeHover(true)}
          onMouseLeave={() => setThemeHover(false)}
          title={dark ? 'Modo Claro' : 'Modo Escuro'}
          className="w-full flex items-center rounded-md transition-all duration-150"
          style={{
            gap: collapsed ? 0 : '10px',
            padding: collapsed ? '9px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: themeHover ? bright : muted,
            background: themeHover ? 'rgba(255,255,255,0.04)' : 'transparent',
          }}
        >
          <i className={`ph-light ${dark ? 'ph-sun' : 'ph-moon'}`} style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }} />
          {!collapsed && <span style={ITEM_LABEL}>{dark ? 'Modo Claro' : 'Modo Escuro'}</span>}
        </button>

        <button
          onClick={handleLogout}
          onMouseEnter={() => setLogoutHover(true)}
          onMouseLeave={() => setLogoutHover(false)}
          title="Sair"
          className="w-full flex items-center rounded-md transition-all duration-150"
          style={{
            gap: collapsed ? 0 : '10px',
            padding: collapsed ? '9px 0' : '8px 12px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: logoutHover ? '#EF4444' : muted,
            background: logoutHover ? 'rgba(239,68,68,0.08)' : 'transparent',
          }}
        >
          <i className="ph-light ph-sign-out" style={{ fontSize: '16px', lineHeight: 1, flexShrink: 0 }} />
          {!collapsed && <span style={ITEM_LABEL}>Sair</span>}
        </button>
      </div>

      {/* ─── PROFILE (rodapé) ─── */}
      {user && (
        <Link
          to="/perfil"
          onClick={onClose}
          className="flex items-center shrink-0 transition-all duration-150"
          style={{
            borderTop: divider,
            gap: collapsed ? 0 : '10px',
            padding: collapsed ? '12px 0' : '10px 14px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: 'rgba(255,255,255,0.02)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(74,17,162,0.10)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
        >
          <UserAvatar user={user} size={34} />
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p style={{
                  fontFamily: 'Geist, sans-serif', fontWeight: 600,
                  fontSize: '12px', color: '#F5F5F7',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user.name}
                </p>
                <p style={{
                  fontFamily: 'Oswald, sans-serif', fontWeight: 500,
                  fontSize: '8.5px', color: '#6B28C4',
                  letterSpacing: '0.20em', textTransform: 'uppercase', marginTop: '2px',
                }}>
                  {user.title ?? (user.role === 'socio' ? 'Sócio' : 'Estagiário')}
                </p>
              </div>
              <i className="ph-light ph-caret-right" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', flexShrink: 0 }} />
            </>
          )}
        </Link>
      )}
    </aside>
  );
}

/* ─── Botão de colapso no header ─── */
function CollapseButton({ collapsed, onToggle, center }: { collapsed: boolean; onToggle?: () => void; center?: boolean }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onToggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? 'Expandir menu' : 'Recolher menu'}
      style={{
        flexShrink: 0,
        width: center ? '44px' : '32px',
        height: center ? '44px' : '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10px',
        cursor: 'pointer',
        border: `0.5px solid ${hovered ? 'rgba(153,102,224,0.55)' : 'rgba(255,255,255,0.10)'}`,
        transition: 'all 0.18s ease',
        background: hovered
          ? 'rgba(74,17,162,0.30)'
          : center ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
        color: hovered ? '#C9B6F0' : 'rgba(255,255,255,0.50)',
        boxShadow: hovered ? '0 0 16px rgba(74,17,162,0.35), inset 0 0 8px rgba(74,17,162,0.10)' : 'none',
        margin: center ? '0 auto' : undefined,
      }}
    >
      <i
        className="ph-light ph-sidebar-simple"
        style={{ fontSize: center ? '18px' : '15px', lineHeight: 1, transform: collapsed ? 'scaleX(-1)' : 'none', transition: 'transform 0.3s ease' }}
      />
    </button>
  );
}

/* ─── Item de nav ─── */
interface SidebarItemProps {
  icon: string;
  label: string;
  isActive: boolean;
  collapsed: boolean;
  muted: string;
  bright: string;
}

function SidebarItem({ icon, label, isActive, collapsed, muted, bright }: SidebarItemProps) {
  const [hovered, setHovered] = useState(false);

  /* Ativo: roxo escuro sólido | Hover: versão mais suave do mesmo estilo */
  const ACTIVE_COLOR = '#5B1FB5';
  const ACTIVE_GLOW  = 'rgba(91,31,181,0.85)';
  const HOVER_COLOR  = 'rgba(107,40,196,0.55)';
  const HOVER_GLOW   = 'rgba(107,40,196,0.40)';

  const showBar = isActive || hovered;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={collapsed ? label : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        gap: collapsed ? 0 : '12px',
        padding: collapsed ? '11px 0' : '10px 14px 10px 18px',
        justifyContent: collapsed ? 'center' : 'flex-start',
        borderRadius: '8px',
        cursor: 'pointer',
        marginBottom: '5px',
        transition: 'background 0.20s ease, color 0.20s ease',
        color: isActive ? '#FFFFFF' : hovered ? '#E0D4F7' : muted,
        background: hovered && !isActive
          ? 'rgba(255,255,255,0.05)'
          : 'transparent',
      }}
    >
      {/* Barra lateral — aparece tanto no hover quanto no ativo */}
      <span style={{
        position: 'absolute',
        left: 0,
        top: '18%',
        bottom: '18%',
        width: isActive ? '3px' : '2px',
        borderRadius: '0 4px 4px 0',
        background: isActive ? ACTIVE_COLOR : HOVER_COLOR,
        opacity: showBar ? 1 : 0,
        boxShadow: isActive
          ? `0 0 12px 4px ${ACTIVE_GLOW}, 0 0 4px 2px ${ACTIVE_COLOR}`
          : `0 0 8px 2px ${HOVER_GLOW}`,
        transition: 'opacity 0.20s ease, width 0.20s ease, background 0.20s ease, box-shadow 0.20s ease',
      }} />

      <i
        className={`ph-light ${icon}`}
        style={{
          fontSize: '18px',
          lineHeight: 1,
          flexShrink: 0,
          color: isActive ? '#FFFFFF' : hovered ? '#C9B6F0' : 'inherit',
          transition: 'color 0.20s ease, filter 0.20s ease',
          filter: isActive
            ? 'drop-shadow(0 0 6px rgba(91,31,181,0.60))'
            : hovered
            ? 'drop-shadow(0 0 5px rgba(107,40,196,0.50))'
            : 'none',
        }}
      />

      {!collapsed && (
        <span style={{
          fontFamily: 'Oswald, sans-serif',
          fontWeight: isActive ? 600 : 500,
          fontSize: '12px',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
      )}
    </div>
  );
}
