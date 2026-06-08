import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Sun, CalendarRange, FolderKanban, CheckCheck } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Loading, ErrorState } from '../components/ui/Loading';
import { Avatar } from '../components/ui/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { taskPeriod } from '../lib/tasks';
import { Task, TaskPeriod } from '../mocks/data';

function formatDone(d?: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: '2-digit' });
}

const PERIOD_META: Record<TaskPeriod, { label: string; icon: typeof Sun; color: string }> = {
  diaria: { label: 'Diária', icon: Sun, color: '#F5AE39' },
  semanal: { label: 'Semanal', icon: CalendarRange, color: '#8637CC' },
};

function DoneCard({ task, projectName, users }: { task: Task; projectName?: string; users: ReturnType<typeof useUsers>['data'] }) {
  const period = taskPeriod(task);
  const pm = PERIOD_META[period];
  const Icon = pm.icon;
  const assignees = task.assignedTo.map((aid) => users.find((u) => u.id === aid)).filter(Boolean);

  return (
    <Link
      to={`/atividades/${task.id}`}
      className="group card-interactive rounded-lg p-4 flex items-center gap-3"
    >
      <CheckCircle2 size={20} className="text-success shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center gap-1 rounded-full font-mono font-semibold px-2 py-0.5 text-[10px]"
            style={{ backgroundColor: `${pm.color}1f`, color: pm.color }}
          >
            <Icon size={11} /> {pm.label}
          </span>
          {projectName && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-viper-500 truncate">
              <FolderKanban size={11} /> {projectName}
            </span>
          )}
        </div>
        <p className="text-sm font-medium line-through text-base-muted truncate">{task.title}</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex -space-x-1.5">
          {assignees.map((a) => (
            <Avatar key={a!.id} user={a!} size={22} fontSize={9} className="border-2 [border-color:var(--surface)]" />
          ))}
        </div>
        <span className="text-xs text-base-muted font-num hidden sm:block">{formatDone(task.completedAt)}</span>
      </div>
    </Link>
  );
}

export function Finalizadas() {
  const { user } = useAuth();
  const { data: tasks, loading, error } = useTasks();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const isSocio = user?.role === 'socio';

  const [scope, setScope] = useState<'mine' | 'all'>('mine');
  const [period, setPeriod] = useState<'all' | TaskPeriod>('all');

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name;

  const done = tasks.filter((t) => t.status === 'concluida');
  const scoped = done.filter((t) => (isSocio && scope === 'all' ? true : t.assignedTo.includes(user?.id ?? '')));

  const dailyCount = scoped.filter((t) => taskPeriod(t) === 'diaria').length;
  const weeklyCount = scoped.filter((t) => taskPeriod(t) === 'semanal').length;

  const filtered = scoped
    .filter((t) => period === 'all' || taskPeriod(t) === period)
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));

  const periodFilters: { key: 'all' | TaskPeriod; label: string }[] = [
    { key: 'all', label: `Todas (${scoped.length})` },
    { key: 'diaria', label: `Diárias (${dailyCount})` },
    { key: 'semanal', label: `Semanais (${weeklyCount})` },
  ];

  return (
    <Layout title="Tasks finalizadas" subtitle="Tudo o que já foi concluído">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Filtro de período */}
        <div className="flex gap-2 flex-wrap">
          {periodFilters.map((f) => {
            const active = period === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setPeriod(f.key)}
                className="px-3.5 py-1.5 rounded-md text-sm font-medium border transition-all duration-150"
                style={
                  active
                    ? { backgroundColor: '#8637CC', borderColor: '#8637CC', color: '#fff', boxShadow: '0 0 16px rgba(134,55,204,0.42)' }
                    : { backgroundColor: 'transparent', borderColor: 'var(--border)', color: 'var(--text-muted)' }
                }
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Escopo (sócio) */}
        {isSocio && (
          <div className="ml-auto inline-flex items-center gap-1 p-1 rounded-lg border" style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}>
            {(['mine', 'all'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setScope(s)}
                className="px-3 py-1 rounded-md text-xs font-medium transition-all"
                style={scope === s ? { backgroundColor: 'var(--surface)', color: 'var(--text-primary)' } : { color: 'var(--text-muted)' }}
              >
                {s === 'mine' ? 'Minhas' : 'Todas'}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <Loading label="Carregando finalizadas…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-muted">
          <CheckCheck size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">Nenhuma task finalizada {period === 'diaria' ? 'diária' : period === 'semanal' ? 'semanal' : ''} ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((task) => (
            <DoneCard key={task.id} task={task} projectName={getProjectName(task.projectId)} users={users} />
          ))}
        </div>
      )}
    </Layout>
  );
}
