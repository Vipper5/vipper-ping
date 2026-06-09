import React from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  CheckCheck,
  CalendarDays,
  BarChart2,
  Clock,
  LogOut,
  Sun,
  Moon,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  socioOnly?: boolean;
  estagiarioOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/projetos', label: 'Clientes', icon: <FolderKanban size={18} /> },
  { to: '/atividades', label: 'Tasks', icon: <CheckSquare size={18} /> },
  { to: '/finalizadas', label: 'Finalizadas', icon: <CheckCheck size={18} /> },
  { to: '/agenda', label: 'Agenda', icon: <CalendarDays size={18} /> },
  { to: '/membros', label: 'Membros', icon: <Users size={18} /> },
  { to: '/relatorios', label: 'Relatórios', icon: <BarChart2 size={18} />, socioOnly: true },
  { to: '/ponto', label: 'Ponto', icon: <Clock size={18} />, estagiarioOnly: true },
];

function UserAvatar({ user }: { user: { name: string; initials: string; photo?: string | null } }) {
  if (user.photo) {
    return (
      <img
        src={user.photo}
        alt={user.name}
        className="w-9 h-9 rounded-full object-cover shrink-0 ring-2 ring-viper-700"
      />
    );
  }
  return (
    <div className="w-9 h-9 rounded-full bg-viper-700 flex items-center justify-center shrink-0 ring-2 ring-viper-800">
      <span className="text-xs font-bold text-viper-200 font-mono">{user.initials}</span>
    </div>
  );
}

interface SidebarProps {
  /** No mobile, controla se o drawer está aberto. */
  open?: boolean;
  /** Fecha o drawer (mobile). */
  onClose?: () => void;
}

export function Sidebar({ open = false, onClose }: SidebarProps) {
  const { user, signOut } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.socioOnly && user?.role !== 'socio') return false;
    if (item.estagiarioOnly && user?.role !== 'estagiario') return false;
    return true;
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen w-64 md:w-52 lg:w-56 flex flex-col z-50 transition-transform duration-200 md:translate-x-0 ${
        open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
      }`}
      style={{ backgroundColor: 'var(--sidebar-bg)' }}
    >
      {/* Logo — height matches the page header so the bottom borders align */}
      <div className="h-[73px] flex items-center gap-3 px-5 border-b shrink-0" style={{ borderColor: 'var(--sidebar-border)' }}>
        <img src="/logo2-color.png" alt="Vipper" className="h-9 w-9 object-contain shrink-0" />
        <div>
          <div className="text-white font-bold text-sm leading-tight">Vipper</div>
          <div className="text-viper-300 text-xs font-mono tracking-widest uppercase">Ping</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
          >
            {({ isActive }) => (
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-viper-500/10 text-viper-400'
                    : 'text-neutral-400 hover:text-white hover:bg-carvao-surface1'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 inset-y-1.5 w-[3px] rounded-r bg-viper-500" />
                )}
                <span className={isActive ? 'pl-1' : ''}>{item.icon}</span>
                <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom — theme + logout */}
      <div className="px-3 pt-3 pb-2 border-t space-y-1" style={{ borderColor: 'var(--sidebar-border)' }}>
        <button
          onClick={toggle}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-neutral-400 hover:text-white hover:bg-carvao-surface1 text-sm transition-colors"
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
          <span>{dark ? 'Modo claro' : 'Modo escuro'}</span>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-neutral-400 hover:text-danger hover:bg-red-950/30 text-sm transition-colors"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </button>
      </div>

      {/* Profile — minimal button pinned to the very bottom, links to /perfil */}
      {user && (
        <Link
          to="/perfil"
          onClick={onClose}
          className="group flex items-center gap-3 px-4 py-3 border-t hover:bg-carvao-surface1 transition-colors shrink-0"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          <UserAvatar user={user} />
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate leading-tight">{user.name}</p>
            <p className="text-neutral-500 text-[11px] font-mono truncate leading-tight mt-0.5">
              {user.title ?? (user.role === 'socio' ? 'Sócio' : 'Estagiário')}
            </p>
          </div>
          <ChevronRight size={14} className="text-neutral-600 group-hover:text-viper-400 shrink-0 transition-colors" />
        </Link>
      )}
    </aside>
  );
}
