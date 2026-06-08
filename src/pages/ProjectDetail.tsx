import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, ExternalLink, User, FileText, CalendarDays, Clock, Target, CheckCircle2, Trash2, ArrowRight, Pencil,
  ListChecks, ArrowUp, ArrowDown, Check,
} from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge, Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { Avatar } from '../components/ui/Avatar';
import { Loading } from '../components/ui/Loading';
import { progressState } from '../lib/progress';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useProject, useTasks, useUsers } from '../lib/hooks';
import {
  addProjectNote, addProjectDoc, updateProject, createTask, deleteProject,
  addProjectObjective, updateProjectObjective, toggleProjectObjective, deleteProjectObjective,
  reorderProjectObjectives,
} from '../lib/api';
import { User as TeamUser, ProjectStatus, TaskPriority, ProjectObjective } from '../mocks/data';

// Roxo vibrante/neon usado nos acentos desta página (melhor visibilidade).
const VIBRANT = '#A855F7';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000);
}
function deadlineMeta(endDate: string, status: ProjectStatus) {
  const days = daysUntil(endDate);
  if (status === 'Concluído') return { color: '#6e695a', label: 'Entregue' };
  if (days < 0) return { color: '#E54056', label: `${Math.abs(days)}d em atraso` };
  if (days === 0) return { color: '#E54056', label: 'Entrega hoje' };
  if (days <= 7) return { color: '#F5AE39', label: `Faltam ${days}d` };
  return { color: VIBRANT, label: `Faltam ${days}d` };
}

interface WeeklyFormData {
  title: string; assignedTo: string[]; priority: TaskPriority; dueDate: string;
}
interface DailyFormData {
  title: string; description: string; assignedTo: string[]; priority: TaskPriority; dueDate: string; parentTaskId: string;
}
interface EditFormData {
  name: string; client: string; status: ProjectStatus; stack: string;
  startDate: string; endDate: string; description: string; responsibles: string[];
}
interface ObjectiveFormData {
  title: string; description: string;
}

const defaultWeekly: WeeklyFormData = { title: '', assignedTo: [], priority: 'media', dueDate: '' };
const defaultDaily: DailyFormData = { title: '', description: '', assignedTo: [], priority: 'media', dueDate: '', parentTaskId: '' };
const defaultEdit: EditFormData = {
  name: '', client: '', status: 'Ativo', stack: '', startDate: '', endDate: '', description: '', responsibles: [],
};
const defaultObjective: ObjectiveFormData = { title: '', description: '' };

// linha de seleção de responsáveis (máx. 2) reutilizável
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

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: project, loading, reload: reloadProject } = useProject(id);
  const { data: tasks, reload: reloadTasks } = useTasks();
  const { data: users } = useUsers();

  const toast = useToast();
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [docForm, setDocForm] = useState({ title: '', url: '' });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState<EditFormData>(defaultEdit);
  const [showWeeklyModal, setShowWeeklyModal] = useState(false);
  const [weeklyForm, setWeeklyForm] = useState<WeeklyFormData>(defaultWeekly);
  const [showDailyModal, setShowDailyModal] = useState(false);
  const [dailyForm, setDailyForm] = useState<DailyFormData>(defaultDaily);
  const [saving, setSaving] = useState(false);

  // Objetivos: cópia local p/ marcar/reordenar com resposta imediata; persiste em background.
  const [objectives, setObjectives] = useState<ProjectObjective[]>([]);
  const [showObjectiveModal, setShowObjectiveModal] = useState(false);
  const [objectiveForm, setObjectiveForm] = useState<ObjectiveFormData>(defaultObjective);
  // Objetivo aberto no popup de detalhe/edição (null = fechado).
  const [openObjective, setOpenObjective] = useState<ProjectObjective | null>(null);
  const [objEdit, setObjEdit] = useState<ObjectiveFormData>(defaultObjective);

  useEffect(() => {
    setObjectives(project?.objectives ?? []);
  }, [project]);

  if (loading) {
    return (
      <Layout title="Carregando…">
        <Loading />
      </Layout>
    );
  }

  if (!project) {
    return (
      <Layout title="Projeto não encontrado">
        <Link to="/projetos" className="text-viper-400 hover:text-viper-400 flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Voltar para projetos
        </Link>
      </Layout>
    );
  }

  const isSocio = user?.role === 'socio';
  const getUserName = (uid: string) => users.find((u) => u.id === uid)?.name ?? uid;
  const dl = deadlineMeta(project.endDate, project.status);

  const projectTasks = tasks.filter((t) => t.projectId === id);
  const weeklyTasks = projectTasks.filter((t) => t.period === 'semanal');
  const dailyTasks = projectTasks.filter((t) => t.period !== 'semanal');
  // Diárias de uma semanal específica e diárias avulsas (legado, sem semanal).
  const dailiesFor = (weeklyId: string) => dailyTasks.filter((d) => d.parentTaskId === weeklyId);
  const orphanDailies = dailyTasks.filter((d) => !d.parentTaskId || !weeklyTasks.some((w) => w.id === d.parentTaskId));
  // Progresso dos objetivos (checklist próprio): papel quente (0/0), vermelho <45%, roxo <75%, verde >=75%.
  const objDone = objectives.filter((o) => o.done).length;
  const objProgress = progressState(objDone, objectives.length);
  const objAllDone = !objProgress.empty && objDone === objectives.length;
  // Verde escuro usado no checkbox marcado.
  const DARK_GREEN = '#15803D';

  // ---- handlers ----
  const handleDeleteProject = async () => {
    if (!id || deleting) return;
    setDeleting(true);
    try {
      await deleteProject(id);
      navigate('/projetos');
    } finally {
      setDeleting(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim() || !user || !id || saving) return;
    setSaving(true);
    try {
      await addProjectNote(id, noteText.trim(), user.id);
      setNoteText('');
      setShowNoteModal(false);
      reloadProject();
    } finally {
      setSaving(false);
    }
  };

  // Abre o popup de edição preenchido com os valores atuais do projeto.
  const openEdit = () => {
    setEditForm({
      name: project.name,
      client: project.client,
      status: project.status,
      stack: project.stack.join(', '),
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description,
      responsibles: project.responsibles,
    });
    setShowEditModal(true);
  };

  const toggleEditResp = (uid: string) => {
    setEditForm((f) => ({
      ...f,
      responsibles: f.responsibles.includes(uid)
        ? f.responsibles.filter((r) => r !== uid)
        : [...f.responsibles, uid],
    }));
  };

  // Salva todas as alterações do popup de edição.
  const handleSaveEdit = async () => {
    if (!id || !editForm.name.trim() || saving) return;
    setSaving(true);
    try {
      await updateProject(id, {
        name: editForm.name,
        client: editForm.client,
        status: editForm.status,
        stack: editForm.stack.split(',').map((s) => s.trim()).filter(Boolean),
        startDate: editForm.startDate,
        endDate: editForm.endDate,
        description: editForm.description,
        responsibles: editForm.responsibles,
      });
      setShowEditModal(false);
      reloadProject();
      toast.success('Alteração salva com sucesso.');
    } catch {
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  // ---- objetivos (checklist) ----
  const createObjective = async () => {
    if (!objectiveForm.title.trim() || !id || saving) return;
    setSaving(true);
    try {
      await addProjectObjective(id, objectiveForm.title.trim(), objectiveForm.description.trim(), objectives.length);
      setObjectiveForm(defaultObjective);
      setShowObjectiveModal(false);
      reloadProject();
      toast.success('Objetivo adicionado.');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Causa típica: a tabela project_objectives ainda não existe (migration pendente).
      toast.error(`Não foi possível salvar o objetivo: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Marca/desmarca com atualização otimista; persiste em background.
  const toggleObjective = (obj: ProjectObjective) => {
    const next = !obj.done;
    setObjectives((list) => list.map((o) => (o.id === obj.id ? { ...o, done: next } : o)));
    toggleProjectObjective(obj.id, next).catch(() => {
      setObjectives((list) => list.map((o) => (o.id === obj.id ? { ...o, done: obj.done } : o)));
      toast.error('Não foi possível atualizar o objetivo.');
    });
  };

  // Move um objetivo para cima/baixo e persiste a nova ordem.
  const moveObjective = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= objectives.length) return;
    const next = objectives.slice();
    [next[index], next[target]] = [next[target], next[index]];
    setObjectives(next);
    reorderProjectObjectives(next.map((o) => o.id)).catch(() => {
      toast.error('Não foi possível reordenar.');
      reloadProject();
    });
  };

  const removeObjective = async (objId: string) => {
    setObjectives((list) => list.filter((o) => o.id !== objId));
    if (openObjective?.id === objId) setOpenObjective(null);
    try {
      await deleteProjectObjective(objId);
    } catch {
      toast.error('Não foi possível excluir o objetivo.');
      reloadProject();
    }
  };

  // Abre o popup de detalhe e pré-carrega os campos de edição.
  const openObjectiveDetail = (obj: ProjectObjective) => {
    setOpenObjective(obj);
    setObjEdit({ title: obj.title, description: obj.description ?? '' });
  };

  const saveObjectiveEdit = async () => {
    if (!openObjective || !objEdit.title.trim() || saving) return;
    setSaving(true);
    try {
      await updateProjectObjective(openObjective.id, {
        title: objEdit.title.trim(),
        description: objEdit.description.trim() || null,
      });
      setOpenObjective(null);
      reloadProject();
      toast.success('Objetivo atualizado.');
    } catch {
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const addDoc = async () => {
    if (!docForm.title.trim() || !docForm.url.trim() || !id || saving) return;
    setSaving(true);
    try {
      await addProjectDoc(id, docForm.title.trim(), docForm.url.trim());
      setDocForm({ title: '', url: '' });
      setShowDocModal(false);
      reloadProject();
    } finally {
      setSaving(false);
    }
  };

  const createWeekly = async () => {
    if (!weeklyForm.title.trim() || weeklyForm.assignedTo.length === 0 || !user || !id || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: weeklyForm.title,
        description: '',
        projectId: id,
        assignedTo: weeklyForm.assignedTo,
        priority: weeklyForm.priority,
        period: 'semanal',
        dueDate: weeklyForm.dueDate || new Date().toISOString().split('T')[0],
        createdBy: user.id,
      });
      setWeeklyForm(defaultWeekly);
      setShowWeeklyModal(false);
      reloadTasks();
    } finally {
      setSaving(false);
    }
  };

  // Abre o modal de nova diária já vinculada a uma semanal específica.
  const openDailyFor = (weeklyId: string) => {
    setDailyForm({ ...defaultDaily, parentTaskId: weeklyId });
    setShowDailyModal(true);
  };

  const createDaily = async () => {
    if (!dailyForm.title.trim() || dailyForm.assignedTo.length === 0 || !dailyForm.parentTaskId || !user || !id || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: dailyForm.title,
        description: dailyForm.description,
        projectId: id,
        assignedTo: dailyForm.assignedTo,
        priority: dailyForm.priority,
        period: 'diaria',
        parentTaskId: dailyForm.parentTaskId,
        dueDate: dailyForm.dueDate || new Date().toISOString().split('T')[0],
        createdBy: user.id,
      });
      setDailyForm(defaultDaily);
      setShowDailyModal(false);
      reloadTasks();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      title={<span className="text-xl font-bold text-base-primary tracking-tight font-mono">{project.name}</span>}
      subtitle={<span className="text-sm text-base-muted">{project.client}</span>}
      back={{ to: '/projetos', label: 'Projetos' }}
      action={
        isSocio ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-danger text-danger bg-transparent transition-all duration-150 hover:bg-danger hover:text-white hover:shadow-[0_0_16px_rgba(229,64,86,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <Trash2 size={14} /> <span className="hidden sm:inline">Excluir</span>
            </button>
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-viper-500 text-viper-500 bg-transparent transition-all duration-150 hover:bg-viper-500 hover:text-white hover:shadow-[0_0_16px_rgba(134,55,204,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viper-500"
            >
              <Pencil size={14} /> <span className="hidden sm:inline">Editar projeto</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Resumo do projeto (somente leitura — edição pelo popup "Editar projeto") */}
      <div className="card rounded-md p-5 mb-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          {/* Status */}
          <StatusBadge status={project.status} />

          {/* Cronograma: início → entrega + prazo restante */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays size={15} className="text-base-muted shrink-0" />
              <span className="font-num text-base-secondary inline-flex items-center gap-1.5">
                {formatDate(project.startDate)}
                <ArrowRight size={13} className="text-base-muted" />
                {formatDate(project.endDate)}
              </span>
            </div>

            {/* Prazo restante */}
            <span
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${dl.color}26`, color: dl.color, border: `1px solid ${dl.color}59` }}
            >
              <Clock size={12} className="shrink-0" />
              <span className="font-num">{dl.label}</span>
            </span>
          </div>

          {/* Responsáveis */}
          <div className="flex items-center gap-2">
            {project.responsibles.map((r) => {
              const u = users.find((usr) => usr.id === r);
              return u ? (
                <div key={r} className="flex items-center gap-1.5 text-xs text-base-muted">
                  <Avatar user={u} size={24} fontSize={9} />
                  <span>{u.name}</span>
                </div>
              ) : null;
            })}
          </div>

          {/* Stack */}
          {project.stack.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {project.stack.map((s) => (
                <Badge key={s} variant="neutral" className="font-mono text-xs">{s}</Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna principal: conclusão + entregas + diárias */}
        <div className="lg:col-span-2 space-y-5">
          {/* OBJETIVOS — checklist do projeto (reordenável; clique abre o detalhe) */}
          <div
            className="rounded-md p-5"
            style={{
              backgroundColor: 'var(--surface)',
              // Sem objetivos, a cor é papel quente; com objetivos segue a escala de progresso.
              backgroundImage: `linear-gradient(135deg, ${objProgress.empty ? 'var(--papel-quente-soft)' : `${objProgress.color}14`}, transparent 55%)`,
              border: '1px solid var(--border)',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ backgroundColor: objProgress.empty ? 'var(--papel-quente-tint)' : `${objProgress.color}22`, color: objProgress.empty ? 'var(--papel-quente)' : objProgress.color }}>
                  <ListChecks size={15} />
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-base-muted">Objetivos</span>
                {objectives.length > 0 && (
                  <span className="text-xs font-num text-base-muted">· {objDone}/{objectives.length}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {objAllDone && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: '#15BB7722', color: '#15BB77' }}>
                    <CheckCircle2 size={12} /> Concluídos
                  </span>
                )}
                {isSocio && (
                  <Button variant="tertiary" size="sm" onClick={() => { setObjectiveForm(defaultObjective); setShowObjectiveModal(true); }}>
                    <Plus size={13} /> Objetivo
                  </Button>
                )}
              </div>
            </div>

            {objectives.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-base-muted">
                  Nenhum objetivo definido.{isSocio && ' Adicione metas para acompanhar o projeto.'}
                </p>
              </div>
            ) : (
              <>
                <ul className="space-y-1">
                  {objectives.map((obj, i) => (
                    <li key={obj.id} className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-subtle">
                      {/* Checkbox quadrado: papel quente → verde escuro ao marcar */}
                      <button
                        type="button"
                        onClick={() => isSocio && toggleObjective(obj)}
                        disabled={!isSocio}
                        aria-pressed={obj.done}
                        title={obj.done ? 'Concluído' : 'Marcar como concluído'}
                        className="shrink-0 w-5 h-5 rounded-[5px] flex items-center justify-center transition-all duration-150 disabled:cursor-default"
                        style={obj.done
                          ? { backgroundColor: DARK_GREEN, border: `1px solid ${DARK_GREEN}` }
                          : { backgroundColor: 'var(--papel-quente-tint)', border: '1px solid var(--papel-quente)' }}
                      >
                        {obj.done && <Check size={13} strokeWidth={3} className="text-white" />}
                      </button>

                      {/* Título — clique abre o popup de detalhe */}
                      <button type="button" onClick={() => openObjectiveDetail(obj)} className="flex-1 min-w-0 text-left">
                        <span
                          className={`text-sm font-medium truncate block transition-colors ${obj.done ? 'line-through' : 'text-base-primary group-hover:text-viper-500'}`}
                          style={obj.done ? { color: DARK_GREEN } : undefined}
                        >
                          {obj.title}
                        </span>
                      </button>

                      {obj.description && (
                        <span className="shrink-0 text-base-muted opacity-60" title="Tem descrição">
                          <FileText size={12} />
                        </span>
                      )}

                      {/* Ações — reordenar/excluir (somente sócio) */}
                      {isSocio && (
                        <div className="shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button type="button" onClick={() => moveObjective(i, -1)} disabled={i === 0} title="Mover para cima"
                            className="p-1 rounded text-base-muted hover:text-base-primary hover:bg-surface2 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                            <ArrowUp size={14} />
                          </button>
                          <button type="button" onClick={() => moveObjective(i, 1)} disabled={i === objectives.length - 1} title="Mover para baixo"
                            className="p-1 rounded text-base-muted hover:text-base-primary hover:bg-surface2 disabled:opacity-30 disabled:hover:bg-transparent transition-colors">
                            <ArrowDown size={14} />
                          </button>
                          <button type="button" onClick={() => removeObjective(obj.id)} title="Excluir objetivo"
                            className="p-1 rounded text-base-muted hover:text-danger hover:bg-danger/10 transition-colors">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>

                {/* Progresso dos objetivos */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-base-muted">{objDone}/{objectives.length} objetivos concluídos</span>
                    <span className="text-sm font-bold font-num" style={{ color: objProgress.color }}>{objProgress.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <div className="h-full rounded-full" style={{ width: `${objProgress.pct}%`, backgroundColor: objProgress.color, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              </>
            )}
          </div>

          {/* TASKS SEMANAIS — objetivos; progresso vem das diárias ligadas */}
          <div className="card rounded-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-viper-400" />
                <h2 className="font-semibold text-base-primary text-sm">Tasks semanais ({weeklyTasks.length})</h2>
              </div>
              {isSocio && (
                <Button variant="tertiary" size="sm" onClick={() => setShowWeeklyModal(true)}>
                  <Plus size={13} /> Nova semanal
                </Button>
              )}
            </div>

            {weeklyTasks.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-base-muted">
                Nenhuma task semanal. {isSocio && 'Crie objetivos semanais e vá realizando diárias até concluí-los.'}
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {weeklyTasks.map((task) => {
                  const dailies = dailiesFor(task.id);
                  const dDone = dailies.filter((d) => d.status === 'concluida').length;
                  const st = progressState(dDone, dailies.length);
                  const isDone = task.status === 'concluida';
                  return (
                    <div key={task.id} className="px-5 py-3.5">
                      {/* Cabeçalho da semanal */}
                      <div className="flex items-center gap-3">
                        {isDone
                          ? <CheckCircle2 size={16} className="text-success shrink-0" />
                          : <Target size={15} className="text-viper-400 shrink-0" />}
                        <Link to={`/atividades/${task.id}`} className={`text-sm font-semibold flex-1 truncate hover:text-viper-500 transition-colors ${isDone ? 'line-through text-base-muted' : 'text-base-primary'}`}>
                          {task.title}
                        </Link>
                        <StatusBadge status={task.status} />
                        {isSocio && (
                          <button
                            onClick={() => openDailyFor(task.id)}
                            title="Nova task diária nesta semanal"
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-viper-500 hover:text-viper-400 rounded-md px-1.5 py-1 hover:bg-viper-500/10 transition-colors"
                          >
                            <Plus size={13} /> diária
                          </button>
                        )}
                      </div>

                      {/* Progresso pela conclusão das diárias */}
                      <div className="flex items-center gap-3 mt-2 pl-7">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <div className="h-full rounded-full" style={{ width: st.empty ? '100%' : `${st.pct}%`, backgroundColor: st.color, opacity: st.empty ? 0.35 : 1, transition: 'width 0.5s ease' }} />
                        </div>
                        {st.empty ? (
                          <span className="text-xs font-medium shrink-0" style={{ color: st.color }}>Aguarde por novas atividades</span>
                        ) : (
                          <span className="text-xs font-num text-base-muted shrink-0">{dDone}/{dailies.length} diárias</span>
                        )}
                      </div>

                      {/* Diárias vinculadas */}
                      {dailies.length > 0 && (
                        <div className="mt-2 pl-7 space-y-0.5">
                          {dailies.map((d) => (
                            <Link key={d.id} to={`/atividades/${d.id}`} className="flex items-center gap-2.5 py-1 -mx-1 px-1 rounded-sm hover:bg-subtle transition-colors">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${d.status === 'concluida' ? 'bg-success' : d.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'}`} />
                              <span className={`text-sm flex-1 truncate ${d.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-secondary'}`}>{d.title}</span>
                              <span className="text-xs text-base-muted font-num shrink-0">{formatDate(d.dueDate)}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TASKS DIÁRIAS SEM SEMANAL (legado) */}
          {orphanDailies.length > 0 && (
            <div className="card rounded-md flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-neutral-400" />
                  <h2 className="font-semibold text-base-primary text-sm">Tasks diárias sem semanal ({orphanDailies.length})</h2>
                </div>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {orphanDailies.map((task) => (
                  <Link key={task.id} to={`/atividades/${task.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-subtle transition-colors">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${task.status === 'concluida' ? 'bg-success' : task.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-primary'}`}>{task.title}</p>
                      <p className="text-xs text-base-muted font-mono truncate">{task.assignedTo.map((tid) => getUserName(tid)).join(' + ')} · prazo {formatDate(task.dueDate)}</p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Lateral: sobre + docs + notas */}
        <div className="space-y-5">
          <div className="card rounded-md p-5">
            <h3 className="text-sm font-semibold text-base-primary mb-2">Sobre o projeto</h3>
            {project.description ? (
              <p className="text-sm text-base-secondary leading-relaxed block w-full whitespace-pre-wrap">{project.description}</p>
            ) : (
              <p className="text-sm text-base-muted">Sem descrição.</p>
            )}
          </div>

          <div className="card rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-base-primary">Documentação</h3>
              {isSocio && (
                <Button variant="tertiary" size="sm" onClick={() => setShowDocModal(true)}>
                  <Plus size={13} /> Doc
                </Button>
              )}
            </div>
            {project.docs.length === 0 ? (
              <p className="text-xs text-base-muted">Nenhum documento.</p>
            ) : (
              <div className="space-y-2">
                {project.docs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-sm" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <FileText size={15} className="text-viper-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-primary truncate">{doc.title}</p>
                      <p className="text-xs text-base-muted font-mono">{formatDateTime(doc.addedAt)}</p>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-viper-400 hover:text-viper-400 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card rounded-md p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-base-primary">Notas</h3>
              <Button variant="tertiary" size="sm" onClick={() => setShowNoteModal(true)}>
                <Plus size={13} /> Nota
              </Button>
            </div>
            {project.notes.length === 0 ? (
              <p className="text-xs text-base-muted">Nenhuma nota ainda.</p>
            ) : (
              <div className="space-y-3">
                {project.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-sm border-l-2 border-viper-300" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <p className="text-sm text-base-secondary">{note.text}</p>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-base-muted font-mono">
                      <User size={10} />
                      <span>{getUserName(note.author)}</span>
                      <span>·</span>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nova task semanal modal — objetivo da semana (sem deveres; o progresso vem das diárias) */}
      <Modal
        open={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        title="Nova task semanal"
        description="Um objetivo da semana. Ele é alcançado realizando as tasks diárias ligadas a ele."
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowWeeklyModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createWeekly} disabled={!weeklyForm.title.trim() || weeklyForm.assignedTo.length === 0}>Criar semanal</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título da semanal" required>
            <Input value={weeklyForm.title} onChange={(e) => setWeeklyForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Implementar autenticação JWT" autoFocus />
          </FormField>

          <FormField label="Responsáveis" required hint="Selecione até 2 responsáveis">
            <AssigneePicker users={users} value={weeklyForm.assignedTo} onToggle={(uid) => setWeeklyForm((f) => ({ ...f, assignedTo: f.assignedTo.includes(uid) ? f.assignedTo.filter((x) => x !== uid) : f.assignedTo.length < 2 ? [...f.assignedTo, uid] : f.assignedTo }))} />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={weeklyForm.priority} onChange={(e) => setWeeklyForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={weeklyForm.dueDate} onChange={(e) => setWeeklyForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Nova task diária modal — sempre ligada a uma semanal */}
      <Modal
        open={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        title="Nova task diária"
        description={
          weeklyTasks.find((w) => w.id === dailyForm.parentTaskId)
            ? `Na semanal: ${weeklyTasks.find((w) => w.id === dailyForm.parentTaskId)?.title}`
            : `No projeto ${project.name}`
        }
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDailyModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createDaily} disabled={!dailyForm.title.trim() || dailyForm.assignedTo.length === 0 || !dailyForm.parentTaskId}>Criar diária</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={dailyForm.title} onChange={(e) => setDailyForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Ajustar layout do header" autoFocus />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={dailyForm.description} onChange={(e) => setDailyForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descreva o que precisa ser feito..." />
          </FormField>
          <FormField label="Responsáveis" required hint="Selecione até 2 responsáveis">
            <AssigneePicker users={users} value={dailyForm.assignedTo} onToggle={(uid) => setDailyForm((f) => ({ ...f, assignedTo: f.assignedTo.includes(uid) ? f.assignedTo.filter((x) => x !== uid) : f.assignedTo.length < 2 ? [...f.assignedTo, uid] : f.assignedTo }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={dailyForm.priority} onChange={(e) => setDailyForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={dailyForm.dueDate} onChange={(e) => setDailyForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Note modal */}
      <Modal
        open={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        title="Adicionar nota"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowNoteModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={addNote} disabled={!noteText.trim()}>Salvar nota</Button>
          </>
        }
      >
        <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Escreva sua nota..." autoFocus />
      </Modal>

      {/* Doc modal */}
      <Modal
        open={showDocModal}
        onClose={() => setShowDocModal(false)}
        title="Adicionar documento"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDocModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={addDoc} disabled={!docForm.title.trim() || !docForm.url.trim()}>Adicionar</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Especificação da API" autoFocus />
          </FormField>
          <FormField label="Link (URL)" required>
            <Input value={docForm.url} onChange={(e) => setDocForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." className="font-mono" />
          </FormField>
        </div>
      </Modal>

      {/* Editar projeto — popup com todos os campos */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar projeto"
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowEditModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSaveEdit} disabled={!editForm.name.trim() || saving}>
              {saving ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome do projeto" required>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="apicore-v2" className="font-mono" />
            </FormField>
            <FormField label="Cliente" required>
              <Input value={editForm.client} onChange={(e) => setEditForm((f) => ({ ...f, client: e.target.value }))} placeholder="Nome do cliente" />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Status">
              <Select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>
                <option>Ativo</option>
                <option>Pausado</option>
                <option>Concluído</option>
              </Select>
            </FormField>
            <FormField label="Início">
              <Input type="date" value={editForm.startDate} onChange={(e) => setEditForm((f) => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={editForm.endDate} onChange={(e) => setEditForm((f) => ({ ...f, endDate: e.target.value }))} />
            </FormField>
          </div>

          <FormField label="Stack" hint="Separe por vírgula: React, Node.js, PostgreSQL">
            <Input value={editForm.stack} onChange={(e) => setEditForm((f) => ({ ...f, stack: e.target.value }))} placeholder="React, Node.js, TypeScript" className="font-mono" />
          </FormField>

          <FormField label="Descrição">
            <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descreva o objetivo do projeto..." />
          </FormField>

          <FormField label="Responsáveis">
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => {
                const selected = editForm.responsibles.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleEditResp(u.id)}
                    className={`chip flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${selected ? 'chip-selected' : ''}`}
                  >
                    <Avatar user={u} size={20} fontSize={9} />
                    {u.name}
                  </button>
                );
              })}
            </div>
          </FormField>

          <p className="text-xs text-base-muted pt-1">
            Os objetivos do projeto são gerenciados pelo checklist na seção “Objetivos”.
          </p>
        </div>
      </Modal>

      {/* Novo objetivo — popup com título e descrição */}
      <Modal
        open={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
        title="Novo objetivo"
        description="Uma meta do projeto. Marque no checklist quando for concluída."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowObjectiveModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createObjective} disabled={!objectiveForm.title.trim() || saving}>
              {saving ? 'Salvando…' : 'Adicionar objetivo'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={objectiveForm.title} onChange={(e) => setObjectiveForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Entregar o MVP funcional" autoFocus />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={objectiveForm.description} onChange={(e) => setObjectiveForm((f) => ({ ...f, description: e.target.value }))} rows={3} placeholder="Detalhe o que precisa ser alcançado..." />
          </FormField>
        </div>
      </Modal>

      {/* Detalhe do objetivo — título + descrição (edição p/ sócio) */}
      <Modal
        open={!!openObjective}
        onClose={() => setOpenObjective(null)}
        title="Objetivo"
        size="sm"
        footer={
          isSocio ? (
            <>
              <Button variant="tertiary" onClick={() => setOpenObjective(null)}>Fechar</Button>
              <Button variant="primary" onClick={saveObjectiveEdit} disabled={!objEdit.title.trim() || saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </>
          ) : (
            <Button variant="tertiary" onClick={() => setOpenObjective(null)}>Fechar</Button>
          )
        }
      >
        {openObjective && (isSocio ? (
          <div className="space-y-4">
            <FormField label="Título" required>
              <Input value={objEdit.title} onChange={(e) => setObjEdit((f) => ({ ...f, title: e.target.value }))} autoFocus />
            </FormField>
            <FormField label="Descrição">
              <Textarea value={objEdit.description} onChange={(e) => setObjEdit((f) => ({ ...f, description: e.target.value }))} rows={4} placeholder="Sem descrição." />
            </FormField>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-base font-semibold text-base-primary">{openObjective.title}</h3>
            {openObjective.description ? (
              <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">{openObjective.description}</p>
            ) : (
              <p className="text-sm text-base-muted">Sem descrição.</p>
            )}
          </div>
        ))}
      </Modal>

      {/* Confirmar exclusão do projeto */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Excluir projeto"
        description="Esta ação não pode ser desfeita."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Excluindo…' : 'Excluir projeto'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-secondary">
          Tem certeza que deseja excluir <span className="font-semibold text-base-primary font-mono">{project.name}</span>?
          As notas, documentos e responsáveis serão removidos. As atividades vinculadas
          serão mantidas, mas ficarão sem projeto.
        </p>
      </Modal>
    </Layout>
  );
}
