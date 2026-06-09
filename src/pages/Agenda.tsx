import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Plus, X, ArrowLeft, Pencil, Trash2, MapPin, Link2, FileText, StickyNote, ExternalLink, Clock, Users } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { TimePicker } from '../components/ui/TimePicker';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useTasks, useEvents, useProjects, useUsers } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import { createTask, createEvent, updateTask, updateEvent, deleteEvent, deleteTask } from '../lib/api';
import { Task, AgendaEvent, TaskPriority } from '../mocks/data';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Categorias da agenda — cada uma com sua cor
type Category = 'entrega' | 'tarefa' | 'reuniao' | 'lembrete' | 'conclusao';
const CATEGORY: Record<Category, { label: string; color: string }> = {
  entrega: { label: 'Projeto', color: '#8637CC' },
  tarefa: { label: 'Task', color: '#5294E6' },
  reuniao: { label: 'Reunião', color: '#F5AE39' },
  lembrete: { label: 'Lembrete', color: '#15BB77' },
  conclusao: { label: 'Conclusão de cliente', color: '#E54056' },
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const TODAY = ymd(new Date());

function fullDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}
function tint(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

// item unificado do calendário
interface CalItem {
  id: string;
  title: string;
  category: Category;
  color: string;
  date: string;
  to?: string;
  task?: Task;
  event?: AgendaEvent;
  projectId?: string;
}

interface NewForm {
  type: 'tarefa' | 'entrega' | 'reuniao' | 'lembrete';
  title: string;
  members: string[];
  priority: TaskPriority;
  projectId: string;
  time: string;
  description: string;
  note: string;
  location: string;
  link: string;
}
const emptyForm: NewForm = {
  type: 'tarefa', title: '', members: [], priority: 'media', projectId: '', time: '',
  description: '', note: '', location: '', link: '',
};

export function Agenda() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const { data: tasks, reload: reloadTasks } = useTasks();
  const { data: events, reload: reloadEvents } = useEvents();
  const { data: projects } = useProjects();
  const { data: users } = useUsers();
  const [saving, setSaving] = useState(false);
  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  // Abas do painel: "agenda" (lista/detalhe do dia) e "add" (novo/editar).
  const [dayTab, setDayTab] = useState<'agenda' | 'add'>('agenda');
  const [detail, setDetail] = useState<CalItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NewForm>(emptyForm);

  const isSocio = user?.role === 'socio';

  // Fecha o painel lateral do dia com Esc.
  useEffect(() => {
    if (selectedDay === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectedDay(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedDay]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const getUserName = (uid: string) => users.find((u) => u.id === uid)?.name ?? uid;
  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name ?? '';

  // monta todos os itens do calendário
  const items: CalItem[] = [];
  tasks.forEach((t) => {
    const category: Category = t.period === 'semanal' ? 'entrega' : 'tarefa';
    items.push({ id: t.id, title: t.title, category, color: CATEGORY[category].color, date: t.dueDate, to: `/atividades/${t.id}`, task: t, projectId: t.projectId });
  });
  events.forEach((e) => {
    items.push({ id: e.id, title: e.title, category: e.category, color: CATEGORY[e.category].color, date: e.date, event: e });
  });
  projects.forEach((p) => {
    if (p.status === 'Concluído' || !p.endDate) return;
    items.push({ id: `proj-${p.id}`, title: `Conclusão: ${p.name}`, category: 'conclusao', color: CATEGORY.conclusao.color, date: p.endDate, to: `/projetos/${p.id}`, projectId: p.id });
  });

  // agrupa por dia
  const byDay: Record<string, CalItem[]> = {};
  items.forEach((it) => { (byDay[it.date] = byDay[it.date] || []).push(it); });

  const firstCell = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    cells.push(d);
  }

  const goToday = () => setCursor(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const prevMonth = () => setCursor(new Date(year, month - 1, 1));
  const nextMonth = () => setCursor(new Date(year, month + 1, 1));

  const openDay = (d: string) => {
    setSelectedDay(d);
    setDayTab('agenda');
    setDetail(null);
    setEditingId(null);
    setForm(emptyForm);
  };
  const closeDay = () => setSelectedDay(null);

  // Alterna para a aba de criação (limpa qualquer edição/detalhe em andamento).
  const goCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDetail(null);
    setDayTab('add');
  };
  // Volta para a lista do dia.
  const goList = () => {
    setDetail(null);
    setEditingId(null);
    setDayTab('agenda');
  };

  // Item clicável → abre o detalhe (tasks/eventos). Conclusões de cliente continuam como link.
  const openDetail = (it: CalItem) => {
    setDetail(it);
    setDayTab('agenda');
  };

  // Permissão: sócio edita qualquer agendamento; demais editam os que participam.
  const canManage = (it: CalItem): boolean => {
    if (it.category === 'conclusao') return false;
    if (isSocio) return true;
    if (it.task) return it.task.assignedTo.includes(user?.id ?? '');
    if (it.event) return it.event.members.includes(user?.id ?? '');
    return false;
  };

  const openEdit = (it: CalItem) => {
    if (it.task) {
      setForm({
        type: it.task.period === 'semanal' ? 'entrega' : 'tarefa',
        title: it.task.title,
        members: it.task.assignedTo,
        priority: it.task.priority,
        projectId: it.task.projectId,
        time: '',
        description: it.task.description ?? '',
        note: it.task.note ?? '',
        location: '',
        link: '',
      });
      setEditingId(it.task.id);
      setDayTab('add');
    } else if (it.event) {
      setForm({
        type: it.event.category,
        title: it.event.title,
        members: it.event.members,
        priority: 'media',
        projectId: '',
        time: it.event.time ?? '',
        description: it.event.description ?? '',
        note: it.event.note ?? '',
        location: it.event.location ?? '',
        link: it.event.link ?? '',
      });
      setEditingId(it.event.id);
      setDayTab('add');
    }
  };

  const removeItem = async (it: CalItem) => {
    if (saving) return;
    setSaving(true);
    try {
      if (it.task) { await deleteTask(it.task.id); reloadTasks(); }
      else if (it.event) { await deleteEvent(it.event.id); reloadEvents(); }
      setDayTab('agenda');
      setDetail(null);
    } finally {
      setSaving(false);
    }
  };

  const toggleMember = (uid: string) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(uid)
        ? f.members.filter((x) => x !== uid)
        : [...f.members, uid],
    }));
  };

  const isTaskType = form.type === 'tarefa' || form.type === 'entrega';

  const saveEntry = async () => {
    if (!form.title.trim() || form.members.length === 0 || !user || !selectedDay || saving) return;
    setSaving(true);
    try {
      if (isTaskType) {
        if (editingId) {
          await updateTask(editingId, {
            title: form.title.trim(),
            description: form.description.trim(),
            note: form.note.trim(),
            projectId: form.projectId,
            assignedTo: form.members.slice(0, 2),
            priority: form.priority,
            dueDate: selectedDay,
          });
        } else {
          await createTask({
            title: form.title.trim(),
            description: form.description.trim(),
            note: form.note.trim(),
            projectId: form.projectId,
            assignedTo: form.members.slice(0, 2),
            priority: form.priority,
            period: form.type === 'entrega' ? 'semanal' : 'diaria',
            dueDate: selectedDay,
            createdBy: user.id,
          });
        }
        reloadTasks();
      } else {
        const payload = {
          title: form.title.trim(),
          date: selectedDay,
          category: form.type as 'reuniao' | 'lembrete',
          time: form.time || undefined,
          members: form.members,
          createdBy: user.id,
          description: form.description.trim() || undefined,
          note: form.note.trim() || undefined,
          location: form.location.trim() || undefined,
          link: form.link.trim() || undefined,
        };
        if (editingId) await updateEvent(editingId, payload);
        else await createEvent(payload);
        reloadEvents();
      }
      setForm(emptyForm);
      setEditingId(null);
      setDetail(null);
      setDayTab('agenda');
    } finally {
      setSaving(false);
    }
  };

  const monthLabel = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const dayItems = selectedDay ? (byDay[selectedDay] ?? []) : [];

  return (
    <Layout
      title="Agenda"
      subtitle="Calendário de entregas e eventos da empresa"
      action={
        <div className="flex items-center gap-1.5">
          <button onClick={prevMonth} className="p-2 rounded-md text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors">
            <ChevronLeft size={16} />
          </button>
          <Button variant="secondary" size="sm" onClick={goToday}>Hoje</Button>
          <button onClick={nextMonth} className="p-2 rounded-md text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      }
    >
      {/* Mês + legenda */}
      <div className="flex items-center gap-4 mb-4 flex-wrap">
        <h2 className="text-xl font-bold text-base-primary capitalize">{monthLabel}</h2>
        <div className="flex items-center gap-3 ml-auto text-xs font-mono text-base-muted flex-wrap">
          {(Object.keys(CATEGORY) as Category[]).map((c) => (
            <span key={c} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY[c].color }} />
              {CATEGORY[c].label}
            </span>
          ))}
        </div>
      </div>

      {/* Calendário */}
      <div className="card rounded-md overflow-hidden">
        <div className="grid grid-cols-7" style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
          {WEEKDAYS.map((w, i) => (
            <div key={w} className={`py-2.5 text-center text-xs font-mono font-semibold uppercase tracking-wider ${i === 0 || i === 6 ? 'text-viper-500' : 'text-base-muted'}`}>
              {w}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((d, i) => {
            const key = ymd(d);
            const inMonth = d.getMonth() === month;
            const isToday = key === TODAY;
            const weekend = d.getDay() === 0 || d.getDay() === 6;
            const dItems = byDay[key] ?? [];
            // cores distintas do dia (para a borda lateral)
            const dayColors = Array.from(new Set(dItems.map((it) => it.color)));
            const shown = dItems.slice(0, 3);
            const extra = dItems.length - shown.length;

            // Fundo da célula com contraste nos dois temas: fins de semana mais escuros e
            // dias de outro mês um pouco mais escuros (no light clareando o papel, no dark indo ao preto).
            let cellBg: string;
            if (isToday) {
              cellBg = 'rgba(134,55,204,0.10)';
            } else if (dark) {
              if (!inMonth) cellBg = weekend ? '#101116' : '#1C1D21';
              // dia disponível: leve realce acima do surface (bem sutil)
              else cellBg = weekend ? '#17181C' : '#272930';
            } else if (!inMonth) {
              cellBg = weekend ? '#DCD3BD' : '#E9E2D1';
            } else {
              // dia disponível: leve realce acima do surface (bem sutil)
              cellBg = weekend ? '#E4DCC7' : '#FEFDF9';
            }

            return (
              <button
                key={i}
                onClick={() => openDay(key)}
                className="group relative text-left min-h-[68px] sm:min-h-[122px] py-1.5 pr-1 pl-2 sm:py-2 sm:pr-2 sm:pl-3 flex flex-col gap-1 border-b border-r transition-colors focus:outline-none"
                style={{ borderColor: 'var(--border)', backgroundColor: cellBg }}
              >
                {/* borda lateral colorida com as cores do dia */}
                {dayColors.length > 0 && (
                  <span className="absolute left-0 top-0 bottom-0 w-1 flex flex-col overflow-hidden">
                    {dayColors.map((c) => (
                      <span key={c} className="flex-1" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                )}

                {/* realce de hover */}
                <span className="pointer-events-none absolute inset-0 bg-viper-500 opacity-0 group-hover:opacity-[0.07] transition-opacity" />
                {isToday && <span className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-viper-500/40" />}

                <div className="relative flex items-center justify-between">
                  <span className={`text-xs font-mono flex items-center justify-center ${
                    isToday ? 'w-5 h-5 rounded-full bg-viper-500 text-white font-bold' : weekend && inMonth ? 'text-viper-500 font-semibold' : 'text-base-muted'
                  }`}>
                    {d.getDate()}
                  </span>
                  {dItems.length > 0 && <span className="text-[10px] font-mono text-base-muted group-hover:opacity-0 transition-opacity">{dItems.length}</span>}
                  <span className="absolute right-0 opacity-0 group-hover:opacity-100 transition-opacity text-viper-500"><Plus size={13} /></span>
                </div>

                {/* Mobile: apenas pontos coloridos (chips de texto não cabem) */}
                {dItems.length > 0 && (
                  <div className="relative flex sm:hidden flex-wrap gap-1 mt-0.5">
                    {dayColors.slice(0, 4).map((c) => (
                      <span key={c} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c }} />
                    ))}
                  </div>
                )}

                {/* Tablet/desktop: chips de texto */}
                <div className="relative hidden sm:flex flex-col gap-1 overflow-hidden">
                  {shown.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center gap-1.5 pr-1.5 py-0.5 rounded-sm text-[11px] leading-tight overflow-hidden"
                      style={{ backgroundColor: tint(it.color, 0.14) }}
                    >
                      <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: it.color, minHeight: 14 }} />
                      <span className={`truncate ${it.task?.status === 'concluida' ? 'line-through opacity-70' : ''}`} style={{ color: it.color }}>
                        {it.event?.time ? `${it.event.time} ` : ''}{it.category === 'conclusao' ? it.title.replace('Conclusão: ', '🏁 ') : it.title}
                      </span>
                    </div>
                  ))}
                  {extra > 0 && <span className="text-[10px] font-mono text-base-muted pl-0.5">+{extra} mais</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Painel lateral do dia — desfoca todo o app e desliza pela direita */}
      {selectedDay !== null && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-carvao-base/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setSelectedDay(null)}
          />
          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md flex flex-col border-l animate-slide-in-right"
            style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', boxShadow: '-24px 0 60px rgba(0,0,0,0.34)' }}
          >
            <header className="flex items-center justify-between gap-3 p-6 pb-4 border-b shrink-0" style={{ borderColor: 'var(--border)' }}>
              <h2 className="text-lg font-semibold text-base-primary capitalize truncate">{selectedDay ? fullDate(selectedDay) : ''}</h2>
              <button onClick={closeDay} className="shrink-0 rounded-md p-1 text-base-muted hover:text-base-primary hover:bg-subtle transition-colors">
                <X size={18} />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto p-6 pt-4">
              {/* Abas: alternar entre a agenda do dia e novo agendamento */}
              <div className="flex gap-1 mb-4 p-1 rounded-md" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                <button
                  onClick={goList}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-sm font-medium transition-colors ${dayTab === 'agenda' ? 'text-viper-500 shadow-e1' : 'text-base-muted hover:text-base-primary'}`}
                  style={dayTab === 'agenda' ? { backgroundColor: 'var(--surface)' } : {}}
                >
                  Agenda do dia ({dayItems.length})
                </button>
                <button
                  onClick={goCreate}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-sm text-sm font-medium transition-colors ${dayTab === 'add' ? 'text-viper-500 shadow-e1' : 'text-base-muted hover:text-base-primary'}`}
                  style={dayTab === 'add' ? { backgroundColor: 'var(--surface)' } : {}}
                >
                  <Plus size={14} /> Novo
                </button>
              </div>

              {/* LISTA DO DIA — agrupada por categoria */}
              {dayTab === 'agenda' && !detail && (
                <>
                  {dayItems.length === 0 ? (
                    <p className="text-sm text-base-muted text-center py-8">Nada agendado para este dia.</p>
                  ) : (
                    <div className="space-y-5">
                      {(Object.keys(CATEGORY) as Category[])
                        .map((cat) => ({ cat, items: dayItems.filter((it) => it.category === cat) }))
                        .filter(({ items }) => items.length > 0)
                        .map(({ cat, items }) => (
                          <div key={cat}>
                            {/* Cabeçalho da categoria */}
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: CATEGORY[cat].color }} />
                              <span className="text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: CATEGORY[cat].color }}>
                                {CATEGORY[cat].label}
                              </span>
                              <span className="text-xs font-mono text-base-muted">({items.length})</span>
                            </div>
                            <div className="space-y-2">
                              {items.map((it) => {
                                const inner = (
                                  <>
                                    <span className="w-1 self-stretch rounded-full shrink-0" style={{ backgroundColor: it.color, minHeight: 44 }} />
                                    <div className="flex-1 min-w-0 py-0.5">
                                      <p className={`text-sm font-semibold leading-snug ${it.task?.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-primary'}`}>
                                        {it.event?.time ? `${it.event.time} · ` : ''}{it.category === 'conclusao' ? it.title.replace('Conclusão: ', '') : it.title}
                                      </p>
                                      <p className="text-xs text-base-muted font-mono mt-0.5 truncate">
                                        {it.task && `${getProjectName(it.task.projectId) || 'Sem cliente'} · ${it.task.assignedTo.map((id) => getUserName(id)).join(' + ')}`}
                                        {it.event && it.event.members.map((id) => getUserName(id)).join(', ')}
                                        {it.category === 'conclusao' && getProjectName(it.projectId!)}
                                      </p>
                                    </div>
                                    {it.task && <StatusBadge status={it.task.status} />}
                                  </>
                                );
                                return it.category === 'conclusao' && it.to ? (
                                  <Link key={it.id} to={it.to} onClick={closeDay} className="flex items-center gap-3 p-3.5 rounded-md transition-colors hover:bg-subtle w-full text-left" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                                    {inner}
                                  </Link>
                                ) : (
                                  <button key={it.id} onClick={() => openDetail(it)} className="flex items-center gap-3 p-3.5 rounded-md transition-colors hover:bg-subtle w-full text-left" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                                    {inner}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}
                </>
              )}

              {/* DETALHE DO AGENDAMENTO */}
              {dayTab === 'agenda' && detail && (
                <div className="space-y-4">
                  <button onClick={goList} className="inline-flex items-center gap-1.5 text-sm text-base-muted hover:text-viper-500 transition-colors">
                    <ArrowLeft size={15} /> Voltar para o dia
                  </button>
                  <div>
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: tint(detail.color, 0.16), color: detail.color }}>
                      <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: detail.color }} />
                      {CATEGORY[detail.category].label}
                    </span>
                    <h3 className="mt-2 text-lg font-bold text-base-primary leading-snug">{detail.title}</h3>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {detail.event?.time && (
                        <span className="inline-flex items-center gap-1 text-xs font-num text-base-muted"><Clock size={12} /> {detail.event.time}</span>
                      )}
                      {detail.task && <StatusBadge status={detail.task.status} />}
                    </div>
                  </div>

                  {(detail.task?.description || detail.event?.description) && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-base-muted mb-1"><FileText size={12} /> Descrição</p>
                      <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">{detail.task?.description || detail.event?.description}</p>
                    </div>
                  )}

                  {(detail.task?.note || detail.event?.note) && (
                    <div className="rounded-sm border-l-2 border-viper-300 p-3" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                      <p className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-base-muted mb-1"><StickyNote size={12} /> Anotação</p>
                      <p className="text-sm text-base-secondary leading-relaxed whitespace-pre-wrap">{detail.task?.note || detail.event?.note}</p>
                    </div>
                  )}

                  {detail.event?.location && (
                    <div className="flex items-center gap-2 text-sm text-base-secondary"><MapPin size={14} className="text-viper-400 shrink-0" /> {detail.event.location}</div>
                  )}
                  {detail.event?.link && (
                    <a href={detail.event.link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-viper-500 hover:text-viper-400 transition-colors break-all"><Link2 size={14} className="shrink-0" /> {detail.event.link}</a>
                  )}

                  {detail.task && detail.task.projectId && getProjectName(detail.task.projectId) && (
                    <div className="text-sm">
                      <span className="text-base-muted">Cliente: </span>
                      <Link to={`/projetos/${detail.task.projectId}`} onClick={closeDay} className="text-viper-500 hover:text-viper-400 font-medium transition-colors">{getProjectName(detail.task.projectId)}</Link>
                    </div>
                  )}

                  {((detail.task?.assignedTo.length ?? 0) > 0 || (detail.event?.members.length ?? 0) > 0) && (
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-base-muted mb-2"><Users size={12} /> {detail.task ? 'Responsáveis' : 'Participantes'}</p>
                      <div className="space-y-2">
                        {(detail.task?.assignedTo ?? detail.event?.members ?? []).map((mid) => {
                          const u = users.find((x) => x.id === mid);
                          return u ? (
                            <div key={mid} className="flex items-center gap-2">
                              <Avatar user={u} size={24} fontSize={9} />
                              <span className="text-sm text-base-primary">{u.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-4 mt-2 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div>
                      {canManage(detail) && (
                        <button
                          onClick={() => removeItem(detail)}
                          disabled={saving}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-danger text-danger bg-transparent transition-all duration-150 hover:bg-danger hover:text-white hover:shadow-[0_0_16px_rgba(229,64,86,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                        >
                          <Trash2 size={14} /> Excluir
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.to && detail.task && (
                        <Link to={detail.to} onClick={closeDay} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md text-viper-500 hover:bg-subtle transition-colors">
                          <ExternalLink size={14} /> Abrir
                        </Link>
                      )}
                      {canManage(detail) && (
                        <button
                          onClick={() => openEdit(detail)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-viper-500 text-viper-500 bg-transparent transition-all duration-150 hover:bg-viper-500 hover:text-white hover:shadow-[0_0_16px_rgba(134,55,204,0.65)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viper-500"
                        >
                          <Pencil size={14} /> Editar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* FORMULÁRIO (criar / editar) */}
              {dayTab === 'add' && (
                <div className="space-y-3">
                  {!editingId && (
                    <FormField label="Tipo">
                      <div className="grid grid-cols-2 gap-2">
                        {(['tarefa', 'entrega', 'reuniao', 'lembrete'] as const).map((tp) => {
                          const sel = form.type === tp;
                          const color = CATEGORY[tp].color;
                          return (
                            <button
                              key={tp}
                              type="button"
                              onClick={() => setForm((f) => ({ ...f, type: tp }))}
                              className="flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-all"
                              style={sel ? { borderColor: color, backgroundColor: tint(color, 0.12), color } : { borderColor: 'var(--border)' }}
                            >
                              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                              {CATEGORY[tp].label}
                            </button>
                          );
                        })}
                      </div>
                    </FormField>
                  )}

                  <FormField label="Título" required>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                      placeholder={form.type === 'reuniao' ? 'Assunto da reunião...' : form.type === 'lembrete' ? 'Lembrete...' : 'Título da task...'}
                      autoFocus
                    />
                  </FormField>

                  <FormField label={isTaskType ? 'Responsáveis' : 'Participantes'} hint={isTaskType ? 'Até 2' : undefined}>
                    <div className="flex gap-2 flex-wrap">
                      {users.map((u) => {
                        const sel = form.members.includes(u.id);
                        const dis = isTaskType && !sel && form.members.length >= 2;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            disabled={dis}
                            onClick={() => toggleMember(u.id)}
                            className={`chip flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs ${sel ? 'chip-selected' : ''}`}
                          >
                            <Avatar user={u} size={20} fontSize={9} fallbackClassName="bg-viper-100 dark:bg-carvao-surface2 text-viper-600 dark:text-viper-400" />
                            {u.name}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>

                  {isTaskType && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <FormField label="Prioridade">
                          <Select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as TaskPriority }))}>
                            <option value="baixa">Baixa</option>
                            <option value="media">Média</option>
                            <option value="alta">Alta</option>
                          </Select>
                        </FormField>
                        <FormField label="Cliente">
                          <Select value={form.projectId} onChange={(e) => setForm((f) => ({ ...f, projectId: e.target.value }))}>
                            <option value="">Nenhum</option>
                            {projects.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                          </Select>
                        </FormField>
                      </div>
                      <FormField label="Descrição">
                        <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Descreva o que precisa ser feito..." />
                      </FormField>
                      <FormField label="Anotação" hint="Opcional">
                        <Textarea value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} rows={2} placeholder="Uma anotação para este agendamento..." />
                      </FormField>
                    </>
                  )}

                  {form.type === 'lembrete' && (
                    <>
                      <FormField label="Horário">
                        <TimePicker value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} />
                      </FormField>
                      <FormField label="Descrição">
                        <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} placeholder="Detalhes do lembrete..." />
                      </FormField>
                    </>
                  )}

                  {form.type === 'reuniao' && (
                    <>
                      <FormField label="Horário">
                        <TimePicker value={form.time} onChange={(v) => setForm((f) => ({ ...f, time: v }))} />
                      </FormField>
                      <FormField label="Local da reunião">
                        <Input value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Meet, Teams, Discord..." />
                      </FormField>
                      <FormField label="Link da reunião">
                        <Input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://meet..." className="font-mono" />
                      </FormField>
                    </>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    <Button variant="tertiary" onClick={goList} className="flex-1">Cancelar</Button>
                    <Button variant="primary" onClick={saveEntry} disabled={!form.title.trim() || form.members.length === 0 || saving} className="flex-1">
                      {saving ? 'Salvando…' : editingId ? 'Salvar' : 'Adicionar'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}
    </Layout>
  );
}
