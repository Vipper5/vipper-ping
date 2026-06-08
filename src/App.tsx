import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { ProjectDetail } from './pages/ProjectDetail';
import { Activities } from './pages/Activities';
import { ActivityDetail } from './pages/ActivityDetail';
import { Finalizadas } from './pages/Finalizadas';
import { Agenda } from './pages/Agenda';
import { Reports } from './pages/Reports';
import { Ponto } from './pages/Ponto';
import { Members } from './pages/Members';
import { MemberDetail } from './pages/MemberDetail';
import { Profile } from './pages/Profile';

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0E0F11' }}>
      <div className="w-8 h-8 rounded-full border-2 border-viper-500 border-t-transparent animate-spin" />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RequireSocio({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'socio') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function RequireEstagiario({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'estagiario') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/projetos" element={<RequireAuth><Projects /></RequireAuth>} />
      <Route path="/projetos/:id" element={<RequireAuth><ProjectDetail /></RequireAuth>} />
      <Route path="/atividades" element={<RequireAuth><Activities /></RequireAuth>} />
      <Route path="/atividades/:id" element={<RequireAuth><ActivityDetail /></RequireAuth>} />
      <Route path="/finalizadas" element={<RequireAuth><Finalizadas /></RequireAuth>} />
      <Route path="/agenda" element={<RequireAuth><Agenda /></RequireAuth>} />
      <Route path="/relatorios" element={<RequireSocio><Reports /></RequireSocio>} />
      <Route path="/ponto" element={<RequireEstagiario><Ponto /></RequireEstagiario>} />
      <Route path="/membros" element={<RequireAuth><Members /></RequireAuth>} />
      <Route path="/membros/:id" element={<RequireAuth><MemberDetail /></RequireAuth>} />
      <Route path="/perfil" element={<RequireAuth><Profile /></RequireAuth>} />
      <Route path="*" element={<Navigate to={user ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
