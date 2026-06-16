import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/Badge';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import { useTasks, useProjects } from '../lib/hooks';
import { taskPeriod } from '../lib/tasks';
import { Camera, Save, User, Sun, CalendarRange, ExternalLink, CheckCheck } from 'lucide-react';

const STATUS_RANK: Record<string, number> = { em_andamento: 0, pendente: 1, concluida: 2 };

function formatPhone(raw: string): string {
  // Se já tem o prefixo +55, remove-o para trabalhar apenas com os dígitos locais
  const stripped = raw.startsWith('+55') ? raw.slice(3) : raw;
  // Mantém apenas dígitos, limitado a 12 (DDD 2 + número até 10)
  const digits = stripped.replace(/\D/g, '').slice(0, 12);
  if (!digits) return '';
  const ddd = digits.slice(0, 2);
  const num = digits.slice(2);
  if (digits.length <= 2) return `+55 (${ddd}`;
  if (num.length < 5) return `+55 (${ddd}) ${num}`;
  return `+55 (${ddd}) ${num.slice(0, 5)}-${num.slice(5)}`;
}

export function Profile() {
  const { user, updateProfile } = useAuth();
  const { data: tasks } = useTasks();
  const { data: projects } = useProjects();
  const [saved, setSaved] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    bio: user?.bio ?? '',
    photo: user?.photo ?? '',
  });

  if (!user) return null;

  const handlePhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, photo: (ev.target?.result as string) ?? '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    const { error } = await updateProfile(form);
    if (error) return;
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const hasChanges =
    form.name !== (user.name ?? '') ||
    form.email !== (user.email ?? '') ||
    form.phone !== (user.phone ?? '') ||
    form.bio !== (user.bio ?? '') ||
    form.photo !== (user.photo ?? '');

  // Minhas tasks — pendentes/andamento primeiro; concluídas (riscadas) por último.
  const myTasks = tasks.filter((t) => t.assignedTo.includes(user.id));
  const doneCount = myTasks.filter((t) => t.status === 'concluida').length;
  const sortedTasks = [...myTasks].sort((a, b) => {
    const r = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (r !== 0) return r;
    return a.dueDate.localeCompare(b.dueDate);
  });

  return (
    <Layout
      title="Meu perfil"
      subtitle="Gerencie suas informações pessoais"
      action={
        <div className="flex items-center gap-2">
          <Link
            to={`/membros/${user.id}`}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md border border-viper-500 text-viper-500 bg-transparent transition-all duration-150 hover:bg-viper-500 hover:text-white hover:shadow-[0_0_16px_rgba(134,55,204,0.55)]"
          >
            <ExternalLink size={14} /> <span className="hidden sm:inline">Ver como membro</span>
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges && !saved}
          >
            {saved ? (
              <>
                <span>✓</span> Salvo
              </>
            ) : (
              <>
                <Save size={14} /> Salvar alterações
              </>
            )}
          </Button>
        </div>
      }
    >
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-xl border p-6 space-y-6"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {/* Photo section */}
          <div className="flex items-center gap-6">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-viper-700 flex items-center justify-center overflow-hidden ring-4 ring-viper-500/20">
                {form.photo ? (
                  <img src={form.photo} alt={form.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-viper-200 font-mono">{user.initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-viper-500 flex items-center justify-center shadow-lg hover:bg-viper-400 transition-colors"
              >
                <Camera size={13} className="text-white" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-base-primary">{user.name}</p>
              <p className="text-xs text-base-muted mt-0.5">{user.title}</p>
              <button
                onClick={() => fileRef.current?.click()}
                className="text-xs text-viper-400 hover:text-viper-300 transition-colors mt-2 font-mono"
              >
                Trocar foto de perfil
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoFile}
            />
          </div>

          <div className="border-t" style={{ borderColor: 'var(--border)' }} />

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FormField label="Nome completo" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Seu nome"
              />
            </FormField>

            <FormField label="Cargo">
              <Input
                value={user.title ?? ''}
                disabled
                className="opacity-50 cursor-not-allowed"
                placeholder="Definido pela empresa"
              />
            </FormField>

            <FormField label="E-mail" required>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="email@vipperdev.com"
              />
            </FormField>

            <FormField label="Telefone">
              <Input
                type="text"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: formatPhone(e.target.value) }))}
                placeholder="+55 (11) 99999-9999"
                maxLength={21}
              />
            </FormField>
          </div>

          <FormField label="Bio">
            <Textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Escreva uma breve descrição sobre você..."
            />
          </FormField>

          {/* Read-only info */}
          <div
            className="rounded-lg p-4 flex items-start gap-3"
            style={{ backgroundColor: 'var(--bg-subtle)' }}
          >
            <User size={14} className="text-viper-400 shrink-0 mt-0.5" />
            <p className="text-xs text-base-muted font-mono">
              <span className="text-base-secondary">Função:</span>{' '}
              {user.role === 'socio' ? 'Sócio' : 'Estagiário'}
              {' · '}
              <span className="text-base-secondary">ID:</span> {user.id}
            </p>
          </div>
        </div>

        {/* Minhas tasks — concluídas aparecem riscadas */}
        <div
          className="rounded-xl border mt-5 overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-base-primary">Minhas tasks</h3>
              {myTasks.length > 0 && (
                <span className="text-xs font-num text-base-muted">{doneCount}/{myTasks.length} concluídas</span>
              )}
            </div>
            <Link to="/finalizadas" className="text-xs text-viper-500 hover:text-viper-400 font-mono transition-colors flex items-center gap-1">
              <CheckCheck size={12} /> finalizadas
            </Link>
          </div>

          {myTasks.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-base-muted">Nenhuma task atribuída a você.</p>
          ) : (
            <div className="max-h-[22rem] overflow-y-auto">
              {sortedTasks.map((t, i) => {
                const isDone = t.status === 'concluida';
                const PeriodIcon = taskPeriod(t) === 'semanal' ? CalendarRange : Sun;
                const periodColor = taskPeriod(t) === 'semanal' ? '#8637CC' : '#F5AE39';
                return (
                  <Link
                    key={t.id}
                    to={`/atividades/${t.id}`}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-subtle transition-colors border-b last:border-0"
                    style={{ borderColor: 'var(--border)', backgroundColor: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-subtle)' }}
                  >
                    <PeriodIcon size={15} className="shrink-0" style={{ color: periodColor }} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-base-muted' : 'text-base-primary'}`}>
                        {t.title}
                      </p>
                      <p className="text-xs text-base-muted font-mono truncate">
                        {projects.find((p) => p.id === t.projectId)?.name ?? 'Sem cliente'}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

