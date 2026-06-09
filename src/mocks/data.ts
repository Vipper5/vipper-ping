// Tipos de domínio do Vipper Ping.
// Os dados agora vêm do Supabase (ver src/lib/api.ts e src/lib/hooks.ts);
// este arquivo mantém apenas as interfaces compartilhadas e helpers puros.

export type UserRole = 'socio' | 'estagiario';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  initials: string;
  email: string;
  title?: string;
  phone?: string;
  bio?: string;
  responsibilities?: string[];
  photo?: string;
}

export type ProjectStatus = 'Ativo' | 'Pausado' | 'Concluído' | 'Em Desenvolvimento';

// Objetivo do cliente — item de um checklist reordenável.
export interface ProjectObjective {
  id: string;
  title: string;
  description?: string;
  done: boolean;
  position: number;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  status: ProjectStatus;
  stack: string[];
  startDate: string;
  endDate: string;
  responsibles: string[];
  description: string;
  docs: { title: string; url: string; addedAt: string }[];
  notes: { id: string; text: string; author: string; createdAt: string; imageUrl?: string }[];
  // Objetivos do cliente — checklist de metas (ver project_objectives).
  objectives: ProjectObjective[];
}

export type TaskStatus = 'pendente' | 'em_andamento' | 'concluida';
export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TaskPeriod = 'diaria' | 'semanal';

export interface Subtask {
  id: string;
  title: string;
  description?: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  assignedTo: string[];
  createdBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  period?: TaskPeriod;
  /** Para Tasks diárias: id da Task semanal a que pertencem. */
  parentTaskId?: string;
  /** Anotação livre do agendamento. */
  note?: string;
  dueDate: string;
  subtasks: Subtask[];
  completedAt?: string;
}

export interface TimeEntry {
  id: string;
  date: string;
  entrada?: string;
  saidaAlmoco?: string;
  voltaAlmoco?: string;
  saida?: string;
}

// Eventos da agenda que não são tarefas (reuniões, lembretes, etc.)
export type EventCategory = 'reuniao' | 'lembrete';

export interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  category: EventCategory;
  time?: string;
  members: string[];
  description?: string;
  note?: string;
  location?: string;
  link?: string;
}

export function calcHours(entry: TimeEntry): string {
  if (!entry.entrada || !entry.saida) return '--';
  const toMin = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  const total = toMin(entry.saida) - toMin(entry.entrada);
  const lunch = entry.saidaAlmoco && entry.voltaAlmoco
    ? toMin(entry.voltaAlmoco) - toMin(entry.saidaAlmoco)
    : 0;
  const worked = total - lunch;
  return `${Math.floor(worked / 60)}h ${worked % 60}m`;
}
