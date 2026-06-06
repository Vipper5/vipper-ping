import React, { useState, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Button } from '../components/ui/Button';
import { FormField, Input, Textarea } from '../components/ui/FormField';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Save, User } from 'lucide-react';

export function Profile() {
  const { user, updateProfile } = useAuth();
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

  return (
    <Layout
      title="Meu perfil"
      subtitle="Gerencie suas informações pessoais"
      action={
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
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+55 11 99999-9999"
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
      </div>
    </Layout>
  );
}
