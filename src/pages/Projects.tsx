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
import { useProjects, useTasks, useUsers } from '../lib/hooks';
import { Avatar } from '../components/ui/Avatar';
import { createProject, updateProject } from '../lib/api';
import { Project, ProjectStatus, Task, User } from '../mocks/data';

// ─── helpers ───────────────────────────────────────────

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
  });
}

function todayISO(): string {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().split('T')[0];
}

function daysUntil(d: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(d + 'T00:00:00').getTime() - today.getTime()) / 86400000);
}

function deadlineMeta(endDate: string, status: ProjectStatus): { color: string; label: string; urgent: boolean } {
  if (!endDate) return { color: 'var(--text-muted)', label: '—', urgent: false };
  if (status === 'Concluído') return { color: 'var(--text-muted)', label: 'Entregue', urgent: false };
  const days = daysUntil(endDate);
  if (days < 0)  return { color: '#EF4444', label: `${Math.abs(days)}d em atraso`, urgent: true };
  if (days === 0) return { color: '#EF4444', label: 'Hoje', urgent: true };
  if (days <= 7)  return { color: '#EF9F27', label: `${days}d`, urgent: true };
  return { color: 'var(--text-muted)', label: formatDate(endDate), urgent: false };
}

function projectStats(projectId: string, allTasks: Task[]) {
  const tasks = allTasks.filter((t) => t.projectId === projectId);
  const done = tasks.filter((t) => t.status === 'concluida').length;
  const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
  return { total: tasks.length, done, pct };
}

function progressColor(pct: number): string {
  if (pct >= 75) return '#1D9E75';
  if (pct >= 35) return '#4A11A2';
  return '#EF4444';
}

// ─── sub-componentes ─────────────────────────────────

function AvatarStack({ ids, users }: { ids: string[]; users: User[] }) {
  return (
    <div className="flex -space-x-2">
      {ids.slice(0, 4).map((rid) => {
        const ru = users.find((u) => u.id === rid);
        return ru ? (
          <div key={rid} title={ru.name} className="w-6 h-6 rounded-full overflow-hidden shrink-0" style={{ border: '1.5px solid var(--surface)' }}>
            {ru.photo ? (
              <img src={ru.photo} alt={ru.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center" style={{ background: 'rgba(74,17,162,0.30)', color: '#C9B6F0' }}>
                <span style={{ fontSize: '8px', fontFamily: 'Oswald, sans-serif', fontWeight: 600 }}>{ru.initials}</span>
              </div>
            )}
          </div>
        ) : null;
      })}
      {ids.length > 4 && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ border: '1.5px solid var(--surface)', background: 'var(--surface2)', color: 'var(--text-muted)' }}>
          <span style={{ fontSize: '8px' }}>+{ids.length - 4}</span>
        </div>
      )}
    </div>
  );
}

// Dropdown de filtros customizado
const STATUS_OPTIONS = [
  { key: 'all',                label: 'TODOS',            dot: '#8A8A96' },
  { key: 'Ativo',              label: 'ATIVOS',           dot: '#1D9E75' },
  { key: 'Em Desenvolvimento', label: 'EM DESENVOLVIMENTO', dot: '#378ADD' },
  { key: 'Pausado',            label: 'PAUSADOS',         dot: '#EF9F27' },
  { key: 'Pendente',           label: 'PENDENTES',        dot: '#EF4444' },
];

function FilterDropdown({ value, onChange, counts }: {
  value: string;
  onChange: (v: string) => void;
  counts: Record<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  const current = STATUS_OPTIONS.find((o) => o.key === value) ?? STATUS_OPTIONS[0];
  const count = counts[value] ?? 0;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-150"
        style={{
          border: '0.5px solid var(--border)',
          background: 'var(--surface)',
          color: 'var(--text-secondary)',
          minWidth: '180px',
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: current.dot }} />
        <span className="font-label text-[11px] tracking-[0.10em] flex-1 text-left">{current.label}</span>
        <span
          className="font-label text-[10px] px-1.5 py-0.5 rounded"
          style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}
        >
          {count}
        </span>
        <i
          className="ph-light ph-caret-down shrink-0"
          style={{ fontSize: '13px', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: 'var(--text-muted)' }}
        />
      </button>

      {open && (
        <div
          className="dropdown-menu absolute top-full left-0 mt-1 z-20 w-full py-1"
          style={{ minWidth: '200px' }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onChange(opt.key); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors text-left"
              style={{
                background: value === opt.key ? 'rgba(74,17,162,0.10)' : 'transparent',
                color: value === opt.key ? '#9966E0' : 'var(--text-secondary)',
              }}
              onMouseEnter={(e) => { if (value !== opt.key) (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'; }}
              onMouseLeave={(e) => { if (value !== opt.key) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: opt.dot }} />
              <span className="font-label text-[11px] tracking-[0.10em] flex-1">{opt.label}</span>
              <span className="font-label text-[10px]" style={{ color: 'var(--text-muted)' }}>
                {counts[opt.key] ?? 0}
              </span>
              {value === opt.key && <i className="ph-light ph-check shrink-0" style={{ fontSize: '13px', color: '#4A11A2' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── form ────────────────────────────────────────────

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
  name: '', client: '', status: 'Ativo', stack: '',
  startDate: '', endDate: '', description: '', responsibles: [],
};

const STATUS_ORDER: Record<string, number> = {
  Ativo: 0, 'Em Desenvolvimento': 1, Pausado: 2, Pendente: 3, 'Concluído': 4,
};

// ─── COMPONENT ───────────────────────────────────────

export function Projects() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: projects, loading, error, reload } = useProjects();
  const { data: tasks } = useTasks();
  const { data: users } = useUsers();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<Project | null>(null);
  const [form, setForm] = useState<ProjectFormData>(defaultForm);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  const isSocio = user?.role === 'socio';

  const openCreate = () => {
    setEditProject(null);
    setForm({ ...defaultForm, startDate: todayISO() });
    setShowModal(true);
  };

  const openEdit = (p: Project, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditProject(p);
    setForm({
      name: p.name, client: p.client, status: p.status,
      stack: p.stack.join(', '), startDate: p.startDate,
      endDate: p.endDate, description: p.description, responsibles: p.responsibles,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || saving) return;
    const stackArr = form.stack.split(',').map((s) => s.trim()).filter(Boolean);
    const input = {
      name: form.name, client: form.client, status: form.status, stack: stackArr,
      startDate: form.startDate, endDate: form.endDate,
      description: form.description, responsibles: form.responsibles,
    };
    setSaving(true);
    try {
      if (editProject) { await updateProject(editProject.id, input); }
      else { await createProject(input); }
      setShowModal(false);
      reload();
      toast.success('Operação concluída.');
    } catch (e) {
      toast.error(`Não foi possível salvar: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setSaving(false);
    }
  };

  const cancelModal = () => { setShowModal(false); toast.error('Operação cancelada'); };

  const toggleResponsible = (id: string) => {
    setForm((f) => ({
      ...f,
      responsibles: f.responsibles.includes(id)
        ? f.responsibles.filter((r) => r !== id)
        : [...f.responsibles, id],
    }));
  };

  const counts: Record<string, number> = {
    all:                  projects.length,
    Ativo:                projects.filter((p) => p.status === 'Ativo').length,
    'Em Desenvolvimento': projects.filter((p) => p.status === 'Em Desenvolvimento').length,
    Pausado:              projects.filter((p) => p.status === 'Pausado').length,
    Pendente:             projects.filter((p) => p.status === 'Pendente').length,
  };

  const sortProjects = (list: Project[]) =>
    [...list].sort((a, b) => {
      const diff = (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99);
      return diff !== 0 ? diff : a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });

  const filtered = sortProjects(
    projects
      .filter((p) => statusFilter === 'all' || p.status === statusFilter)
      .filter((p) => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
      }),
  );

  return (
    <Layout
      title="Clientes"
      action={
        isSocio ? (
          <Button variant="primary" size="sm" onClick={openCreate}>
            <i className="ph-light ph-plus" style={{ fontSize: '15px' }} /> Novo cliente
          </Button>
        ) : undefined
      }
    >
      {/* ─── TOOLBAR ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <i
            className="ph-light ph-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ fontSize: '15px', color: 'var(--text-muted)' }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar cliente…"
            className="w-full pl-8 pr-3 py-2 rounded-md text-sm transition-all"
            style={{
              background: 'var(--surface)',
              border: '0.5px solid var(--border)',
              color: 'var(--text-primary)',
              fontFamily: 'Geist, system-ui',
              outline: 'none',
            }}
            onFocus={(e) => (e.target.style.borderColor = '#4A11A2')}
            onBlur={(e) => (e.target.style.borderColor = 'var(--border)')}
          />
        </div>

        {/* Filter dropdown */}
        <FilterDropdown value={statusFilter} onChange={setStatusFilter} counts={counts} />
      </div>

      {/* ─── LISTA ─── */}
      {loading ? (
        <Loading label="Carregando clientes…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <i className="ph-light ph-folder-open" style={{ fontSize: '40px', color: 'var(--text-muted)' }} />
          <p className="font-label text-[11px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
            NENHUM CLIENTE ENCONTRADO
          </p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden" style={{ border: '0.5px solid var(--border)', background: 'var(--surface)' }}>
          {/* Cabeçalho da lista */}
          <div
            className="grid items-center px-4 py-2.5"
            style={{
              gridTemplateColumns: '1fr 120px 160px 80px 110px 36px',
              background: 'var(--bg-subtle)',
              borderBottom: '0.5px solid var(--border)',
            }}
          >
            {['CLIENTE', 'RESPONSÁVEIS', 'PROGRESSO', 'TASKS', 'PRAZO', ''].map((h) => (
              <span
                key={h}
                className="font-label text-[10px] tracking-[0.14em]"
                style={{ color: 'var(--text-muted)' }}
              >
                {h}
              </span>
            ))}
          </div>

          {/* Linhas */}
          {filtered.map((project) => {
            const st = projectStats(project.id, tasks);
            const dl = deadlineMeta(project.endDate, project.status);
            const pc = progressColor(st.pct);

            return (
              <Link
                key={project.id}
                to={`/projetos/${project.id}`}
                className="group list-row grid items-center px-4 py-3"
                style={{ gridTemplateColumns: '1fr 120px 160px 80px 110px 36px' }}
              >
                {/* Nome + cliente + status */}
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <p
                      className="text-sm font-semibold truncate transition-colors"
                      style={{ color: 'var(--text-primary)', fontFamily: 'Geist, system-ui' }}
                    >
                      {project.name}
                    </p>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
                    {project.client}
                  </p>
                </div>

                {/* Responsáveis */}
                <div>
                  <AvatarStack ids={project.responsibles} users={users} />
                </div>

                {/* Progresso */}
                <div className="pr-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-num text-[11px] font-bold" style={{ color: pc }}>{st.pct}%</span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--track)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${st.pct}%`, background: pc, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>

                {/* Tasks — ícone + contagem */}
                <div className="flex items-center gap-1.5">
                  <i className="ph-light ph-list-checks" style={{ fontSize: '14px', color: 'var(--text-muted)', flexShrink: 0 }} />
                  <span className="font-num text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {st.done}<span style={{ color: 'var(--text-muted)' }}>/{st.total}</span>
                  </span>
                </div>

                {/* Prazo */}
                <div className="flex items-center gap-1.5">
                  <i className="ph-light ph-calendar-blank" style={{ fontSize: '13px', color: dl.urgent ? dl.color : 'var(--text-muted)', flexShrink: 0 }} />
                  <span
                    className="font-label text-[10px] tracking-[0.06em]"
                    style={{
                      color: dl.color,
                      background: dl.urgent ? `${dl.color}18` : 'transparent',
                      padding: dl.urgent ? '1px 6px' : '0',
                      borderRadius: '4px',
                    }}
                  >
                    {dl.label}
                  </span>
                </div>

                {/* Ação */}
                <div className="flex items-center justify-end gap-1">
                  {isSocio && (
                    <button
                      onClick={(e) => openEdit(project, e)}
                      title="Editar"
                      className="p-1.5 rounded transition-all opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = '#4A11A2'; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; }}
                    >
                      <i className="ph-light ph-pencil-simple" style={{ fontSize: '14px' }} />
                    </button>
                  )}
                  <i
                    className="ph-light ph-arrow-right opacity-0 group-hover:opacity-100 transition-all"
                    style={{ fontSize: '14px', color: '#4A11A2' }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* ─── MODAL CRIAR / EDITAR ─── */}
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
                <option>Pendente</option>
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
