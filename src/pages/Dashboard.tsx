import { ReactNode, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, User, Project } from '../mocks/data';
import { useTasks, useProjects, useUsers, useEvents } from '../lib/hooks';
import { Loading } from '../components/ui/Loading';
import { progressState } from '../lib/progress';
import { Avatar } from '../components/ui/Avatar';
import {
  FolderKanban,
  TrendingUp,
  ArrowRight,
  CalendarRange,
  Sun,
  ChevronRight,
  ChevronLeft,
  CalendarDays,
} from 'lucide-react';
import { Link } from 'react-router-dom';

function pad(n: number) {
  return String(n).padStart(2, '0');
}
function ymd(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
const TODAY = ymd(new Date());

function isToday(d: string) {
  return d === TODAY;
}

// Período da task (legado sem período conta como Task) — mesma regra da página de Tasks.
function taskPeriod(t: Task): 'diaria' | 'semanal' {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
function fullDayLabel(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  });
}

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Categorias do calendário — espelham a página Agenda.
type Category = 'entrega' | 'tarefa' | 'reuniao' | 'lembrete' | 'conclusao';
const CATEGORY: Record<Category, { label: string; color: string }> = {
  entrega:  { label: 'Projeto',   color: '#9966E0' },
  tarefa:   { label: 'Task',      color: '#378ADD' },
  reuniao:  { label: 'Reunião',   color: '#EF9F27' },
  lembrete: { label: 'Lembrete', color: '#1D9E75' },
  conclusao:{ label: 'Conclusão', color: '#EF4444' },
};
const CATEGORY_PRIORITY: Record<Category, number> = {
  reuniao: 0, lembrete: 1, conclusao: 2, entrega: 3, tarefa: 4,
};

interface CalItem {
  id: string;
  title: string;
  category: Category;
  color: string;
  date: string;
  to: string;
}

interface ProgressTileProps {
  label: string;
  done: number;
  total: number;
  subtitle: string;
  icon: ReactNode;
  onClick: () => void;
}

// Compact progress tile — % é o foco; ocupa pouco espaço. Clicável → abre lista.
function ProgressTile({ label, done, total, subtitle, icon, onClick }: ProgressTileProps) {
  const { empty, pct, color } = progressState(done, total);
  const [hover, setHover] = useState(false);
  const { dark } = useTheme();
  const glow = dark ? '14' : '24';
  const cornerTint = empty ? 'var(--papel-quente-soft)' : `${color}${glow}`;
  const iconBg = empty ? 'var(--papel-quente-tint)' : `${color}22`;

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="group rounded-md p-4 relative overflow-hidden flex flex-col text-left transition-colors"
      style={{
        backgroundColor: 'var(--surface)',
        backgroundImage: `linear-gradient(135deg, ${cornerTint}, transparent 60%)`,
        border: `1px solid ${hover ? color : 'var(--border)'}`,
        boxShadow: 'var(--card-shadow)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ backgroundColor: iconBg, color }}
        >
          {icon}
        </span>
        <p className="text-xs font-mono uppercase tracking-wider text-base-muted">{label}</p>
        <ChevronRight size={14} className="ml-auto text-base-muted group-hover:text-viper-500 transition-colors" />
      </div>

      {empty ? (
        <div className="mt-2.5 mb-1.5">
          <span className="text-sm font-semibold leading-snug block" style={{ color }}>
            Aguarde por novas atividades
          </span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between mt-2.5 mb-1.5">
          <span className="text-3xl font-bold font-num tracking-tight leading-none" style={{ color }}>
            {pct}%
          </span>
          <span className="text-xs font-num text-base-muted">{done}/{total}</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--track)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: empty ? '100%' : `${pct}%`, backgroundColor: color, opacity: empty ? 0.35 : 1 }}
        />
      </div>
      <p className="text-xs text-base-muted mt-1.5">{subtitle}</p>
    </button>
  );
}

// Faixa de membro compacta — progresso de TASKS (diárias); preenche a largura do container.
function MemberStrip({ member, tasks, isSelf }: { member: User; tasks: Task[]; isSelf?: boolean }) {
  const memberTasks = tasks.filter((t) => t.assignedTo.includes(member.id) && taskPeriod(t) === 'diaria');
  const done = memberTasks.filter((t) => t.status === 'concluida').length;
  const { empty, pct, color } = progressState(done, memberTasks.length);
  const roleLabel = isSelf ? 'Você' : member.role === 'socio' ? 'Sócio' : 'Estagiário';

  return (
    <Link
      to={`/membros/${member.id}`}
      className="card-interactive rounded-md p-4 flex items-center gap-3"
      style={isSelf ? { borderColor: '#9966E0' } : undefined}
    >
      <Avatar user={member} size={38} fontSize={14} />
      <div className="w-28 sm:w-32 shrink-0 min-w-0">
        <p className="text-sm font-semibold text-base-primary leading-tight truncate">{member.name}</p>
        <p className={`text-xs font-mono ${isSelf ? 'text-viper-500' : 'text-base-muted'}`}>{roleLabel}</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-base-muted uppercase tracking-wider hidden sm:inline">Tasks</span>
          {empty ? (
            <span className="font-semibold ml-auto" style={{ color }}>Sem tasks</span>
          ) : (
            <span className="font-bold font-num ml-auto" style={{ color }}>{done}/{memberTasks.length} · {pct}%</span>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--track)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: empty ? '100%' : `${pct}%`, backgroundColor: color, opacity: empty ? 0.35 : 1 }}
          />
        </div>
      </div>

      <ArrowRight size={16} className="text-viper-500 shrink-0" />
    </Link>
  );
}

// Mini calendário — versão compacta da Agenda. Clicar num dia chama onSelectDay.
function MiniCalendar({ byDay, onSelectDay }: { byDay: Record<string, CalItem[]>; onSelectDay: (day: string) => void }) {
  const { dark } = useTheme();
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });
  const year = cursor.getFullYear();
  const month = cursor.getMonth();

  const firstCell = new Date(year, month, 1 - new Date(year, month, 1).getDay());
  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstCell);
    d.setDate(firstCell.getDate() + i);
    cells.push(d);
  }

  const monthName = cursor.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className="card rounded-md flex flex-col overflow-hidden">
      {/* Header — navegação de mês + atalho de hoje */}
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b shrink-0"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
      >
        <div className="flex items-center gap-1">
          <button onClick={() => setCursor(new Date(year, month - 1, 1))} className="p-1 rounded text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors">
            <ChevronLeft size={15} />
          </button>
          <span className="text-sm font-semibold text-base-primary capitalize min-w-[7.5rem] text-center">{monthName}</span>
          <button onClick={() => setCursor(new Date(year, month + 1, 1))} className="p-1 rounded text-base-muted hover:text-viper-500 hover:bg-subtle transition-colors">
            <ChevronRight size={15} />
          </button>
        </div>
        <button
          onClick={() => onSelectDay(TODAY)}
          className="text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors flex items-center gap-1"
        >
          ver agenda de hoje <ArrowRight size={11} />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        {WEEKDAYS.map((w, i) => (
          <div key={i} className={`py-1.5 text-center text-[10px] font-mono font-semibold uppercase ${i === 0 || i === 6 ? 'text-viper-500' : 'text-base-muted'}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Grade de dias — preenche a altura disponível (alinha com os cards) */}
      <div className="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        {cells.map((d, i) => {
          const key = ymd(d);
          const inMonth = d.getMonth() === month;
          const today = key === TODAY;
          const weekend = d.getDay() === 0 || d.getDay() === 6;
          const dItems = byDay[key] ?? [];
          const dayColors = Array.from(new Set(dItems.map((it) => it.color)));

          let cellBg = 'transparent';
          if (today) cellBg = 'rgba(74,17,162,0.10)';
          else if (!inMonth) cellBg = dark ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.035)';

          return (
            <button
              key={i}
              onClick={() => onSelectDay(key)}
              className="group relative flex flex-col items-center justify-start gap-1 pt-1 border-b border-r min-h-0 transition-colors focus:outline-none hover:bg-subtle"
              style={{ borderColor: 'var(--border)', backgroundColor: cellBg }}
            >
              <span className={`text-[11px] font-mono leading-none flex items-center justify-center ${
                today ? 'w-[18px] h-[18px] rounded-full bg-viper-500 text-white font-bold'
                  : !inMonth ? 'text-base-muted opacity-40'
                  : weekend ? 'text-viper-500 font-semibold' : 'text-base-secondary'
              }`}>
                {d.getDate()}
              </span>
              {dayColors.length > 0 && (
                <span className="flex gap-[3px] flex-wrap justify-center px-0.5">
                  {dayColors.slice(0, 4).map((c) => (
                    <span key={c} className="w-[5px] h-[5px] rounded-full" style={{ backgroundColor: c }} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data: allTasks, loading: tasksLoading } = useTasks();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: events, loading: eventsLoading } = useEvents();
  const [modal, setModal] = useState<'diario' | 'semanal' | 'clientes' | 'concluidas' | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  if (!user) return null;

  const isSocio = user.role === 'socio';
  const loading = tasksLoading || projectsLoading || usersLoading || eventsLoading;

  const myTasks = allTasks.filter((t) => t.assignedTo.includes(user.id));
  const todayTasks = myTasks.filter((t) => isToday(t.dueDate) && taskPeriod(t) === 'diaria');
  const dailyTasks = myTasks.filter((t) => taskPeriod(t) === 'diaria');
  const weeklyTasks = myTasks.filter((t) => taskPeriod(t) === 'semanal');
  const activeProjects = projects.filter((p) => p.status === 'Ativo');

  const dailyDone = dailyTasks.filter((t) => t.status === 'concluida').length;
  const weeklyDone = weeklyTasks.filter((t) => t.status === 'concluida').length;

  // Concluídas no mês corrente (por completedAt).
  const now = new Date();
  const completedThisMonth = myTasks.filter((t) => {
    if (t.status !== 'concluida' || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const otherMembers = isSocio ? users.filter((u) => u.id !== user.id) : [];

  // Itens do calendário — apenas as tasks do usuário logado.
  const calItems: CalItem[] = [];
  myTasks.forEach((t) => {
    const category: Category = t.period === 'semanal' ? 'entrega' : 'tarefa';
    calItems.push({ id: t.id, title: t.title, category, color: CATEGORY[category].color, date: t.dueDate, to: `/atividades/${t.id}` });
  });
  events.forEach((e) => {
    const category = (e.category as Category) ?? 'lembrete';
    calItems.push({ id: e.id, title: e.title, category, color: CATEGORY[category]?.color ?? CATEGORY.lembrete.color, date: e.date, to: '/agenda' });
  });
  projects.forEach((p) => {
    if (p.status === 'Concluído' || !p.endDate) return;
    calItems.push({ id: `proj-${p.id}`, title: `Conclusão: ${p.name}`, category: 'conclusao', color: CATEGORY.conclusao.color, date: p.endDate, to: `/projetos/${p.id}` });
  });
  const byDay: Record<string, CalItem[]> = {};
  calItems.forEach((it) => { (byDay[it.date] = byDay[it.date] || []).push(it); });
  Object.keys(byDay).forEach((day) => {
    byDay[day].sort((a, b) => CATEGORY_PRIORITY[a.category] - CATEGORY_PRIORITY[b.category]);
  });
  const dayItems = selectedDay ? byDay[selectedDay] ?? [] : [];

  const modalTasks: Task[] = modal === 'diario' ? dailyTasks : modal === 'semanal' ? weeklyTasks : [];
  const modalTitle = modal === 'diario' ? 'Tasks' : modal === 'semanal' ? 'Projetos'
    : modal === 'clientes' ? 'Clientes ativos' : 'Concluídas no mês';
  const modalDesc = modal === 'diario' ? 'Suas tasks' : modal === 'semanal' ? 'Seus projetos'
    : modal === 'clientes' ? `${activeProjects.length} ${activeProjects.length === 1 ? 'cliente ativo' : 'clientes ativos'}`
    : `${completedThisMonth.length} ${completedThisMonth.length === 1 ? 'atividade concluída' : 'atividades concluídas'} este mês`;

  if (loading) {
    return (
      <Layout title="Dashboard">
        <Loading label="Carregando seu painel…" />
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard"
    >
      <div className="space-y-4">
        {/* TOPO — mini calendário (esq) + 4 cards compactos (dir, 2×2) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          <MiniCalendar byDay={byDay} onSelectDay={(d) => setSelectedDay(d)} />

          <div className="grid grid-cols-2 gap-4 content-start">
            <ProgressTile
              label="Tasks"
              done={dailyDone}
              total={dailyTasks.length}
              icon={<Sun size={15} />}
              subtitle={dailyTasks.length === 0 ? 'Sem tasks' : `${dailyTasks.length} ${dailyTasks.length === 1 ? 'task' : 'tasks'}`}
              onClick={() => setModal('diario')}
            />
            <ProgressTile
              label="Projetos"
              done={weeklyDone}
              total={weeklyTasks.length}
              icon={<CalendarRange size={15} />}
              subtitle={weeklyTasks.length === 0 ? 'Sem projetos' : `${weeklyTasks.length} ${weeklyTasks.length === 1 ? 'projeto' : 'projetos'}`}
              onClick={() => setModal('semanal')}
            />
            <KpiCard
              label="Clientes ativos"
              value={activeProjects.length}
              icon={<FolderKanban size={16} />}
              onClick={() => setModal('clientes')}
            />
            <KpiCard
              label="Concluídas no mês"
              value={completedThisMonth.length}
              icon={<TrendingUp size={16} />}
              onClick={() => setModal('concluidas')}
            />
          </div>
        </div>

        {/* BASE — membros empilhados (esq) + tasks de hoje (dir) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
          <div className="flex flex-col gap-4">
            {otherMembers.map((m) => (
              <MemberStrip key={m.id} member={m} tasks={allTasks} />
            ))}
            <MemberStrip member={user} tasks={allTasks} isSelf />
          </div>

          {/* Tasks de hoje — compacto */}
          <div className="card rounded-md flex flex-col overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-2.5 border-b shrink-0"
              style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
            >
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full bg-viper-500" />
                <h2 className="font-semibold text-base-primary text-sm">Tasks de hoje</h2>
              </div>
              <Link to="/atividades" className="text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors flex items-center gap-1">
                ver tudo <ArrowRight size={11} />
              </Link>
            </div>
            {todayTasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center px-5 py-8">
                <p className="text-base-muted text-sm text-center">Nenhuma task para hoje.</p>
              </div>
            ) : (
              <div className="flex-1 max-h-[18rem] overflow-y-auto">
                {todayTasks.map((task, i) => (
                  <Link
                    to={`/atividades/${task.id}`}
                    key={task.id}
                    className="flex items-center gap-3 px-5 py-2 hover:bg-subtle transition-colors border-b last:border-0"
                    style={{ borderColor: 'var(--border)', backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-subtle)' }}
                  >
                    <div
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        task.status === 'concluida' ? 'bg-success' : task.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[13px] font-medium truncate ${task.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-primary'}`}>
                        {task.title}
                      </p>
                      <p className="text-[11px] text-base-muted font-mono truncate">
                        {projects.find((p) => p.id === task.projectId)?.name ?? '—'}
                      </p>
                    </div>
                    <StatusBadge status={task.status} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Popup do dia (clique no calendário) */}
      <Modal
        open={selectedDay !== null}
        onClose={() => setSelectedDay(null)}
        title={selectedDay ? fullDayLabel(selectedDay) : ''}
        description={`${dayItems.length} ${dayItems.length === 1 ? 'item' : 'itens'} na agenda`}
        size="md"
      >
        {dayItems.length === 0 ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-sm text-base-muted">Nada agendado para este dia.</p>
            <Link
              to="/agenda"
              onClick={() => setSelectedDay(null)}
              className="inline-flex items-center gap-1 text-sm text-viper-500 hover:text-viper-400 font-mono transition-colors"
            >
              abrir agenda <ArrowRight size={13} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
            {dayItems.map((it) => (
              <Link
                key={it.id}
                to={it.to}
                onClick={() => setSelectedDay(null)}
                className="flex items-center gap-3 p-3 rounded-sm transition-colors hover:bg-subtle"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: it.color }} />
                <span className="text-sm font-medium text-base-primary truncate flex-1">{it.title}</span>
                <span className="text-xs font-mono shrink-0" style={{ color: it.color }}>{CATEGORY[it.category].label}</span>
              </Link>
            ))}
          </div>
        )}
      </Modal>

      {/* Popup unificado — tasks/projetos por período, clientes ativos, concluídas no mês */}
      <Modal
        open={modal !== null}
        onClose={() => setModal(null)}
        title={modalTitle}
        description={modalDesc}
        size="md"
      >
        {modal === 'clientes' ? (
          activeProjects.length === 0 ? (
            <p className="text-sm text-base-muted py-6 text-center">Nenhum cliente ativo.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
              {activeProjects.map((p: Project) => (
                <Link
                  key={p.id}
                  to={`/projetos/${p.id}`}
                  onClick={() => setModal(null)}
                  className="flex items-center gap-3 p-3 rounded-sm transition-colors hover:bg-subtle"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                >
                  <span className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 bg-viper-500/10 text-viper-500">
                    <FolderKanban size={16} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-primary truncate">{p.name}</p>
                    <p className="text-xs text-base-muted font-mono truncate">{p.client}</p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              ))}
            </div>
          )
        ) : modal === 'concluidas' ? (
          completedThisMonth.length === 0 ? (
            <p className="text-sm text-base-muted py-6 text-center">Nenhuma atividade concluída este mês.</p>
          ) : (
            <div className="space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
              {completedThisMonth.map((task) => (
                <Link
                  key={task.id}
                  to={`/atividades/${task.id}`}
                  onClick={() => setModal(null)}
                  className="flex items-center gap-3 p-3 rounded-sm transition-colors hover:bg-subtle"
                  style={{ backgroundColor: 'var(--bg-subtle)' }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0 bg-success" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-primary truncate line-through opacity-80">{task.title}</p>
                    <p className="text-xs text-base-muted font-mono truncate">
                      {projects.find((p) => p.id === task.projectId)?.name ?? 'Sem cliente'}
                    </p>
                  </div>
                  {task.completedAt && (
                    <span className="text-xs font-mono text-base-muted shrink-0">{formatDateTime(task.completedAt)}</span>
                  )}
                </Link>
              ))}
            </div>
          )
        ) : modalTasks.length === 0 ? (
          <p className="text-sm text-base-muted py-6 text-center">Nenhuma task neste período.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
            {modalTasks.map((task) => (
              <Link
                key={task.id}
                to={`/atividades/${task.id}`}
                onClick={() => setModal(null)}
                className="flex items-center gap-3 p-3 rounded-sm transition-colors hover:bg-subtle"
                style={{ backgroundColor: 'var(--bg-subtle)' }}
              >
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    task.status === 'concluida' ? 'bg-success' : task.status === 'em_andamento' ? 'bg-info' : 'bg-neutral-400'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${task.status === 'concluida' ? 'line-through text-base-muted' : 'text-base-primary'}`}>
                    {task.title}
                  </p>
                  <p className="text-xs text-base-muted font-mono">
                    {projects.find((p) => p.id === task.projectId)?.name ?? 'Sem cliente'}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </Link>
            ))}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
