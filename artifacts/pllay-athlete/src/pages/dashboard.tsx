import { useLocation } from "wouter";
import { useGetAthleteProfile, useGetProgress } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { PhaseBadge, ProgressBar } from "@/components/ui-elements";
import { WEEKS, PHASE_COLORS } from "@/lib/constants";
import { Lock, ArrowRight, CheckCircle2 } from "lucide-react";
import { useEffect } from "react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: isProfileLoading, error: profileError } = useGetAthleteProfile({
    query: { retry: false }
  });
  const { data: progress, isLoading: isProgressLoading } = useGetProgress({
    query: { enabled: !!profile }
  });

  useEffect(() => {
    // If we get a 404 or similar error for the profile, redirect to onboarding
    if (profileError) {
      setLocation("/onboarding");
    }
  }, [profileError, setLocation]);

  if (isProfileLoading || isProgressLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  if (!profile || !progress) return null;

  const currentPhase = progress.currentPhase;
  const currentColor = PHASE_COLORS[currentPhase] || PHASE_COLORS[0];

  return (
    <Layout currentPhase={currentPhase}>
      <div className="px-6 pt-10 pb-6 border-b border-border bg-card">
        <PhaseBadge phase={currentPhase} />
        <h1 className="font-heading text-4xl leading-none uppercase mt-4 mb-1">
          {profile.name}
        </h1>
        <p className="font-mono text-sm text-muted-foreground">{profile.sport}</p>
      </div>

      <div className="p-6 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <div className="font-heading text-3xl" style={{ color: currentColor }}>{progress.weeksCompleted}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">Weeks Done</div>
          </div>
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <div className="font-heading text-3xl" style={{ color: currentColor }}>{progress.reflectionsCompleted}</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">Reflections</div>
          </div>
          <div className="bg-muted/30 border border-border rounded-xl p-4 text-center">
            <div className="font-heading text-3xl" style={{ color: currentColor }}>{Math.round(progress.overallCompletionPct)}%</div>
            <div className="font-mono text-[10px] text-muted-foreground mt-1 tracking-wider uppercase">Complete</div>
          </div>
        </div>

        {/* Phase 0 CTA */}
        {!progress.phase0Complete && (
          <div 
            className="rounded-xl border p-5 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ borderColor: PHASE_COLORS[0], backgroundColor: `${PHASE_COLORS[0]}10` }}
            onClick={() => setLocation("/phase0")}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-heading text-2xl uppercase" style={{ color: PHASE_COLORS[0] }}>Phase 0: Establishment</h2>
              <ArrowRight style={{ color: PHASE_COLORS[0] }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Complete the foundational modules before unlocking Week 1.</p>
            <button 
              className="w-full py-2 rounded font-heading text-lg text-white uppercase tracking-wide"
              style={{ backgroundColor: PHASE_COLORS[0] }}
            >
              Start Phase 0
            </button>
          </div>
        )}

        {/* Current Week Card */}
        {progress.phase0Complete && progress.currentWeek <= 12 && (
          <div 
            className="rounded-xl border p-5 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ borderColor: currentColor, backgroundColor: `${currentColor}10` }}
            onClick={() => setLocation(`/week/${progress.currentWeek}`)}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-heading text-2xl uppercase" style={{ color: currentColor }}>Week {progress.currentWeek}</h2>
              <ArrowRight style={{ color: currentColor }} />
            </div>
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">Mission</p>
            <p className="text-sm font-medium mb-4">{WEEKS[progress.currentWeek - 1].mission}</p>
            <button 
              className="w-full py-2 rounded font-heading text-lg text-white uppercase tracking-wide"
              style={{ backgroundColor: currentColor }}
            >
              Complete Reflection
            </button>
          </div>
        )}

        {/* Capstone Card */}
        {progress.currentWeek > 12 && !progress.capstoneComplete && (
          <div 
            className="rounded-xl border p-5 cursor-pointer hover:opacity-90 transition-opacity"
            style={{ borderColor: PHASE_COLORS[4], backgroundColor: `${PHASE_COLORS[4]}10` }}
            onClick={() => setLocation(`/capstone`)}
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="font-heading text-2xl uppercase" style={{ color: PHASE_COLORS[4] }}>Phase 4: Capstone</h2>
              <ArrowRight style={{ color: PHASE_COLORS[4] }} />
            </div>
            <p className="text-sm text-muted-foreground mb-4">Review your 12-week progression across all domains.</p>
            <button 
              className="w-full py-2 rounded font-heading text-lg text-white uppercase tracking-wide"
              style={{ backgroundColor: PHASE_COLORS[4] }}
            >
              Start Capstone
            </button>
          </div>
        )}

        {/* Timeline */}
        <div>
          <h3 className="font-heading text-xl uppercase mb-4">Program Timeline</h3>
          <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-border">
            {WEEKS.map((week) => {
              const isCompleted = week.number < progress.currentWeek;
              const isCurrent = week.number === progress.currentWeek && progress.phase0Complete;
              const isLocked = week.number > progress.currentWeek || !progress.phase0Complete;
              
              let statusColor = "var(--color-muted)";
              if (isCompleted) statusColor = "var(--color-primary)";
              if (isCurrent) statusColor = currentColor;

              return (
                <div key={week.number} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-card shrink-0 ml-0 mr-4 z-10 font-heading text-lg"
                    style={{ backgroundColor: statusColor, color: (isCompleted || isCurrent) ? 'white' : 'var(--color-muted-foreground)' }}
                  >
                    {isCompleted ? <CheckCircle2 size={18} /> : (isLocked ? <Lock size={16} /> : week.number)}
                  </div>
                  
                  <div 
                    className={`flex-1 rounded-xl p-4 border ${isCurrent ? 'bg-card' : 'bg-muted/30'} ${isLocked ? 'opacity-60 grayscale' : ''}`}
                    style={{ borderColor: isCurrent ? currentColor : 'var(--color-border)' }}
                    onClick={() => !isLocked && setLocation(`/week/${week.number}`)}
                  >
                    <div className="flex justify-between items-center">
                      <h4 className="font-heading text-lg uppercase" style={{ color: isCurrent ? currentColor : 'inherit' }}>
                        Week {week.number}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
