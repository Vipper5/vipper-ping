import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Badge } from '../components/ui/Badge';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useUsers, useTasks } from '../lib/hooks';
import { useAuth } from '../contexts/AuthContext';

export function Members() {
  const { user } = useAuth();
  const { data: users, loading, error } = useUsers();
  const { data: tasks } = useTasks();

  return (
    <Layout title="Membros">
      {loading ? (
        <Loading label="Carregando equipe…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {users.map((member) => {
            const memberTasks    = tasks.filter((t) => t.assignedTo.includes(member.id));
            const activeTasks    = memberTasks.filter((t) => t.status === 'em_andamento');
            const pendingTasks   = memberTasks.filter((t) => t.status === 'pendente');
            const completedTasks = memberTasks.filter((t) => t.status === 'concluida');
            const totalActive    = activeTasks.length + pendingTasks.length;
            const pct            = memberTasks.length > 0
              ? Math.round((completedTasks.length / memberTasks.length) * 100)
              : 0;
            const isCurrentUser = user?.id === member.id;

            return (
              <Link key={member.id} to={`/membros/${member.id}`}
                className="group card-interactive rounded-lg flex flex-col overflow-hidden"
                style={{ minHeight: '260px' }}>

                {/* ── Faixa superior roxa ── */}
                <div className="h-[6px] w-full" style={{ background: 'linear-gradient(90deg, #4A11A2 0%, #9966E0 100%)' }} />

                <div className="flex flex-col gap-0 flex-1 p-5">
                  {/* ── Header: avatar + nome + cargo ── */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center shrink-0 overflow-hidden transition-all"
                      style={{ background: 'rgba(74,17,162,0.20)', border: '2px solid rgba(74,17,162,0.40)' }}>
                      {member.photo ? (
                        <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold font-mono" style={{ color: '#C9B6F0' }}>{member.initials}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[15px] group-hover:text-viper-400 transition-colors" style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-primary)' }}>
                          {member.name}
                        </p>
                        {isCurrentUser && <Badge variant="primary">Você</Badge>}
                      </div>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
                        {member.title ?? (member.role === 'socio' ? 'Sócio' : 'Estagiário')}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge variant={member.role === 'socio' ? 'primary' : 'neutral'}>
                          {member.role === 'socio' ? 'Sócio' : 'Estagiário'}
                        </Badge>
                        {member.email && (
                          <span className="font-label text-[9px] tracking-[0.06em] truncate max-w-[140px]" style={{ color: 'var(--text-muted)' }}>
                            {member.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ── Bio ── */}
                  {member.bio && (
                    <p className="text-xs leading-relaxed mb-4 line-clamp-2"
                      style={{ fontFamily: 'Geist, system-ui', color: 'var(--text-secondary)' }}>
                      {member.bio}
                    </p>
                  )}

                  {/* ── Responsabilidades ── */}
                  {member.responsibilities && member.responsibilities.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {member.responsibilities.slice(0, 3).map((r) => (
                        <span key={r} className="font-label text-[9px] tracking-[0.08em] px-2 py-0.5 rounded"
                          style={{ background: 'rgba(74,17,162,0.10)', color: '#9966E0', border: '0.5px solid rgba(74,17,162,0.20)' }}>
                          {r}
                        </span>
                      ))}
                      {member.responsibilities.length > 3 && (
                        <span className="font-label text-[9px] tracking-[0.08em] px-2 py-0.5 rounded"
                          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)', border: '0.5px solid var(--border)' }}>
                          +{member.responsibilities.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* ── Espaço flex para empurrar stats para baixo ── */}
                  <div className="flex-1" />

                  {/* ── Stats ── */}
                  <div className="pt-3" style={{ borderTop: '0.5px solid var(--border)' }}>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="flex flex-col items-center p-2 rounded-md" style={{ background: 'var(--bg-subtle)' }}>
                        <span className="font-num text-[18px] font-bold" style={{ color: '#378ADD' }}>{activeTasks.length}</span>
                        <span className="font-label text-[8px] tracking-[0.10em] mt-0.5" style={{ color: 'var(--text-muted)' }}>EM ANDAMENTO</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-md" style={{ background: 'var(--bg-subtle)' }}>
                        <span className="font-num text-[18px] font-bold" style={{ color: '#EF9F27' }}>{pendingTasks.length}</span>
                        <span className="font-label text-[8px] tracking-[0.10em] mt-0.5" style={{ color: 'var(--text-muted)' }}>PENDENTES</span>
                      </div>
                      <div className="flex flex-col items-center p-2 rounded-md" style={{ background: 'var(--bg-subtle)' }}>
                        <span className="font-num text-[18px] font-bold" style={{ color: '#1D9E75' }}>{completedTasks.length}</span>
                        <span className="font-label text-[8px] tracking-[0.10em] mt-0.5" style={{ color: 'var(--text-muted)' }}>CONCLUÍDAS</span>
                      </div>
                    </div>

                    {/* Barra de progresso */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-label text-[9px] tracking-[0.10em]" style={{ color: 'var(--text-muted)' }}>
                        CONCLUSÃO GERAL
                      </span>
                      <span className="font-num text-[11px] font-bold" style={{ color: pct >= 70 ? '#1D9E75' : pct >= 40 ? '#9966E0' : '#EF9F27' }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-subtle)' }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 70
                            ? 'linear-gradient(90deg, #1D9E75, #15BB77)'
                            : pct >= 40
                            ? 'linear-gradient(90deg, #4A11A2, #9966E0)'
                            : 'linear-gradient(90deg, #EF9F27, #F5C842)',
                        }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Layout>
  );
}
