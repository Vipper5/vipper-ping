import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import { createTask, updateTask, setTaskComplete } from '../lib/api';
import { Task, Project, User, TaskPeriod, TaskPriority } from '../mocks/data';

/* ─── Helpers ─── */

function todayStr() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().split('T')[0];
}

function formatDateShort(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function daysUntil(d: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000);
}

function taskPeriod(t: Task): TaskPeriod {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
}

function taskProgress(task: Task): number {
  if (task.status === 'concluida') return 100;
  if (!task.subtasks?.length) return 0;
  return Math.round((task.subtasks.filter((s) => s.done).length / task.subtasks.length) * 100);
}

function progressBarColor(pct: number, priority: string, status: string): string {
  if (status === 'concluida') return '#1D9E75';
  if (pct === 0) return 'var(--track)';
  if (priority === 'alta') return '#EF4444';
  if (priority === 'baixa') return '#1D9E75';
  return '#4A11A2';
}

const PRIORITY_RANK: Record<string, number> = { alta: 0, media: 1, baixa: 2 };
const STATUS_RANK:   Record<string, number> = { em_andamento: 0, pendente: 1, concluida: 2 };

const PRIORITY_META: Record<string, { label: string; color: string }> = {
  alta:  { label: 'Alta',  color: '#EF4444' },
  media: { label: 'Média', color: '#9966E0' },
  baixa: { label: 'Baixa', color: '#1D9E75' },
};

const STATUS_GROUPS = [
  { key: 'em_andamento', label: 'Em andamento', dot: '#378ADD' },
  { key: 'pendente',     label: 'Pendente',     dot: '#8A8A96' },
  { key: 'concluida',    label: 'Concluída',    dot: '#1D9E75' },
];

/* ─── FilterDropdown ─── */

interface DropdownOption { key: string; label: string; dot?: string }

function FilterDropdown({ value, onChange, options, counts, minWidth = '180px' }: {
  value: string; onChange: (v: string) => void;
  options: DropdownOption[]; counts: Record<string, number>; minWidth?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const current = options.find((o) => o.key === value) ?? options[0];
  return (
    <div ref={ref} className="relative">
      {(() => {
        const isFiltered = value !== 'all';
        const accent = current.dot ?? 'var(--text-secondary)';
        return (
          <button onClick={() => setOpen((p) => !p)}
            className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150"
            style={{
              border: isFiltered ? `0.5px solid ${accent}` : '0.5px solid var(--border)',
              background: isFiltered ? `${accent}12` : 'var(--surface)',
              color: isFiltered ? accent : 'var(--text-secondary)',
              minWidth,
            }}>
            {current.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: current.dot }} />}
            <span className="font-label text-[11px] tracking-[0.10em] flex-1 text-left">{current.label}</span>
            <span className="font-label text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
              {counts[value] ?? 0}
            </span>
            <i className="ph-light ph-caret-down shrink-0"
              style={{ fontSize: '13px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: isFiltered ? accent : 'var(--text-muted)' }} />
          </button>
        );
      })()}
      {open && (
        <div className="dropdown-menu absolute top-full left-0 mt-1 z-20 py-1" style={{ minWidth: '210px' }}>
          {options.map((opt) => {
            const isSel = value === opt.key;
            const accentColor = opt.dot ?? '#9966E0';
            const accentBg = isSel ? `${accentColor}18` : 'transparent';
            return (
              <button key={opt.key} onClick={() => { onChange(opt.key); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left"
                style={{ background: accentBg, color: isSel ? accentColor : 'var(--text-secondary)' }}
                onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'; }}
                onMouseLeave={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                {opt.dot && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />}
                <span className="font-label text-[11px] tracking-[0.10em] flex-1">{opt.label}</span>
                <span className="font-label text-[10px]" style={{ color: 'var(--text-muted)' }}>{counts[opt.key] ?? 0}</span>
                {isSel && <i className="ph-light ph-check shrink-0" style={{ fontSize: '13px', color: accentColor }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Cabeçalho ordenável ─── */

type SortCol = 'tarefa' | 'tipo' | 'status' | 'progresso' | 'prazo' | null;
type SortDir = 'asc' | 'desc';

function SortHeader({ label, col, sortCol, sortDir, onSort }: {
  label: string; col: SortCol;
  sortCol: SortCol; sortDir: SortDir;
  onSort: (c: SortCol) => void;
}) {
  const active = sortCol === col;
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 transition-colors group"
      style={{ color: active ? '#9966E0' : 'var(--text-muted)' }}
    >
      <span className="font-label text-[10px] tracking-[0.14em]">{label}</span>
      {active ? (
        <i className={`ph-light ${sortDir === 'asc' ? 'ph-arrow-down' : 'ph-arrow-up'}`}
          style={{ fontSize: '11px', color: '#9966E0' }} />
      ) : (
        <i className="ph-light ph-arrows-down-up opacity-0 group-hover:opacity-50"
          style={{ fontSize: '11px' }} />
      )}
    </button>
  );
}

/* ════════════════════════════════════
   MODO LISTA
════════════════════════════════════ */

function ListaView({ tasks, projects, users, onCheck }: {
  tasks: Task[]; projects: Project[]; users: User[];
  onCheck: (task: Task, e: React.MouseEvent) => void;
}) {
  const [sortCol, setSortCol] = useState<SortCol>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (col: SortCol) => {
    if (sortCol === col) {
      if (sortDir === 'asc') setSortDir('desc');
      else { setSortCol(null); setSortDir('asc'); }
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  const sorted = [...tasks].sort((a, b) => {
    if (sortCol) {
      let diff = 0;
      if (sortCol === 'tarefa') diff = a.title.localeCompare(b.title, 'pt-BR', { sensitivity: 'base' });
      if (sortCol === 'tipo')   diff = taskPeriod(a).localeCompare(taskPeriod(b));
      if (sortCol === 'status') diff = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
      if (sortCol === 'progresso') diff = taskProgress(a) - taskProgress(b);
      if (sortCol === 'prazo') diff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      return sortDir === 'asc' ? diff : -diff;
    }
    // Default: prazo asc, depois prioridade
    const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (PRIORITY_RANK[a.priority] ?? 9) - (PRIORITY_RANK[b.priority] ?? 9);
  });

  const COLS = '32px 1fr 100px 140px 170px 60px 90px';

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
      {/* Header */}
      <div className="grid items-center px-4 py-2.5"
        style={{ gridTemplateColumns: COLS, gap: '12px', background: 'var(--bg-subtle)', borderBottom: '0.5px solid var(--border)' }}>
        <span />
        <SortHeader label="TAREFA"    col="tarefa"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        <SortHeader label="TIPO"      col="tipo"      sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        <SortHeader label="STATUS"    col="status"    sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        <SortHeader label="PROGRESSO" col="progresso" sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
        <span className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>RESP.</span>
        <SortHeader label="PRAZO"     col="prazo"     sortCol={sortCol} sortDir={sortDir} onSort={handleSort} />
      </div>

      {sorted.map((task) => {
        const project   = projects.find((p) => p.id === task.projectId);
        const assignees = task.assignedTo.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
        const pct       = taskProgress(task);
        const barColor  = progressBarColor(pct, task.priority, task.status);
        const isDone    = task.status === 'concluida';
        const days      = daysUntil(task.dueDate);
        const dateColor = isDone ? 'var(--text-muted)' : days < 0 ? '#EF4444' : days <= 3 ? '#EF4444' : days <= 7 ? '#EF9F27' : 'var(--text-secondary)';
        const isProj    = taskPeriod(task) === 'semanal';
        const tipoColor = isProj ? '#9966E0' : '#EF9F27';
        const tipoLabel = isProj ? 'Projeto'  : 'Task';

        return (
          <Link key={task.id} to={`/atividades/${task.id}`}
            className="group list-row grid items-center px-4 py-3"
            style={{ gridTemplateColumns: COLS, gap: '12px' }}>

            {/* Checkbox */}
            <div className="flex items-center justify-center"
              onClick={(e) => onCheck(task, e)}>
              <div className="w-[18px] h-[18px] rounded flex items-center justify-center transition-all cursor-pointer"
                style={{
                  border: isDone ? '1.5px solid #1D9E75' : '1.5px solid rgba(255,255,255,0.22)',
                  background: isDone ? 'rgba(29,158,117,0.18)' : 'rgba(255,255,255,0.04)',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isDone) {
                    el.style.borderColor = 'rgba(255,255,255,0.55)';
                    el.style.background = 'rgba(255,255,255,0.09)';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  if (!isDone) {
                    el.style.borderColor = 'rgba(255,255,255,0.22)';
                    el.style.background = 'rgba(255,255,255,0.04)';
                  }
                }}
              >
                {isDone && <i className="ph-bold ph-check" style={{ fontSize: '10px', color: '#1D9E75' }} />}
              </div>
            </div>

            {/* Tarefa + cliente */}
            <div className="min-w-0 pr-2">
              <p className="text-sm font-semibold truncate"
                style={{ fontFamily: 'Geist, system-ui', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                {task.title}
              </p>
              <p className="text-xs truncate mt-0.5" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>
                {project?.name ?? 'Sem cliente'}
              </p>
            </div>

            {/* Tipo */}
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: tipoColor }} />
              <span className="font-label text-[10px] tracking-[0.06em]" style={{ color: tipoColor }}>{tipoLabel}</span>
            </div>

            {/* Status */}
            <StatusBadge status={task.status} />

            {/* Progresso */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--track)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className="font-num text-[11px] shrink-0 w-8 text-right" style={{ color: barColor }}>{pct}%</span>
            </div>

            {/* Responsáveis */}
            <div className="flex -space-x-1.5">
              {assignees.slice(0, 2).map((u) => (
                <Avatar key={u.id} user={u} size={24} fontSize={9} fallbackClassName="" />
              ))}
              {assignees.length > 2 && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--surface2)', border: '1.5px solid var(--surface)', fontSize: '9px', color: 'var(--text-muted)' }}>
                  +{assignees.length - 2}
                </div>
              )}
            </div>

            {/* Prazo */}
            <span className="font-label text-[10px] tracking-[0.06em]" style={{ color: dateColor }}>
              {task.dueDate ? formatDateShort(task.dueDate) : '—'}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════
   MODO CRONOGRAMA — gantt
════════════════════════════════════ */

const DAY_W = 30;

function getBarPosition(task: Task, year: number, month: number, daysInMonth: number) {
  const durDays = task.period === 'semanal' ? 18 : 7;
  const endObj  = new Date(task.dueDate + 'T00:00:00');
  const startObj = new Date(endObj);
  startObj.setDate(startObj.getDate() - durDays + 1);
  const mStart = new Date(year, month, 1);
  const mEnd   = new Date(year, month, daysInMonth);
  if (endObj < mStart || startObj > mEnd) return null;
  const clampedStart = startObj < mStart ? mStart : startObj;
  const clampedEnd   = endObj   > mEnd   ? mEnd   : endObj;
  const startDay = clampedStart.getDate();
  const endDay   = clampedEnd.getDate();
  return { left: (startDay - 1) * DAY_W, width: (endDay - startDay + 1) * DAY_W, startDay, endDay, durDays };
}

function CronogramaView({ tasks, projects, users }: { tasks: Task[]; projects: Project[]; users: User[] }) {
  const now = new Date();
  const [viewDate, setViewDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const year        = viewDate.getFullYear();
  const month       = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const todayDay    = now.getMonth() === month && now.getFullYear() === year ? now.getDate() : null;
  const monthLabel  = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const LABEL_W = 260;

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
      {/* Nav de mês */}
      <div className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '0.5px solid var(--border)', background: 'var(--bg-subtle)' }}>
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
          <i className="ph-light ph-caret-left" style={{ fontSize: '14px' }} />
        </button>
        <span className="font-label text-[11px] tracking-[0.14em] capitalize"
          style={{ color: 'var(--text-primary)', minWidth: '140px', textAlign: 'center' }}>
          {monthLabel.toUpperCase()}
        </span>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
          <i className="ph-light ph-caret-right" style={{ fontSize: '14px' }} />
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: LABEL_W + daysInMonth * DAY_W + 60 }}>
          {/* Header dias */}
          <div className="flex" style={{ background: 'var(--bg-subtle)', borderBottom: '0.5px solid var(--border)' }}>
            <div className="shrink-0 flex items-center px-4" style={{ width: LABEL_W, borderRight: '0.5px solid var(--border)' }}>
              <span className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>TAREFA</span>
            </div>
            {days.map((d) => {
              const isToday = d === todayDay;
              return (
                <div key={d} className="shrink-0 flex items-center justify-center py-2.5"
                  style={{ width: DAY_W, borderRight: '0.5px solid var(--border-subtle)' }}>
                  <span className="font-num text-[10px] w-5 h-5 flex items-center justify-center rounded-full"
                    style={{ color: isToday ? '#fff' : 'var(--text-muted)', background: isToday ? '#4A11A2' : 'transparent', fontWeight: isToday ? 700 : 400 }}>
                    {d}
                  </span>
                </div>
              );
            })}
            <div className="shrink-0 flex items-center justify-end px-3" style={{ width: 52 }}>
              <span className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>DUR</span>
            </div>
          </div>

          {STATUS_GROUPS.map((group) => {
            const groupTasks = tasks.filter((t) => t.status === group.key);
            if (groupTasks.length === 0) return null;
            return (
              <React.Fragment key={group.key}>
                <div className="flex items-center px-4 py-2"
                  style={{ background: 'var(--bg-subtle)', borderBottom: '0.5px solid var(--border)', borderTop: '0.5px solid var(--border)' }}>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: group.dot }} />
                    <span className="font-label text-[10px] tracking-[0.12em]" style={{ color: 'var(--text-secondary)' }}>
                      {group.label.toUpperCase()}
                    </span>
                    <span className="font-num text-[10px]" style={{ color: 'var(--text-muted)' }}>· {groupTasks.length}</span>
                  </div>
                </div>
                {groupTasks.map((task) => {
                  const project   = projects.find((p) => p.id === task.projectId);
                  const assignees = task.assignedTo.map((id) => users.find((u) => u.id === id)).filter(Boolean) as User[];
                  const bar       = getBarPosition(task, year, month, daysInMonth);
                  const pct       = taskProgress(task);
                  const prio      = PRIORITY_META[task.priority] ?? PRIORITY_META.media;
                  const isDone    = task.status === 'concluida';
                  const isOverdue  = daysUntil(task.dueDate) < 0;
                  const isHighPrio = task.priority === 'alta';
                  const barBg      = isDone ? '#1D9E75'
                    : task.status === 'pendente' ? 'transparent'
                    : isOverdue ? '#EF4444'
                    : isHighPrio ? '#6B28C4'
                    : '#4A11A2';

                  return (
                    <Link key={task.id} to={`/atividades/${task.id}`}
                      className="group flex list-row" style={{ alignItems: 'stretch', minHeight: '52px' }}>
                      <div className="shrink-0 flex items-center gap-2 px-4 py-2"
                        style={{ width: LABEL_W, borderRight: '0.5px solid var(--border)' }}>
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: prio.color }} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold truncate"
                            style={{ fontFamily: 'Geist, system-ui', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                            {task.title}
                          </p>
                          <p className="text-[10px] truncate mt-0.5" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>
                            {project?.name ?? 'Sem cliente'}
                            {assignees.length > 0 && <span> · {assignees.map((u) => u.initials).join(' ')}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="relative flex-1 flex" style={{ height: '52px' }}>
                        {days.map((d) => (
                          <div key={d} className="shrink-0 h-full"
                            style={{ width: DAY_W, borderRight: '0.5px solid var(--border-subtle)', background: d === todayDay ? 'rgba(74,17,162,0.04)' : 'transparent' }} />
                        ))}
                        {todayDay && (
                          <div style={{ position: 'absolute', top: 0, bottom: 0, left: (todayDay - 1) * DAY_W + DAY_W / 2 - 0.5, width: '1px', background: 'rgba(74,17,162,0.35)', pointerEvents: 'none' }} />
                        )}
                        {bar && (
                          <div title={`${bar.startDay} → ${bar.endDay} · ${bar.durDays}d`}
                            style={{
                              position: 'absolute', top: '50%', transform: 'translateY(-50%)',
                              left: bar.left, width: bar.width, height: '20px', borderRadius: '6px',
                              background: barBg,
                              border: task.status === 'pendente' ? `1px solid ${isOverdue ? '#EF4444' : isHighPrio ? '#6B28C4' : 'var(--border)'}` : 'none',
                              overflow: 'hidden',
                            }}>
                            {task.status === 'em_andamento' && pct > 0 && (
                              <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: 'rgba(255,255,255,0.25)', borderRadius: '6px 0 0 6px' }} />
                            )}
                            {bar.width > 60 && (
                              <span style={{
                                position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', paddingLeft: '8px',
                                fontFamily: 'Geist, system-ui', fontSize: '10px', fontWeight: 500,
                                color: task.status === 'pendente' ? 'var(--text-muted)' : 'rgba(255,255,255,0.85)',
                                whiteSpace: 'nowrap',
                              }}>
                                {bar.startDay}–{bar.endDay}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 flex items-center justify-end px-3" style={{ width: 52 }}>
                        <span className="font-num text-[11px]" style={{ color: isOverdue ? '#EF4444' : isHighPrio ? '#9966E0' : 'var(--text-muted)', fontWeight: isOverdue ? 600 : 400 }}>
                          {bar ? `${bar.durDays}d` : '—'}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════
   FORM CRIAÇÃO
════════════════════════════════════ */

interface CreateForm {
  title: string; description: string; projectId: string;
  period: TaskPeriod; parentTaskId: string;
  assignedTo: string[]; priority: TaskPriority; dueDate: string;
}
const emptyCreate: CreateForm = {
  title: '', description: '', projectId: '', period: 'diaria',
  parentTaskId: '', assignedTo: [], priority: 'media', dueDate: '',
};

/* ════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════ */

type ViewMode = 'lista' | 'cronograma';

const STATUS_OPTS: DropdownOption[] = [
  { key: 'all',          label: 'TODOS',        dot: '#9966E0' },
  { key: 'pendente',     label: 'PENDENTES',    dot: '#EF4444' },
  { key: 'em_andamento', label: 'EM ANDAMENTO', dot: '#EF9F27' },
];

const PERIOD_OPTS: DropdownOption[] = [
  { key: 'all',    label: 'TODOS OS TIPOS', dot: '#9966E0' },
  { key: 'diaria', label: 'TASKS',          dot: '#EF9F27' },
  { key: 'semanal',label: 'PROJETOS',       dot: '#9966E0' },
];

export function Activities() {
  const { user }   = useAuth();
  const toast      = useToast();
  const { data: tasks, loading, error, reload } = useTasks();
  const { data: projects } = useProjects();
  const { data: users }    = useUsers();

  const [viewMode, setViewMode]         = useState<ViewMode>('lista');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPeriod, setFilterPeriod] = useState('all');
  const [search, setSearch]             = useState('');
  const [showCreate, setShowCreate]     = useState(false);
  const [createForm, setCreateForm]     = useState<CreateForm>(emptyCreate);
  const [saving, setSaving]             = useState(false);

  const isSocio = user?.role === 'socio';

  /* Filtra sempre excluindo concluídas */
  const filtered = tasks
    .filter((t) => t.status !== 'concluida')
    .filter((t) => filterStatus === 'all' || t.status === filterStatus)
    .filter((t) => filterPeriod === 'all' || taskPeriod(t) === filterPeriod)
    .filter((t) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || projects.find((p) => p.id === t.projectId)?.name.toLowerCase().includes(q);
    });

  const counts = {
    status: {
      all:          tasks.filter((t) => t.status !== 'concluida').length,
      pendente:     tasks.filter((t) => t.status === 'pendente').length,
      em_andamento: tasks.filter((t) => t.status === 'em_andamento').length,
    },
    period: {
      all:    tasks.filter((t) => t.status !== 'concluida').length,
      diaria: tasks.filter((t) => taskPeriod(t) === 'diaria' && t.status !== 'concluida').length,
      semanal:tasks.filter((t) => taskPeriod(t) === 'semanal' && t.status !== 'concluida').length,
    },
  };

  const weeklyOptions = tasks.filter((t) => taskPeriod(t) === 'semanal' && t.projectId === createForm.projectId);

  const handleCheck = async (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await setTaskComplete(task.id, true);
      reload();
      toast.success('Task concluída!');
    } catch {
      toast.error('Erro ao atualizar task.');
    }
  };

  const submitCreate = async () => {
    if (!createForm.title.trim() || createForm.assignedTo.length === 0 || !user || saving) return;
    setSaving(true);
    try {
      await createTask({
        title: createForm.title.trim(), description: createForm.description.trim(),
        projectId: createForm.projectId, assignedTo: createForm.assignedTo,
        priority: createForm.priority, period: createForm.period,
        parentTaskId: createForm.period === 'diaria' ? (createForm.parentTaskId || undefined) : undefined,
        dueDate: createForm.dueDate || todayStr(), createdBy: user.id,
      });
      setShowCreate(false); setCreateForm(emptyCreate); reload();
      toast.success('Task criada.');
    } catch (e) {
      toast.error(`Erro: ${e instanceof Error ? e.message : String(e)}`);
    } finally { setSaving(false); }
  };

  return (
    <Layout
      title="Tasks"
      action={
        isSocio ? (
          <Button variant="primary" size="sm" onClick={() => { setCreateForm({ ...emptyCreate, dueDate: todayStr() }); setShowCreate(true); }}>
            <i className="ph-light ph-plus" style={{ fontSize: '15px' }} />
            <span className="hidden sm:inline">Nova task</span>
          </Button>
        ) : undefined
      }
    >
      {/* ─── TOOLBAR ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Toggle — Lista à esquerda, Cronograma à direita */}
        <div className="inline-flex items-center gap-1 p-1 rounded-lg" style={{ background: 'var(--bg-subtle)', border: '0.5px solid var(--border)' }}>
          {(['lista', 'cronograma'] as ViewMode[]).map((mode) => {
            const active = viewMode === mode;
            const icon   = mode === 'lista' ? 'ph-list' : 'ph-calendar-dots';
            const label  = mode === 'lista' ? 'LISTA'   : 'CRONOGRAMA';
            return (
              <button key={mode} onClick={() => setViewMode(mode)}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-md transition-all duration-150 font-label text-[11px] tracking-[0.10em]"
                style={active
                  ? { background: '#4A11A2', color: '#FFFFFF', boxShadow: '0 0 12px rgba(74,17,162,0.35)' }
                  : { color: 'var(--text-muted)', background: 'transparent' }}>
                <i className={`ph-light ${icon}`} style={{ fontSize: '14px' }} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <i className="ph-light ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ fontSize: '15px', color: 'var(--text-muted)' }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar task…"
            className="w-full pl-8 pr-3 py-2 rounded-md text-sm"
            style={{ background: 'var(--surface)', border: '0.5px solid var(--border)', color: 'var(--text-primary)', fontFamily: 'Geist, system-ui', outline: 'none' }}
            onFocus={(e) => (e.target.style.borderColor = '#4A11A2')}
            onBlur={(e)  => (e.target.style.borderColor = 'var(--border)')} />
        </div>

        <FilterDropdown value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTS} counts={counts.status} />
        <FilterDropdown value={filterPeriod} onChange={setFilterPeriod} options={PERIOD_OPTS} counts={counts.period} minWidth="155px" />
      </div>

      {/* ─── CONTEÚDO ─── */}
      {loading ? (
        <Loading label="Carregando tasks…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <i className="ph-light ph-check-circle" style={{ fontSize: '40px', color: 'var(--text-muted)' }} />
          <p className="font-label text-[11px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>NENHUMA TASK ENCONTRADA</p>
        </div>
      ) : viewMode === 'lista' ? (
        <ListaView tasks={filtered} projects={projects} users={users} onCheck={handleCheck} />
      ) : (
        <CronogramaView tasks={filtered} projects={projects} users={users} />
      )}

      {/* ─── MODAL CRIAR ─── */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nova task" size="md"
        footer={
          <>
            <Button variant="tertiary" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button variant="primary" onClick={submitCreate} disabled={!createForm.title.trim() || createForm.assignedTo.length === 0 || saving}>
              {saving ? 'Criando…' : 'Criar task'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField label="Título" required hint={`${createForm.title.length}/30`}>
            <Input value={createForm.title} onChange={(e) => setCreateForm((f) => ({ ...f, title: e.target.value.slice(0, 30) }))} placeholder="Ex.: Ajustar layout do header" autoFocus maxLength={30} />
          </FormField>
          <FormField label="Descrição" hint={`${createForm.description.length}/2000`}>
            <Textarea value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value.slice(0, 2000) }))} rows={2} placeholder="Descreva o que precisa ser feito..." maxLength={2000} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Tipo">
              <Select value={createForm.period} onChange={(e) => setCreateForm((f) => ({ ...f, period: e.target.value as TaskPeriod, parentTaskId: '' }))}>
                <option value="diaria">Task</option>
                <option value="semanal">Projeto</option>
              </Select>
            </FormField>
            <FormField label="Cliente">
              <Select value={createForm.projectId} onChange={(e) => setCreateForm((f) => ({ ...f, projectId: e.target.value, parentTaskId: '' }))}>
                <option value="">Sem cliente</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </FormField>
          </div>
          {createForm.period === 'diaria' && createForm.projectId && weeklyOptions.length > 0 && (
            <FormField label="Vincular a um projeto" hint="Opcional">
              <Select value={createForm.parentTaskId} onChange={(e) => setCreateForm((f) => ({ ...f, parentTaskId: e.target.value }))}>
                <option value="">Nenhum</option>
                {weeklyOptions.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
              </Select>
            </FormField>
          )}
          <FormField label="Responsáveis" required hint="Até 2 responsáveis">
            <div className="flex gap-2 flex-wrap pt-1">
              {users.map((u) => {
                const sel = createForm.assignedTo.includes(u.id);
                const dis = !sel && createForm.assignedTo.length >= 2;
                return (
                  <button key={u.id} type="button" disabled={dis}
                    onClick={() => setCreateForm((f) => ({ ...f, assignedTo: sel ? f.assignedTo.filter((x) => x !== u.id) : [...f.assignedTo, u.id] }))}
                    className={`chip flex items-center gap-2 px-3 py-2 rounded-md text-sm ${sel ? 'chip-selected' : ''}`}>
                    <Avatar user={u} size={24} fontSize={10} fallbackClassName="" />
                    {u.name}
                  </button>
                );
              })}
            </div>
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Prioridade">
              <Select value={createForm.priority} onChange={(e) => setCreateForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </Select>
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={createForm.dueDate} onChange={(e) => setCreateForm((f) => ({ ...f, dueDate: e.target.value }))} />
            </FormField>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
