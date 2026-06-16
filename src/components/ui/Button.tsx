import React from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: '#4A11A2',
    color: '#FFFFFF',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: '#4A11A2',
    border: '0.5px solid #4A11A2',
  },
  tertiary: {
    background: 'transparent',
    color: '#4A11A2',
    border: 'none',
  },
  destructive: {
    background: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '0.5px solid var(--border)',
  },
};

const variantHover: Record<Variant, string> = {
  primary:     '#6B28C4',
  secondary:   'rgba(74,17,162,0.08)',
  tertiary:    'rgba(74,17,162,0.06)',
  destructive: '#DC2626',
  ghost:       'var(--bg-subtle)',
};

const sizeStyles: Record<Size, React.CSSProperties> = {
  sm: { padding: '7px 14px', fontSize: '11px', letterSpacing: '0.08em' },
  md: { padding: '9px 18px', fontSize: '12px', letterSpacing: '0.08em' },
  lg: { padding: '12px 24px', fontSize: '13px', letterSpacing: '0.06em' },
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  style,
  ...props
}: ButtonProps) {
  const [hover, setHover] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    borderRadius: '0.375rem',
    fontFamily: 'Oswald, sans-serif',
    fontWeight: 500,
    textTransform: 'uppercase',
    cursor: props.disabled ? 'not-allowed' : 'pointer',
    opacity: props.disabled ? 0.45 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    transition: 'background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
    outline: 'none',
    userSelect: 'none',
    whiteSpace: 'nowrap',
    ...(hover && !props.disabled
      ? variant === 'primary'
        ? { background: variantHover[variant], boxShadow: '0 0 18px rgba(74,17,162,0.40)' }
        : variant === 'secondary'
        ? { background: variantHover[variant], boxShadow: '0 0 14px rgba(74,17,162,0.20)' }
        : variant === 'destructive'
        ? { background: variantHover[variant], boxShadow: '0 0 16px rgba(239,68,68,0.35)' }
        : { background: variantHover[variant] }
      : {}),
    ...style,
  };

  return (
    <button
      className={className}
      style={baseStyle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      {...props}
    >
      {children}
    </button>
  );
}
