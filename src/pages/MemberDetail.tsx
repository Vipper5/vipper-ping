import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Edit3 } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useUsers, useTasks, useProjects } from '../lib/hooks';
import { setTaskComplete } from '../lib/api';

function isToday(d: string) {
  return d === new Date().toISOString().split('T')[0];
}
function isThisWeek(d: string) {
  const now = new Date();
  const date = new Date(d + 'T00:00:00');
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  return date >= startOfWeek && date <= endOfWeek;
}
// Monochromatic purple — intensity grows with progress
function progressColor(pct: number): string {
  const sat = 42 + (pct / 100) * 32;
  const light = 66 - (pct / 100) * 22;
  return `hsl(272, ${sat}%, ${light}%)`;
}

interface ProgressMiniProps {
  label: string;
  done: number;
  total: number;
  subtitle: string;
}

function ProgressMini({ label, done, total, subtitle }: ProgressMiniProps) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const color = progressColor(pct);
  return (
    <div
      className="rounded-xl border p-5"
      style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs font-mono uppercase tracking-wider text-base-muted">{label}</p>
        <span className="text-xl font-bold font-mono" style={{ color }}>
          {pct}%
        </span>
      </div>
      <p className="text-xs text-base-secondary mb-3">{subtitle}</p>
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs font-mono text-base-muted mt-2">
        {done} de {total} concluídas
      </p>
    </div>
  );
}

export function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: tasks, reload } = useTasks();
  const { data: projects } = useProjects();

  const member = users.find((u) => u.id === id);

  if (usersLoading) {
    return (
      <Layout title="Carregando…">
        <Loading />
      </Layout>
    );
  }

  if (!member) {
    return (
      <Layout title="Membro não encontrado">
        <Link to="/membros" className="text-viper-500 hover:text-viper-400 flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Voltar para membros
        </Link>
      </Layout>
    );
  }

  const canEdit = currentUser?.role === 'socio' && member.role === 'estagiario';
  const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id));
  const todayTasks = memberTasks.filter((t) => isToday(t.dueDate));
  const weekTasks = memberTasks.filter((t) => isThisWeek(t.dueDate));
  const completedTasks = memberTasks.filter((t) => t.status === 'concluida');

  const todayDone = todayTasks.filter((t) => t.status === 'concluida').length;
  const weekDone = weekTasks.filter((t) => t.status === 'concluida').length;
  const totalPct =
    memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name ?? pid;

  const toggleTaskStatus = async (taskId: string) => {
    const current = tasks.find((t) => t.id === taskId);
    if (!current) return;
    await setTaskComplete(taskId, current.status !== 'concluida');
    reload();
  };

  return (
    <Layout
      title={member.name}
      subtitle={member.title}
      back={{ to: '/membros', label: 'Membros' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: profile card + overall progress */}
        <div className="lg:col-span-1 space-y-4">
          {/* Avatar + identity */}
          <div
            className="rounded-xl border p-6 flex flex-col items-center text-center"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-20 h-20 rounded-full bg-viper-700 flex items-center justify-center mb-4 ring-4 ring-viper-500/20 overflow-hidden">
              {member.photo ? (
                <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-viper-200 font-mono">{member.initials}</span>
              )}
            </div>
            <h2 className="text-lg font-bold text-base-primary">{member.name}</h2>
            <p className="text-sm text-base-muted mt-0.5">{member.title}</p>
            <div className="mt-3">
              <Badge variant={member.role === 'socio' ? 'primary' : 'neutral'}>
                {member.role === 'socio' ? 'Sócio' : 'Estagiário'}
              </Badge>
            </div>

            {member.bio && (
              <p className="text-xs text-base-secondary mt-4 leading-relaxed text-left">{member.bio}</p>
            )}

            <div className="w-full mt-4 space-y-2 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
              {member.email && (
                <div className="flex items-center gap-2 text-xs text-base-muted font-mono">
                  <Mail size={12} className="text-viper-400 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-2 text-xs text-base-muted font-mono">
                  <Phone size={12} className="text-viper-400 shrink-0" />
                  <span>{member.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Overall progress */}
          <div
            className="rounded-xl border p-5"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h3 className="text-xs font-mono uppercase tracking-wider text-base-muted mb-4">
              Progresso geral
            </h3>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono text-base-muted">
                {completedTasks.length} de {memberTasks.length} concluídas
              </span>
              <span className="text-xl font-bold font-mono" style={{ color: progressColor(totalPct) }}>
                {totalPct}%
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${totalPct}%`, backgroundColor: progressColor(totalPct) }}
              />
            </div>
          </div>
        </div>

        {/* Right column: daily/weekly progress + task list */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProgressMini
              label="Progresso diário"
              done={todayDone}
              total={todayTasks.length}
              subtitle={todayTasks.length === 0 ? 'Sem tarefas hoje' : `${todayTasks.length} com prazo hoje`}
            />
            <ProgressMini
              label="Progresso semanal"
              done={weekDone}
              total={weekTasks.length}
              subtitle={weekTasks.length === 0 ? 'Sem tarefas esta semana' : `${weekTasks.length} na semana`}
            />
          </div>

          {/* Task list */}
          <div
            className="rounded-xl border overflow-hidden"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 border-b"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <span className="text-xs font-mono uppercase tracking-wider text-base-muted">
                Tasks ({memberTasks.length})
              </span>
              {canEdit && (
                <span className="text-xs text-viper-400 font-mono flex items-center gap-1.5">
                  <Edit3 size={11} /> Modo edição ativo
                </span>
              )}
            </div>

            {memberTasks.length === 0 ? (
              <div className="px-5 py-10 text-center text-base-muted text-sm">
                Nenhuma task atribuída.
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {memberTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-4 px-5 py-3.5">
                    {canEdit ? (
                      <button
                        onClick={() => toggleTaskStatus(task.id)}
                        className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center transition-colors ${
                          task.status === 'concluida'
                            ? 'bg-success border-success'
                            : 'border-neutral-400 hover:border-viper-500'
                        }`}
                      >
                        {task.status === 'concluida' && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path
                              d="M1 4L3.5 6.5L9 1"
                              stroke="white"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          task.status === 'concluida'
                            ? 'bg-success'
                            : task.status === 'em_andamento'
                            ? 'bg-info'
                            : 'bg-neutral-400'
                        }`}
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-medium truncate ${
                          task.status === 'concluida'
                            ? 'line-through text-base-muted'
                            : 'text-base-primary'
                        }`}
                      >
                        {task.title}
                      </p>
                      <p className="text-xs text-base-muted font-mono mt-0.5">
                        {getProjectName(task.projectId)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
