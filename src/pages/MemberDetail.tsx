import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Badge, StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Loading } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useUsers, useTasks, useProjects } from '../lib/hooks';
import { taskPeriod } from '../lib/tasks';
import { progressState } from '../lib/progress';
import { setTaskComplete } from '../lib/api';
import { TaskPeriod } from '../mocks/data';
import { Pencil } from 'lucide-react';

function isToday(d: string) {
  return d === new Date().toISOString().split('T')[0];
}
function isThisWeek(d: string) {
  const now = new Date();
  const date = new Date(d + 'T00:00:00');
  const start = new Date(now); start.setDate(now.getDate() - now.getDay());
  const end   = new Date(start); end.setDate(start.getDate() + 6);
  return date >= start && date <= end;
}

/* ── Card de progresso (hoje / semana) ─────────────────────────────── */
function ProgressCard({ label, icon, done, total, subtitle, onClick }: {
  label: string; icon: string; done: number; total: number; subtitle: string; onClick: () => void;
}) {
  const { empty, pct, color } = progressState(done, total);
  const [hovered, setHovered] = useState(false);
  const cornerTint = empty ? 'rgba(255,255,255,0.03)' : `${color}18`;

  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-lg p-5 flex flex-col gap-3 transition-all duration-200 text-left w-full relative overflow-hidden"
      style={{
        background: 'var(--surface)',
        backgroundImage: `linear-gradient(135deg, ${cornerTint}, transparent 55%)`,
        border: hovered && !empty ? `1px solid ${color}` : '0.5px solid var(--border)',
        boxShadow: hovered && !empty ? `0 0 16px ${color}25` : 'none',
        cursor: 'pointer',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: empty ? 'var(--bg-subtle)' : `${color}20`, color: empty ? 'var(--text-muted)' : color }}>
          <i className={`ph-light ${icon}`} style={{ fontSize: '15px' }} />
        </span>
        <span className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
          {label.toUpperCase()}
        </span>
      </div>
      {empty ? (
        <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
          Sem atividades no período
        </p>
      ) : (
        <div className="flex items-baseline justify-between">
          <span className="font-num text-[32px] font-bold leading-none" style={{ color }}>{pct}%</span>
          <span className="font-num text-[12px]" style={{ color: 'var(--text-muted)' }}>{done}/{total}</span>
        </div>
      )}
      <div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
          <div className="h-full rounded-full transition-all duration-700"
            style={{ width: empty ? '100%' : `${pct}%`, background: empty ? 'var(--border)' : color, opacity: empty ? 0.3 : 1 }} />
        </div>
        <p className="text-[11px] mt-1.5" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
          {subtitle}
        </p>
      </div>
    </button>
  );
}

/* ── Card de stat clicável (tasks feitas / projetos feitos) ─────────── */
function DoneCard({ label, icon, count, accentColor, onClick }: {
  label: string; icon: string; count: number; accentColor: string; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button type="button" onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="text-left rounded-lg p-4 flex flex-col gap-2 transition-all duration-200 w-full"
      style={{
        background: 'var(--surface)',
        border: hovered ? `1px solid ${accentColor}` : '0.5px solid var(--border)',
        boxShadow: hovered ? `0 0 14px ${accentColor}30` : 'none',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-md flex items-center justify-center shrink-0"
          style={{ background: `${accentColor}18`, color: accentColor }}>
          <i className={`ph-light ${icon}`} style={{ fontSize: '14px' }} />
        </span>
        <span className="font-num text-[26px] font-bold leading-none" style={{ color: accentColor }}>{count}</span>
      </div>
      <p className="text-xs font-medium" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>{label}</p>
      <span className="flex items-center gap-0.5 font-label text-[9px] tracking-[0.08em] transition-colors"
        style={{ color: hovered ? accentColor : 'var(--text-muted)' }}>
        VER LISTA <i className="ph-light ph-caret-right" style={{ fontSize: '10px' }} />
      </span>
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   PÁGINA
═══════════════════════════════════════════════════════════════════════ */
export function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const { data: users, loading: usersLoading } = useUsers();
  const { data: tasks, reload } = useTasks();
  const { data: projects } = useProjects();

  const member = users.find((u) => u.id === id);
  const [doneModal, setDoneModal]         = useState<TaskPeriod | 'all' | null>(null);
  const [periodModal, setPeriodModal]     = useState<'today' | 'week' | null>(null);

  if (usersLoading) return <Layout title="Carregando…"><Loading /></Layout>;
  if (!member) return (
    <Layout title="Membro não encontrado" back={{ to: '/membros', label: 'Membros' }}>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Membro não encontrado.</p>
    </Layout>
  );

  const isSelf   = currentUser?.id === member.id;
  const canEdit  = currentUser?.role === 'socio' && member.role === 'estagiario';

  const memberTasks    = tasks.filter((t) => t.assignedTo.includes(member.id));
  const completedTasks = memberTasks.filter((t) => t.status === 'concluida');
  const activeTasks    = memberTasks.filter((t) => t.status === 'em_andamento');
  const pendingTasks   = memberTasks.filter((t) => t.status === 'pendente');

  const todayTasks = memberTasks.filter((t) => isToday(t.dueDate));
  const weekTasks  = memberTasks.filter((t) => isThisWeek(t.dueDate));
  const todayDone  = todayTasks.filter((t) => t.status === 'concluida').length;
  const weekDone   = weekTasks.filter((t) => t.status === 'concluida').length;

  const dailyDone  = memberTasks.filter((t) => taskPeriod(t) === 'diaria'  && t.status === 'concluida');
  const weeklyDone = memberTasks.filter((t) => taskPeriod(t) === 'semanal' && t.status === 'concluida');
  const modalTasks = doneModal === 'diaria' ? dailyDone : doneModal === 'semanal' ? weeklyDone : doneModal === 'all' ? completedTasks : [];

  const totalPct = memberTasks.length > 0 ? Math.round((completedTasks.length / memberTasks.length) * 100) : 0;
  const { color: barColor } = progressState(completedTasks.length, memberTasks.length);

  const getProjectName = (pid: string) => projects.find((p) => p.id === pid)?.name ?? '';

  const toggleTaskStatus = async (taskId: string) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t) return;
    await setTaskComplete(taskId, t.status !== 'concluida');
    if (t.status !== 'concluida') toast.success('Task concluída!');
    reload();
  };

  const STATUS_DOT: Record<string, string> = {
    concluida:    '#1D9E75',
    em_andamento: '#378ADD',
    pendente:     '#8A8A96',
  };

  return (
    <Layout
      title={member.name}
      back={{ to: '/membros', label: 'Membros' }}
      action={
        isSelf ? (
          <Link to="/perfil"
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-150"
            style={{ border: '0.5px solid #4A11A2', color: '#9966E0' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(74,17,162,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <Pencil size={13} /> Editar perfil
          </Link>
        ) : undefined
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── COLUNA ESQUERDA ── */}
        <div className="lg:col-span-1 space-y-4">

          {/* Card de perfil */}
          <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
            <div className="p-6 flex flex-col items-center text-center">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden mb-4"
                style={{ background: 'rgba(74,17,162,0.18)', border: '2px solid rgba(74,17,162,0.40)', boxShadow: '0 0 20px rgba(74,17,162,0.20)' }}>
                {member.photo
                  ? <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold font-mono" style={{ color: '#C9B6F0' }}>{member.initials}</span>}
              </div>

              <h2 className="font-semibold text-[17px]" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-primary)' }}>{member.name}</h2>
              {member.title && (
                <p className="text-xs mt-0.5" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>{member.title}</p>
              )}
              <div className="flex items-center gap-2 mt-2.5 flex-wrap justify-center">
                <Badge variant={member.role === 'socio' ? 'primary' : 'neutral'}>
                  {member.role === 'socio' ? 'Sócio' : 'Estagiário'}
                </Badge>
                {isSelf && <Badge variant="primary">Você</Badge>}
              </div>

              {member.bio && (
                <p className="text-xs leading-relaxed mt-4 text-left" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>
                  {member.bio}
                </p>
              )}

              {/* Contatos */}
              {(member.email || member.phone) && (
                <div className="w-full mt-4 pt-4 space-y-2" style={{ borderTop: '0.5px solid var(--border)' }}>
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs">
                      <i className="ph-light ph-envelope shrink-0" style={{ fontSize: '13px', color: '#9966E0' }} />
                      <span style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }} className="truncate">{member.email}</span>
                    </div>
                  )}
                  {member.phone && (
                    <div className="flex items-center gap-2 text-xs">
                      <i className="ph-light ph-phone shrink-0" style={{ fontSize: '13px', color: '#9966E0' }} />
                      <span style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>{member.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Responsabilidades */}
              {member.responsibilities && member.responsibilities.length > 0 && (
                <div className="w-full mt-4 pt-4" style={{ borderTop: '0.5px solid var(--border)' }}>
                  <p className="font-label text-[9px] tracking-[0.14em] mb-2 text-left" style={{ color: 'var(--text-muted)' }}>RESPONSABILIDADES</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.responsibilities.map((r) => (
                      <span key={r} className="font-label text-[9px] tracking-[0.06em] px-2 py-0.5 rounded"
                        style={{ background: 'rgba(74,17,162,0.10)', color: '#9966E0', border: '0.5px solid rgba(74,17,162,0.20)' }}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card de progresso geral */}
          <div className="rounded-lg p-5 space-y-4" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
            <p className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>PROGRESSO GERAL</p>

            <div className="flex items-center justify-between">
              <span className="text-xs" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>
                {completedTasks.length} de {memberTasks.length} concluídas
              </span>
              <span className="font-num text-[20px] font-bold" style={{ color: barColor }}>{totalPct}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${totalPct}%`, background: barColor }} />
            </div>

            {/* Stats rápidas */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {[
                { label: 'EM AND.', value: activeTasks.length,  color: '#378ADD' },
                { label: 'PEND.',   value: pendingTasks.length,  color: '#EF9F27' },
                { label: 'CONCL.',  value: completedTasks.length, color: '#1D9E75' },
              ].map((s) => (
                <div key={s.label} className="flex flex-col items-center py-2 rounded-md" style={{ background: 'var(--bg-subtle)' }}>
                  <span className="font-num text-[17px] font-bold" style={{ color: s.color }}>{s.value}</span>
                  <span className="font-label text-[8px] tracking-[0.08em] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Mini cards clicáveis */}
            <div className="grid grid-cols-2 gap-3">
              <DoneCard label="Tasks feitas"    icon="ph-sun"            count={dailyDone.length}  accentColor="#EF9F27" onClick={() => setDoneModal('diaria')} />
              <DoneCard label="Projetos feitos" icon="ph-calendar-dots" count={weeklyDone.length} accentColor="#9966E0" onClick={() => setDoneModal('semanal')} />
            </div>

            {/* Ver todas */}
            <button type="button" onClick={() => setDoneModal('all')}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md transition-all duration-150 font-label text-[10px] tracking-[0.10em]"
              style={{ border: '0.5px solid var(--border)', color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#1D9E75'; (e.currentTarget as HTMLElement).style.color = '#1D9E75'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLElement).style.color = 'var(--text-muted)'; }}>
              <i className="ph-light ph-check-circle" style={{ fontSize: '13px' }} />
              TODAS AS TASKS FEITAS
              <span className="font-num font-bold" style={{ color: '#1D9E75' }}>{completedTasks.length}</span>
              <i className="ph-light ph-caret-right" style={{ fontSize: '11px' }} />
            </button>
          </div>
        </div>

        {/* ── COLUNA DIREITA ── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Cards de progresso hoje / semana */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProgressCard
              label="Progresso de hoje"
              icon="ph-sun"
              done={todayDone}
              total={todayTasks.length}
              subtitle={todayTasks.length === 0 ? 'Sem tarefas hoje' : `${todayTasks.length} com prazo hoje`}
              onClick={() => setPeriodModal('today')}
            />
            <ProgressCard
              label="Progresso da semana"
              icon="ph-calendar-dots"
              done={weekDone}
              total={weekTasks.length}
              subtitle={weekTasks.length === 0 ? 'Sem tarefas esta semana' : `${weekTasks.length} na semana`}
              onClick={() => setPeriodModal('week')}
            />
          </div>

          {/* Lista de tasks */}
          <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
            <div className="flex items-center justify-between px-5 py-3" style={{ background: 'var(--bg-subtle)', borderBottom: '0.5px solid var(--border)' }}>
              <span className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                TASKS ({memberTasks.length})
              </span>
              {canEdit && (
                <span className="font-label text-[9px] tracking-[0.10em] flex items-center gap-1.5" style={{ color: '#9966E0' }}>
                  <i className="ph-light ph-pencil" style={{ fontSize: '11px' }} /> MODO EDIÇÃO
                </span>
              )}
            </div>

            {memberTasks.length === 0 ? (
              <div className="py-16 text-center">
                <i className="ph-light ph-clipboard-text" style={{ fontSize: '32px', color: 'var(--text-muted)' }} />
                <p className="font-label text-[10px] tracking-[0.14em] mt-3" style={{ color: 'var(--text-muted)' }}>NENHUMA TASK ATRIBUÍDA</p>
              </div>
            ) : (
              <div>
                {memberTasks.map((task) => {
                  const isDone = task.status === 'concluida';
                  const dot    = STATUS_DOT[task.status] ?? '#8A8A96';
                  return (
                    <div key={task.id}
                      className="flex items-center gap-4 px-5 py-3 transition-colors list-row"
                      style={{ borderBottom: '0.5px solid var(--border)' }}>

                      {canEdit ? (
                        <button onClick={() => toggleTaskStatus(task.id)}
                          className="w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 transition-all"
                          style={{ border: isDone ? 'none' : '1.5px solid rgba(255,255,255,0.22)', background: isDone ? '#1D9E75' : 'rgba(255,255,255,0.04)' }}>
                          {isDone && <i className="ph-bold ph-check" style={{ fontSize: '10px', color: '#fff' }} />}
                        </button>
                      ) : (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                      )}

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate"
                          style={{ fontFamily: 'Geist, system-ui', color: isDone ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: isDone ? 'line-through' : 'none' }}>
                          {task.title}
                        </p>
                        {task.projectId && (
                          <p className="text-[11px] mt-0.5 truncate" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>
                            {getProjectName(task.projectId)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={task.priority} />
                        <StatusBadge status={task.status} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal tasks do período (hoje / semana) */}
      <Modal
        open={periodModal !== null}
        onClose={() => setPeriodModal(null)}
        title={periodModal === 'today' ? 'Tasks de hoje' : 'Tasks da semana'}
        description={`${periodModal === 'today' ? todayTasks.length : weekTasks.length} tasks com prazo no período`}
        size="md"
      >
        {(() => {
          const list = periodModal === 'today' ? todayTasks : weekTasks;
          if (list.length === 0) return (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma task neste período.</p>
          );
          return (
            <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
              {list.map((task) => (
                <Link key={task.id} to={`/atividades/${task.id}`} onClick={() => setPeriodModal(null)}
                  className="flex items-center gap-3 p-3 rounded-md transition-colors"
                  style={{ background: 'var(--bg-subtle)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)')}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: task.status === 'concluida' ? '#1D9E75' : task.status === 'em_andamento' ? '#378ADD' : '#8A8A96' }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ fontFamily: 'Geist, system-ui', color: task.status === 'concluida' ? 'var(--text-muted)' : 'var(--text-primary)', textDecoration: task.status === 'concluida' ? 'line-through' : 'none' }}>{task.title}</p>
                    <p className="text-[11px] truncate" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>{getProjectName(task.projectId)}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={task.priority} />
                    <StatusBadge status={task.status} />
                  </div>
                </Link>
              ))}
            </div>
          );
        })()}
      </Modal>

      {/* Modal de tasks concluídas */}
      <Modal
        open={doneModal !== null}
        onClose={() => setDoneModal(null)}
        title={doneModal === 'all' ? 'Todas as tasks concluídas' : doneModal === 'semanal' ? 'Projetos concluídos' : 'Tasks concluídas'}
        description={`${modalTasks.length} ${modalTasks.length === 1 ? 'atividade' : 'atividades'} por ${member.name}`}
        size="md"
      >
        {modalTasks.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: 'var(--text-muted)' }}>Nenhuma atividade concluída.</p>
        ) : (
          <div className="space-y-1.5 max-h-[60vh] overflow-y-auto">
            {modalTasks.map((task) => {
              const isWeekly = taskPeriod(task) === 'semanal';
              const periodColor = isWeekly ? '#9966E0' : '#EF9F27';
              return (
                <Link key={task.id} to={`/atividades/${task.id}`} onClick={() => setDoneModal(null)}
                  className="flex items-center gap-3 p-3 rounded-md transition-colors"
                  style={{ background: 'var(--bg-subtle)' }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--surface2)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)')}>
                  <i className={`ph-light ${isWeekly ? 'ph-calendar-dots' : 'ph-sun'} shrink-0`}
                    style={{ fontSize: '14px', color: periodColor }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-through truncate" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>{task.title}</p>
                    <p className="text-[11px] truncate" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-muted)' }}>{getProjectName(task.projectId)}</p>
                  </div>
                  <StatusBadge status={task.status} />
                </Link>
              );
            })}
          </div>
        )}
      </Modal>
    </Layout>
  );
}
