import { useState, useEffect } from 'react';
import { Clock, CheckCircle2, Circle, ArrowRight } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { TimeEntry, calcHours } from '../mocks/data';
import { useAuth } from '../contexts/AuthContext';
import { useTimeEntries } from '../lib/hooks';
import { punchClock } from '../lib/api';

type Punch = 'entrada' | 'saidaAlmoco' | 'voltaAlmoco' | 'saida';

const PUNCHES: { key: Punch; label: string; icon: string }[] = [
  { key: 'entrada', label: 'Entrada', icon: '→' },
  { key: 'saidaAlmoco', label: 'Saída almoço', icon: '⇥' },
  { key: 'voltaAlmoco', label: 'Volta almoço', icon: '⇤' },
  { key: 'saida', label: 'Saída', icon: '←' },
];

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function getNextPunch(entry: Partial<TimeEntry>): Punch | null {
  if (!entry.entrada) return 'entrada';
  if (!entry.saidaAlmoco) return 'saidaAlmoco';
  if (!entry.voltaAlmoco) return 'voltaAlmoco';
  if (!entry.saida) return 'saida';
  return null;
}

export function Ponto() {
  const { user } = useAuth();
  const { data: entries, reload } = useTimeEntries(user?.id);
  const [now, setNow] = useState(new Date());
  const [punching, setPunching] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = now.toISOString().split('T')[0];
  const todayEntry: Partial<TimeEntry> = entries.find((e) => e.date === todayStr) ?? { date: todayStr };
  const nextPunch = getNextPunch(todayEntry);

  const currentTime = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  const currentDate = now.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handlePunch = async () => {
    if (!nextPunch || !user || punching) return;
    const punchTime = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setPunching(true);
    try {
      await punchClock(user.id, todayStr, nextPunch, punchTime);
      reload();
    } finally {
      setPunching(false);
    }
  };

  const getNextLabel = () => {
    if (!nextPunch) return 'Dia encerrado';
    return PUNCHES.find((p) => p.key === nextPunch)?.label ?? '';
  };

  const history = entries.filter((e) => e.date !== todayStr).slice(0, 10);

  return (
    <Layout
      title="Ponto"
    >
      <div className="max-w-2xl mx-auto">
        {/* Clock card */}
        <div
          className="rounded-xl p-8 mb-6 text-center"
          style={{ backgroundColor: '#0E0F11', border: '1px solid #2A2B30' }}
        >
          {/* Live clock */}
          <p className="text-neutral-500 text-xs font-mono uppercase tracking-widest mb-3">
            {currentDate}
          </p>
          <p className="text-white font-mono font-bold text-6xl tracking-tight mb-1">
            {currentTime}
          </p>

          {/* Punches today */}
          <div className="flex justify-center gap-4 mt-6 mb-8">
            {PUNCHES.map((punch) => {
              const val = (todayEntry as any)[punch.key] as string | undefined;
              const isNext = nextPunch === punch.key;
              const isDone = !!val;

              return (
                <div key={punch.key} className="flex flex-col items-center gap-1.5">
                  <div
                    className="w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all"
                    style={{
                      borderColor: isDone ? '#1D9E75' : isNext ? '#4A11A2' : '#1F1F24',
                      background: isDone ? 'rgba(29,158,117,0.10)' : isNext ? 'rgba(74,17,162,0.10)' : '#141417',
                    }}
                  >
                    {isDone ? (
                      <CheckCircle2 size={18} className="text-success" />
                    ) : isNext ? (
                      <Circle size={18} className="text-viper-400 animate-pulse" />
                    ) : (
                      <Circle size={18} className="text-neutral-600" />
                    )}
                  </div>
                  <p className={`text-xs font-mono ${
                    isDone ? 'text-neutral-400' : isNext ? 'text-viper-400' : 'text-neutral-600'
                  }`}>
                    {punch.label}
                  </p>
                  <p className={`text-sm font-mono font-bold ${isDone ? 'text-white' : 'text-neutral-600'}`}>
                    {val ?? '--:--'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* CTA punch button */}
          {nextPunch ? (
            <button
              onClick={handlePunch}
              disabled={punching}
              className="inline-flex items-center gap-3 bg-viper-500 text-white font-bold text-base px-8 py-4 rounded-md hover:bg-viper-400 active:bg-viper-600 transition-colors disabled:opacity-60"
            >
              <Clock size={20} />
              {punching ? 'Registrando…' : `Bater ponto — ${getNextLabel()}`}
              <ArrowRight size={18} />
            </button>
          ) : (
            <div className="inline-flex items-center gap-2 text-neutral-500 font-medium text-base px-8 py-4 rounded-xl" style={{ background: 'var(--surface2)' }}>
              <CheckCircle2 size={20} className="text-success" />
              Dia completo
            </div>
          )}

          {/* Today's hours */}
          {todayEntry.entrada && todayEntry.saida && (
            <p className="mt-4 text-success font-mono text-sm">
              Total hoje: {calcHours(todayEntry as TimeEntry)}
            </p>
          )}
        </div>

        {/* History table */}
        <div className="card rounded-md overflow-hidden">
          <div className="px-5 py-3 border-b border-base"
               style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
            <span className="text-xs font-mono text-base-muted uppercase tracking-wider">
              Histórico recente
            </span>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border)' }}>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Data</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Entrada</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Saída almoço</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Volta</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Saída</th>
                <th className="text-left px-4 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {/* Today row */}
              <tr
                className="border-b"
                style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
              >
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-viper-500">Hoje</span>
                </td>
                {(['entrada', 'saidaAlmoco', 'voltaAlmoco', 'saida'] as Punch[]).map((k) => (
                  <td key={k} className="px-4 py-3">
                    <span className={`font-mono text-xs ${(todayEntry as any)[k] ? 'text-base-primary' : 'text-base-muted'}`}>
                      {(todayEntry as any)[k] ?? '--:--'}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span className={`font-mono text-xs font-medium ${
                    (todayEntry as TimeEntry).entrada && (todayEntry as TimeEntry).saida ? 'text-success' : 'text-base-muted'
                  }`}>
                    {calcHours(todayEntry as TimeEntry)}
                  </span>
                </td>
              </tr>

              {history.map((entry, i) => (
                <tr
                  key={entry.id}
                  className="border-b last:border-0"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-subtle)',
                  }}
                >
                  <td className="px-4 py-3 text-xs font-mono text-base-muted">{formatDate(entry.date)}</td>
                  {(['entrada', 'saidaAlmoco', 'voltaAlmoco', 'saida'] as Punch[]).map((k) => (
                    <td key={k} className="px-4 py-3">
                      <span className={`font-mono text-xs ${(entry as any)[k] ? 'text-base-primary' : 'text-base-muted'}`}>
                        {(entry as any)[k] ?? '--:--'}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3">
                    <span className={`font-mono text-xs font-medium ${
                      entry.entrada && entry.saida ? 'text-success' : 'text-base-muted'
                    }`}>
                      {calcHours(entry)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
