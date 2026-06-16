import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

export function Login() {
  const { signIn } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [focusField, setFocusField] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) { setError('E-mail ou senha inválidos.'); return; }
    navigate('/dashboard');
  };

  const inputStyle = (field: string): React.CSSProperties => ({
    width: '100%',
    padding: '11px 14px',
    borderRadius: '0.375rem',
    border: `0.5px solid ${focusField === field ? '#4A11A2' : 'var(--border)'}`,
    background: 'rgba(255,255,255,0.03)',
    color: 'var(--text-primary)',
    fontFamily: 'Geist, system-ui',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    boxShadow: focusField === field ? '0 0 0 3px rgba(74,17,162,0.12)' : 'none',
  });

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Blobs de fundo */}
      <div
        className="bg-blob bg-blob-1"
        style={{ opacity: dark ? 1 : 0.7 }}
        aria-hidden
      />
      <div
        className="bg-blob bg-blob-2"
        style={{ opacity: dark ? 0.6 : 0.4 }}
        aria-hidden
      />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-6 right-6 w-9 h-9 rounded-md flex items-center justify-center transition-colors"
        style={{ color: 'var(--text-muted)', border: '0.5px solid var(--border)', background: 'var(--surface)' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = '#4A11A2')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <i className={`ph-light ${dark ? 'ph-sun' : 'ph-moon'}`} style={{ fontSize: '18px', lineHeight: 1 }} />
      </button>

      {/* Card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-slide-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10 gap-4">
          <div className="vipper-logo" style={{ width: 60, height: 60 }}>
            <img src="/Vipper - ROXA.png" className="ghost" alt="" />
            <img src="/Vipper - ROXA.png" className="base" alt="Vipper" />
          </div>
          <div className="text-center">
            <div className="font-titulo text-3xl" style={{ color: 'var(--text-primary)' }}>VIPPER PING</div>
            <div className="font-label text-[11px] tracking-[0.22em] mt-1" style={{ color: '#4A11A2' }}>
              SISTEMA INTERNO
            </div>
          </div>
        </div>

        <div
          style={{
            background: dark ? 'rgba(20, 20, 26, 0.60)' : 'rgba(255,255,255,0.80)',
            border: '0.5px solid var(--border)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '0.875rem',
            padding: '32px',
            boxShadow: '0 24px 64px rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          <form onSubmit={handleLogin} className="flex flex-col gap-5">
            {/* E-mail */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                E-MAIL
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@vipperdev.com"
                style={{ ...inputStyle('email'), ['--placeholder-color' as string]: 'var(--text-muted)' }}
                onFocus={() => setFocusField('email')}
                onBlur={() => setFocusField(null)}
              />
            </div>

            {/* Senha */}
            <div className="flex flex-col gap-1.5">
              <label className="font-label text-[10px] tracking-[0.14em]" style={{ color: 'var(--text-muted)' }}>
                SENHA
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                style={inputStyle('password')}
                onFocus={() => setFocusField('password')}
                onBlur={() => setFocusField(null)}
              />
            </div>

            {/* Erro */}
            {error && (
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-md"
                style={{ background: 'rgba(239,68,68,0.10)', border: '0.5px solid rgba(239,68,68,0.30)' }}
              >
                <i className="ph-light ph-warning-circle" style={{ fontSize: '15px', color: '#EF4444', flexShrink: 0 }} />
                <p className="text-xs" style={{ color: '#EF4444', fontFamily: 'Geist, system-ui' }}>{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!email || !password || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all duration-150"
              style={{
                background: email && password && !submitting ? '#4A11A2' : 'var(--surface2)',
                color: email && password && !submitting ? '#FFFFFF' : 'var(--text-muted)',
                fontFamily: 'Oswald, sans-serif',
                fontWeight: 500,
                fontSize: '12px',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: !email || !password || submitting ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (email && password && !submitting) {
                  (e.currentTarget as HTMLButtonElement).style.background = '#6B28C4';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 20px rgba(74,17,162,0.40)';
                }
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = email && password && !submitting ? '#4A11A2' : 'var(--surface2)';
                (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
              }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.30)', borderTopColor: '#FFFFFF' }} />
              ) : (
                <>
                  ENTRAR
                  <i className="ph-light ph-arrow-right" style={{ fontSize: '16px' }} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-label text-[9px] tracking-[0.20em]" style={{ color: 'var(--text-muted)' }}>
          VIPPERDEV · PING
        </p>
      </div>
    </div>
  );
}
