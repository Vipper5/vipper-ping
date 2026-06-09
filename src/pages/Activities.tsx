import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { CheckCircle2, ListChecks, CalendarRange, Sun, CalendarClock, Flag, Plus, EyeOff, Eye } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { StatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { progressState } from '../lib/progress';
import { createTask } from '../lib/api';
import { Avatar } from '../components/ui/Avatar';
import {
  Task,
  Project,
  User,
  TaskPeriod,
  TaskPriority,
} from '../mocks/data';

interface CreateForm {
  title: string;
  description: string;
  projectId: string;
  period: TaskPeriod;
  parentTaskId: string;
  assignedTo: string[];
  priority: TaskPriority;
  dueDate: string;
}
const emptyCreate: CreateForm = {
  title: '', description: '', projectId: '', period: 'diaria', parentTaskId: '',
  assignedTo: [], priority: 'media', dueDate: '',
};

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

const STATUS_RANK: Record<string, number> = { concluida: 0, em_andamento: 1, pendente: 2 };

// Período da task (legado sem período conta como Task).
function taskPeriod(t: Task): TaskPeriod {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
}

// Metadados visuais de cada nível (ícone + cor + rótulos singular/plural).
const PERIOD_META: Record<TaskPeriod, { label: string; plural: string; icon: typeof Sun; color: string }> = {
  diaria: { label: 'Task', plural: 'Tasks', icon: Sun, color: '#B45309' },
  semanal: { label: 'Projeto', plural: 'Projetos', icon: CalendarRange, color: '#6D28D9' },
};

// Cor por prioridade (acento lateral do card).
const PRIORITY_META: Record<string, { label: string; color: string }> = {
  alta: { label: 'Alta', color: '#B91C1C' },
  media: { label: 'Média', color: '#B45309' },
  baixa: { label: 'Baixa', color: '#047857' },
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

  // Num projeto, o progresso vem das tasks ligadas (mesmo critério do cliente/detalhe).
  const dailies = isWeekly ? tasks.filter((t) => t.parentTaskId === task.id) : [];
  const dailiesDone = dailies.filter((d) => d.status === 'concluida').length;
  const weekProg = progressState(dailiesDone, dailies.length);

  return (
    <Link
      to={`/atividades/${task.id}`}
      className={`group relative card-interactive rounded-lg overflow-hidden flex flex-col ${isWeekly ? 'gap-3 p-5 pl-6' : 'gap-2.5 p-4 pl-5'} ${isDone ? 'opacity-35 grayscale-[40%]' : ''}`}
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

      {/* Cliente + prioridade */}
      <div className="flex items-center justify-between gap-2">
        {project ? (
          <span className="text-xs font-mono text-viper-500 truncate">{project.name}</span>
        ) : (
          <span className="text-xs font-mono text-base-muted truncate">sem cliente</span>
        )}
        <span className="inline-flex items-center gap-1 text-[11px] font-medium shrink-0" style={{ color: prio.color }}>
          <Flag size={11} />
          {prio.label}
        </span>
      </div>

      {/* Progresso de etapas (apenas tasks) */}
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
        /* Rodapé do PROJETO — barra de progresso do projeto + responsáveis (só foto e nome) */
        <div className="mt-auto pt-1">
          {/* Progresso do projeto (tasks concluídas) */}
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs text-base-muted">
              <CalendarRange size={12} style={{ color: pm.color }} />
              Progresso do projeto
            </span>
            {weekProg.empty ? (
              <span className="text-[11px] font-medium" style={{ color: pm.color }}>Sem tasks</span>
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
            {weekProg.empty ? 'Nenhuma task ligada' : `${dailiesDone}/${dailies.length} tasks concluídas`}
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
  const toast = useToast();
  const { data: tasks, loading, error, reload } = useTasks();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const [period, setPeriod] = useState<TaskPeriod>('semanal');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('mine');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateForm>(emptyCreate);
  const [saving, setSaving] = useState(false);
  const [hideCompleted, setHideCompleted] = useState(() =>
    localStorage.getItem('ping:hideCompleted') === 'true',
  );
  const toggleHideCompleted = () => {
    setHideCompleted((h) => {
      const next = !h;
      localStorage.setItem('ping:hideCompleted', String(next));
      return next;
    });
  };

  const { dark } = useTheme();
  const isSocio = user?.role === 'socio';

  // Projetos do cliente escolhido — possíveis "pais" de uma task.
  const weeklyOptions = tasks.filter(
    (t) => taskPeriod(t) === 'semanal' && t.projectId === createForm.projectId,
  );

  const openCreate = () => {
    setCreateForm({ ...emptyCreate, period, dueDate: new Date().toISOString().split('T')[0] });
    setShowCreate(true);
  };

  const toggleCreateAssignee = (uid: string) => {
    setCreateForm((f) => ({
      ...f,
      assignedTo: f.assignedTo.includes(uid)
        ? f.assignedTo.filter((x) => x !== uid)
        : f.assignedTo.length < 2 ? [...f.assignedTo, uid] : f.assignedTo,
    }));
  };

  const submitCreate = async () => {
    if (!createForm.title.trim() || createForm.assignedTo.length === 0 || !user || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: createForm.title.trim(),
        description: createForm.description.trim(),
        projectId: createForm.projectId,
        assignedTo: createForm.assignedTo,
        priority: createForm.priority,
        period: createForm.period,
        parentTaskId: createForm.period === 'diaria' ? (createForm.parentTaskId || undefined) : undefined,
        dueDate: createForm.dueDate || new Date().toISOString().split('T')[0],
        createdBy: user.id,
      });
      setShowCreate(false);
      setCreateForm(emptyCreate);
      reload();
      toast.success('Task criada.');
    } catch (e) {
      toast.error(`Não foi possível criar a task: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  // 1) recorta por responsável (define as contagens do toggle e dos status);
  // 2) pelo período do toggle; 3) por status.
  const assigneeScoped = tasks.filter(
    (t) =>
      filterAssignee === 'all' ||
      (filterAssignee === 'mine' && t.assignedTo.includes(user?.id ?? '')) ||
      t.assignedTo.includes(filterAssignee),
  );

  // Contagens do toggle Tasks/Projetos já refletindo o filtro de responsável.
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
    .filter((t) => !hideCompleted || t.status !== 'concluida')
    .sort((a, b) => {
      const statusDiff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (statusDiff !== 0) return statusDiff;
      const projA = projects.find((p) => p.id === a.projectId)?.name ?? '';
      const projB = projects.find((p) => p.id === b.projectId)?.name ?? '';
      const projDiff = projA.localeCompare(projB, 'pt-BR', { sensitivity: 'base' });
      if (projDiff !== 0) return projDiff;
      return a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
    });

  const statusFilters: { key: string; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'concluida', label: 'Concluída' },
    { key: 'em_andamento', label: 'Em andamento' },
    { key: 'pendente', label: 'Pendente' },
  ];
  const filterColors: Record<string, { base: string; light: string; glow: string; darkText: string }> = {
    all:         { base: '#6D28D9', light: '#7C3AED', glow: '109,40,217',  darkText: '#5B21B6' },
    pendente:    { base: '#B91C1C', light: '#DC2626', glow: '185,28,28',   darkText: '#991B1B' },
    em_andamento:{ base: '#B45309', light: '#D97706', glow: '180,83,9',    darkText: '#92400E' },
    concluida:   { base: '#047857', light: '#059669', glow: '4,120,87',    darkText: '#065F46' },
  };

  // Projetos primeiro, Tasks em segundo.
  const periodOptions: TaskPeriod[] = ['semanal', 'diaria'];

  return (
    <Layout
      title="Tasks"
      subtitle="To-do list do time"
      action={
        isSocio ? (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={15} /> <span className="hidden sm:inline">Nova task</span>
          </Button>
        ) : undefined
      }
    >
      {/* Toggle Tasks / Projetos */}
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
                    ? { backgroundColor: meta.color, color: '#fff', boxShadow: dark ? `0 0 10px ${meta.color}44` : 'none' }
                    : { color: 'var(--text-muted)', backgroundColor: 'transparent' }
                }
              >
                <Icon size={15} />
                {meta.plural}
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
            const inactiveText = dark ? (isHover ? c.light : c.base) : (isHover ? c.light : c.darkText);
            const style: React.CSSProperties = active
              ? {
                  backgroundColor: isHover ? c.light : c.base,
                  borderColor: isHover ? c.light : c.base,
                  color: '#fff',
                  boxShadow: dark ? `0 0 12px rgba(${c.glow},${isHover ? 0.35 : 0.22})` : 'none',
                }
              : {
                  backgroundColor: isHover ? `rgba(${c.glow},0.10)` : 'transparent',
                  borderColor: inactiveText,
                  color: inactiveText,
                  boxShadow: 'none',
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
                      : { backgroundColor: `rgba(${c.glow},0.12)`, color: inactiveText }
                  }
                >
                  {counts[f.key as keyof typeof counts]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={toggleHideCompleted}
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all duration-150"
          style={
            hideCompleted
              ? { borderColor: '#047857', backgroundColor: 'rgba(4,120,87,0.1)', color: '#047857' }
              : { borderColor: 'var(--border)', color: 'var(--text-muted)' }
          }
          title={hideCompleted ? 'Mostrar concluídas' : 'Ocultar concluídas'}
        >
          {hideCompleted ? <Eye size={13} /> : <EyeOff size={13} />}
          {hideCompleted ? `Mostrar concluídas (${counts.concluida})` : 'Ocultar concluídas'}
        </button>

        {isSocio && (
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-md border focus:outline-none focus:ring-1 focus:ring-viper-500"
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
            {period === 'semanal' ? 'Nenhum projeto encontrado.' : 'Nenhuma task encontrada.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map((task) => (
            <TaskCard key={task.id} task={task} tasks={tasks} projects={projects} users={users} />
          ))}
        </div>
      )}

      {/* Nova task */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nova task"
        description="Crie uma task ou um projeto."
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={submitCreate}
              disabled={!createForm.title.trim() || createForm.assignedTo.length === 0 || saving}
            >
              {saving ? 'Criando…' : 'Criar task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input
              value={createForm.title}
              onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Ex.: Ajustar layout do header"
              autoFocus
            />
          </FormField>

          <FormField label="Descrição">
            <Textarea
              value={createForm.description}
              onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Descreva o que precisa ser feito..."
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <Select
                value={createForm.period}
                onChange={(e) => setCreateForm((f) => ({ ...f, period: e.target.value as TaskPeriod, parentTaskId: '' }))}
              >
                <option value="diaria">Task</option>
                <option value="semanal">Projeto</option>
              </Select>
            </FormField>
            <FormField label="Cliente">
              <Select
                value={createForm.projectId}
                onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value, parentTaskId: '' }))}
              >
                <option value="">Sem cliente</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
            </FormField>
          </div>

          {/* Projeto pai — só para task, quando o cliente tem projetos */}
          {createForm.period === 'diaria' && createForm.projectId && weeklyOptions.length > 0 && (
            <FormField label="Vincular a um projeto" hint="Opcional — liga a task a um projeto">
              <Select
                value={createForm.parentTaskId}
                onChange={(e) => setCreateForm((f) => ({ ...f, parentTaskId: e.target.value }))}
              >
                <option value="">Nenhuma</option>
                {weeklyOptions.map((w) => (
                  <option key={w.id} value={w.id}>{w.title}</option>
                ))}
              </Select>
            </FormField>
          )}

          <FormField label="Responsáveis" required hint="Selecione até 2 responsáveis">
            <div className="flex gap-2 flex-wrap pt-1">
              {users.map((u) => {
                const isSelected = createForm.assignedTo.includes(u.id);
                const isDisabled = !isSelected && createForm.assignedTo.length >= 2;
                return (
                  <button
                    key={u.id}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => toggleCreateAssignee(u.id)}
                    className={`chip flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isSelected ? 'chip-selected' : ''}`}
                  >
                    <Avatar user={u} size={24} fontSize={10} fallbackClassName="bg-viper-100 dark:bg-carvao-surface2 text-viper-600 dark:text-viper-400" />
                    {u.name}
                  </button>
                );
              })}
            </div>
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select
                value={createForm.priority}
                onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input
                type="date"
                value={createForm.dueDate}
                onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </FormField>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
