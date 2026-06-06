import { Loader2 } from 'lucide-react';

export function Loading({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-base-muted">
      <Loader2 size={24} className="animate-spin text-viper-500" />
      <p className="text-sm font-mono">{label}</p>
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-2 text-center">
      <p className="text-sm text-danger font-medium">Não foi possível carregar os dados.</p>
      <p className="text-xs text-base-muted font-mono max-w-md">{message}</p>
    </div>
  );
}
