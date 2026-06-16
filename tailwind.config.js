/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:  ['Geist', 'system-ui', 'sans-serif'],
        label: ['Oswald', 'sans-serif'],
        mono:  ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // Roxo Glitch — paleta oficial VipperDev
        viper: {
          50:  '#EDE7FA',
          100: '#C9B6F0',
          200: '#9966E0',
          300: '#8040D0',
          400: '#6B28C4',  // hover
          500: '#4A11A2',  // brand principal
          600: '#3D0D87',
          700: '#350B78',  // pressed / escuro
          800: '#2A0960',
          900: '#1C004B',
        },
        // Dark mode surfaces
        dark: {
          bg:      '#0A0A0C',
          surface: '#141417',
          hover:   '#1F1F24',
        },
        // Light mode surfaces
        light: {
          bg:      '#FAFAFB',
          surface: '#FFFFFF',
          border:  '#E8E8EC',
        },
        // Semânticas
        success: '#1D9E75',
        warning: '#EF9F27',
        danger:  '#EF4444',
        info:    '#378ADD',
      },
      boxShadow: {
        e1: '0 1px 2px rgba(0,0,0,.06), 0 1px 1px rgba(0,0,0,.04)',
        e2: '0 2px 6px rgba(0,0,0,.10), 0 1px 2px rgba(0,0,0,.07)',
        e3: '0 8px 24px rgba(0,0,0,.16), 0 2px 6px rgba(0,0,0,.10)',
        e4: '0 18px 48px rgba(0,0,0,.28), 0 6px 16px rgba(0,0,0,.16)',
        glass: '0 8px 32px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,0.06)',
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
      },
      keyframes: {
        'vipper-ghost': {
          '0%,100%': { opacity: '0', transform: 'translate(0)' },
          '50%': { opacity: '.35', transform: 'translate(-1px,1px)' },
        },
        'vipper-shake': {
          '0%,100%': { transform: 'translate(0)' },
          '50%': { transform: 'translate(0.5px,-0.5px)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'check-pop': {
          '0%':   { transform: 'scale(0)' },
          '60%':  { transform: 'scale(1.3)' },
          '100%': { transform: 'scale(1)' },
        },
        'victory-pop': {
          '0%':   { opacity: '0', transform: 'scale(0.72) translateY(20px)' },
          '18%':  { opacity: '1', transform: 'scale(1.07) translateY(-4px)' },
          '28%':  { opacity: '1', transform: 'scale(1)   translateY(0)' },
          '78%':  { opacity: '1', transform: 'scale(1)   translateY(0)' },
          '100%': { opacity: '0', transform: 'scale(0.92) translateY(-10px)' },
        },
        'task-complete': {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '30%':  { opacity: '1', transform: 'scale(1.02)' },
          '100%': { opacity: '0', transform: 'scale(1)' },
        },
        'blob-drift': {
          '0%,100%': { transform: 'translate(0,0) scale(1)' },
          '33%':     { transform: 'translate(30px,-20px) scale(1.05)' },
          '66%':     { transform: 'translate(-20px,15px) scale(0.97)' },
        },
      },
      animation: {
        'vipper-ghost': 'vipper-ghost 0.6s ease-in-out infinite',
        'vipper-shake':  'vipper-shake 0.6s ease-in-out infinite',
        'slide-down':    'slide-down 0.2s ease-out',
        'slide-up':      'slide-up 0.2s ease-out',
        'slide-in-right':'slide-in-right 0.25s ease-out',
        'fade-in':       'fade-in 0.15s ease-out',
        'check-pop':     'check-pop 0.3s ease-out',
        'victory-pop':   'victory-pop 2.6s cubic-bezier(0.34,1.56,0.64,1) forwards',
        'task-complete': 'task-complete 1.2s ease-out forwards',
        'blob-drift':    'blob-drift 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
