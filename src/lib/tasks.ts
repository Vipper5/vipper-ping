import type { Task, TaskPeriod } from '../mocks/data';

/** Período da task. Legado sem período é tratado como diária. */
export function taskPeriod(t: Task): TaskPeriod {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
}
