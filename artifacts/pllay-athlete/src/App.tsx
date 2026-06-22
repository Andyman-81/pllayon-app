import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@workspace/replit-auth-web';
import { useEffect } from 'react';

import Dashboard from '@/pages/dashboard';
import Onboarding from '@/pages/onboarding';
import WeeklyReflection from '@/pages/weekly-reflection';
import Phase0 from '@/pages/phase0';
import MonthlyCheckin from '@/pages/monthly-checkin';
import Capstone from '@/pages/capstone';
import Progress from '@/pages/progress';
import CompetitionReview from '@/pages/competition-review';
import Appendix from '@/pages/appendix';
import PreComp from '@/pages/pre-comp';
import SchedulePage from '@/pages/schedule';
import CyclePlannerPage from '@/pages/cycle-planner';
import NotFound from '@/pages/not-found';
import RegisterCoach from '@/pages/register-coach';
import RegisterParent from '@/pages/register-parent';
import CoachDashboard from '@/pages/dashboard-coach';
import ParentDashboard from '@/pages/dashboard-parent';
import CoachReview from '@/pages/coach-review';
import { useState } from 'react';
import { getRole, saveRole, type Role } from '@/lib/useRole';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const ROLES: { value: Role; label: string; colour: string }[] = [
  { value: 'athlete', label: 'Athlete', colour: '#10AC6E' },
  { value: 'coach',   label: 'Coach',   colour: '#0B7DF1' },
  { value: 'parent',  label: 'Parent',  colour: '#F5B809' },
];

function LoginScreen() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(getRole());

  function handleLogin() {
    saveRole(selectedRole);
    login();
  }

  const activeColour = ROLES.find(r => r.value === selectedRole)?.colour ?? '#10AC6E';

  return (
    <div style={{
      minHeight: '100dvh', width: '100%', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', background: '#111111', color: '#fff', padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-m)', color: '#10AC6E', letterSpacing: '.2em', fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}>
          Pllay On Edge
        </p>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(52px,8vw,80px)', textTransform: 'uppercase', letterSpacing: '-.02em', lineHeight: .88, marginBottom: 40 }}>
          Development<br />Program
        </h1>

        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,.4)', marginBottom: 12 }}>
            I am accessing as
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                style={{
                  minHeight: 44, padding: '10px 22px', borderRadius: 100,
                  border: `2px solid ${selectedRole === r.value ? r.colour : 'rgba(255,255,255,.15)'}`,
                  background: selectedRole === r.value ? `${r.colour}20` : 'transparent',
                  fontFamily: 'var(--font-m)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase',
                  color: selectedRole === r.value ? r.colour : 'rgba(255,255,255,.45)',
                  cursor: 'pointer', fontWeight: 700, transition: 'all .15s',
                }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleLogin}
          style={{
            width: '100%', background: activeColour, color: '#111111', border: 'none', borderRadius: 4,
            padding: '16px 32px', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22,
            textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', minHeight: 52,
          }}
        >
          Access Portal
        </button>
      </div>
    </div>
  );
}

function Spinner({ colour = '#10AC6E' }: { colour?: string }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC' }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${colour}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginScreen />;
  return <Component />;
}

function SmartRoot() {
  const [, navigate] = useLocation();
  const role = getRole();

  useEffect(() => {
    if (role === 'coach')  navigate('/dashboard/coach',  { replace: true });
    if (role === 'parent') navigate('/dashboard/parent', { replace: true });
  }, []);

  if (role === 'coach')  return <Spinner colour="#0B7DF1" />;
  if (role === 'parent') return <Spinner colour="#D97706" />;
  return <Dashboard />;
}

function Router() {
  return (
    <Switch>
      {/* Root — role-aware */}
      <Route path="/" component={() => <ProtectedRoute component={SmartRoot} />} />

      {/* Athlete routes (unchanged) */}
      <Route path="/onboarding"                   component={() => <ProtectedRoute component={Onboarding} />} />
      <Route path="/phase0"                       component={() => <ProtectedRoute component={Phase0} />} />
      <Route path="/week/:weekNumber"             component={() => <ProtectedRoute component={WeeklyReflection} />} />
      <Route path="/month/:monthNumber/checkin"   component={() => <ProtectedRoute component={MonthlyCheckin} />} />
      <Route path="/capstone"                     component={() => <ProtectedRoute component={Capstone} />} />
      <Route path="/progress"                     component={() => <ProtectedRoute component={Progress} />} />
      <Route path="/competition-review"           component={() => <ProtectedRoute component={CompetitionReview} />} />
      <Route path="/competition-review/:id"       component={() => <ProtectedRoute component={CompetitionReview} />} />
      <Route path="/appendix/:id"                 component={() => <ProtectedRoute component={Appendix} />} />
      <Route path="/pre-comp"                     component={() => <ProtectedRoute component={PreComp} />} />
      <Route path="/schedule/week/:weekNum"       component={() => <ProtectedRoute component={SchedulePage} />} />
      <Route path="/cycle-planner"                component={() => <ProtectedRoute component={CyclePlannerPage} />} />

      {/* Coach routes */}
      <Route path="/register/coach"   component={() => <ProtectedRoute component={RegisterCoach} />} />
      <Route path="/dashboard/coach"  component={() => <ProtectedRoute component={CoachDashboard} />} />
      <Route path="/coach-review"     component={() => <ProtectedRoute component={CoachReview} />} />

      {/* Parent routes */}
      <Route path="/register/parent"  component={() => <ProtectedRoute component={RegisterParent} />} />
      <Route path="/dashboard/parent" component={() => <ProtectedRoute component={ParentDashboard} />} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;
