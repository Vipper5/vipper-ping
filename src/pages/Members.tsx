import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useUsers, useTasks } from '../lib/hooks';
import { CheckSquare, Clock, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Monochromatic purple — intensity grows with progress
function progressColor(pct: number): string {
  const sat = 42 + (pct / 100) * 32;
  const light = 66 - (pct / 100) * 22;
  return `hsl(272, ${sat}%, ${light}%)`;
}

export function Members() {
  const { user } = useAuth();
  const { data: users, loading, error } = useUsers();
  const { data: tasks } = useTasks();

  return (
    <Layout title="Membros" subtitle="Equipe VipperDev">
      {loading ? (
        <Loading label="Carregando equipe…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {users.map((member) => {
          const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id));
          const activeTasks = memberTasks.filter((t) => t.status !== 'concluida');
          const completedTasks = memberTasks.filter((t) => t.status === 'concluida');
          const pct = memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;
          const color = progressColor(pct);
          const isCurrentUser = user?.id === member.id;

          return (
            <Link
              key={member.id}
              to={isCurrentUser ? '/perfil' : `/membros/${member.id}`}
              className="group card-interactive rounded-md p-5 flex flex-col gap-4"
            >
              {/* Header: avatar + name */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-viper-700 flex items-center justify-center shrink-0 group-hover:ring-2 group-hover:ring-viper-500/30 transition-all overflow-hidden">
                  {member.photo ? (
                    <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-bold text-viper-200 font-mono">{member.initials}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-base-primary text-sm group-hover:text-viper-400 transition-colors">
                      {member.name}
                    </p>
                    <Badge variant={member.role === 'socio' ? 'primary' : 'neutral'}>
                      {member.role === 'socio' ? 'Sócio' : 'Estagiário'}
                    </Badge>
                    {isCurrentUser && <Badge variant="primary">Você</Badge>}
                  </div>
                  <p className="text-xs text-base-muted mt-0.5 truncate">{member.title}</p>
                </div>
                <ChevronRight
                  size={15}
                  className="text-base-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
                />
              </div>

              {/* Stats + progress bar */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-xs font-mono text-base-muted">
                    <span className="flex items-center gap-1.5">
                      <Clock size={11} className="text-base-muted" />
                      {activeTasks.length} ativas
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckSquare size={11} className="text-viper-400" />
                      {completedTasks.length} concluídas
                    </span>
                  </div>
                  <span className="text-xs font-mono font-bold" style={{ color }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      )}
    </Layout>
  );
}
