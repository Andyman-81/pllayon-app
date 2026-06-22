import { Switch, Route, Router as WouterRouter } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@workspace/replit-auth-web';

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
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000 } },
});

function LoginScreen() {
  const { login } = useAuth();
  return (
    <div style={{
      minHeight: '100dvh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111111',
      color: '#fff',
      padding: 24,
    }}>
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-m)', color: '#10AC6E', letterSpacing: '.2em', fontSize: 11, textTransform: 'uppercase', marginBottom: 12 }}>
          Pllay On Edge
        </p>
        <h1 style={{
          fontFamily: 'var(--font-d)',
          fontWeight: 800,
          fontSize: 'clamp(52px,8vw,80px)',
          textTransform: 'uppercase',
          letterSpacing: '-.02em',
          lineHeight: .88,
          marginBottom: 56,
        }}>
          Development<br />Program
        </h1>
        <button
          onClick={() => login()}
          style={{
            width: '100%',
            background: '#10AC6E',
            color: '#111111',
            border: 'none',
            borderRadius: 4,
            padding: '16px 32px',
            fontFamily: 'var(--font-d)',
            fontWeight: 800,
            fontSize: 22,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            cursor: 'pointer',
          }}
        >
          Access Portal
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC' }}>
        <div style={{ width: 32, height: 32, border: '4px solid #10AC6E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!isAuthenticated) return <LoginScreen />;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/onboarding" component={() => <ProtectedRoute component={Onboarding} />} />
      <Route path="/phase0" component={() => <ProtectedRoute component={Phase0} />} />
      <Route path="/week/:weekNumber" component={() => <ProtectedRoute component={WeeklyReflection} />} />
      <Route path="/month/:monthNumber/checkin" component={() => <ProtectedRoute component={MonthlyCheckin} />} />
      <Route path="/capstone" component={() => <ProtectedRoute component={Capstone} />} />
      <Route path="/progress" component={() => <ProtectedRoute component={Progress} />} />
      <Route path="/competition-review" component={() => <ProtectedRoute component={CompetitionReview} />} />
      <Route path="/competition-review/:id" component={() => <ProtectedRoute component={CompetitionReview} />} />
      <Route path="/appendix/:id" component={() => <ProtectedRoute component={Appendix} />} />
      <Route path="/pre-comp" component={() => <ProtectedRoute component={PreComp} />} />
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
