import { useState, type ReactNode } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  X,
  CalendarClock,
  FolderKanban,
  Target,
  RotateCcw,
  Trash2,
  Pencil,
  ChevronRight,
  Sun,
  CalendarRange,
  Flag,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../lib/hooks';
import { useProjects, useUsers, useTasks } from '../lib/hooks';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { progressColor, progressState } from '../lib/progress';
import {
  setTaskComplete,
  setTaskStatus,
  updateTask,
  toggleSubtask as apiToggleSubtask,
  addSubtask as apiAddSubtask,
  updateSubtask as apiUpdateSubtask,
  deleteSubtask as apiDeleteSubtask,
  deleteTask as apiDeleteTask,
} from '../lib/api';
import { User as TeamUser, TaskPriority, Subtask } from '../mocks/data';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

// Cor de acento por status — dá identidade visual à página de task (diferente do cliente).
const STATUS_COLOR: Record<string, string> = {
  pendente: '#94908a',
  em_andamento: '#5294E6',
  concluida: '#15BB77',
};
const PRIORITY_COLOR: Record<string, string> = {
  alta: '#E54056',
  media: '#F5AE39',
  baixa: '#15BB77',
};

interface EditTaskForm {
  title: string; description: string; priority: TaskPriority; dueDate: string; assignedTo: string[];
}
interface SubForm {
  title: string; description: string;
}

// Seleção de responsáveis (máx. 2), igual ao padrão dos popups de criação.
function AssigneePicker({ value, onToggle, users }: { value: string[]; onToggle: (id: string) => void; users: TeamUser[] }) {
  return (
    <div className="flex gap-2 flex-wrap pt-1">
      {users.map((u) => {
        const isSelected = value.includes(u.id);
        const isDisabled = !isSelected && value.length >= 2;
        return (
          <button
            key={u.id}
            type="button"
            disabled={isDisabled}
            onClick={() => onToggle(u.id)}
            className={`chip flex items-center gap-2 px-3 py-2 rounded-md text-sm ${isSelected ? 'chip-selected' : ''}`}
          >
            <Avatar user={u} size={24} fontSize={10} fallbackClassName="bg-viper-100 dark:bg-carvao-surface2 text-viper-600 dark:text-viper-400" />
            {u.name}
          </button>
        );
      })}
    </div>
  );
}

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: task, loading, reload } = useTask(id);
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { data: allTasks } = useTasks();

  const [showSubModal, setShowSubModal] = useState(false);
  const [subForm, setSubForm] = useState<SubForm>({ title: '', description: '' });
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edição da task/projeto.
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState<EditTaskForm>({ title: '', description: '', priority: 'media', dueDate: '', assignedTo: [] });

  // Popup de detalhe/edição de uma etapa.
  const [openSub, setOpenSub] = useState<Subtask | null>(null);
  const [subEditing, setSubEditing] = useState(false);
  const [subEditForm, setSubEditForm] = useState<SubForm>({ title: '', description: '' });

  if (loading) {
    return (
      <Layout title="Carregando…">
        <Loading />
      </Layout>
    );
  }

  if (!task) {
    return (
      <Layout title="Task não encontrada">
        <Link to="/atividades" className="text-viper-500 hover:text-viper-400 flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Voltar para tasks
        </Link>
      </Layout>
    );
  }

  const project = projects.find((p) => p.id === task.projectId);
  const assignees = task.assignedTo.map((aid) => users.find((u) => u.id === aid)).filter(Boolean);
  const doneSubtasks = task.subtasks.filter((s) => s.done).length;
  const isDone = task.status === 'concluida';
  const totalSub = task.subtasks.length;

  // Hierarquia: projeto → tasks (filhas) → etapas.
  const isWeekly = task.period === 'semanal';
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const childDone = children.filter((c) => c.status === 'concluida').length;
  const parentWeekly = task.parentTaskId ? allTasks.find((t) => t.id === task.parentTaskId) : undefined;

  // Progresso: no projeto vem das tasks; na task, das etapas.
  const weeklyProg = progressState(childDone, children.length);
  const dailyPct = totalSub ? Math.round((doneSubtasks / totalSub) * 100) : (isDone ? 100 : 0);
  const progressPct = isWeekly ? weeklyProg.pct : dailyPct;
  const progressEmpty = isWeekly && weeklyProg.empty;
  const progressBarColor = isWeekly ? weeklyProg.color : progressColor(dailyPct);
  const progressCaption = isWeekly
    ? (weeklyProg.empty ? 'Aguarde por novas atividades' : `${childDone}/${children.length} tasks concluídas`)
    : (totalSub
        ? `${doneSubtasks}/${totalSub} etapas concluídas`
        : isDone
        ? 'Task concluída'
        : 'Sem etapas — conclua a task para chegar a 100%');

  const isSocio = user?.role === 'socio';
  const isOwner = task.assignedTo.includes(user?.id ?? '');
  const canEdit = isOwner || isSocio;

  const statusColor = STATUS_COLOR[task.status] ?? '#94908a';
  const PeriodIcon = isWeekly ? CalendarRange : Sun;
  const periodColor = isWeekly ? '#8637CC' : '#F5AE39';
  const prioColor = PRIORITY_COLOR[task.priority] ?? '#F5AE39';

  // ---- handlers ----
  const toggleComplete = async () => {
    if (!canEdit) return;
    await setTaskComplete(task.id, task.status !== 'concluida');
    reload();
  };

  const startProgress = async () => {
    if (!canEdit) return;
    await setTaskStatus(task.id, 'em_andamento');
    reload();
  };

  const toggleSubtask = async (subtaskId: string, currentDone: boolean) => {
    if (!canEdit) return;
    await apiToggleSubtask(subtaskId, !currentDone);
    if (!currentDone && task.status === 'pendente') {
      await setTaskStatus(task.id, 'em_andamento');
    }
    reload();
  };

  const addSubtask = async () => {
    if (!subForm.title.trim() || saving) return;
    setSaving(true);
    try {
      await apiAddSubtask(task.id, subForm.title.trim(), task.subtasks.length, subForm.description);
      setSubForm({ title: '', description: '' });
      setShowSubModal(false);
      reload();
    } finally {
      setSaving(false);
    }
  };

  const deleteSubtask = async (subtaskId: string) => {
    await apiDeleteSubtask(subtaskId);
    if (openSub?.id === subtaskId) setOpenSub(null);
    reload();
  };

  // Abre o popup de uma etapa (modo leitura).
  const openSubtask = (sub: Subtask) => {
    setOpenSub(sub);
    setSubEditing(false);
    setSubEditForm({ title: sub.title, description: sub.description ?? '' });
  };

  const saveSubEdit = async () => {
    if (!openSub || !subEditForm.title.trim() || saving) return;
    setSaving(true);
    try {
      await apiUpdateSubtask(openSub.id, {
        title: subEditForm.title.trim(),
        description: subEditForm.description.trim() || null,
      });
      setOpenSub(null);
      reload();
      toast.success('Etapa atualizada.');
    } catch {
      toast.error('Não foi possível salvar a etapa.');
    } finally {
      setSaving(false);
    }
  };

  const openEditTask = () => {
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      dueDate: task.dueDate,
      assignedTo: task.assignedTo,
    });
    setShowEdit(true);
  };

  const saveEditTask = async () => {
    if (!editForm.title.trim() || saving) return;
    setSaving(true);
    try {
      await updateTask(task.id, {
        title: editForm.title.trim(),
        description: editForm.description,
        note: task.note ?? '',
        projectId: task.projectId,
        assignedTo: editForm.assignedTo,
        priority: editForm.priority,
        dueDate: editForm.dueDate,
      });
      setShowEdit(false);
      reload();
      toast.success('Task atualizada.');
    } catch {
      toast.error('Não foi possível salvar a task.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task || deleting) return;
    setDeleting(true);
    try {
      await apiDeleteTask(task.id);
      navigate('/atividades');
    } finally {
      setDeleting(false);
    }
  };

  // Cabeçalho de seção reutilizável com ícone colorido (identidade de "task").
  const SectionTitle = ({ icon, label, count }: { icon: ReactNode; label: string; count?: string }) => (
    <div className="flex items-center gap-2">
      <span className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${periodColor}1f`, color: periodColor }}>
        {icon}
      </span>
      <h3 className="text-sm font-semibold text-base-primary">{label}</h3>
      {count && <span className="text-xs font-num text-base-muted">{count}</span>}
    </div>
  );

  return (
    <Layout
      title={task.title}
      back={{ to: '/atividades', label: 'Tasks' }}
      action={
        <div className="flex items-center gap-2">
          {canEdit && (
            isDone ? (
              <button
                onClick={toggleComplete}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border bg-transparent transition-all duration-150 hover:text-white"
                style={{ borderColor: '#15BB77', color: '#15BB77' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#15BB77'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <RotateCcw size={14} /> <span className="hidden sm:inline">Reverter</span>
              </button>
            ) : task.status === 'em_andamento' ? (
              <button
                onClick={toggleComplete}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-white transition-all duration-150 hover:brightness-110 hover:shadow-[0_0_16px_rgba(21,187,119,0.55)]"
                style={{ backgroundColor: '#15BB77' }}
              >
                <CheckCircle2 size={14} /> <span className="hidden sm:inline">Concluir</span>
              </button>
            ) : (
              <button
                onClick={startProgress}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-white transition-all duration-150 hover:brightness-110 hover:shadow-[0_0_16px_rgba(82,148,230,0.55)]"
                style={{ backgroundColor: '#5294E6' }}
              >
                <Circle size={14} /> <span className="hidden sm:inline">Em andamento</span>
              </button>
            )
          )}
          {isSocio && (
            <button
              onClick={openEditTask}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-viper-500 text-viper-500 bg-transparent transition-all duration-150 hover:bg-viper-500 hover:text-white hover:shadow-[0_0_16px_rgba(134,55,204,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viper-500"
            >
              <Pencil size={14} /> <span className="hidden sm:inline">Editar</span>
            </button>
          )}
          {isSocio && (
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-danger text-danger bg-transparent transition-all duration-150 hover:bg-danger hover:text-white hover:shadow-[0_0_16px_rgba(229,64,86,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <Trash2 size={14} /> <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      }
    >
      {/* Layout de "ticket": banner com acento de status (distinto do dashboard de cliente) */}
      <div className="max-w-3xl mx-auto space-y-5">
        {/* HERO — faixa de status com meta e progresso */}
        <div
          className="relative rounded-xl overflow-hidden"
          style={{
            border: '1px solid var(--border)',
            boxShadow: 'var(--card-shadow)',
            backgroundColor: 'var(--surface)',
            backgroundImage: `linear-gradient(120deg, ${statusColor}1f, transparent 62%)`,
          }}
        >
          <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: statusColor }} />
          <div className="p-6 pl-7">
            {/* chips: período + status + prioridade */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span
                className="inline-flex items-center gap-1.5 rounded-full font-mono font-semibold tracking-wide px-2.5 py-1 text-[11px]"
                style={{ backgroundColor: `${periodColor}1f`, color: periodColor }}
              >
                <PeriodIcon size={13} />
                {isWeekly ? 'Projeto' : 'Task'}
              </span>
              <StatusBadge status={task.status} />
              <span
                className="inline-flex items-center gap-1 rounded-full font-mono font-semibold px-2.5 py-1 text-[11px]"
                style={{ backgroundColor: `${prioColor}1f`, color: prioColor }}
              >
                <Flag size={11} /> {task.priority === 'alta' ? 'Alta' : task.priority === 'baixa' ? 'Baixa' : 'Média'}
              </span>
            </div>

            <h2 className={`text-2xl font-bold leading-tight ${isDone ? 'line-through text-base-muted' : 'text-base-primary'}`}>
              {task.title}
            </h2>

            {/* meta: prazo · cliente · projeto-pai · responsáveis */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-sm">
              <span className="inline-flex items-center gap-1.5 text-base-secondary font-mono">
                <CalendarClock size={14} className="text-base-muted" />
                {formatDate(task.dueDate)}
              </span>
              {project ? (
                <Link to={`/projetos/${project.id}`} className="inline-flex items-center gap-1.5 text-viper-500 hover:text-viper-400 font-mono transition-colors">
                  <FolderKanban size={14} /> {project.name}
                </Link>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-base-muted font-mono">
                  <FolderKanban size={14} /> Sem cliente
                </span>
              )}
              {parentWeekly && (
                <Link to={`/atividades/${parentWeekly.id}`} className="inline-flex items-center gap-1.5 text-base-secondary hover:text-viper-500 font-mono transition-colors truncate max-w-[14rem]">
                  <Target size={13} className="text-viper-400" /> {parentWeekly.title}
                </Link>
              )}
              {assignees.length > 0 && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="flex -space-x-1.5">
                    {assignees.map((a) => (
                      <Avatar key={a!.id} user={a!} size={22} fontSize={9} className="border-2 [border-color:var(--surface)]" />
                    ))}
                  </span>
                  <span className="text-xs text-base-muted font-mono">{assignees.map((a) => a!.name).join(' + ')}</span>
                </span>
              )}
            </div>

            {/* progresso */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-base-muted">{progressCaption}{isDone && task.completedAt ? ` · concluída em ${formatDateTime(task.completedAt)}` : ''}</span>
                {progressEmpty ? (
                  <span className="text-xs font-semibold" style={{ color: progressBarColor }}>Aguarde</span>
                ) : (
                  <span className="text-base font-bold font-num" style={{ color: progressBarColor }}>{progressPct}%</span>
                )}
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: progressEmpty ? '100%' : `${progressPct}%`, backgroundColor: progressBarColor, opacity: progressEmpty ? 0.35 : 1 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DESCRIÇÃO */}
        <div className="card rounded-xl p-5">
          <SectionTitle icon={<Pencil size={13} />} label="Descrição" />
          <div className="mt-3">
            {task.description ? (
              <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">{task.description}</p>
            ) : (
              <p className="text-xs text-base-muted">Sem descrição.{isSocio && ' Use “Editar” para adicionar.'}</p>
            )}
          </div>
        </div>

        {isWeekly ? (
          /* Projeto: lista as tasks ligadas (geridas no cliente) */
          <div className="card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={<Target size={13} />} label="Tasks" count={children.length > 0 ? `${childDone}/${children.length}` : undefined} />
              {project && (
                <Link to={`/projetos/${project.id}`} className="text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors">
                  gerir no cliente →
                </Link>
              )}
            </div>
            {children.length === 0 ? (
              <p className="text-xs text-base-muted">Nenhuma task ligada. Crie a partir do cliente.</p>
            ) : (
              <div className="space-y-1">
                {children.map((c) => (
                  <Link key={c.id} to={`/atividades/${c.id}`} className="flex items-center gap-2.5 py-1.5 -mx-1 px-1 rounded-md hover:bg-subtle transition-colors">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'concluida' ? 'bg-success' : c.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'}`} />
                    <span className={`text-sm flex-1 truncate ${c.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-secondary'}`}>{c.title}</span>
                    <StatusBadge status={c.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Task: etapas clicáveis (popup de detalhe/edição) */
          <div className="card rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <SectionTitle icon={<CheckCircle2 size={13} />} label="Etapas" count={totalSub > 0 ? `${doneSubtasks}/${totalSub}` : undefined} />
              {isSocio && (
                <Button variant="tertiary" size="sm" onClick={() => { setSubForm({ title: '', description: '' }); setShowSubModal(true); }}>
                  <Plus size={13} /> Nova etapa
                </Button>
              )}
            </div>

            <div className="space-y-0.5">
              {task.subtasks.map((sub) => (
                <div key={sub.id} className="group/sub flex items-center gap-2.5 py-1.5 px-1.5 -mx-1.5 rounded-md hover:bg-subtle transition-colors">
                  <button
                    onClick={() => toggleSubtask(sub.id, sub.done)}
                    disabled={!canEdit}
                    title={sub.done ? 'Concluída' : 'Marcar como concluída'}
                    className={`shrink-0 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                  >
                    {sub.done
                      ? <CheckCircle2 size={17} className="text-success" />
                      : <Circle size={17} className="text-neutral-400 hover:text-viper-500" />}
                  </button>

                  {/* clique abre o popup com as informações */}
                  <button onClick={() => openSubtask(sub)} className="flex-1 min-w-0 text-left flex items-center gap-2">
                    <span className={`text-sm truncate ${sub.done ? 'line-through text-base-muted' : 'text-base-secondary group-hover/sub:text-base-primary'} transition-colors`}>
                      {sub.title}
                    </span>
                    {sub.description && <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-viper-400" title="Tem descrição" />}
                  </button>

                  <ChevronRight size={14} className="shrink-0 text-base-muted opacity-0 group-hover/sub:opacity-100 transition-opacity" />

                  {isSocio && (
                    <button
                      onClick={() => deleteSubtask(sub.id)}
                      title="Excluir etapa"
                      className="shrink-0 opacity-0 group-hover/sub:opacity-100 p-0.5 rounded text-neutral-400 hover:text-danger transition-all"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              {totalSub === 0 && (
                <p className="text-xs text-base-muted py-1">Nenhuma etapa.{isSocio && ' Adicione com “Nova etapa”.'}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Popup de detalhe/edição de etapa */}
      <Modal
        open={!!openSub}
        onClose={() => setOpenSub(null)}
        title="Etapa"
        size="sm"
        footer={
          subEditing ? (
            <>
              <Button variant="tertiary" onClick={() => setSubEditing(false)}>Cancelar</Button>
              <Button variant="primary" onClick={saveSubEdit} disabled={!subEditForm.title.trim() || saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </>
          ) : (
            <>
              {isSocio && (
                <Button variant="secondary" onClick={() => setSubEditing(true)}>
                  <Pencil size={14} /> Editar
                </Button>
              )}
              <Button variant="primary" onClick={() => setOpenSub(null)}>Fechar</Button>
            </>
          )
        }
      >
        {openSub && (subEditing ? (
          <div className="space-y-4">
            <FormField label="Título" required>
              <Input value={subEditForm.title} onChange={(e) => setSubEditForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </FormField>
            <FormField label="Descrição">
              <Textarea value={subEditForm.description} onChange={(e) => setSubEditForm((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Detalhe a etapa..." />
            </FormField>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {openSub.done
                ? <CheckCircle2 size={18} className="text-success shrink-0" />
                : <Circle size={18} className="text-neutral-400 shrink-0" />}
              <h3 className={`text-base font-semibold ${openSub.done ? 'line-through text-base-muted' : 'text-base-primary'}`}>{openSub.title}</h3>
            </div>
            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1">Descrição</p>
              {openSub.description ? (
                <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">{openSub.description}</p>
              ) : (
                <p className="text-sm text-base-muted">Sem descrição.</p>
              )}
            </div>
            {canEdit && (
              <button
                onClick={() => { toggleSubtask(openSub.id, openSub.done); setOpenSub(null); }}
                className="text-xs font-medium text-viper-500 hover:text-viper-400 transition-colors"
              >
                {openSub.done ? 'Marcar como pendente' : 'Marcar como concluída'}
              </button>
            )}
          </div>
        ))}
      </Modal>

      {/* Nova etapa */}
      <Modal
        open={showSubModal}
        onClose={() => setShowSubModal(false)}
        title="Nova etapa"
        description={`Para: ${task.title}`}
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowSubModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={addSubtask} disabled={!subForm.title.trim() || saving}>Adicionar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título da etapa" required>
            <Input
              autoFocus
              value={subForm.title}
              onChange={(e) => setSubForm((f) => ({ ...f, title: e.target.value }))}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
              placeholder="Ex.: Validar formulário de login"
            />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={subForm.description} onChange={(e) => setSubForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Detalhes da etapa (opcional)..." />
          </FormField>
        </div>
      </Modal>

      {/* Editar task */}
      <Modal
        open={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar task"
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowEdit(false)}>Cancelar</Button>
            <Button variant="primary" onClick={saveEditTask} disabled={!editForm.title.trim() || saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} autoFocus />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Descreva o que precisa ser feito..." />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={editForm.priority} onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={editForm.dueDate} onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>
          <FormField label="Responsáveis" hint="Selecione até 2 responsáveis">
            <AssigneePicker
              users={users}
              value={editForm.assignedTo}
              onToggle={(uid) => setEditForm((f) => ({
                ...f,
                assignedTo: f.assignedTo.includes(uid)
                  ? f.assignedTo.filter((x) => x !== uid)
                  : f.assignedTo.length < 2 ? [...f.assignedTo, uid] : f.assignedTo,
              }))}
            />
          </FormField>
        </div>
      </Modal>

      {/* Confirmar exclusão */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Excluir task"
        description="Esta ação não pode ser desfeita."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteTask} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Excluindo…' : 'Excluir'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-secondary">
          Tem certeza que deseja excluir <span className="font-semibold text-base-primary">{task.title}</span>?
          Todas as etapas serão removidas.
        </p>
      </Modal>
    </Layout>
  );
}
