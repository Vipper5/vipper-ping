// Lógica de cor/estado de progresso compartilhada entre Dashboard e Projetos.

/** Cor de "papel quente" usada quando não há nenhuma atividade (0/0).
 *  Theme-aware via CSS var (no light é um pouco mais escura para leitura). */
export const PAPEL_QUENTE = 'var(--papel-quente)';

/** Texto exibido no lugar da porcentagem quando não há atividades. */
export const NO_ACTIVITY_LABEL = 'Aguarde por novas atividades';

/**
 * Escala de cor por porcentagem:
 *  < 45%  → vermelho
 *  < 75%  → roxo
 *  >= 75% → verde
 */
export function progressColor(pct: number): string {
  if (pct < 45) return '#E54056';
  if (pct < 75) return '#8637CC';
  return '#15BB77';
}

/**
 * Estado de uma barra de progresso considerando a possibilidade de 0/0.
 * Quando não há atividades, devolve `empty: true` para que a UI mostre
 * "Aguarde por novas atividades" com a cor de papel quente.
 */
export function progressState(done: number, total: number) {
  if (total === 0) {
    return { empty: true, pct: 0, color: PAPEL_QUENTE, label: NO_ACTIVITY_LABEL };
  }
  const pct = Math.round((done / total) * 100);
  return { empty: false, pct, color: progressColor(pct), label: `${pct}%` };
}
