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
      style={{ backgroundColor: '#0E0F11' }}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
           style={{
             backgroundImage: 'radial-gradient(circle at 25% 25%, #8637CC 0%, transparent 50%), radial-gradient(circle at 75% 75%, #642C9A 0%, transparent 50%)'
           }} />

      {/* Theme toggle */}
      <button
        onClick={toggle}
        className="absolute top-6 right-6 p-2 rounded-md text-neutral-500 hover:text-neutral-300 hover:bg-carvao-surface2 transition-colors"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      {/* Card */}
      <div className="relative w-full max-w-sm mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-viper-500 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 text-white" stroke="currentColor" strokeWidth={2}>
                <path d="M12 3C7 3 3 7 3 12s4 9 9 9c2 0 4-.7 5.5-1.9" strokeLinecap="round"/>
                <path d="M17 8c1.5 1 2.5 2.5 2.5 4.5" strokeLinecap="round"/>
                <circle cx="18" cy="6" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div className="text-left">
              <p className="text-white font-bold text-lg leading-none">Vipper</p>
              <p className="text-viper-300 text-xs font-mono tracking-widest uppercase">Ping</p>
            </div>
          </div>
          <p className="text-neutral-400 text-sm">Sistema interno VipperDev</p>
        </div>

        <div
          className="rounded-xl border p-6 shadow-e4"
          style={{ backgroundColor: '#1A1B1E', borderColor: '#2A2B30' }}
        >
          <h2 className="text-white font-semibold text-base mb-1">Entrar</h2>
          <p className="text-neutral-500 text-xs font-mono mb-5">Use suas credenciais para continuar</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="voce@vipperdev.com"
                className="w-full px-3 py-2.5 rounded-md border bg-carvao-surface1 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-viper-500 transition-colors"
                style={{ borderColor: '#2A2B30' }}
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-neutral-400 mb-1.5">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-md border bg-carvao-surface1 text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-viper-500 transition-colors"
                style={{ borderColor: '#2A2B30' }}
              />
            </div>

            {error && (
              <p className="text-xs text-red-400 font-mono">{error}</p>
            )}

            <button
              type="submit"
              disabled={!email || !password || submitting}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-md font-semibold text-sm transition-all duration-150 ${
                email && password && !submitting
                  ? 'bg-viper-500 text-white hover:bg-viper-400 active:bg-viper-600'
                  : 'bg-carvao-surface2 text-neutral-600 cursor-not-allowed'
              }`}
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

        <p className="text-center text-neutral-600 text-xs font-mono mt-6">
          VipperDev · v1.0.0
        </p>
      </div>
    </div>
  );
}
