import { useState } from 'react';
import { Download, Filter } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { KpiCard } from '../components/ui/KpiCard';
import { StatusBadge } from '../components/ui/Badge';
import { FormField, Select, Input } from '../components/ui/FormField';
import { Loading } from '../components/ui/Loading';
import { useTasks, useProjects, useUsers } from '../lib/hooks';
import { CheckSquare, User } from 'lucide-react';

function formatDateTime(d: string) {
  return new Date(d).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function Reports() {
  const { data: allTasks, loading: tasksLoading } = useTasks();
  const { data: projects, loading: projectsLoading } = useProjects();
  const { data: users, loading: usersLoading } = useUsers();
  const [projectFilter, setProjectFilter] = useState('all');
  const [personFilter, setPersonFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const loading = tasksLoading || projectsLoading || usersLoading;

  const completedTasks = allTasks.filter((t) => t.status === 'concluida' && t.completedAt);

  const filtered = completedTasks.filter((t) => {
    const projectOk = projectFilter === 'all' || t.projectId === projectFilter;
    const personOk = personFilter === 'all' || t.assignedTo.includes(personFilter);
    const fromOk = !fromDate || t.completedAt! >= fromDate;
    const toOk = !toDate || t.completedAt! <= toDate + 'T23:59:59';
    return projectOk && personOk && fromOk && toOk;
  });

  const getUserName = (id: string) => users.find((u) => u.id === id)?.name ?? id;
  const getProjectName = (id: string) => projects.find((p) => p.id === id)?.name ?? id;

  const byPerson = users.map((u) => ({
    name: u.name,
    count: filtered.filter((t) => t.assignedTo.includes(u.id)).length,
  })).filter((x) => x.count > 0);

  const byProject = projects.map((p) => ({
    name: p.name,
    count: filtered.filter((t) => t.projectId === p.id).length,
  })).filter((x) => x.count > 0);

  // KPIs por pessoa — primeiros 3 membros (sócios primeiro, conforme ordenação)
  const kpiUsers = users.slice(0, 3);

  if (loading) {
    return (
      <Layout title="Relatórios">
        <Loading label="Carregando relatórios…" />
      </Layout>
    );
  }

  return (
    <Layout
      title="Relatórios"
      action={
        <Button variant="secondary" size="sm">
          <Download size={14} /> Exportar CSV
        </Button>
      }
    >
      {/* Filters */}
      <div className="card rounded-md p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-base-muted" />
          <span className="text-xs font-mono text-base-muted uppercase tracking-wider">Filtros</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FormField label="Cliente">
            <Select value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
              <option value="all">Todos os clientes</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="Pessoa">
            <Select value={personFilter} onChange={(e) => setPersonFilter(e.target.value)}>
              <option value="all">Todos</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </FormField>

          <FormField label="De">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </FormField>

          <FormField label="Até">
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </FormField>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Tasks concluídas"
          value={filtered.length}
          icon={<CheckSquare size={16} />}
          trend="up"
          trendLabel="no período"
        />
        {kpiUsers.map((u) => (
          <KpiCard
            key={u.id}
            label={`Por ${u.name}`}
            value={filtered.filter((t) => t.assignedTo.includes(u.id)).length}
            icon={<User size={16} />}
          />
        ))}
      </div>

      {/* Summary row */}
      {(byPerson.length > 0 || byProject.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="card rounded-md p-5">
            <h3 className="text-xs font-mono text-base-muted uppercase tracking-wider mb-3">Por pessoa</h3>
            <div className="space-y-2">
              {byPerson.map((x) => (
                <div key={x.name} className="flex items-center gap-3">
                  <span className="text-sm text-base-secondary w-20">{x.name}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--track)' }}>
                    <div
                      className="h-full rounded-full bg-viper-500"
                      style={{ width: `${(x.count / filtered.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-base-muted w-6 text-right">{x.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card rounded-md p-5">
            <h3 className="text-xs font-mono text-base-muted uppercase tracking-wider mb-3">Por cliente</h3>
            <div className="space-y-2">
              {byProject.map((x) => (
                <div key={x.name} className="flex items-center gap-3">
                  <span className="text-sm font-mono text-base-secondary w-24 truncate">{x.name}</span>
                  <div className="flex-1 h-1.5 rounded-full" style={{ background: 'var(--track)' }}>
                    <div
                      className="h-full rounded-full bg-viper-400"
                      style={{ width: `${(x.count / filtered.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-base-muted w-6 text-right">{x.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card rounded-md overflow-hidden">
        <div className="px-5 py-3 border-b border-base flex items-center justify-between"
             style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
          <span className="text-xs font-mono text-base-muted uppercase tracking-wider">
            Tasks concluídas ({filtered.length})
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-base-muted text-sm">
            Nenhuma task concluída no período selecionado.
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-base" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}>
                <th className="text-left px-5 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Task</th>
                <th className="text-left px-5 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Quem fez</th>
                <th className="text-left px-5 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Cliente</th>
                <th className="text-left px-5 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Concluída em</th>
                <th className="text-left px-5 py-3 text-xs font-mono text-base-muted uppercase tracking-wider">Prior.</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task, i) => (
                <tr
                  key={task.id}
                  className="border-b last:border-0 transition-colors hover:bg-subtle"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-subtle)',
                  }}
                >
                  <td className="px-5 py-3">
                    <p className="font-medium text-base-primary line-through opacity-70">{task.title}</p>
                  </td>
                  <td className="px-5 py-3 text-base-secondary font-mono text-xs">{task.assignedTo.map((id) => getUserName(id)).join(', ')}</td>
                  <td className="px-5 py-3 text-viper-500 font-mono text-xs">{getProjectName(task.projectId)}</td>
                  <td className="px-5 py-3 text-base-muted font-mono text-xs">
                    {task.completedAt ? formatDateTime(task.completedAt) : '—'}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={task.priority} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
