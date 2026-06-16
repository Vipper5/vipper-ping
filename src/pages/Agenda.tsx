import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, ArrowLeft, Pencil, Trash2, MapPin, Link2, FileText, StickyNote, ExternalLink, Clock, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { TimePicker } from '../components/ui/TimePicker';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, useEvents, useProjects, useUsers } from '../lib/hooks';
import { useToast } from '../contexts/ToastContext';
import { Avatar } from '../components/ui/Avatar';
import { createTask, createEvent, updateTask, updateEvent, deleteEvent, deleteTask, updateProject, addProjectNote } from '../lib/api';
import { Task, AgendaEvent, TaskPriority } from '../mocks/data';

const WEEKDAYS = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];

type Category = 'entrega' | 'tarefa' | 'reuniao' | 'lembrete' | 'conclusao';

/* ── Cores alinhadas ao design doc ─────────────────────────────────────────
   Reunião   → Aviso   #EF9F27
   Lembrete  → Sucesso #1D9E75
   Task      → Info    #378ADD
   Entrega   → Roxo    #9966E0
   Conclusão → Erro    #EF4444
─────────────────────────────────────────────────────────────────────────── */
const CATEGORY: Record<Category, { label: string; color: string }> = {
  reuniao:  { label: 'Reunião',   color: '#EF9F27' },
  lembrete: { label: 'Lembrete',  color: '#1D9E75' },
  tarefa:   { label: 'Task',      color: '#378ADD' },
  entrega:  { label: 'Entrega',   color: '#9966E0' },
  conclusao:{ label: 'Conclusão', color: '#EF4444' },
};

const LEGEND_CATS: Category[] = ['reuniao', 'lembrete', 'tarefa', 'entrega'];

const CATEGORY_PRIORITY: Record<Category, number> = { reuniao: 0, lembrete: 1, conclusao: 2, entrega: 3, tarefa: 4 };

function pad(n: number) { return String(n).padStart(2, '0'); }
function ymd(d: Date)   { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
const TODAY = ymd(new Date());

function shortDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
}
function shortDateLabel(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  const dow = d.toLocaleDateString('pt-BR', { weekday: 'short' });
  const day = d.getDate();
  const mon = d.toLocaleDateString('pt-BR', { month: 'short' });
  return `${day} ${mon}`;
}
function tint(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

interface CalItem {
  id: string; title: string; category: Category; color: string; date: string;
  to?: string; task?: Task; event?: AgendaEvent; projectId?: string;
}

interface NewForm {
  type: 'tarefa' | 'entrega' | 'reuniao' | 'lembrete' | 'conclusao';
  title: string; members: string[]; priority: TaskPriority; projectId: string;
  parentTaskId: string; time: string; description: string; note: string; location: string; link: string;
}
const emptyForm: NewForm = {
  type: 'tarefa', title: '', members: [], priority: 'media', projectId: '', parentTaskId: '',
  time: '', description: '', note: '', location: '', link: '',
};

/* ── Componente de item do sidebar ──────────────────────────────────────── */
function SidebarItem({ it, onClick }: { it: CalItem; onClick: () => void }) {
  const isDone = it.task?.status === 'concluida';
  return (
    <button onClick={onClick} className="w-full text-left flex items-stretch gap-0 rounded-md overflow-hidden transition-colors group"
      style={{ background: 'var(--bg-subtle)' }}
      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = tint(it.color, 0.08))}
      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)')}>
      <span className="w-[3px] shrink-0" style={{ background: it.color }} />
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <p className="text-sm font-medium truncate"
          style={{ fontFamily: 'Geist, system-ui', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
          {it.event?.time ? <span className="font-num text-[11px] mr-1.5" style={{ color: it.color }}>{it.event.time}</span> : null}
          {it.title.replace('Conclusão: ', '')}
        </p>
        <p className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
          {CATEGORY[it.category].label}
          {it.task?.assignedTo?.length ? ` · ${it.task.assignedTo.length} resp.` : ''}
        </p>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════════════════════════════════════ */
export function Agenda() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: tasks, reload: reloadTasks } = useTasks();
  const { data: events, reload: reloadEvents } = useEvents();
  const { data: projects, reload: reloadProjects } = useProjects();
  const { data: users } = useUsers();
  const [saving, setSaving] = useState(false);

  const [cursor, setCursor] = useState(() => {
    const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string>(TODAY);
  const [sidebarTab, setSidebarTab] = useState<'day' | 'add'>('day');
  const [detail, setDetail] = useState<CalItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewForm>(emptyForm);
  const [filterMember, setFilterMember] = useState<string>('all');

  const isSocio = user?.role === 'socio';
  const year  = cursor.getFullYear();
  const month = cursor.getMonth();

  const getUserName  = (uid: string) => users.find((u) => u.id === uid)?.name ?? uid;
  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name ?? '';

  /* ── Monta itens ── */
  const items: CalItem[] = [];
  tasks.forEach((t) => {
    if (filterMember !== 'all' && !t.assignedTo.includes(filterMember)) return;
    const cat: Category = t.period === 'semanal' ? 'entrega' : 'tarefa';
    items.push({ id: t.id, title: t.title, category: cat, color: CATEGORY[cat].color, date: t.dueDate, to: `/atividades/${t.id}`, task: t, projectId: t.projectId });
  });
  events.forEach((e) => {
    if (filterMember !== 'all' && !e.members.includes(filterMember)) return;
    items.push({ id: e.id, title: e.title, category: e.category, color: CATEGORY[e.category].color, date: e.date, event: e });
  });
  projects.forEach((p) => {
    if (p.status === 'Concluído' || !p.endDate) return;
    items.push({ id: `proj-${p.id}`, title: `Conclusão: ${p.name}`, category: 'conclusao', color: CATEGORY.conclusao.color, date: p.endDate, to: `/projetos/${p.id}`, projectId: p.id });
  });

  const byDay: Record<string, CalItem[]> = {};
  items.forEach((it) => { (byDay[it.date] = byDay[it.date] || []).push(it); });
  Object.keys(byDay).forEach((d) => byDay[d].sort((a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]));

  /* ── Grid: 42 células ── */
  const firstCell = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const cells: Date[] = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(firstCell); d.setDate(firstCell.getDate() + i); return d;
  });

  /* ── Próximos eventos (a partir de amanhã) ── */
  const tomorrowStr = ymd(new Date(new Date().setDate(new Date().getDate() + 1)));
  const upcoming = items
    .filter((it) => it.date >= tomorrowStr)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  /* ── Handlers ── */
  const goToday = () => {
    const n = new Date();
    setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
    setSelectedDay(TODAY);
    setSidebarTab('day'); setDetail(null);
  };

  const openDay = (key: string) => {
    setSelectedDay(key); setSidebarTab('day'); setDetail(null); setEditingId(null); setForm(emptyForm);
  };

  const goCreate = () => { setEditingId(null); setForm(emptyForm); setDetail(null); setSidebarTab('add'); };
  const goList   = () => { setDetail(null); setEditingId(null); setSidebarTab('day'); };

  const canManage = (it: CalItem) => {
    if (it.category === 'conclusao') return false;
    if (isSocio) return true;
    if (it.task)  return it.task.assignedTo.includes(user?.id ?? '');
    if (it.event) return it.event.members.includes(user?.id ?? '');
    return false;
  };

  const openEdit = (it: CalItem) => {
    if (it.task) {
      setForm({ type: it.task.period === 'semanal' ? 'entrega' : 'tarefa', title: it.task.title, members: it.task.assignedTo, priority: it.task.priority, projectId: it.task.projectId, parentTaskId: it.task.parentTaskId ?? '', time: '', description: it.task.description ?? '', note: it.task.note ?? '', location: '', link: '' });
      setEditingId(it.task.id); setSidebarTab('add');
    } else if (it.event) {
      setForm({ type: it.event.category, title: it.event.title, members: it.event.members, priority: 'media', projectId: '', parentTaskId: '', time: it.event.time ?? '', description: it.event.description ?? '', note: it.event.note ?? '', location: it.event.location ?? '', link: it.event.link ?? '' });
      setEditingId(it.event.id); setSidebarTab('add');
    }
  };

  const removeItem = async (it: CalItem) => {
    if (saving) return;
    setSaving(true);
    try {
      if (it.task)  { await deleteTask(it.task.id);  reloadTasks(); }
      if (it.event) { await deleteEvent(it.event.id); reloadEvents(); }
      setSidebarTab('day'); setDetail(null);
    } finally { setSaving(false); }
  };

  const toggleMember = (uid: string) => setForm((f) => ({
    ...f, members: f.members.includes(uid) ? f.members.filter((x) => x !== uid) : [...f.members, uid],
  }));

  const isTaskType = form.type === 'tarefa' || form.type === 'entrega';

  const saveEntry = async () => {
    if (!form.title.trim() || !user || saving) return;
    if (form.type !== 'conclusao' && form.members.length === 0) return;
    if (form.type === 'conclusao' && !form.projectId) return;
    setSaving(true);
    try {
      if (isTaskType) {
        if (editingId) {
          await updateTask(editingId, { title: form.title.trim(), description: form.description.trim(), note: form.note.trim(), projectId: form.projectId, assignedTo: form.members.slice(0, 2), priority: form.priority, dueDate: selectedDay });
        } else {
          await createTask({ title: form.title.trim(), description: form.description.trim(), note: form.note.trim(), projectId: form.projectId, parentTaskId: form.parentTaskId || undefined, assignedTo: form.members.slice(0, 2), priority: form.priority, period: form.type === 'entrega' ? 'semanal' : 'diaria', dueDate: selectedDay, createdBy: user.id });
        }
        reloadTasks();
      } else if (form.type === 'conclusao') {
        const proj = projects.find((p) => p.id === form.projectId);
        if (!proj) return;
        await updateProject(form.projectId, { name: proj.name, client: proj.client, status: 'Concluído', stack: proj.stack, startDate: proj.startDate, endDate: selectedDay, description: proj.description, responsibles: proj.responsibles });
        const noteText = [form.title.trim(), form.description.trim()].filter(Boolean).join('\n\n');
        if (noteText) await addProjectNote(form.projectId, noteText, user.id);
        toast.success(`${proj.name} marcado como concluído!`);
        reloadProjects();
      } else {
        const payload = { title: form.title.trim(), date: selectedDay, category: form.type as 'reuniao' | 'lembrete', time: form.time || undefined, members: form.members, createdBy: user.id, description: form.description.trim() || undefined, note: form.note.trim() || undefined, location: form.location.trim() || undefined, link: form.link.trim() || undefined };
        if (editingId) await updateEvent(editingId, payload);
        else await createEvent(payload);
        reloadEvents();
      }
      setForm(emptyForm); setEditingId(null); setDetail(null); setSidebarTab('day');
    } finally { setSaving(false); }
  };

  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dayItems   = byDay[selectedDay] ?? [];
  const selIsToday = selectedDay === TODAY;

  /* ── Render ── */
  return (
    <Layout
      title="Agenda"
      action={
        <div className="flex items-center gap-1.5">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
            <ChevronLeft size={16} />
          </button>
          <span className="font-label text-[12px] tracking-[0.10em] capitalize px-1" style={{ color: 'var(--text-primary)', minWidth: '110px', textAlign: 'center' }}>
            {monthLabel.toUpperCase()}
          </span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1.5 rounded-md transition-colors" style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
            <ChevronRight size={16} />
          </button>
          <Button variant="secondary" size="sm" onClick={goToday}>Hoje</Button>
        </div>
      }
    >
      {/* ── Filtros + legenda ── */}
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <button onClick={() => setFilterMember('all')}
            className="px-3 py-1.5 rounded-md font-label text-[10px] tracking-[0.10em] transition-all"
            style={filterMember === 'all' ? { background: '#4A11A2', color: '#fff' } : { color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
            Todos
          </button>
          {users.map((u) => (
            <button key={u.id} onClick={() => setFilterMember(u.id)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md font-label text-[10px] tracking-[0.10em] transition-all"
              style={filterMember === u.id ? { background: '#4A11A2', color: '#fff' } : { color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}>
              <Avatar user={u} size={16} fontSize={7} fallbackClassName="" />
              {u.name.split(' ')[0]}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {LEGEND_CATS.map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: CATEGORY[c].color }} />
              <span className="font-label text-[10px] tracking-[0.08em]" style={{ color: 'var(--text-muted)' }}>{CATEGORY[c].label}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Layout principal: calendário + sidebar ── */}
      <div className="flex gap-4 items-start">
        {/* CALENDÁRIO */}
        <div className="flex-1 min-w-0 rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          {/* Header dias da semana */}
          <div className="grid grid-cols-7" style={{ background: 'var(--bg-subtle)', borderBottom: '0.5px solid var(--border)' }}>
            {WEEKDAYS.map((w, i) => (
              <div key={w} className="py-2.5 text-center font-label text-[10px] tracking-[0.14em]"
                style={{ color: i === 0 || i === 6 ? '#9966E0' : 'var(--text-muted)' }}>
                {w}
              </div>
            ))}
          </div>

          {/* Células — altura fixa e igual para todas */}
          <div className="grid grid-cols-7" style={{ gridAutoRows: '100px' }}>
            {cells.map((d, i) => {
              const key     = ymd(d);
              const inMonth = d.getMonth() === month;
              const isToday = key === TODAY;
              const isSel   = key === selectedDay;
              const weekend = d.getDay() === 0 || d.getDay() === 6;
              const dItems  = byDay[key] ?? [];
              const shown   = dItems.slice(0, 2);
              const extra   = dItems.length - shown.length;

              return (
                <button key={i} onClick={() => openDay(key)}
                  className="relative text-left flex flex-col p-2 transition-colors focus:outline-none overflow-hidden"
                  style={{
                    borderRight: '0.5px solid var(--border)',
                    borderBottom: '0.5px solid var(--border)',
                    background: isSel
                      ? 'rgba(74,17,162,0.10)'
                      : isToday
                      ? 'rgba(74,17,162,0.06)'
                      : !inMonth
                      ? 'rgba(0,0,0,0.28)'
                      : weekend
                      ? 'rgba(0,0,0,0.14)'
                      : 'transparent',
                  }}
                  onMouseEnter={(e) => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'rgba(74,17,162,0.05)'; }}
                  onMouseLeave={(e) => {
                    const bg = isSel ? 'rgba(74,17,162,0.10)' : isToday ? 'rgba(74,17,162,0.06)' : !inMonth ? 'rgba(0,0,0,0.28)' : weekend ? 'rgba(0,0,0,0.14)' : 'transparent';
                    (e.currentTarget as HTMLElement).style.background = bg;
                  }}>

                  {/* Anel de seleção */}
                  {isSel && <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#4A11A2]/50" />}
                  {isToday && !isSel && <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-[#4A11A2]/25" />}

                  {/* Número do dia */}
                  <span className={`font-num text-[11px] mb-1.5 w-5 h-5 flex items-center justify-center rounded-full shrink-0`}
                    style={{
                      color: isToday ? '#fff' : weekend && inMonth ? '#9966E0' : inMonth ? 'var(--text-secondary)' : 'var(--text-muted)',
                      background: isToday ? '#4A11A2' : 'transparent',
                      fontWeight: isToday ? 700 : 400,
                      opacity: inMonth ? 1 : 0.4,
                    }}>
                    {d.getDate()}
                  </span>

                  {/* Chips de evento */}
                  <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                    {shown.map((it) => (
                      <div key={it.id} className="flex items-center gap-1 px-1 py-0.5 rounded text-[10px] leading-tight overflow-hidden"
                        style={{ background: tint(it.color, 0.12) }}>
                        <span className="w-1 h-1 rounded-full shrink-0" style={{ background: it.color }} />
                        <span className="truncate font-medium" style={{ color: it.color, fontFamily: 'Geist, system-ui' }}>
                          {it.event?.time ? `${it.event.time} ` : ''}{it.title.replace('Conclusão: ', '')}
                        </span>
                      </div>
                    ))}
                    {extra > 0 && (
                      <span className="font-label text-[9px] tracking-[0.06em] pl-1" style={{ color: 'var(--text-muted)' }}>+{extra} mais</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* SIDEBAR FIXA */}
        <div className="w-64 shrink-0 rounded-lg overflow-hidden flex flex-col" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)', minHeight: '640px' }}>
          {sidebarTab === 'day' && !detail && (
            <>
              {/* Header do dia */}
              <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <div>
                  <p className="font-label text-[10px] tracking-[0.12em]" style={{ color: 'var(--text-muted)' }}>
                    {selIsToday ? 'HOJE' : shortDate(selectedDay).toUpperCase().split(',')[0]}
                  </p>
                  <p className="font-semibold text-[15px] mt-0.5 capitalize" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-primary)' }}>
                    {new Date(selectedDay + 'T00:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
                    {dayItems.length === 0 ? 'Nenhum evento' : `${dayItems.length} evento${dayItems.length !== 1 ? 's' : ''}`}
                  </p>
                </div>
                {isSocio && (
                  <button onClick={goCreate} className="p-1.5 rounded-md transition-colors"
                    style={{ color: 'var(--text-muted)', background: 'var(--bg-subtle)' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = '#4A11A2'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
                    <Plus size={14} />
                  </button>
                )}
              </div>

              {/* Eventos do dia */}
              <div className="flex-1 overflow-y-auto">
                {dayItems.length > 0 && (
                  <div className="p-3 flex flex-col gap-1.5">
                    {dayItems.map((it) => (
                      <SidebarItem key={it.id} it={it} onClick={() => setDetail(it)} />
                    ))}
                  </div>
                )}

                {/* Próximos eventos */}
                {upcoming.length > 0 && (
                  <div className="px-4 pb-4">
                    <p className="font-label text-[9px] tracking-[0.18em] mb-2 pt-2" style={{ color: 'var(--text-muted)', borderTop: dayItems.length > 0 ? '0.5px solid var(--border)' : 'none' }}>
                      PRÓXIMOS
                    </p>
                    <div className="flex flex-col gap-2">
                      {upcoming.map((it) => (
                        <div key={it.id} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.color }} />
                          <span className="text-[11px] flex-1 truncate" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>
                            {it.title.replace('Conclusão: ', '')}
                          </span>
                          <span className="font-label text-[9px] tracking-[0.06em] shrink-0" style={{ color: 'var(--text-muted)' }}>
                            {shortDateLabel(it.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* DETALHE DO ITEM */}
          {sidebarTab === 'day' && detail && (
            <div className="flex flex-col flex-1">
              <div className="px-4 pt-3 pb-3 flex items-center gap-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <button onClick={() => setDetail(null)} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                  <ArrowLeft size={14} />
                </button>
                <span className="font-label text-[10px] tracking-[0.10em]" style={{ color: 'var(--text-muted)' }}>DETALHE</span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-label text-[10px] tracking-[0.08em]"
                    style={{ background: tint(detail.color, 0.14), color: detail.color }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: detail.color }} />
                    {CATEGORY[detail.category].label}
                  </span>
                  <h3 className="mt-2 text-sm font-semibold leading-snug" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-primary)' }}>
                    {detail.title.replace('Conclusão: ', '')}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {detail.event?.time && <span className="flex items-center gap-1 font-num text-[11px]" style={{ color: 'var(--text-muted)' }}><Clock size={11} />{detail.event.time}</span>}
                    {detail.task && <StatusBadge status={detail.task.status} />}
                  </div>
                </div>

                {(detail.task?.description || detail.event?.description) && (
                  <div>
                    <p className="flex items-center gap-1 font-label text-[9px] tracking-[0.12em] mb-1" style={{ color: 'var(--text-muted)' }}><FileText size={10} /> DESCRIÇÃO</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>{detail.task?.description || detail.event?.description}</p>
                  </div>
                )}
                {(detail.task?.note || detail.event?.note) && (
                  <div className="p-2.5 rounded" style={{ background: 'var(--bg-subtle)', borderLeft: `2px solid #9966E0` }}>
                    <p className="flex items-center gap-1 font-label text-[9px] tracking-[0.12em] mb-1" style={{ color: 'var(--text-muted)' }}><StickyNote size={10} /> NOTA</p>
                    <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>{detail.task?.note || detail.event?.note}</p>
                  </div>
                )}
                {detail.event?.location && (
                  <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><MapPin size={12} style={{ color: '#9966E0' }} />{detail.event.location}</div>
                )}
                {detail.event?.link && (
                  <a href={detail.event.link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs break-all transition-colors" style={{ color: '#9966E0' }}>
                    <Link2 size={12} />{detail.event.link}
                  </a>
                )}
                {detail.task?.projectId && getProjectName(detail.task.projectId) && (
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Cliente: <Link to={`/projetos/${detail.task.projectId}`} className="transition-colors" style={{ color: '#9966E0' }}>{getProjectName(detail.task.projectId)}</Link>
                  </div>
                )}
                {((detail.task?.assignedTo.length ?? 0) > 0 || (detail.event?.members.length ?? 0) > 0) && (
                  <div>
                    <p className="font-label text-[9px] tracking-[0.12em] mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      {detail.task ? 'RESPONSÁVEIS' : 'PARTICIPANTES'}
                    </p>
                    <div className="space-y-1.5">
                      {(detail.task?.assignedTo ?? detail.event?.members ?? []).map((mid) => {
                        const u = users.find((x) => x.id === mid);
                        return u ? (
                          <div key={mid} className="flex items-center gap-2">
                            <Avatar user={u} size={20} fontSize={8} />
                            <span className="text-xs" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>{u.name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 flex items-center justify-between gap-2" style={{ borderTop: '0.5px solid var(--border)' }}>
                {canManage(detail) && (
                  <button onClick={() => removeItem(detail)} disabled={saving}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{ border: '0.5px solid #EF4444', color: '#EF4444' }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.10)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                    <Trash2 size={12} /> Excluir
                  </button>
                )}
                <div className="flex items-center gap-1.5 ml-auto">
                  {detail.to && detail.task && (
                    <Link to={detail.to} className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors" style={{ color: '#9966E0' }}>
                      <ExternalLink size={12} /> Abrir
                    </Link>
                  )}
                  {canManage(detail) && (
                    <button onClick={() => openEdit(detail)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all"
                      style={{ border: '0.5px solid #4A11A2', color: '#9966E0' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(74,17,162,0.10)'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
                      <Pencil size={12} /> Editar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* FORMULÁRIO */}
          {sidebarTab === 'add' && (
            <div className="flex flex-col flex-1">
              <div className="px-4 pt-3 pb-3 flex items-center gap-2" style={{ borderBottom: '0.5px solid var(--border)' }}>
                <button onClick={goList} className="p-1 rounded transition-colors" style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = '#4A11A2')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--text-muted)')}>
                  <ArrowLeft size={14} />
                </button>
                <span className="font-label text-[10px] tracking-[0.10em]" style={{ color: 'var(--text-muted)' }}>
                  {editingId ? 'EDITAR' : 'NOVO EVENTO'}
                </span>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!editingId && (
                  <FormField label="Tipo">
                    <div className="grid grid-cols-2 gap-1.5">
                      {(['tarefa', 'entrega', 'reuniao', 'lembrete', 'conclusao'] as const).map((tp) => {
                        const sel = form.type === tp;
                        const color = CATEGORY[tp].color;
                        return (
                          <button key={tp} type="button"
                            onClick={() => setForm((f) => ({ ...f, type: tp, title: tp === 'conclusao' ? '' : f.title }))}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium transition-all"
                            style={sel ? { border: `0.5px solid ${color}`, background: tint(color, 0.12), color } : { border: '0.5px solid var(--border)', color: 'var(--text-muted)' }}>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                            {CATEGORY[tp].label}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}

                {form.type === 'conclusao' && (
                  <FormField label="Cliente" required>
                    <Select value={form.projectId} onChange={(e) => { const pid = e.target.value; const proj = projects.find((p) => p.id === pid); setForm((f) => ({ ...f, projectId: pid, title: proj?.name ?? '' })); }}>
                      <option value="">Selecione...</option>
                      {projects.filter((p) => p.status !== 'Concluído').map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </Select>
                  </FormField>
                )}

                <FormField label="Título" required>
                  <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 30) }))} maxLength={30} autoFocus
                    placeholder={form.type === 'reuniao' ? 'Assunto...' : form.type === 'lembrete' ? 'Lembrete...' : 'Título...'} />
                </FormField>

                {form.type !== 'conclusao' && (
                  <FormField label={isTaskType ? 'Responsáveis' : 'Participantes'} hint={isTaskType ? 'Até 2' : undefined}>
                    <div className="flex gap-1.5 flex-wrap">
                      {users.map((u) => {
                        const sel = form.members.includes(u.id);
                        const dis = isTaskType && !sel && form.members.length >= 2;
                        return (
                          <button key={u.id} type="button" disabled={dis}
                            onClick={() => toggleMember(u.id)}
                            className="flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all"
                            style={sel ? { background: '#4A11A2', color: '#fff' } : { background: 'var(--bg-subtle)', color: 'var(--text-secondary)' }}>
                            <Avatar user={u} size={16} fontSize={7} fallbackClassName="" />
                            {u.name.split(' ')[0]}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}

                {isTaskType && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <FormField label="Prioridade">
                        <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                          <option value="baixa">Baixa</option>
                          <option value="media">Média</option>
                          <option value="alta">Alta</option>
                        </Select>
                      </FormField>
                      <FormField label="Cliente">
                        <Select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value, parentTaskId: '' }))}>
                          <option value="">Nenhum</option>
                          {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                        </Select>
                      </FormField>
                    </div>
                    <FormField label="Descrição">
                      <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 2000) }))} maxLength={2000} rows={2} placeholder="Descreva..." />
                    </FormField>
                  </>
                )}

                {(form.type === 'reuniao' || form.type === 'lembrete') && (
                  <FormField label="Horário">
                    <TimePicker value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} />
                  </FormField>
                )}
                {form.type === 'reuniao' && (
                  <>
                    <FormField label="Local">
                      <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Meet, Teams..." />
                    </FormField>
                    <FormField label="Link">
                      <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." className="font-mono" />
                    </FormField>
                  </>
                )}
                {(form.type === 'conclusao' || form.type === 'lembrete') && (
                  <FormField label="Descrição" hint="Opcional">
                    <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value.slice(0, 2000) }))} maxLength={2000} rows={3} placeholder="Observações..." />
                  </FormField>
                )}
              </div>
              <div className="p-3 flex gap-2" style={{ borderTop: '0.5px solid var(--border)' }}>
                <Button variant="tertiary" onClick={goList} className="flex-1">Cancelar</Button>
                <Button variant="primary" onClick={saveEntry} className="flex-1"
                  disabled={!form.title.trim() || (form.type !== 'conclusao' && form.members.length === 0) || (form.type === 'conclusao' && !form.projectId) || saving}>
                  {saving ? 'Salvando…' : editingId ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
