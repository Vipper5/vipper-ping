import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Plus, ExternalLink, User, FileText, CalendarDays, Clock, Target, CheckCircle2, Trash2, ArrowRight, Pencil,
  ListChecks, ArrowUp, ArrowDown, Check, Upload, ImageIcon,
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
  addProjectNote, addProjectDoc, deleteProjectNote, deleteProjectDoc,
  updateProject, createTask, deleteTask, setTaskComplete, deleteProject,
  addProjectObjective, updateProjectObjective, toggleProjectObjective, deleteProjectObjective,
  reorderProjectObjectives, uploadProjectFile,
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
interface StandaloneTaskFormData {
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
const defaultStandaloneTask: StandaloneTaskFormData = { title: '', description: '', assignedTo: [], priority: 'media', dueDate: '', parentTaskId: '' };
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
  const [noteImage, setNoteImage] = useState<File | null>(null);
  const [noteImagePreview, setNoteImagePreview] = useState<string | null>(null);
  const noteImageRef = useRef<HTMLInputElement>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docTitle, setDocTitle] = useState('');
  const docFileRef = useRef<HTMLInputElement>(null);
  const [showStandaloneTaskModal, setShowStandaloneTaskModal] = useState(false);
  const [standaloneTaskForm, setStandaloneTaskForm] = useState<StandaloneTaskFormData>(defaultStandaloneTask);
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
      <Layout title="Cliente não encontrado">
        <Link to="/projetos" className="text-viper-400 hover:text-viper-400 flex items-center gap-1 text-sm">
          <ArrowLeft size={14} /> Voltar para clientes
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
  // Tasks de um projeto específico e tasks avulsas (legado, sem projeto).
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
      let imageUrl: string | undefined;
      if (noteImage) {
        imageUrl = await uploadProjectFile(`notes/${id}`, noteImage);
      }
      await addProjectNote(id, noteText.trim(), user.id, imageUrl);
      setNoteText('');
      setNoteImage(null);
      setNoteImagePreview(null);
      setShowNoteModal(false);
      reloadProject();
    } catch (e) {
      toast.error(`Não foi possível salvar a nota: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const handleNoteImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setNoteImage(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setNoteImagePreview(url);
    } else {
      setNoteImagePreview(null);
    }
  };

  // Abre o popup de edição preenchido com os valores atuais do cliente.
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
    if (!docTitle.trim() || !docFile || !id || saving) return;
    setSaving(true);
    try {
      const url = await uploadProjectFile(`docs/${id}`, docFile);
      await addProjectDoc(id, docTitle.trim(), url);
      setDocTitle('');
      setDocFile(null);
      setShowDocModal(false);
      reloadProject();
      toast.success('Documento adicionado.');
    } catch (e) {
      toast.error(`Não foi possível fazer upload: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const completeTask = async (taskId: string, isDone: boolean) => {
    try {
      await setTaskComplete(taskId, !isDone);
      reloadTasks();
      if (!isDone) toast.success('🏆 Task Concluída!');
    } catch {
      toast.error('Não foi possível atualizar a task.');
    }
  };

  const removeNote = async (noteId: string) => {
    try {
      await deleteProjectNote(noteId);
      reloadProject();
    } catch {
      toast.error('Não foi possível excluir a nota.');
    }
  };

  const removeDoc = async (docId: string) => {
    try {
      await deleteProjectDoc(docId);
      reloadProject();
    } catch {
      toast.error('Não foi possível excluir o documento.');
    }
  };

  const removeTask = async (taskId: string) => {
    try {
      await deleteTask(taskId);
      reloadTasks();
    } catch {
      toast.error('Não foi possível excluir a task.');
    }
  };

  const createStandaloneTask = async () => {
    if (!standaloneTaskForm.title.trim() || standaloneTaskForm.assignedTo.length === 0 || !user || !id || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: standaloneTaskForm.title,
        description: standaloneTaskForm.description,
        projectId: id,
        assignedTo: standaloneTaskForm.assignedTo,
        priority: standaloneTaskForm.priority,
        period: 'diaria',
        parentTaskId: standaloneTaskForm.parentTaskId || undefined,
        dueDate: standaloneTaskForm.dueDate || new Date().toISOString().split('T')[0],
        createdBy: user.id,
      });
      setStandaloneTaskForm(defaultStandaloneTask);
      setShowStandaloneTaskModal(false);
      reloadTasks();
      toast.success('Task criada.');
    } catch (e) {
      toast.error(`Não foi possível criar a task: ${e instanceof Error ? e.message : String(e)}`);
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

  // Abre o modal de nova task já vinculada a um projeto específico.
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
      back={{ to: '/projetos', label: 'Clientes' }}
      action={
        isSocio ? (
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => { setStandaloneTaskForm({ ...defaultStandaloneTask, dueDate: new Date().toISOString().split('T')[0] }); setShowStandaloneTaskModal(true); }}>
              <Plus size={14} /> <span className="hidden sm:inline">Nova task</span>
            </Button>
            <button
              onClick={() => setShowDelete(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-danger text-danger bg-transparent transition-all duration-150 hover:bg-danger hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
            >
              <Trash2 size={14} /> <span className="hidden sm:inline">Excluir</span>
            </button>
            <button
              onClick={openEdit}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-viper-500 text-viper-500 bg-transparent transition-all duration-150 hover:bg-viper-500 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viper-500"
            >
              <Pencil size={14} /> <span className="hidden sm:inline">Editar cliente</span>
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Resumo do cliente (somente leitura — edição pelo popup "Editar cliente") */}
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
        {/* Coluna principal: objetivos + projetos + tasks */}
        <div className="lg:col-span-2 space-y-5">
          {/* OBJETIVOS — checklist do cliente (reordenável; clique abre o detalhe) */}
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
                  Nenhum objetivo definido.{isSocio && ' Adicione metas para acompanhar o cliente.'}
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

          {/* PROJETOS — progresso vem das tasks ligadas */}
          <div className="card rounded-md flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-viper-400" />
                <h2 className="font-semibold text-base-primary text-sm">Projetos ({weeklyTasks.length})</h2>
              </div>
              {isSocio && (
                <Button variant="tertiary" size="sm" onClick={() => setShowWeeklyModal(true)}>
                  <Plus size={13} /> Novo projeto
                </Button>
              )}
            </div>

            {weeklyTasks.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-base-muted">
                Nenhum projeto. {isSocio && 'Crie projetos e vá realizando tasks até concluí-los.'}
              </div>
            ) : (
              <div>
                {weeklyTasks.map((task, i) => {
                  const dailies = dailiesFor(task.id);
                  const dDone = dailies.filter((d) => d.status === 'concluida').length;
                  const isDone = task.status === 'concluida';
                  const st = progressState(dDone, dailies.length, isDone);
                  return (
                    <div key={task.id} className="px-5 py-3.5 border-b last:border-0" style={{ borderColor: 'var(--border)', backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-subtle)' }}>
                      {/* Cabeçalho do projeto */}
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
                            title="Nova task neste projeto"
                            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-viper-500 hover:text-viper-400 rounded-md px-1.5 py-1 hover:bg-viper-500/10 transition-colors"
                          >
                            <Plus size={13} /> task
                          </button>
                        )}
                      </div>

                      {/* Progresso pela conclusão das tasks */}
                      <div className="flex items-center gap-3 mt-2 pl-7">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                          <div className="h-full rounded-full" style={{ width: st.empty ? '100%' : `${st.pct}%`, backgroundColor: st.color, opacity: st.empty ? 0.35 : 1, transition: 'width 0.5s ease' }} />
                        </div>
                        {st.empty ? (
                          <span className="text-xs font-medium shrink-0" style={{ color: st.color }}>Aguarde por novas atividades</span>
                        ) : (
                          <span className="text-xs font-num text-base-muted shrink-0">{dDone}/{dailies.length} tasks</span>
                        )}
                      </div>

                      {/* Tasks vinculadas */}
                      {dailies.length > 0 && (
                        <div className="mt-2 pl-7 space-y-0.5">
                          {dailies.map((d) => {
                            const canComplete = isSocio || (d.assignedTo ?? []).includes(user?.id ?? '');
                            const isDoneD = d.status === 'concluida';
                            return (
                              <div key={d.id} className="group flex items-center gap-2.5 py-1 -mx-1 px-1 rounded-sm hover:bg-subtle transition-colors">
                                {/* Dot (idle) → Checkbox (hover) */}
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); if (canComplete) completeTask(d.id, isDoneD); }}
                                  disabled={!canComplete}
                                  title={isDoneD ? 'Reverter' : 'Marcar como concluída'}
                                  className="shrink-0 w-4 h-4 flex items-center justify-center disabled:cursor-default"
                                >
                                  <span className={`block group-hover:hidden w-2 h-2 rounded-full ${isDoneD ? 'bg-success' : d.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'}`} />
                                  <span className={`hidden group-hover:flex w-4 h-4 rounded items-center justify-center border transition-all ${isDoneD ? 'bg-emerald-700 border-emerald-700' : 'border-neutral-400 hover:border-emerald-600'}`}>
                                    {isDoneD && <Check size={10} strokeWidth={3} className="text-white animate-check-pop" />}
                                  </span>
                                </button>
                                <Link to={`/atividades/${d.id}`} className="flex-1 flex items-center gap-2 min-w-0">
                                  <span className={`text-sm flex-1 truncate ${isDoneD ? 'line-through text-base-muted' : 'text-base-secondary'}`}>{d.title}</span>
                                </Link>
                                <span className="text-xs text-base-muted font-num shrink-0">{formatDate(d.dueDate)}</span>
                                {isSocio && (
                                  <button
                                    onClick={() => removeTask(d.id)}
                                    title="Excluir task"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-base-muted hover:text-danger hover:bg-danger/10"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* TASKS SEM PROJETO (legado) */}
          {orphanDailies.length > 0 && (
            <div className="card rounded-md flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-4 rounded-full bg-neutral-400" />
                  <h2 className="font-semibold text-base-primary text-sm">Tasks sem projeto ({orphanDailies.length})</h2>
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
            <h3 className="text-sm font-semibold text-base-primary mb-2">Sobre o cliente</h3>
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
                {project.docs.map((doc) => (
                  <div key={doc.id} className="group flex items-center gap-3 p-2.5 rounded-sm" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <FileText size={15} className="text-viper-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-primary truncate">{doc.title}</p>
                      <p className="text-xs text-base-muted font-mono">{formatDateTime(doc.addedAt)}</p>
                    </div>
                    <a href={doc.url} target="_blank" rel="noreferrer" className="text-viper-400 hover:text-viper-500 transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    {isSocio && (
                      <button
                        onClick={() => removeDoc(doc.id)}
                        title="Excluir documento"
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-base-muted hover:text-danger hover:bg-danger/10"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
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
                  <div key={note.id} className="group p-3 rounded-sm border-l-2 border-viper-300" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <p className="text-sm text-base-secondary whitespace-pre-wrap">{note.text}</p>
                    {note.imageUrl && (
                      <a href={note.imageUrl} target="_blank" rel="noreferrer" className="mt-2 block rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                        <img src={note.imageUrl} alt="Imagem da nota" className="w-full max-h-48 object-cover hover:opacity-90 transition-opacity" />
                      </a>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-1.5">
                      <div className="flex items-center gap-2 text-xs text-base-muted font-mono">
                        <User size={10} />
                        <span>{getUserName(note.author)}</span>
                        <span>·</span>
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                      {isSocio && (
                        <button
                          onClick={() => removeNote(note.id)}
                          title="Excluir nota"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-base-muted hover:text-danger hover:bg-danger/10"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Novo projeto modal — o progresso vem das tasks ligadas */}
      <Modal
        open={showWeeklyModal}
        onClose={() => setShowWeeklyModal(false)}
        title="Novo projeto"
        description="Um projeto do cliente. Ele é alcançado realizando as tasks ligadas a ele."
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowWeeklyModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createWeekly} disabled={!weeklyForm.title.trim() || weeklyForm.assignedTo.length === 0}>Criar projeto</Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título do projeto" required>
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

      {/* Nova task modal — sempre ligada a um projeto */}
      <Modal
        open={showDailyModal}
        onClose={() => setShowDailyModal(false)}
        title="Nova task"
        description={
          weeklyTasks.find((w) => w.id === dailyForm.parentTaskId)
            ? `No projeto: ${weeklyTasks.find((w) => w.id === dailyForm.parentTaskId)?.title}`
            : `No cliente ${project.name}`
        }
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDailyModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createDaily} disabled={!dailyForm.title.trim() || dailyForm.assignedTo.length === 0 || !dailyForm.parentTaskId}>Criar task</Button>
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
        onClose={() => { setShowNoteModal(false); setNoteImage(null); setNoteImagePreview(null); }}
        title="Adicionar nota"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => { setShowNoteModal(false); setNoteImage(null); setNoteImagePreview(null); }}>Cancelar</Button>
            <Button variant="primary" onClick={addNote} disabled={!noteText.trim() || saving}>
              {saving ? 'Salvando…' : 'Salvar nota'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={4} placeholder="Escreva sua nota..." autoFocus />
          <div>
            <input
              ref={noteImageRef}
              type="file"
              accept="image/*,.gif"
              className="hidden"
              onChange={handleNoteImageChange}
            />
            {noteImagePreview ? (
              <div className="relative rounded-md overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
                <img src={noteImagePreview} alt="Preview" className="w-full max-h-48 object-cover" />
                <button
                  onClick={() => { setNoteImage(null); setNoteImagePreview(null); if (noteImageRef.current) noteImageRef.current.value = ''; }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ArrowLeft size={12} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => noteImageRef.current?.click()}
                className="flex items-center gap-2 text-xs text-base-muted hover:text-viper-500 transition-colors py-1.5 px-2 rounded-md hover:bg-subtle"
              >
                <ImageIcon size={14} /> Anexar imagem / gif (opcional)
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Doc modal — upload de arquivo */}
      <Modal
        open={showDocModal}
        onClose={() => { setShowDocModal(false); setDocFile(null); setDocTitle(''); }}
        title="Adicionar documento"
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => { setShowDocModal(false); setDocFile(null); setDocTitle(''); }}>Cancelar</Button>
            <Button variant="primary" onClick={addDoc} disabled={!docTitle.trim() || !docFile || saving}>
              {saving ? 'Enviando…' : 'Adicionar'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Ex.: Especificação da API" autoFocus />
          </FormField>
          <FormField label="Arquivo" required>
            <input ref={docFileRef} type="file" className="hidden" onChange={(e) => setDocFile(e.target.files?.[0] ?? null)} />
            {docFile ? (
              <div className="flex items-center gap-2 p-2.5 rounded-md" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <FileText size={15} className="text-viper-400 shrink-0" />
                <span className="text-sm text-base-primary truncate flex-1">{docFile.name}</span>
                <button onClick={() => { setDocFile(null); if (docFileRef.current) docFileRef.current.value = ''; }} className="text-base-muted hover:text-danger transition-colors text-xs">remover</button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => docFileRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 p-4 rounded-md border-2 border-dashed text-sm text-base-muted hover:text-viper-500 hover:border-viper-400 transition-colors"
                style={{ borderColor: 'var(--border)' }}
              >
                <Upload size={16} /> Clique para selecionar o arquivo
              </button>
            )}
          </FormField>
        </div>
      </Modal>

      {/* Nova task — vinculada ao cliente, opcionalmente a um projeto */}
      <Modal
        open={showStandaloneTaskModal}
        onClose={() => setShowStandaloneTaskModal(false)}
        title="Nova task"
        description={`No cliente ${project.name}`}
        size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowStandaloneTaskModal(false)}>Cancelar</Button>
            <Button variant="primary" onClick={createStandaloneTask} disabled={!standaloneTaskForm.title.trim() || standaloneTaskForm.assignedTo.length === 0 || saving}>
              {saving ? 'Criando…' : 'Criar task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required>
            <Input value={standaloneTaskForm.title} onChange={(e) => setStandaloneTaskForm((f) => ({ ...f, title: e.target.value }))} placeholder="Ex.: Ajustar layout do header" autoFocus />
          </FormField>
          <FormField label="Descrição">
            <Textarea value={standaloneTaskForm.description} onChange={(e) => setStandaloneTaskForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descreva o que precisa ser feito..." />
          </FormField>
          {weeklyTasks.length > 0 && (
            <FormField label="Vincular a um projeto" hint="Opcional">
              <Select value={standaloneTaskForm.parentTaskId} onChange={(e) => setStandaloneTaskForm((f) => ({ ...f, parentTaskId: e.target.value }))}>
                <option value="">Nenhum</option>
                {weeklyTasks.map((w) => (<option key={w.id} value={w.id}>{w.title}</option>))}
              </Select>
            </FormField>
          )}
          <FormField label="Responsáveis" required hint="Selecione até 2 responsáveis">
            <AssigneePicker users={users} value={standaloneTaskForm.assignedTo} onToggle={(uid) => setStandaloneTaskForm((f) => ({ ...f, assignedTo: f.assignedTo.includes(uid) ? f.assignedTo.filter((x) => x !== uid) : f.assignedTo.length < 2 ? [...f.assignedTo, uid] : f.assignedTo }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={standaloneTaskForm.priority} onChange={(e) => setStandaloneTaskForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={standaloneTaskForm.dueDate} onChange={(e) => setStandaloneTaskForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>

      {/* Editar cliente — popup com todos os campos */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Editar cliente"
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
            <FormField label="Nome do cliente" required>
              <Input value={editForm.name} onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))} placeholder="acme-corp" className="font-mono" />
            </FormField>
            <FormField label="Empresa" required>
              <Input value={editForm.client} onChange={(e) => setEditForm((f) => ({ ...f, client: e.target.value }))} placeholder="Nome da empresa" />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Status">
              <Select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>
                <option>Ativo</option>
                <option>Em Desenvolvimento</option>
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
            <Textarea value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descreva o objetivo do cliente..." />
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
            Os objetivos do cliente são gerenciados pelo checklist na seção “Objetivos”.
          </p>
        </div>
      </Modal>

      {/* Novo objetivo — popup com título e descrição */}
      <Modal
        open={showObjectiveModal}
        onClose={() => setShowObjectiveModal(false)}
        title="Novo objetivo"
        description="Uma meta do cliente. Marque no checklist quando for concluída."
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

      {/* Confirmar exclusão do cliente */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title="Excluir cliente"
        description="Esta ação não pode ser desfeita."
        size="sm"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowDelete(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteProject} disabled={deleting}>
              <Trash2 size={14} /> {deleting ? 'Excluindo…' : 'Excluir cliente'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-base-secondary">
          Tem certeza que deseja excluir <span className="font-semibold text-base-primary font-mono">{project.name}</span>?
          As notas, documentos e responsáveis serão removidos. As tasks vinculadas
          serão mantidas, mas ficarão sem cliente.
        </p>
      </Modal>
    </Layout>
  );
}
