import React, { useEffect } from 'react';
import { Button } from './Button';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = { sm: '400px', md: '560px', lg: '720px' }[size];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 animate-fade-in"
        style={{ background: 'rgba(10,10,12,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Painel glass */}
      <div
        className="relative w-full max-h-[90dvh] overflow-y-auto animate-slide-down"
        style={{
          maxWidth: maxW,
          background: 'var(--surface)',
          border: '0.5px solid var(--border)',
          borderRadius: '0.875rem',
          boxShadow: '0 24px 64px rgba(0,0,0,0.40), 0 8px 24px rgba(0,0,0,0.24), inset 0 1px 0 rgba(255,255,255,0.06)',
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
          <div>
            <h2
              className="font-titulo"
              style={{ fontSize: '18px', color: 'var(--text-primary)' }}
            >
              {title.toUpperCase()}
            </h2>
            {description && (
              <p className="mt-1 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-md transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'; (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-subtle)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
          >
            <i className="ph-light ph-x" style={{ fontSize: '18px', lineHeight: 1 }} />
          </button>
        </div>

        {/* Body */}
        {children && <div className="px-6 pb-4">{children}</div>}

        {/* Footer */}
        {footer && (
          <div
            className="flex justify-end gap-3 px-6 py-4"
            style={{ borderTop: '0.5px solid var(--border)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirmar' }: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="destructive" onClick={() => { onConfirm(); onClose(); }}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="text-sm" style={{ color: 'var(--text-secondary)', fontFamily: 'Geist, system-ui' }}>
        {description}
      </p>
    </Modal>
  );
}
