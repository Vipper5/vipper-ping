import React from 'react';

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({ label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
        {label.toUpperCase()}
        {required && <span className="ml-0.5" style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-mono" style={{ color: '#EF4444' }}>{error}</p>}
      {hint && !error && <p className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Geist, system-ui' }}>{hint}</p>}
    </div>
  );
}

const inputBase =
  'w-full rounded-md border px-3 py-2 text-sm bg-surface text-base-primary placeholder:text-base-muted transition-colors focus:outline-none focus:ring-2 focus:ring-viper-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50';

const inputBorder = 'border-base';
const inputError = 'border-danger focus:ring-danger';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = '', style, ...props }: InputProps) {
  return (
    <input
      className={`${inputBase} ${error ? inputError : inputBorder} ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: error ? undefined : 'var(--border)', color: 'var(--text-primary)', ...style }}
      {...props}
    />
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = '', style, ...props }: TextareaProps) {
  return (
    <textarea
      className={`${inputBase} ${error ? inputError : inputBorder} resize-none ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: error ? undefined : 'var(--border)', color: 'var(--text-primary)', ...style }}
      {...props}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  children: React.ReactNode;
}

export function Select({ error, className = '', style, children, ...props }: SelectProps) {
  return (
    <select
      className={`${inputBase} ${error ? inputError : inputBorder} cursor-pointer ${className}`}
      style={{ backgroundColor: 'var(--surface)', borderColor: error ? undefined : 'var(--border)', color: 'var(--text-primary)', ...style }}
      {...props}
    >
      {children}
    </select>
  );
}
