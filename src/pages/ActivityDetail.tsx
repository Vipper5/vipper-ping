import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Plus,
  X,
  CalendarClock,
  FolderKanban,
  FileText,
  Target,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input } from '../components/ui/FormField';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useTask } from '../lib/hooks';
import { useProjects, useUsers, useTasks } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import { progressColor, progressState } from '../lib/progress';
import {
  setTaskComplete,
  setTaskStatus,
  toggleSubtask as apiToggleSubtask,
  addSubtask as apiAddSubtask,
  deleteSubtask as apiDeleteSubtask,
  deleteTask as apiDeleteTask,
} from '../lib/api';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

export function ActivityDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: task, loading, reload } = useTask(id);
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const { data: allTasks } = useTasks();
  const [newSubtask, setNewSubtask] = useState('');
  const [showSubModal, setShowSubModal] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // Hierarquia: semanal → diárias (filhas) → subtarefas.
  const isWeekly = task.period === 'semanal';
  const children = allTasks.filter((t) => t.parentTaskId === task.id);
  const childDone = children.filter((c) => c.status === 'concluida').length;
  const parentWeekly = task.parentTaskId ? allTasks.find((t) => t.id === task.parentTaskId) : undefined;

  // Progresso: na semanal vem das diárias; na diária, das subtarefas.
  const weeklyProg = progressState(childDone, children.length);
  const dailyPct = totalSub ? Math.round((doneSubtasks / totalSub) * 100) : (isDone ? 100 : 0);
  const progressPct = isWeekly ? weeklyProg.pct : dailyPct;
  const progressEmpty = isWeekly && weeklyProg.empty;
  const progressBarColor = isWeekly ? weeklyProg.color : progressColor(dailyPct);
  const progressCaption = isWeekly
    ? (weeklyProg.empty ? 'Aguarde por novas atividades' : `${childDone}/${children.length} diárias concluídas`)
    : (totalSub
        ? `${doneSubtasks}/${totalSub} subtarefas concluídas`
        : isDone
        ? 'Task concluída'
        : 'Sem subtarefas — conclua a task para chegar a 100%');

  const isSocio = user?.role === 'socio';
  const isOwner = task.assignedTo.includes(user?.id ?? '');
  const canEdit = isOwner || isSocio;

  const toggleComplete = async () => {
    if (!canEdit) return;
    await setTaskComplete(task.id, task.status !== 'concluida');
    reload();
  };

  // Move a atividade pendente para "em andamento" (passo anterior ao concluir).
  const startProgress = async () => {
    if (!canEdit) return;
    await setTaskStatus(task.id, 'em_andamento');
    reload();
  };

  const toggleSubtask = async (subtaskId: string, currentDone: boolean) => {
    if (!canEdit) return;
    await apiToggleSubtask(subtaskId, !currentDone);
    // Ao concluir uma subtarefa, a atividade pendente passa automaticamente a "em andamento".
    if (!currentDone && task.status === 'pendente') {
      await setTaskStatus(task.id, 'em_andamento');
    }
    reload();
  };

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    await apiAddSubtask(task.id, newSubtask.trim(), task.subtasks.length);
    setNewSubtask('');
    setShowSubModal(false);
    reload();
  };

  const deleteSubtask = async (subtaskId: string) => {
    await apiDeleteSubtask(subtaskId);
    reload();
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

  return (
    <Layout
      title={task.title}
      back={{ to: '/atividades', label: 'Tasks' }}
      action={
        <div className="flex items-center gap-2">
          {canEdit && (
            isDone ? (
              // Concluída → reverter (contorno na cor verde do status)
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
              // Em andamento → concluir (verde, cor do status concluída)
              <button
                onClick={toggleComplete}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md text-white transition-all duration-150 hover:brightness-110 hover:shadow-[0_0_16px_rgba(21,187,119,0.55)]"
                style={{ backgroundColor: '#15BB77' }}
              >
                <CheckCircle2 size={14} /> <span className="hidden sm:inline">Concluir</span>
              </button>
            ) : (
              // Pendente → mover para em andamento (azul, cor do status em andamento)
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
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-danger text-danger bg-transparent transition-all duration-150 hover:bg-danger hover:text-white hover:shadow-[0_0_16px_rgba(229,64,86,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <Trash2 size={14} /> <span className="hidden sm:inline">Excluir</span>
            </button>
          )}
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Resumo do projeto a que a atividade pertence (ou "Atividade única") */}
          <div className="card rounded-md p-5">
            {project ? (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderKanban size={16} className="text-viper-500 shrink-0" />
                    <Link to={`/projetos/${project.id}`} className="font-mono font-semibold text-base-primary hover:text-viper-500 transition-colors truncate">
                      {project.name}
                    </Link>
                    <StatusBadge status={project.status} />
                  </div>
                  <Link to={`/projetos/${project.id}`} className="shrink-0 text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors">
                    ver projeto →
                  </Link>
                </div>
                <p className="text-xs text-base-muted mt-1 font-mono">{project.client}</p>
                {project.description && (
                  <p className="text-sm text-base-secondary mt-2 leading-relaxed line-clamp-2">{project.description}</p>
                )}
                {parentWeekly && (
                  <div className="mt-3 pt-3 border-t flex items-center gap-2 text-xs" style={{ borderColor: 'var(--border)' }}>
                    <Target size={13} className="text-viper-400 shrink-0" />
                    <span className="text-base-muted">Task semanal:</span>
                    <Link to={`/atividades/${parentWeekly.id}`} className="font-medium text-viper-500 hover:text-viper-400 truncate transition-colors">
                      {parentWeekly.title}
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-base-muted shrink-0" />
                <h3 className="text-sm font-semibold text-base-primary">Task única</h3>
              </div>
            )}
          </div>

          {/* Progresso: semanal vem das diárias; diária vem das subtarefas */}
          <div className="card rounded-md p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-base-primary">Progresso</h3>
              {progressEmpty ? (
                <span className="text-sm font-semibold" style={{ color: progressBarColor }}>Aguarde por novas atividades</span>
              ) : (
                <span className="text-lg font-bold font-num" style={{ color: progressBarColor }}>{progressPct}%</span>
              )}
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: progressEmpty ? '100%' : `${progressPct}%`, backgroundColor: progressBarColor, opacity: progressEmpty ? 0.35 : 1 }}
              />
            </div>
            <p className="text-xs text-base-muted mt-2">
              {progressCaption}
              {isDone && task.completedAt ? ` · concluída em ${formatDateTime(task.completedAt)}` : ''}
            </p>
          </div>

          {/* Description */}
          <div className="card rounded-md p-5">
            <h3 className="text-sm font-semibold text-base-primary mb-2">Descrição</h3>
            {task.description ? (
              <p className="text-sm text-base-secondary leading-relaxed">{task.description}</p>
            ) : (
              <p className="text-xs text-base-muted">Sem descrição.</p>
            )}
          </div>

          {isWeekly ? (
            /* Numa semanal, mostramos as Tasks diárias ligadas (geridas no projeto) */
            <div className="card rounded-md p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-base-primary">Tasks diárias</h3>
                  {children.length > 0 && (
                    <span className="text-xs font-num text-base-muted">{childDone}/{children.length}</span>
                  )}
                </div>
                {project && (
                  <Link to={`/projetos/${project.id}`} className="text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors">
                    gerir no projeto →
                  </Link>
                )}
              </div>
              {children.length === 0 ? (
                <p className="text-xs text-base-muted">Nenhuma task diária ligada. Crie a partir do projeto.</p>
              ) : (
                <div className="space-y-1">
                  {children.map((c) => (
                    <Link key={c.id} to={`/atividades/${c.id}`} className="flex items-center gap-2.5 py-1.5 -mx-1 px-1 rounded-sm hover:bg-subtle transition-colors">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${c.status === 'concluida' ? 'bg-success' : c.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'}`} />
                      <span className={`text-sm flex-1 truncate ${c.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-secondary'}`}>{c.title}</span>
                      <StatusBadge status={c.status} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Numa diária, as subtarefas (minitasks) */
            <div className="card rounded-md p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-base-primary">Subtarefas</h3>
                  {task.subtasks.length > 0 && (
                    <span className="text-xs font-num text-base-muted">{doneSubtasks}/{task.subtasks.length}</span>
                  )}
                </div>
                {isSocio && (
                  <Button variant="tertiary" size="sm" onClick={() => { setNewSubtask(''); setShowSubModal(true); }}>
                    <Plus size={13} /> Nova subtarefa
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                {task.subtasks.map((sub) => (
                  <div key={sub.id} className="flex items-center gap-2.5 py-1.5 group/sub">
                    <button
                      onClick={() => toggleSubtask(sub.id, sub.done)}
                      disabled={!canEdit}
                      className={`shrink-0 ${canEdit ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      {sub.done
                        ? <CheckCircle2 size={16} className="text-success" />
                        : <Circle size={16} className="text-neutral-400 hover:text-viper-500" />}
                    </button>
                    <span className={`text-sm flex-1 ${sub.done ? 'line-through text-base-muted' : 'text-base-secondary'}`}>
                      {sub.title}
                    </span>
                    {isSocio && (
                      <button
                        onClick={() => deleteSubtask(sub.id)}
                        className="opacity-0 group-hover/sub:opacity-100 p-0.5 rounded text-neutral-400 hover:text-danger transition-all"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
                {task.subtasks.length === 0 && (
                  <p className="text-xs text-base-muted">Nenhuma subtarefa.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar column: specs */}
        <div className="space-y-4">
          <div className="card rounded-md p-5 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-wider text-base-muted">Especificações</h3>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1.5">Status</p>
              <StatusBadge status={task.status} />
            </div>

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1.5">Prioridade</p>
              <StatusBadge status={task.priority} />
            </div>

            {task.period && (
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1.5">Período</p>
                <Badge variant="primary">{task.period === 'semanal' ? 'Semanal' : 'Diária'}</Badge>
              </div>
            )}

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1.5">Prazo</p>
              <div className="flex items-center gap-2 text-sm text-base-primary font-mono">
                <CalendarClock size={14} className="text-viper-400" />
                {formatDate(task.dueDate)}
              </div>
            </div>

            {project && (
              <div>
                <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-1.5">Projeto</p>
                <Link
                  to={`/projetos/${project.id}`}
                  className="flex items-center gap-2 text-sm text-viper-500 hover:text-viper-400 font-mono transition-colors"
                >
                  <FolderKanban size={14} />
                  {project.name}
                </Link>
              </div>
            )}

            <div>
              <p className="text-xs font-mono uppercase tracking-wider text-base-muted mb-2">
                Responsável{assignees.length > 1 ? 'is' : ''}
              </p>
              <div className="space-y-2">
                {assignees.map((a) => (
                  <div key={a!.id} className="flex items-center gap-2">
                    <Avatar user={a!} size={28} fontSize={10} />
                    <span className="text-sm text-base-primary">{a!.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nova subtarefa — popup pensado na atividade específica */}
      <Modal
        open={showSubModal}
        onClose={() => setShowSubModal(false)}
        title="Nova subtarefa"
        description={`Para: ${task.title}`}
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowSubModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={addSubtask} disabled={!newSubtask.trim()}>Adicionar</Button>
          </>
        }
      >
        <FormField label="Descrição da subtarefa" required>
          <Input
            autoFocus
            value={newSubtask}
            onChange={(e) => setNewSubtask(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSubtask(); } }}
            placeholder="Ex.: Validar formulário de login"
          />
        </FormField>
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
          Todas as subtarefas serão removidas.
        </p>
      </Modal>
    </Layout>
  );
}
