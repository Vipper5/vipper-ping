import React from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive' | 'neon';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: React.ReactNode;
}

// glow no hover, sempre na cor do próprio botão
const GLOW = {
  viper: 'hover:shadow-[0_0_16px_rgba(134,55,204,0.45)]',
  viperSoft: 'hover:shadow-[0_0_14px_rgba(134,55,204,0.28)]',
  danger: 'hover:shadow-[0_0_16px_rgba(229,64,86,0.45)]',
  neon: 'hover:shadow-[0_0_16px_rgba(0,255,148,0.5)]',
};

const variantClasses: Record<Variant, string> = {
  primary:
    `bg-viper-500 text-white hover:bg-viper-600 active:bg-viper-700 ${GLOW.viper} disabled:bg-viper-200 disabled:text-viper-400 disabled:shadow-none dark:disabled:bg-carvao-surface2 dark:disabled:text-viper-800`,
  secondary:
    `border border-viper-500 text-viper-500 bg-transparent hover:bg-viper-50 active:bg-viper-100 ${GLOW.viperSoft} disabled:border-neutral-300 disabled:text-neutral-400 disabled:shadow-none dark:hover:bg-carvao-surface2 dark:disabled:border-carvao-surface3 dark:disabled:text-neutral-600`,
  tertiary:
    `text-viper-500 bg-transparent hover:bg-viper-50 hover:text-viper-400 active:bg-viper-100 disabled:text-neutral-400 disabled:shadow-none dark:hover:bg-carvao-surface2 dark:disabled:text-neutral-600`,
  destructive:
    `bg-danger text-white hover:bg-red-600 active:bg-red-700 ${GLOW.danger} disabled:bg-red-200 disabled:text-red-400 disabled:shadow-none`,
  neon:
    `bg-neon-500 text-carvao-base font-semibold hover:bg-neon-400 active:bg-neon-600 ${GLOW.neon} disabled:bg-neon-800 disabled:text-neon-600 disabled:shadow-none`,
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md',
  md: 'px-4 py-2 text-sm rounded-md',
  lg: 'px-6 py-3 text-base rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-viper-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed select-none ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
