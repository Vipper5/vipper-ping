import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ListChecks } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { StatusBadge } from '../components/ui/Badge';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import {
  Task,
  Project,
  User,
} from '../mocks/data';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const STATUS_RANK: Record<string, number> = { em_andamento: 0, pendente: 1, concluida: 2 };

function TaskCard({ task, projects, users }: { task: Task; projects: Project[]; users: User[] }) {
  const project = projects.find((p) => p.id === task.projectId);
  const assignees = task.assignedTo.map((aid) => users.find((u) => u.id === aid)).filter(Boolean);
  const doneSubtasks = task.subtasks.filter((s) => s.done).length;
  const isDone = task.status === 'concluida';

  return (
    <Link
      to={`/atividades/${task.id}`}
      className={`card-interactive rounded-md p-4 flex flex-col gap-2.5 ${isDone ? 'opacity-70' : ''}`}
    >
      {/* status tag row */}
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={task.status} />
        {task.subtasks.length > 0 && (
          <span className="flex items-center gap-1 text-xs font-mono text-base-muted shrink-0">
            <ListChecks size={12} />
            {doneSubtasks}/{task.subtasks.length}
          </span>
        )}
      </div>

      {/* title */}
      <p className={`text-sm font-semibold leading-snug line-clamp-2 ${isDone ? 'line-through text-base-muted' : 'text-base-primary'}`}>
        {task.title}
      </p>

      {/* project */}
      {project && (
        <span className="text-xs font-mono text-viper-500 truncate">{project.name}</span>
      )}

      {/* subtask progress */}
      {task.subtasks.length > 0 && (
        <div className="h-1 rounded-full bg-neutral-200 dark:bg-carvao-surface3">
          <div
            className="h-full rounded-full bg-viper-500 transition-all duration-500"
            style={{ width: `${(doneSubtasks / task.subtasks.length) * 100}%` }}
          />
        </div>
      )}

      {/* footer: assignees + due date */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-1.5 min-w-0">
          <div className="flex -space-x-1.5">
            {assignees.map((a) => (
              <Avatar
                key={a!.id}
                user={a!}
                size={24}
                fontSize={9}
                className="border-2 [border-color:var(--surface)]"
              />
            ))}
          </div>
          <span className="text-xs text-base-muted font-mono truncate">
            {assignees.map((a) => a!.name).join(' + ')}
          </span>
        </div>
        <span className="text-xs text-base-muted font-mono shrink-0">{formatDate(task.dueDate)}</span>
      </div>
    </Link>
  );
}

export function Activities() {
  const { user } = useAuth();
  const { data: tasks, loading, error } = useTasks();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('mine');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const isSocio = user?.role === 'socio';

  // Primeiro filtra por responsável; as contagens dos status refletem esse recorte.
  const assigneeFiltered = tasks.filter(
    (t) =>
      filterAssignee === 'all' ||
      (filterAssignee === 'mine' && t.assignedTo.includes(user?.id ?? '')) ||
      t.assignedTo.includes(filterAssignee),
  );

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

  return (
    <Layout
      title="Tasks"
      subtitle="To-do list do time"
    >
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
          <p className="text-sm">Nenhuma task encontrada.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} projects={projects} users={users} />
          ))}
        </div>
      )}
    </Layout>
  );
}
