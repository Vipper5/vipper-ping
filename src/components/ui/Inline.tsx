import React, { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface InlineTextProps {
  value: string;
  onSave: (v: string) => void;
  editable?: boolean;
  placeholder?: string;
  multiline?: boolean;
  /** Classe aplicada tanto ao texto exibido quanto ao input (para herdar a tipografia). */
  className?: string;
  mono?: boolean;
  /** Permite salvar valor vazio (por padrão exige conteúdo). */
  allowEmpty?: boolean;
}

/**
 * Texto editável direto no lugar onde aparece. Clique para editar,
 * Enter (ou blur) confirma, Esc cancela.
 */
export function InlineText({
  value,
  onSave,
  editable = true,
  placeholder = '—',
  multiline = false,
  className = '',
  mono = false,
  allowEmpty = false,
}: InlineTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(value);
      // foca no próximo tick
      requestAnimationFrame(() => {
        ref.current?.focus();
        ref.current?.select?.();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v === value) return;
    if (!v && !allowEmpty) return;
    onSave(v);
  };
  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  const monoCls = mono ? 'font-mono' : '';

  if (!editable) {
    return (
      <span className={className}>
        {value || <span className="text-base-muted">{placeholder}</span>}
      </span>
    );
  }

  if (editing) {
    const shared = {
      value: draft,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setDraft(e.target.value),
      onBlur: commit,
      className: `${className} ${monoCls} w-full bg-transparent outline-none rounded-sm px-1 -mx-1 border-b-2 border-viper-400`,
      style: { backgroundColor: 'rgba(168,85,247,0.06)' },
    };
    return multiline ? (
      <textarea
        {...shared}
        ref={(el) => { ref.current = el; }}
        rows={2}
        onKeyDown={(e) => {
          // Enter confirma a alteração; Shift+Enter insere quebra de linha.
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
      />
    ) : (
      <input
        {...shared}
        ref={(el) => { ref.current = el; }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            cancel();
          }
        }}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title="Clique para editar"
      className="group/inline inline-flex items-start gap-1.5 text-left rounded-sm -mx-1 px-1 hover:bg-viper-500/10 transition-colors"
    >
      <span className={className}>
        {value || <span className="text-base-muted italic">{placeholder}</span>}
      </span>
      <Pencil
        size={12}
        className="mt-1 shrink-0 text-viper-400 opacity-0 group-hover/inline:opacity-80 transition-opacity"
      />
    </button>
  );
}
