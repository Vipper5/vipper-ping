export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3" style={{ color: 'var(--text-muted)' }}>
      <div
        className="w-8 h-8 rounded-full border-2 animate-spin"
        style={{ borderColor: 'rgba(74,17,162,0.20)', borderTopColor: '#4A11A2' }}
      />
      <p className="font-label text-[11px] tracking-[0.14em]">{label.toUpperCase()}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
      <i className="ph-light ph-warning-circle" style={{ fontSize: '36px', color: '#EF4444' }} />
      <p className="font-label text-[11px] tracking-[0.14em]" style={{ color: '#EF4444' }}>
        ERRO AO CARREGAR
      </p>
      <p className="text-sm max-w-md" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px' }}>
        {message}
      </p>
    </div>
  );
}
