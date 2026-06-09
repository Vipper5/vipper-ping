import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Sun, Moon, ArrowRight, Loader2 } from 'lucide-react';

export function Login() {
  const { signIn } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || submitting) return;
    setSubmitting(true);
    setError(null);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      setError('E-mail ou senha inválidos.');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      {/* Subtle background pattern */}
      <div className={`absolute inset-0 pointer-events-none ${dark ? 'opacity-5' : 'opacity-[0.07]'}`}
           style={{
             backgroundImage: 'radial-gradient(circle at 25% 25%, #8637CC 0%, transparent 50%), radial-gradient(circle at 75% 75%, #642C9A 0%, transparent 50%)'
           }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-2 rounded-md transition-colors hover:bg-surface2"
        style={{ color: 'var(--text-muted)' }}
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <img
              src={dark ? '/logo2-white.png' : '/logo2-abismo.png'}
              alt="Vipper"
              className="h-11 w-11 object-contain shrink-0"
            />
            <div className="text-left">
              <p className="font-bold text-lg leading-none" style={{ color: 'var(--text-primary)' }}>Vipper</p>
              <p className="text-viper-400 text-xs font-mono tracking-widest uppercase">Ping</p>
            </div>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Sistema interno VipperDev</p>
        </div>

        <div
          className="rounded-xl border p-6 shadow-e4"
          style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <h2 className="font-semibold text-base mb-1" style={{ color: 'var(--text-primary)' }}>Entrar</h2>
          <p className="text-xs font-mono mb-5" style={{ color: 'var(--text-muted)' }}>Use suas credenciais para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--text-secondary)' }}>E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@vipperdev.com"
                className="w-full px-3 py-2.5 rounded-md border text-sm placeholder:text-base-muted focus:outline-none focus:border-viper-500 transition-colors"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            <div>
              <label className="block text-xs font-mono mb-1.5" style={{ color: 'var(--text-secondary)' }}>Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-md border text-sm placeholder:text-base-muted focus:outline-none focus:border-viper-500 transition-colors"
                style={{ backgroundColor: 'var(--bg-subtle)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
              />
            </div>

            {error && (
              <p className="text-xs text-danger font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={!email || !password || submitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold text-sm transition-all duration-150 ${
                email && password && !submitting
                  ? 'bg-viper-500 text-white hover:bg-viper-400 active:bg-viper-600'
                  : 'cursor-not-allowed'
              }`}
              style={email && password && !submitting ? undefined : { backgroundColor: 'var(--surface2)', color: 'var(--text-muted)' }}
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  Entrar
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs font-mono mt-6" style={{ color: 'var(--text-muted)' }}>
          VipperDev · v1.0.0
        </p>
      </div>
    </div>
  );
}
