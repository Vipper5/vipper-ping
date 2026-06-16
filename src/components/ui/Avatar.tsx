interface AvatarUser {
  name: string;
  initials: string;
  photo?: string | null;
}

interface AvatarProps {
  user: AvatarUser;
  /** Diâmetro em pixels. */
  size?: number;
  /** Classes extras do wrapper (img ou fallback). */
  className?: string;
  /** Classes do fallback de iniciais (bg + cor do texto). */
  fallbackClassName?: string;
  /** Tamanho da fonte das iniciais (px). Default: ~38% do size. */
  fontSize?: number;
}

/**
 * Avatar de membro: mostra a foto quando disponível, senão cai para as iniciais.
 * Centraliza a lógica que antes estava espalhada (e que omitia a foto em vários pontos).
 */
export function Avatar({
  user,
  size = 24,
  className = '',
  fallbackClassName = '',
  fontSize,
}: AvatarProps) {
  const dim = { width: size, height: size };

  if (user.photo) {
    return (
      <img
        src={user.photo}
        alt={user.name}
        className={`rounded-full object-cover shrink-0 ${className}`}
        style={dim}
      />
    );
  }

  return (
    <span
      className={`rounded-full flex items-center justify-center shrink-0 font-bold font-mono ${fallbackClassName} ${className}`}
      style={{
        ...dim,
        fontSize: fontSize ?? Math.round(size * 0.38),
        background: fallbackClassName ? undefined : 'rgba(74,17,162,0.28)',
        color: fallbackClassName ? undefined : '#C9B6F0',
      }}
    >
      {user.initials}
    </span>
  );
}
