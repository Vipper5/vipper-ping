import { supabase } from './supabase';
import type {
  User,
  Project,
  ProjectStatus,
  Task,
  TaskStatus,
  TaskPriority,
  TaskPeriod,
  AgendaEvent,
  EventCategory,
  TimeEntry,
} from '../mocks/data';

// ------------------------------------------------------------------
// Helpers de mapeamento DB -> shapes do app
// ------------------------------------------------------------------

/** 'HH:MM:SS' (Postgres time) -> 'HH:MM' (app) */
function hhmm(t: string | null | undefined): string | undefined {
  return t ? t.slice(0, 5) : undefined;
}

/** 'HH:MM' -> 'HH:MM:00' para gravar em coluna time */
function toDbTime(t: string | undefined): string | null {
  return t ? `${t}:00` : null;
}

function nn<T>(v: T | null): T | undefined {
  return v ?? undefined;
}

// ------------------------------------------------------------------
// Usuários / perfis
// ------------------------------------------------------------------

export async function fetchUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('role', { ascending: true })
    .order('name', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    role: p.role,
    initials: p.initials,
    email: p.email,
    title: nn(p.title),
    phone: nn(p.phone),
    bio: nn(p.bio),
    responsibilities: p.responsibilities ?? [],
    photo: nn(p.photo),
  }));
}

// ------------------------------------------------------------------
// Projetos
// ------------------------------------------------------------------

const PROJECT_SELECT =
  '*, project_responsibles(profile_id), project_docs(*), project_notes(*)';

// Os objetivos vêm numa consulta separada (não embutida) para que a página de
// projetos continue funcionando mesmo que a tabela project_objectives ainda não
// exista (migration pendente). Em qualquer erro, devolve lista vazia.
/* eslint-disable @typescript-eslint/no-explicit-any */
async function fetchObjectivesByProject(projectIds: string[]): Promise<Record<string, any[]>> {
  if (projectIds.length === 0) return {};
  const { data, error } = await supabase
    .from('project_objectives')
    .select('*')
    .in('project_id', projectIds);
  if (error || !data) return {};
  const byProject: Record<string, any[]> = {};
  for (const o of data) {
    if (!byProject[o.project_id]) byProject[o.project_id] = [];
    byProject[o.project_id].push(o);
  }
  return byProject;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProject(row: any): Project {
  return {
    id: row.id,
    name: row.name,
    client: row.client,
    status: row.status,
    stack: row.stack ?? [],
    startDate: row.start_date ?? '',
    endDate: row.end_date ?? '',
    responsibles: (row.project_responsibles ?? []).map((r: any) => r.profile_id),
    description: row.description ?? '',
    docs: (row.project_docs ?? [])
      .map((d: any) => ({ id: d.id, title: d.title, url: d.url, addedAt: d.added_at }))
      .sort((a: any, b: any) => a.addedAt.localeCompare(b.addedAt)),
    notes: (row.project_notes ?? [])
      .map((n: any) => ({ id: n.id, text: n.text, author: n.author_id ?? '', createdAt: n.created_at, imageUrl: n.image_url ?? undefined }))
      .sort((a: any, b: any) => a.createdAt.localeCompare(b.createdAt)),
    objectives: (row.project_objectives ?? [])
      .map((o: any) => ({
        id: o.id,
        title: o.title,
        description: o.description ?? undefined,
        done: o.done,
        position: o.position,
      }))
      .sort((a: any, b: any) => a.position - b.position),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = data ?? [];
  const objs = await fetchObjectivesByProject(rows.map((r) => r.id));
  return rows.map((r) => mapProject({ ...r, project_objectives: objs[r.id] ?? [] }));
}

export async function fetchProject(id: string): Promise<Project | null> {
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const objs = await fetchObjectivesByProject([id]);
  return mapProject({ ...data, project_objectives: objs[id] ?? [] });
}

export interface ProjectInput {
  name: string;
  client: string;
  status: ProjectStatus;
  stack: string[];
  startDate: string;
  endDate: string;
  description: string;
  responsibles: string[];
}

export async function createProject(input: ProjectInput): Promise<string> {
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      client: input.client,
      status: input.status,
      stack: input.stack,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      description: input.description || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  await syncProjectResponsibles(data.id, input.responsibles);
  return data.id;
}

export async function updateProject(id: string, input: ProjectInput): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({
      name: input.name,
      client: input.client,
      status: input.status,
      stack: input.stack,
      start_date: input.startDate || null,
      end_date: input.endDate || null,
      description: input.description || null,
    })
    .eq('id', id);
  if (error) throw error;
  await syncProjectResponsibles(id, input.responsibles);
}

export async function deleteProject(id: string): Promise<void> {
  // Responsáveis, docs e notas são removidos em cascata (ON DELETE CASCADE).
  // As tasks do cliente têm project_id setado para NULL (ON DELETE SET NULL).
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

async function syncProjectResponsibles(projectId: string, responsibles: string[]): Promise<void> {
  await supabase.from('project_responsibles').delete().eq('project_id', projectId);
  if (responsibles.length > 0) {
    const { error } = await supabase
      .from('project_responsibles')
      .insert(responsibles.map((profile_id) => ({ project_id: projectId, profile_id })));
    if (error) throw error;
  }
}

export async function addProjectNote(
  projectId: string,
  text: string,
  authorId: string,
  imageUrl?: string,
): Promise<void> {
  const { error } = await supabase
    .from('project_notes')
    .insert({ project_id: projectId, text, author_id: authorId, image_url: imageUrl ?? null });
  if (error) throw error;
}

export async function addProjectDoc(projectId: string, title: string, url: string): Promise<void> {
  const { error } = await supabase
    .from('project_docs')
    .insert({ project_id: projectId, title, url });
  if (error) throw error;
}

export async function deleteProjectNote(noteId: string): Promise<void> {
  const { error } = await supabase.from('project_notes').delete().eq('id', noteId);
  if (error) throw error;
}

export async function deleteProjectDoc(docId: string): Promise<void> {
  const { error } = await supabase.from('project_docs').delete().eq('id', docId);
  if (error) throw error;
}

/** Faz upload de um arquivo para o bucket 'project-files' e retorna a URL pública. */
export async function uploadProjectFile(
  folder: string,
  file: File,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('project-files').upload(path, file, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('project-files').getPublicUrl(path);
  return data.publicUrl;
}

// ------------------------------------------------------------------
// Objetivos do cliente (checklist)
// ------------------------------------------------------------------

export async function addProjectObjective(
  projectId: string,
  title: string,
  description: string,
  position: number,
): Promise<void> {
  const { error } = await supabase
    .from('project_objectives')
    .insert({ project_id: projectId, title, description: description || null, position });
  if (error) throw error;
}

export async function updateProjectObjective(
  objectiveId: string,
  fields: { title?: string; description?: string | null; done?: boolean; position?: number },
): Promise<void> {
  const { error } = await supabase
    .from('project_objectives')
    .update(fields)
    .eq('id', objectiveId);
  if (error) throw error;
}

export async function toggleProjectObjective(objectiveId: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from('project_objectives')
    .update({ done })
    .eq('id', objectiveId);
  if (error) throw error;
}

export async function deleteProjectObjective(objectiveId: string): Promise<void> {
  const { error } = await supabase.from('project_objectives').delete().eq('id', objectiveId);
  if (error) throw error;
}

/** Persiste a nova ordem dos objetivos (position = índice na lista). */
export async function reorderProjectObjectives(orderedIds: string[]): Promise<void> {
  await Promise.all(
    orderedIds.map((id, position) =>
      supabase.from('project_objectives').update({ position }).eq('id', id),
    ),
  );
}

// ------------------------------------------------------------------
// Tarefas
// ------------------------------------------------------------------

const TASK_SELECT = '*, task_assignees(profile_id), subtasks(*)';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? '',
    projectId: row.project_id ?? '',
    assignedTo: (row.task_assignees ?? []).map((a: any) => a.profile_id),
    createdBy: row.created_by ?? '',
    status: row.status,
    priority: row.priority,
    period: row.period ?? undefined,
    parentTaskId: row.parent_task_id ?? undefined,
    note: row.note ?? undefined,
    dueDate: row.due_date ?? '',
    completedAt: row.completed_at ?? undefined,
    subtasks: (row.subtasks ?? [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((s: any) => ({ id: s.id, title: s.title, description: s.description ?? undefined, done: s.done })),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .order('due_date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapTask);
}

export async function fetchTask(id: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapTask(data) : null;
}

export interface TaskInput {
  title: string;
  description: string;
  projectId: string;
  assignedTo: string[];
  priority: TaskPriority;
  period: TaskPeriod;
  dueDate: string;
  createdBy: string;
  /** Para diárias: id da Task semanal pai. */
  parentTaskId?: string;
  /** Anotação livre (opcional). */
  note?: string;
  /** Títulos das etapas a criar junto (opcional). */
  subtasks?: string[];
}

export async function createTask(input: TaskInput): Promise<string> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      description: input.description || null,
      project_id: input.projectId || null,
      created_by: input.createdBy,
      status: 'pendente',
      priority: input.priority,
      period: input.period,
      parent_task_id: input.parentTaskId || null,
      note: input.note || null,
      due_date: input.dueDate || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (input.assignedTo.length > 0) {
    const { error: aErr } = await supabase
      .from('task_assignees')
      .insert(input.assignedTo.map((profile_id) => ({ task_id: data.id, profile_id })));
    if (aErr) throw aErr;
  }
  if (input.subtasks && input.subtasks.length > 0) {
    const { error: sErr } = await supabase
      .from('subtasks')
      .insert(input.subtasks.map((title, position) => ({ task_id: data.id, title, position })));
    if (sErr) throw sErr;
  }
  return data.id;
}

export async function deleteTask(id: string): Promise<void> {
  // Responsáveis e etapas são removidos em cascata (ON DELETE CASCADE).
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
}

export interface TaskUpdate {
  title: string;
  description: string;
  note: string;
  projectId: string;
  assignedTo: string[];
  priority: TaskPriority;
  dueDate: string;
}

/** Edita os campos principais de uma task (usado ao editar um agendamento). */
export async function updateTask(id: string, input: TaskUpdate): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      title: input.title,
      description: input.description || null,
      note: input.note || null,
      project_id: input.projectId || null,
      priority: input.priority,
      due_date: input.dueDate || null,
    })
    .eq('id', id);
  if (error) throw error;
  await supabase.from('task_assignees').delete().eq('task_id', id);
  if (input.assignedTo.length > 0) {
    const { error: aErr } = await supabase
      .from('task_assignees')
      .insert(input.assignedTo.map((profile_id) => ({ task_id: id, profile_id })));
    if (aErr) throw aErr;
  }
}

export async function setTaskComplete(taskId: string, complete: boolean): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      status: complete ? 'concluida' : 'em_andamento',
      completed_at: complete ? new Date().toISOString() : null,
    })
    .eq('id', taskId);
  if (error) throw error;
}

/** Define o status da tarefa diretamente (limpa completed_at se não estiver concluída). */
export async function setTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({
      status,
      completed_at: status === 'concluida' ? new Date().toISOString() : null,
    })
    .eq('id', taskId);
  if (error) throw error;
}

export async function setTaskNote(taskId: string, note: string | null): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .update({ note: note || null })
    .eq('id', taskId);
  if (error) throw error;
}

export async function toggleSubtask(subtaskId: string, done: boolean): Promise<void> {
  const { error } = await supabase.from('subtasks').update({ done }).eq('id', subtaskId);
  if (error) throw error;
}

export async function addSubtask(
  taskId: string,
  title: string,
  position: number,
  description?: string,
): Promise<void> {
  const { error } = await supabase
    .from('subtasks')
    .insert({ task_id: taskId, title, position, description: description?.trim() || null });
  if (error) throw error;
}

/** Edita o conteúdo de uma etapa (título e/ou descrição). */
export async function updateSubtask(
  subtaskId: string,
  fields: { title?: string; description?: string | null },
): Promise<void> {
  const { error } = await supabase.from('subtasks').update(fields).eq('id', subtaskId);
  if (error) throw error;
}

export async function deleteSubtask(subtaskId: string): Promise<void> {
  const { error } = await supabase.from('subtasks').delete().eq('id', subtaskId);
  if (error) throw error;
}

// ------------------------------------------------------------------
// Agenda
// ------------------------------------------------------------------

const EVENT_SELECT = '*, event_members(profile_id)';

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapEvent(row: any): AgendaEvent {
  return {
    id: row.id,
    title: row.title,
    date: row.date,
    category: row.category,
    time: hhmm(row.time),
    members: (row.event_members ?? []).map((m: any) => m.profile_id),
    description: nn(row.description),
    note: nn(row.note),
    location: nn(row.location),
    link: nn(row.link),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchEvents(): Promise<AgendaEvent[]> {
  const { data, error } = await supabase
    .from('agenda_events')
    .select(EVENT_SELECT)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapEvent);
}

export interface EventInput {
  title: string;
  date: string;
  category: EventCategory;
  time?: string;
  members: string[];
  createdBy: string;
  description?: string;
  note?: string;
  location?: string;
  link?: string;
}

export async function createEvent(input: EventInput): Promise<string> {
  const { data, error } = await supabase
    .from('agenda_events')
    .insert({
      title: input.title,
      date: input.date,
      category: input.category,
      time: toDbTime(input.time),
      created_by: input.createdBy,
      description: input.description || null,
      note: input.note || null,
      location: input.location || null,
      link: input.link || null,
    })
    .select('id')
    .single();
  if (error) throw error;
  if (input.members.length > 0) {
    const { error: mErr } = await supabase
      .from('event_members')
      .insert(input.members.map((profile_id) => ({ event_id: data.id, profile_id })));
    if (mErr) throw mErr;
  }
  return data.id;
}

/** Edita um evento da agenda e sincroniza participantes. */
export async function updateEvent(id: string, input: EventInput): Promise<void> {
  const { error } = await supabase
    .from('agenda_events')
    .update({
      title: input.title,
      date: input.date,
      category: input.category,
      time: toDbTime(input.time),
      description: input.description || null,
      note: input.note || null,
      location: input.location || null,
      link: input.link || null,
    })
    .eq('id', id);
  if (error) throw error;
  await supabase.from('event_members').delete().eq('event_id', id);
  if (input.members.length > 0) {
    const { error: mErr } = await supabase
      .from('event_members')
      .insert(input.members.map((profile_id) => ({ event_id: id, profile_id })));
    if (mErr) throw mErr;
  }
}

export async function deleteEvent(id: string): Promise<void> {
  // Participantes removidos em cascata (ON DELETE CASCADE).
  const { error } = await supabase.from('agenda_events').delete().eq('id', id);
  if (error) throw error;
}

// ------------------------------------------------------------------
// Ponto (time_entries)
// ------------------------------------------------------------------

type Punch = 'entrada' | 'saidaAlmoco' | 'voltaAlmoco' | 'saida';
const PUNCH_COLUMN: Record<Punch, string> = {
  entrada: 'entrada',
  saidaAlmoco: 'saida_almoco',
  voltaAlmoco: 'volta_almoco',
  saida: 'saida',
};

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapTimeEntry(row: any): TimeEntry {
  return {
    id: row.id,
    date: row.date,
    entrada: hhmm(row.entrada),
    saidaAlmoco: hhmm(row.saida_almoco),
    voltaAlmoco: hhmm(row.volta_almoco),
    saida: hhmm(row.saida),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function fetchTimeEntries(profileId: string): Promise<TimeEntry[]> {
  const { data, error } = await supabase
    .from('time_entries')
    .select('*')
    .eq('profile_id', profileId)
    .order('date', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapTimeEntry);
}

/** Registra uma batida de ponto (upsert por profile_id+date). */
export async function punchClock(
  profileId: string,
  date: string,
  punch: Punch,
  time: string,
): Promise<void> {
  const column = PUNCH_COLUMN[punch];
  const { error } = await supabase
    .from('time_entries')
    .upsert(
      { profile_id: profileId, date, [column]: toDbTime(time) },
      { onConflict: 'profile_id,date' },
    );
  if (error) throw error;
}
