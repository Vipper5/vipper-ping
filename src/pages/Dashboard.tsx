import { ReactNode, useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, User } from '../mocks/data';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
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
} from 'lucide-react';
import { Link } from 'react-router-dom';

function isToday(d: string) {
  return d === new Date().toISOString().split('T')[0];
}

// Período da task (legado sem período conta como Task) — mesma regra da página de Tasks.
function taskPeriod(t: Task): 'diaria' | 'semanal' {
  return t.period === 'semanal' ? 'semanal' : 'diaria';
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
// 0/0 = sem atividades → "Aguarde por novas atividades" em cor de papel quente.
function ProgressTile({ label, done, total, subtitle, icon, onClick }: ProgressTileProps) {
  const { empty, pct, color } = progressState(done, total);
  const [hover, setHover] = useState(false);
  const { dark } = useTheme();
  // brilho do canto: no light mode precisa ser sutilmente mais forte para aparecer
  const glow = dark ? '14' : '24';
  // Sem atividades (papel quente) usa tints prontas — a cor é uma CSS var e não aceita sufixo de alfa.
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
        <div className="mt-3 mb-1.5">
          <span className="text-sm font-semibold leading-snug block" style={{ color }}>
            Aguarde por novas atividades
          </span>
        </div>
      ) : (
        <div className="flex items-baseline justify-between mt-3 mb-1.5">
          <span className="text-3xl font-bold font-num tracking-tight leading-none" style={{ color }}>
            {pct}%
          </span>
          <span className="text-xs font-num text-base-muted">{done}/{total}</span>
        </div>
      )}
      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: empty ? '100%' : `${pct}%`, backgroundColor: color, opacity: empty ? 0.35 : 1 }}
        />
      </div>
      <p className="text-xs text-base-muted mt-2">{subtitle}</p>
    </button>
  );
}

// Wide member strip — progresso de PROJETOS do membro (sócio vê os demais membros)
function MemberWeekCard({ member, tasks }: { member: User; tasks: Task[] }) {
  const weekTasks = tasks.filter((t) => t.assignedTo.includes(member.id) && taskPeriod(t) === 'semanal');
  const done = weekTasks.filter((t) => t.status === 'concluida').length;
  const { empty, pct, color } = progressState(done, weekTasks.length);
  const roleLabel = member.role === 'socio' ? 'Sócio' : 'Estagiário';

  return (
    <Link
      to={`/membros/${member.id}`}
      className="lg:col-span-4 card-interactive rounded-md p-5 flex flex-col sm:flex-row sm:items-center gap-5"
    >
      <div className="flex items-center gap-3 sm:w-52 shrink-0">
        <Avatar user={member} size={40} fontSize={14} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-base-primary leading-tight truncate">{member.name}</p>
          <p className="text-xs text-base-muted font-mono">{roleLabel}</p>
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          <span className="text-base-muted uppercase tracking-wider">Progresso de projetos</span>
          {empty ? (
            <span className="font-semibold" style={{ color }}>Aguarde por novas atividades</span>
          ) : (
            <span className="font-bold font-num" style={{ color }}>{pct}%</span>
          )}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: empty ? '100%' : `${pct}%`, backgroundColor: color, opacity: empty ? 0.35 : 1 }}
          />
        </div>
      </div>

      <div className="flex gap-3 shrink-0">
        <div className="rounded-sm px-4 py-2 text-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p className="text-xs font-mono text-base-muted">Projetos</p>
          <p className="text-lg font-bold font-num text-base-primary">{weekTasks.length}</p>
        </div>
        <div className="rounded-sm px-4 py-2 text-center" style={{ backgroundColor: 'var(--bg-subtle)' }}>
          <p className="text-xs font-mono text-base-muted">Feitas</p>
          <p className="text-lg font-bold font-num text-viper-500">{done}</p>
        </div>
      </div>

      <ArrowRight size={16} className="text-viper-500 shrink-0 hidden sm:block" />
    </Link>
  );
}

export function Dashboard() {
  const { user } = useAuth();
  const { data: allTasks, loading: tasksLoading } = useTasks();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: users, loading: usersLoading } = useUsers();
  const [periodModal, setPeriodModal] = useState<'diario' | 'semanal' | null>(null);

  if (!user) return null;

  const isSocio = user.role === 'socio';
  const loading = tasksLoading || projectsLoading || usersLoading;

  const myTasks = allTasks.filter((t) => t.assignedTo.includes(user.id));
  // "Tasks de hoje" lista apenas as tasks com prazo para hoje.
  const todayTasks = myTasks.filter((t) => isToday(t.dueDate) && taskPeriod(t) === 'diaria');
  // Tasks x projetos por período (mesma taxonomia da página de Tasks).
  const dailyTasks = myTasks.filter((t) => taskPeriod(t) === 'diaria');
  const weeklyTasks = myTasks.filter((t) => taskPeriod(t) === 'semanal');
  const completedTasks = myTasks.filter((t) => t.status === 'concluida');
  const activeProjects = projects.filter((p) => p.status === 'Ativo');

  const dailyDone = dailyTasks.filter((t) => t.status === 'concluida').length;
  const weeklyDone = weeklyTasks.filter((t) => t.status === 'concluida').length;

  // Comparativo de concluídas vs mês anterior. É o primeiro mês de operação,
  // então não há baseline anterior para comparar (evita divisão por zero).
  const prevMonthCompleted = 0;
  const hasPrevMonth = prevMonthCompleted > 0;
  const monthDelta = hasPrevMonth
    ? Math.round(((completedTasks.length - prevMonthCompleted) / prevMonthCompleted) * 100)
    : 0;
  const monthTrend = monthDelta > 0 ? 'up' : monthDelta < 0 ? 'down' : 'neutral';

  // Sócio acompanha os demais membros (todos menos ele mesmo)
  const otherMembers = isSocio ? users.filter((u) => u.id !== user.id) : [];

  const modalTasks: Task[] = periodModal === 'diario' ? dailyTasks : periodModal === 'semanal' ? weeklyTasks : [];
  const modalTitle = periodModal === 'diario' ? 'Tasks' : 'Projetos';
  const modalDesc = periodModal === 'diario' ? 'Suas tasks' : 'Seus projetos';

  if (loading) {
    return (
      <Layout
        title={`Olá, ${user.name}`}
        subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
      >
        <Loading label="Carregando seu painel…" />
      </Layout>
    );
  }

  return (
    <Layout
      title={`Olá, ${user.name}`}
      subtitle={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
    >
      {/* Bento grid — tamanhos variados */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Hero: atividades de hoje — bloco grande, alto */}
        <div className="lg:col-span-2 lg:row-span-2 card rounded-md flex flex-col overflow-hidden">
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b shrink-0"
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
            <div className="flex-1 flex items-center justify-center px-5 py-12">
              <p className="text-base-muted text-sm text-center">Nenhuma task para hoje.</p>
            </div>
          ) : (
            <div className="divide-y flex-1" style={{ borderColor: 'var(--border)' }}>
              {todayTasks.map((task) => (
                <Link
                  to={`/atividades/${task.id}`}
                  key={task.id}
                  className="flex items-center gap-4 px-5 py-3 hover:bg-subtle transition-colors"
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
                      {projects.find((p) => p.id === task.projectId)?.name ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Progress tiles — compactos, lado a lado (col 3 e 4) */}
        <ProgressTile
          label="Tasks"
          done={dailyDone}
          total={dailyTasks.length}
          icon={<Sun size={15} />}
          subtitle={dailyTasks.length === 0 ? 'Sem tasks' : `${dailyTasks.length} ${dailyTasks.length === 1 ? 'task' : 'tasks'}`}
          onClick={() => setPeriodModal('diario')}
        />
        <ProgressTile
          label="Projetos"
          done={weeklyDone}
          total={weeklyTasks.length}
          icon={<CalendarRange size={15} />}
          subtitle={weeklyTasks.length === 0 ? 'Sem projetos' : `${weeklyTasks.length} ${weeklyTasks.length === 1 ? 'projeto' : 'projetos'}`}
          onClick={() => setPeriodModal('semanal')}
        />

        {/* KPIs pequenos — preenchem a linha de baixo do lado direito */}
        <KpiCard label="Clientes ativos" value={activeProjects.length} icon={<FolderKanban size={16} />} />
        <KpiCard
          label="Concluídas no mês"
          value={completedTasks.length}
          icon={<TrendingUp size={16} />}
          trend={monthTrend}
          trendLabel={hasPrevMonth ? `${monthDelta >= 0 ? '+' : ''}${monthDelta}% vs mês anterior` : 'Primeiro mês'}
        />

        {/* Membros — faixas largas (sócio acompanha os demais) */}
        {otherMembers.map((m) => (
          <MemberWeekCard key={m.id} member={m} tasks={allTasks} />
        ))}
      </div>

      {/* Period activities popup */}
      <Modal
        open={periodModal !== null}
        onClose={() => setPeriodModal(null)}
        title={modalTitle}
        description={modalDesc}
        size="md"
      >
        {modalTasks.length === 0 ? (
          <p className="text-sm text-base-muted py-6 text-center">Nenhuma task neste período.</p>
        ) : (
          <div className="space-y-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
            {modalTasks.map((task) => (
              <Link
                key={task.id}
                to={`/atividades/${task.id}`}
                onClick={() => setPeriodModal(null)}
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
