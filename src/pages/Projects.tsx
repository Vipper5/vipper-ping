import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Pencil, CalendarClock, ListChecks, Target } from 'lucide-react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { FormField, Input, Select, Textarea } from '../components/ui/FormField';
import { Loading, ErrorState } from '../components/ui/Loading';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useProjects, useTasks, useUsers } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import { createProject, updateProject } from '../lib/api';
import { Project, ProjectStatus, Task, User } from '../mocks/data';

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

/** Data de hoje no formato yyyy-mm-dd (para inputs type="date"). */
function todayISO(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
}

function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

// Cor de acento do card por status do cliente.
const STATUS_ACCENT: Record<ProjectStatus, string> = {
  Ativo: '#047857',
  'Em Desenvolvimento': '#1D4ED8',
  Pausado: '#475569',
  'Concluído': '#0F766E',
};

// Metadados do prazo: cor + rótulo (relativo quando urgente, data caso contrário).
function deadlineMeta(endDate: string, status: ProjectStatus): { color: string; label: string; urgent: boolean } {
  if (!endDate) return { color: 'var(--text-muted)', label: '—', urgent: false };
  if (status === 'Concluído') return { color: 'var(--text-muted)', label: 'Entregue', urgent: false };
  const days = daysUntil(endDate);
  if (days < 0) return { color: '#B91C1C', label: `${Math.abs(days)}d em atraso`, urgent: true };
  if (days === 0) return { color: '#B91C1C', label: 'Entrega hoje', urgent: true };
  if (days <= 7) return { color: '#B45309', label: `Faltam ${days}d`, urgent: true };
  return { color: 'var(--text-muted)', label: formatDate(endDate), urgent: false };
}

function projectStats(projectId: string, allTasks: Task[]) {
  const tasks = allTasks.filter((t) => t.projectId === projectId);
  const done = tasks.filter((t) => t.status === 'concluida').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return { total: tasks.length, done, pct };
}

function Avatars({ ids, users }: { ids: string[]; users: User[] }) {
  return (
    <div className="flex -space-x-1.5">
      {ids.map((rid) => {
        const ru = users.find((u) => u.id === rid);
        return ru ? (
          <div
            key={rid}
            className="w-6 h-6 rounded-full bg-viper-700 border-2 flex items-center justify-center overflow-hidden"
            style={{ borderColor: 'var(--surface)' }}
            title={ru.name}
          >
            {ru.photo ? (
              <img src={ru.photo} alt={ru.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-viper-200 font-bold font-mono" style={{ fontSize: '9px' }}>{ru.initials}</span>
            )}
          </div>
        ) : null;
      })}
    </div>
  );
}

interface ProjectFormData {
  name: string;
  client: string;
  status: ProjectStatus;
  stack: string;
  startDate: string;
  endDate: string;
  description: string;
  responsibles: string[];
}

const defaultForm: ProjectFormData = {
  name: '',
  client: '',
  status: 'Ativo',
  stack: '',
  startDate: '',
  endDate: '',
  description: '',
  responsibles: [],
};

export function Projects() {
  const { user } = useAuth();
  const { dark } = useTheme();
  const toast = useToast();
  const { data: projects, loading, error, reload } = useProjects();
  const { data: tasks } = useTasks();
  const { data: users } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(defaultForm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [hoveredFilter, setHoveredFilter] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const isSocio = user?.role === 'socio';

  const openCreate = () => {
    setEditProject(null);
    // Data de início já preenchida com o dia atual.
    setForm({ ...defaultForm, startDate: todayISO() });
    setShowModal(true);
  };

  const openEdit = (p: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditProject(p);
    setForm({
      name: p.name,
      client: p.client,
      status: p.status,
      stack: p.stack.join(', '),
      startDate: p.startDate,
      endDate: p.endDate,
      description: p.description,
      responsibles: p.responsibles,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    const stackArr = form.stack.split(',').map((s) => s.trim()).filter(Boolean);
    const input = {
      name: form.name,
      client: form.client,
      status: form.status,
      stack: stackArr,
      startDate: form.startDate,
      endDate: form.endDate,
      description: form.description,
      responsibles: form.responsibles,
    };
    setSaving(true);
    try {
      if (editProject) {
        await updateProject(editProject.id, input);
      } else {
        await createProject(input);
      }
      setShowModal(false);
      reload();
      toast.success('Operação concluída.');
    } catch {
      toast.error('Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  // Fecha o modal sinalizando que a operação foi cancelada.
  const cancelModal = () => {
    setShowModal(false);
    toast.error('Operação cancelada');
  };

  const toggleResponsible = (id: string) => {
    setForm((f) => ({
      ...f,
      responsibles: f.responsibles.includes(id)
        ? f.responsibles.filter((r) => r !== id)
        : [...f.responsibles, id],
    }));
  };

  const counts = {
    all: projects.length,
    Ativo: projects.filter((p) => p.status === 'Ativo').length,
    'Em Desenvolvimento': projects.filter((p) => p.status === 'Em Desenvolvimento').length,
    Pausado: projects.filter((p) => p.status === 'Pausado').length,
    'Concluído': projects.filter((p) => p.status === 'Concluído').length,
  };

  const filtered = statusFilter === 'all' ? projects : projects.filter((p) => p.status === statusFilter);

  const filters: { key: string; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'Ativo', label: 'Ativos' },
    { key: 'Em Desenvolvimento', label: 'Em Desenvolvimento' },
    { key: 'Pausado', label: 'Pausados' },
    { key: 'Concluído', label: 'Concluídos' },
  ];

  // Cor de cada filtro. `darkText` = texto escuro em light mode (garante contraste no fundo claro).
  const filterColors: Record<string, { base: string; light: string; glow: string; darkText: string }> = {
    all:                  { base: '#6D28D9', light: '#7C3AED', glow: '109,40,217',  darkText: '#5B21B6' },
    Ativo:                { base: '#047857', light: '#059669', glow: '4,120,87',    darkText: '#065F46' },
    'Em Desenvolvimento': { base: '#1D4ED8', light: '#2563EB', glow: '29,78,216',  darkText: '#1E40AF' },
    Pausado:              { base: '#475569', light: '#64748B', glow: '71,85,105',   darkText: '#334155' },
    'Concluído':          { base: '#0F766E', light: '#0D9488', glow: '15,118,110', darkText: '#115E59' },
  };

  return (
    <Layout
      title="Clientes"
      subtitle={`${counts.Ativo} ativos · ${projects.length} no total`}
      action={
        isSocio ? (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={15} /> Novo cliente
          </Button>
        ) : undefined
      }
    >
      {/* Filtros com contagem — cor + brilho neon característicos de cada status */}
      <div className="flex flex-wrap gap-2 mb-6">
        {filters.map((f) => {
          const active = statusFilter === f.key;
          const isHover = hoveredFilter === f.key;
          const c = filterColors[f.key];
          const inactiveText = dark ? (isHover ? c.light : c.base) : (isHover ? c.light : c.darkText);
          const style: React.CSSProperties = active
            ? {
                backgroundColor: isHover ? c.light : c.base,
                borderColor: isHover ? c.light : c.base,
                color: '#fff',
                boxShadow: dark ? `0 0 12px rgba(${c.glow},${isHover ? 0.35 : 0.22})` : 'none',
              }
            : {
                backgroundColor: isHover ? `rgba(${c.glow},0.10)` : 'transparent',
                borderColor: inactiveText,
                color: inactiveText,
                boxShadow: 'none',
              };
          return (
            <button
              key={f.key}
              onClick={() => setStatusFilter(f.key)}
              onMouseEnter={() => setHoveredFilter(f.key)}
              onMouseLeave={() => setHoveredFilter(null)}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-md text-sm font-medium border transition-all duration-150"
              style={style}
            >
              {f.label}
              <span
                className="text-xs font-mono px-1.5 rounded-md"
                style={
                  active
                    ? { backgroundColor: 'rgba(255,255,255,0.2)' }
                    : { backgroundColor: `rgba(${c.glow},0.12)`, color: inactiveText }
                }
              >
                {counts[f.key as keyof typeof counts]}
              </span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <Loading label="Carregando clientes…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-base-muted">
          <div className="w-12 h-12 mx-auto rounded-md border-2 border-dashed flex items-center justify-center mb-3" style={{ borderColor: 'var(--border)' }}>
            <span className="text-xl">📂</span>
          </div>
          <p className="text-sm">Nenhum cliente encontrado.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((project) => {
            const st = projectStats(project.id, tasks);
            const dl = deadlineMeta(project.endDate, project.status);
            const accent = STATUS_ACCENT[project.status] ?? '#8637CC';
            const objTotal = project.objectives.length;
            const objDone = project.objectives.filter((o) => o.done).length;
            return (
              <Link
                key={project.id}
                to={`/projetos/${project.id}`}
                className="group relative card-interactive rounded-xl overflow-hidden p-5 pl-6 flex flex-col"
              >
                {/* Acento lateral por status */}
                <span className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: accent }} />

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono font-semibold text-base-primary text-[15px] truncate group-hover:text-viper-500 transition-colors">
                      {project.name}
                    </p>
                    <p className="text-xs text-base-muted mt-0.5 truncate">{project.client}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <StatusBadge status={project.status} />
                    {isSocio && (
                      <button
                        onClick={(e) => openEdit(project, e)}
                        title="Editar cliente"
                        className="p-1 rounded text-base-muted hover:text-viper-500 hover:bg-viper-50 dark:hover:bg-carvao-surface2 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Stack */}
                {project.stack.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {project.stack.slice(0, 4).map((s) => (
                      <span
                        key={s}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
                      >
                        {s}
                      </span>
                    ))}
                    {project.stack.length > 4 && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                        +{project.stack.length - 4}
                      </span>
                    )}
                  </div>
                )}

                {/* Progresso (empurrado para a base p/ alinhar os cards) */}
                <div className="mt-auto pt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-xs text-base-muted">
                      <ListChecks size={13} /> {st.done}/{st.total} tarefas
                    </span>
                    <span className="text-sm font-num font-bold" style={{ color: accent }}>{st.pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-subtle)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${st.pct}%`, backgroundColor: accent, transition: 'width 0.6s ease' }}
                    />
                  </div>
                  {objTotal > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-base-muted">
                      <Target size={12} className="text-viper-400" />
                      <span>{objDone}/{objTotal} objetivos</span>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div
                  className="flex items-center justify-between pt-4 mt-4 border-t"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <Avatars ids={project.responsibles} users={users} />
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2 py-1 rounded-full"
                      style={
                        dl.urgent
                          ? { backgroundColor: `${dl.color}1f`, color: dl.color }
                          : { color: dl.color }
                      }
                    >
                      <CalendarClock size={12} />
                      {dl.label}
                    </span>
                    <ArrowRight size={14} className="text-viper-500 opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal
        open={showModal}
        onClose={cancelModal}
        title={editProject ? 'Editar cliente' : 'Novo cliente'}
        size="lg"
        footer={
          <>
            <Button variant="destructive" onClick={cancelModal}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.name.trim() || saving}>
              {saving ? 'Salvando…' : editProject ? 'Salvar alterações' : 'Criar cliente'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome do cliente" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="acme-corp"
                className="font-mono"
              />
            </FormField>
            <FormField label="Empresa" required>
              <Input
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                placeholder="Nome da empresa"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FormField label="Status">
              <Select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ProjectStatus }))}>
                <option>Ativo</option>
                <option>Em Desenvolvimento</option>
                <option>Pausado</option>
                <option>Concluído</option>
              </Select>
            </FormField>
            <FormField label="Início">
              <Input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
            </FormField>
            <FormField label="Prazo">
              <Input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
            </FormField>
          </div>

          <FormField label="Stack" hint="Separe por vírgula: React, Node.js, PostgreSQL">
            <Input
              value={form.stack}
              onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))}
              placeholder="React, Node.js, TypeScript"
              className="font-mono"
            />
          </FormField>

          <FormField label="Descrição">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Descreva o objetivo do cliente..."
            />
          </FormField>

          <FormField label="Responsáveis">
            <div className="flex gap-2 flex-wrap">
              {users.map((u) => {
                const selected = form.responsibles.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleResponsible(u.id)}
                    className={`chip flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium ${selected ? 'chip-selected' : ''}`}
                  >
                    <Avatar user={u} size={20} fontSize={9} />
                    {u.name}
                  </button>
                );
              })}
            </div>
          </FormField>
        </div>
      </Modal>
    </Layout>
  );
}
