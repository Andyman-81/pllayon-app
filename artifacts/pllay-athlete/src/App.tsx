import { Switch, Route, Router as WouterRouter, useLocation } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@workspace/replit-auth-web';
import { useEffect, useRef, useState } from 'react';

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
import InjuryNew from '@/pages/injury-new';
import InjuryList from '@/pages/injury-list';
import InjuryDetail from '@/pages/injury-detail';
import CoachAthleteNew from '@/pages/coach-athlete-new';
import CoachAthleteCode from '@/pages/coach-athlete-code';
import CoachAthletes from '@/pages/coach-athletes';
import AthleteEnterCode from '@/pages/athlete-enter-code';
import { getRole, saveRole, type Role } from '@/lib/useRole';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

const ROLES: { value: Role; label: string; colour: string; symbol: string }[] = [
  { value: 'athlete', label: 'Athlete', colour: '#10AC6E', symbol: '▲' },
  { value: 'coach',   label: 'Coach',   colour: '#0B7DF1', symbol: '◆' },
  { value: 'parent',  label: 'Parent',  colour: '#D97706', symbol: '●' },
];

function isDevVisible(): boolean {
  try {
    return window.location.hostname.includes('replit.dev') ||
      localStorage.getItem('po_dev_mode') === 'true';
  } catch { return false; }
}

/* ── Dev Role Switcher Panel ─────────────────────────── */
function DevPanel() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role>(getRole());
  const [, navigate] = useLocation();
  const panelRef = useRef<HTMLDivElement>(null);

  const visible = isDevVisible();

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!visible) return null;

  function switchRole(role: Role) {
    saveRole(role);
    setCurrentRole(role);
    setOpen(false);
    queryClient.clear();
    navigate(`/dashboard/${role}`, { replace: true });
  }

  const userId = (user as any)?.id ?? (user as any)?.name ?? '';
  const shortId = userId ? String(userId).slice(0, 8) + '…' : '—';

  return (
    <div ref={panelRef} style={{ position: 'fixed', bottom: 80, left: 16, zIndex: 9998 }}>
      {open && (
        <div style={{
          position: 'absolute', bottom: 52, left: 0,
          width: 200,
          background: 'rgba(15,23,42,.97)',
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 10,
          padding: 16,
          backdropFilter: 'blur(12px)',
        }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 12 }}>
            DEV — ROLE SWITCHER
          </div>

          {ROLES.map(r => {
            const active = currentRole === r.value;
            return (
              <button
                key={r.value}
                onClick={() => switchRole(r.value)}
                style={{
                  display: 'block', width: '100%', height: 36, marginBottom: 6,
                  background: active ? r.colour : 'transparent',
                  border: `1px solid ${active ? r.colour : 'rgba(255,255,255,.12)'}`,
                  borderRadius: 6,
                  fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase',
                  color: active ? '#fff' : r.colour,
                  cursor: 'pointer', textAlign: 'left', paddingLeft: 12,
                }}
              >
                {r.symbol} {r.label} View
              </button>
            );
          })}

          <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', margin: '12px 0 10px' }} />

          <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 6 }}>
            Current Session
          </div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>
            {shortId}
          </div>
          <div style={{
            display: 'inline-block', padding: '2px 8px', borderRadius: 100,
            background: ROLES.find(r => r.value === currentRole)?.colour + '30',
            border: `1px solid ${ROLES.find(r => r.value === currentRole)?.colour}50`,
            fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
            color: ROLES.find(r => r.value === currentRole)?.colour,
          }}>
            {currentRole}
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(15,23,42,.9)',
          border: '1px solid rgba(255,255,255,.15)',
          color: '#fff', cursor: 'pointer',
          fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.06em',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        title="Dev role switcher"
      >
        ⚙
      </button>
    </div>
  );
}

/* ── Login screen ────────────────────────────────────── */
function LoginScreen() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(getRole());
  const [, navigate] = useLocation();
  const [toast, setToast] = useState('');

  function handleLogin() {
    saveRole(selectedRole);
    login();
  }

  function toggleDevMode() {
    try {
      const current = localStorage.getItem('po_dev_mode') === 'true';
      const next = !current;
      localStorage.setItem('po_dev_mode', next ? 'true' : 'false');
      setToast(next ? 'Dev mode ON — test panel enabled' : 'Dev mode OFF');
      setTimeout(() => setToast(''), 2000);
    } catch {}
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

        <div style={{ marginTop: 20, fontFamily: 'var(--font-b)', fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
          Don't have an account?{' '}
          <button
            onClick={() => navigate(`/register/${selectedRole}`)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: activeColour, fontFamily: 'var(--font-b)', fontSize: 13, padding: 0, textDecoration: 'underline' }}
          >
            Register →
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          <button
            onClick={toggleDevMode}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', color: '#64748B', padding: 0 }}
          >
            Developer mode
          </button>
        </div>
      </div>

      {toast && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(15,23,42,.95)', border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 8, padding: '10px 20px',
          fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em',
          color: 'rgba(255,255,255,.7)', whiteSpace: 'nowrap', zIndex: 9999,
        }}>
          {toast}
        </div>
      )}
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

function ProtectedRoute({ component: Component, allowedRoles }: { component: React.ComponentType; allowedRoles?: Role[] }) {
  const { isAuthenticated, isLoading } = useAuth();
  const [, navigate] = useLocation();
  const role = getRole();

  useEffect(() => {
    if (!isLoading && isAuthenticated && allowedRoles && !allowedRoles.includes(role)) {
      navigate(`/dashboard/${role}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, role]);

  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return <LoginScreen />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Spinner colour={role === 'coach' ? '#0B7DF1' : role === 'parent' ? '#D97706' : '#10AC6E'} />;
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
    <>
      <Switch>
        {/* Root — role-aware */}
        <Route path="/" component={() => <ProtectedRoute component={SmartRoot} />} />

        {/* Explicit login */}
        <Route path="/login" component={LoginScreen} />

        {/* Athlete routes */}
        <Route path="/dashboard/athlete"              component={() => <ProtectedRoute component={Dashboard} />} />
        <Route path="/register/athlete"               component={Onboarding} />
        <Route path="/onboarding"                     component={() => <ProtectedRoute component={Onboarding} />} />
        <Route path="/phase0"                         component={() => <ProtectedRoute component={Phase0} />} />
        <Route path="/week/:weekNumber"               component={() => <ProtectedRoute component={WeeklyReflection} />} />
        <Route path="/month/:monthNumber/checkin"     component={() => <ProtectedRoute component={MonthlyCheckin} />} />
        <Route path="/capstone"                       component={() => <ProtectedRoute component={Capstone} />} />
        <Route path="/progress"                       component={() => <ProtectedRoute component={Progress} />} />
        <Route path="/competition-review"             component={() => <ProtectedRoute component={CompetitionReview} />} />
        <Route path="/competition-review/:id"         component={() => <ProtectedRoute component={CompetitionReview} />} />
        <Route path="/appendix/:id"                   component={() => <ProtectedRoute component={Appendix} />} />
        <Route path="/pre-comp"                       component={() => <ProtectedRoute component={PreComp} />} />
        <Route path="/schedule/week/:weekNum"         component={() => <ProtectedRoute component={SchedulePage} />} />
        <Route path="/cycle-planner"                  component={() => <ProtectedRoute component={CyclePlannerPage} />} />

        {/* Injury / Physical Flag routes */}
        <Route path="/injury/new"  component={() => <ProtectedRoute component={InjuryNew} />} />
        <Route path="/injury/:id"  component={() => <ProtectedRoute component={InjuryDetail} />} />
        <Route path="/injury"      component={() => <ProtectedRoute component={InjuryList} />} />

        {/* Coach routes */}
        <Route path="/register/coach"              component={RegisterCoach} />
        <Route path="/dashboard/coach"             component={() => <ProtectedRoute component={CoachDashboard}   allowedRoles={['coach']} />} />
        <Route path="/coach-review"                component={() => <ProtectedRoute component={CoachReview}      allowedRoles={['coach']} />} />
        <Route path="/coach/athlete/new"           component={() => <ProtectedRoute component={CoachAthleteNew}  allowedRoles={['coach']} />} />
        <Route path="/coach/athlete/:profileId/code" component={() => <ProtectedRoute component={CoachAthleteCode} allowedRoles={['coach']} />} />
        <Route path="/coach/athletes"              component={() => <ProtectedRoute component={CoachAthletes}    allowedRoles={['coach']} />} />

        {/* Athlete — enter code */}
        <Route path="/athlete/enter-code" component={() => <ProtectedRoute component={AthleteEnterCode} allowedRoles={['athlete']} />} />

        {/* Parent routes */}
        <Route path="/register/parent"  component={RegisterParent} />
        <Route path="/dashboard/parent" component={() => <ProtectedRoute component={ParentDashboard} allowedRoles={['parent']} />} />

        <Route component={NotFound} />
      </Switch>
      <DevPanel />
    </>
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
