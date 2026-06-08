import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ListChecks, CalendarRange, Sun, CalendarClock, Flag } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { StatusBadge } from '../components/ui/Badge';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { progressState } from '../lib/progress';
import { Avatar } from '../components/ui/Avatar';
import {
  Task,
  Project,
  User,
  TaskPeriod,
} from '../mocks/data';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const STATUS_RANK: Record<string, number> = { em_andamento: 0, pendente: 1, concluida: 2 };

// Período da task (legado sem período = diária).
function taskPeriod(t: Task): TaskPeriod {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
}

// Metadados visuais de cada período (ícone + cor própria).
const PERIOD_META: Record<TaskPeriod, { label: string; icon: typeof Sun; color: string }> = {
  diaria: { label: 'Diária', icon: Sun, color: '#F5AE39' },
  semanal: { label: 'Semanal', icon: CalendarRange, color: '#8637CC' },
};

// Cor por prioridade (acento lateral do card).
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  alta: { label: 'Alta', color: '#E54056' },
  media: { label: 'Média', color: '#F5AE39' },
  baixa: { label: 'Baixa', color: '#15BB77' },
};

function TaskCard({ task, tasks, projects, users }: { task: Task; tasks: Task[]; projects: Project[]; users: User[] }) {
  const project = projects.find((p) => p.id === task.projectId);
  const assignees = task.assignedTo.map((aid) => users.find((u) => u.id === aid)).filter(Boolean);
  const doneSubtasks = task.subtasks.filter((s) => s.done).length;
  const isDone = task.status === 'concluida';

  const period = taskPeriod(task);
  const pm = PERIOD_META[period];
  const PeriodIcon = pm.icon;
  const isWeekly = period === 'semanal';
  const prio = PRIORITY_META[task.priority] ?? PRIORITY_META.media;

  // Numa semanal, o progresso vem das diárias ligadas (mesmo critério do projeto/detalhe).
  const dailies = isWeekly ? tasks.filter((t) => t.parentTaskId === task.id) : [];
  const dailiesDone = dailies.filter((d) => d.status === 'concluida').length;
  const weekProg = progressState(dailiesDone, dailies.length);

  return (
    <Link
      to={`/atividades/${task.id}`}
      className={`group relative card-interactive rounded-lg overflow-hidden flex flex-col ${isWeekly ? 'gap-3 p-5 pl-6' : 'gap-2.5 p-4 pl-5'} ${isDone ? 'opacity-70' : ''}`}
    >
      {/* Acento lateral por prioridade */}
      <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: prio.color }} />

      {/* Cabeçalho: selo de período (ícone próprio) + status */}
      <div className="flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wide px-2.5 py-1 text-[11px]"
          style={{ backgroundColor: `${pm.color}1f`, color: pm.color }}
        >
          <PeriodIcon size={isWeekly ? 14 : 12} />
          {pm.label}
        </span>
        <StatusBadge status={task.status} />
      </div>

      {/* Título */}
      <p
        className={`font-semibold leading-snug line-clamp-2 ${isWeekly ? 'text-base' : 'text-sm'} ${isDone ? 'line-through text-base-muted' : 'text-base-primary'}`}
      >
        {task.title}
      </p>

      {/* Projeto + prioridade */}
      <div className="flex items-center justify-between gap-2">
        {project ? (
          <span className="text-xs font-mono text-viper-500 truncate">{project.name}</span>
        ) : (
          <span className="text-xs font-mono text-base-muted truncate">sem projeto</span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0" style={{ color: prio.color }}>
          <Flag size={11} />
          {prio.label}
        </span>
      </div>

      {/* Progresso de subtarefas (apenas diárias) */}
      {!isWeekly && task.subtasks.length > 0 && (
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-200 dark:bg-carvao-surface3 overflow-hidden">
            <div
              className="h-full rounded-full bg-viper-500 transition-all duration-500"
              style={{ width: `${(doneSubtasks / task.subtasks.length) * 100}%` }}
            />
          </div>
          <span className="flex items-center gap-1 text-xs font-mono text-base-muted shrink-0">
            <ListChecks size={12} />
            {doneSubtasks}/{task.subtasks.length}
          </span>
        </div>
      )}

      {isWeekly ? (
        /* Rodapé da SEMANAL — barra de progresso semanal + responsáveis (só foto e nome) */
        <div className="mt-auto pt-1">
          {/* Progresso semanal (diárias concluídas) */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-base-muted">
              <CalendarRange size={12} style={{ color: pm.color }} />
              Progresso semanal
            </span>
            {weekProg.empty ? (
              <span className="text-[11px] font-medium" style={{ color: pm.color }}>Sem diárias</span>
            ) : (
              <span className="text-sm font-num font-bold" style={{ color: weekProg.color }}>{weekProg.pct}%</span>
            )}
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: weekProg.empty ? '100%' : `${weekProg.pct}%`,
                backgroundColor: weekProg.empty ? pm.color : weekProg.color,
                opacity: weekProg.empty ? 0.3 : 1,
              }}
            />
          </div>
          <p className="text-xs text-base-muted font-num mt-1.5">
            {weekProg.empty ? 'Nenhuma diária ligada' : `${dailiesDone}/${dailies.length} diárias concluídas`}
          </p>

          {/* Responsáveis — apenas foto e nome */}
          <div className="flex items-center gap-2 mt-3.5 min-w-0">
            <div className="flex -space-x-1.5">
              {assignees.map((a) => (
                <Avatar key={a!.id} user={a!} size={26} fontSize={9} className="border-2 [border-color:var(--surface)]" />
              ))}
            </div>
            <span className="text-sm text-base-secondary font-medium truncate">
              {assignees.map((a) => a!.name).join(' + ')}
            </span>
          </div>
        </div>
      ) : (
        /* Rodapé da DIÁRIA — responsáveis + prazo */
        <div className="flex items-center justify-between gap-2 mt-auto pt-2.5 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="flex -space-x-1.5">
              {assignees.map((a) => (
                <Avatar key={a!.id} user={a!} size={24} fontSize={9} className="border-2 [border-color:var(--surface)]" />
              ))}
            </div>
            <span className="text-xs text-base-muted font-mono truncate">
              {assignees.map((a) => a!.name).join(' + ')}
            </span>
          </div>
          <span className="flex items-center gap-1 text-xs text-base-muted font-mono shrink-0">
            <CalendarClock size={12} />
            {formatDate(task.dueDate)}
          </span>
        </div>
      )}
    </Link>
  );
}

export function Activities() {
  const { user } = useAuth();
  const { data: tasks, loading, error } = useTasks();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const [period, setPeriod] = useState<TaskPeriod>('diaria');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('mine');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const isSocio = user?.role === 'socio';

  // 1) recorta por responsável (define as contagens do toggle e dos status);
  // 2) pelo período do toggle; 3) por status.
  const assigneeScoped = tasks.filter(
    (t) =>
      filterAssignee === 'all' ||
      (filterAssignee === 'mine' && t.assignedTo.includes(user?.id ?? '')) ||
      t.assignedTo.includes(filterAssignee),
  );

  // Contagens do toggle Diário/Semanal já refletindo o filtro de responsável.
  const periodCounts = {
    diaria: assigneeScoped.filter((t) => taskPeriod(t) === 'diaria').length,
    semanal: assigneeScoped.filter((t) => taskPeriod(t) === 'semanal').length,
  };

  const assigneeFiltered = assigneeScoped.filter((t) => taskPeriod(t) === period);

  const counts = {
    all: assigneeFiltered.length,
    pendente: assigneeFiltered.filter((t) => t.status === 'pendente').length,
    em_andamento: assigneeFiltered.filter((t) => t.status === 'em_andamento').length,
    concluida: assigneeFiltered.filter((t) => t.status === 'concluida').length,
  };

  const filtered = assigneeFiltered
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .sort((a, b) => {
      const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (r !== 0) return r;
      return a.dueDate.localeCompare(b.dueDate);
    });

  // Filtros de status com cor + brilho neon (mesmo padrão da aba Projetos).
  // Ordem: Todas → Pendente → Em andamento → Concluída.
  const statusFilters: { key: string; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'pendente', label: 'Pendente' },
    { key: 'em_andamento', label: 'Em andamento' },
    { key: 'concluida', label: 'Concluída' },
  ];
  const filterColors: Record<string, { base: string; light: string; glow: string }> = {
    all: { base: '#8637CC', light: '#AD7BEB', glow: '134,55,204' },
    pendente: { base: '#E54056', light: '#FF6B7E', glow: '229,64,86' },
    em_andamento: { base: '#F5AE39', light: '#FFC766', glow: '245,174,57' },
    concluida: { base: '#15BB77', light: '#2EE6A0', glow: '0,255,148' },
  };

  // Toggle de período (segmented control).
  const periodOptions: TaskPeriod[] = ['diaria', 'semanal'];

  return (
    <Layout
      title="Tasks"
      subtitle="To-do list do time"
    >
      {/* Toggle Diário / Semanal */}
      <div className="mb-5">
        <div
          className="inline-flex items-center gap-1 p-1 rounded-lg border"
          style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)' }}
        >
          {periodOptions.map((p) => {
            const meta = PERIOD_META[p];
            const Icon = meta.icon;
            const active = period === p;
            const total = periodCounts[p];
            return (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-150"
                style={
                  active
                    ? { backgroundColor: meta.color, color: '#fff', boxShadow: `0 0 16px ${meta.color}66` }
                    : { color: 'var(--text-muted)', backgroundColor: 'transparent' }
                }
              >
                <Icon size={15} />
                {meta.label === 'Diária' ? 'Diário' : 'Semanal'}
                <span
                  className="text-xs font-num px-1.5 rounded"
                  style={active ? { backgroundColor: 'rgba(255,255,255,0.22)' } : { backgroundColor: `${meta.color}1f`, color: meta.color }}
                >
                  {total}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2 flex-wrap">
          {statusFilters.map((f) => {
            const active = filterStatus === f.key;
            const isHover = hoveredFilter === f.key;
            const c = filterColors[f.key];
            const style: React.CSSProperties = active
              ? {
                  backgroundColor: isHover ? c.light : c.base,
                  borderColor: isHover ? c.light : c.base,
                  color: '#fff',
                  boxShadow: `0 0 16px rgba(${c.glow},${isHover ? 0.6 : 0.42})`,
                }
              : {
                  backgroundColor: isHover ? `rgba(${c.glow},0.12)` : 'transparent',
                  borderColor: isHover ? c.light : c.base,
                  color: isHover ? c.light : c.base,
                  boxShadow: isHover ? `0 0 14px rgba(${c.glow},0.32)` : 'none',
                };
            return (
              <button
                key={f.key}
                onClick={() => setFilterStatus(f.key)}
                onMouseEnter={() => setHoveredFilter(f.key)}
                onMouseLeave={() => setHoveredFilter(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium border transition-all duration-150"
                style={style}
              >
                {f.label}
                <span
                  className="text-xs font-num px-1.5 rounded-md"
                  style={
                    active
                      ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                      : { backgroundColor: `rgba(${c.glow},0.14)`, color: isHover ? c.light : c.base }
                  }
                >
                  {counts[f.key as keyof typeof counts]}
                </span>
              </button>
            );
          })}
        </div>

        {isSocio && (
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="ml-auto text-xs px-3 py-1.5 rounded-md border focus:outline-none focus:ring-1 focus:ring-viper-500"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
          >
            <option value="mine">Minhas tasks</option>
            <option value="all">Todos</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Task grid */}
      {loading ? (
        <Loading label="Carregando tasks…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-muted">
          <CheckCircle2 size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            Nenhuma task {period === 'semanal' ? 'semanal' : 'diária'} encontrada.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} tasks={tasks} projects={projects} users={users} />
          ))}
        </div>
      )}
    </Layout>
  );
}
