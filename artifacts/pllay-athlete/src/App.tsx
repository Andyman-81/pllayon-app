import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@workspace/replit-auth-web";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Onboarding from "@/pages/onboarding";
import WeeklyReflection from "@/pages/weekly-reflection";
import Phase0 from "@/pages/phase0";
import MonthlyCheckin from "@/pages/monthly-checkin";
import Capstone from "@/pages/capstone";
import Progress from "@/pages/progress";
import CompetitionReview from "@/pages/competition-review";
import Appendix from "@/pages/appendix";

const queryClient = new QueryClient();

function LoginScreen() {
  const { login } = useAuth();
  return (
    <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-[#111111] text-white p-4 font-sans">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-2">
          <p className="text-[#10AC6E] font-mono tracking-widest text-xs">PLLAY ON EDGE</p>
          <h1 className="text-6xl font-heading tracking-tighter uppercase leading-[0.9]">Development<br/>Program</h1>
        </div>
        <button 
          onClick={() => login()}
          className="w-full bg-[#10AC6E] text-[#111111] py-4 px-8 rounded-sm font-heading text-2xl hover:opacity-90 transition-opacity uppercase tracking-wide mt-12"
        >
          Access Portal
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <LoginScreen />;
  }
  
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
      <Route path="/appendix/:id" component={() => <ProtectedRoute component={Appendix} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
