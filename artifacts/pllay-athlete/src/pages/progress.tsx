import { useGetProgress } from "@workspace/api-client-react";
import { Layout, PageHeader } from "@/components/layout";
import { PHASE_COLORS } from "@/lib/constants";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";

export default function Progress() {
  const { data: progress, isLoading } = useGetProgress();

  if (isLoading || !progress) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  const currentPhase = progress.currentPhase;
  const phaseColor = PHASE_COLORS[currentPhase] || PHASE_COLORS[0];

  const chartData = [
    { name: 'Physical', start: progress.domainScores.physical?.start || 0, current: progress.domainScores.physical?.current || 0 },
    { name: 'Technical', start: progress.domainScores.technical?.start || 0, current: progress.domainScores.technical?.current || 0 },
    { name: 'Tactical', start: progress.domainScores.tactical?.start || 0, current: progress.domainScores.tactical?.current || 0 },
    { name: 'Psych.', start: progress.domainScores.psychological?.start || 0, current: progress.domainScores.psychological?.current || 0 },
    { name: 'Lifestyle', start: progress.domainScores.lifestyle?.start || 0, current: progress.domainScores.lifestyle?.current || 0 },
  ];

  return (
    <Layout currentPhase={currentPhase}>
      <PageHeader title="Progress" phaseColor={phaseColor} />
      
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border p-4 rounded-xl text-center">
            <div className="font-mono text-xs text-muted-foreground mb-1">COMPLETION</div>
            <div className="font-heading text-4xl" style={{ color: phaseColor }}>{Math.round(progress.overallCompletionPct)}%</div>
          </div>
          <div className="bg-card border p-4 rounded-xl text-center">
            <div className="font-mono text-xs text-muted-foreground mb-1">STREAK</div>
            <div className="font-heading text-4xl" style={{ color: phaseColor }}>{progress.streakWeeks} <span className="text-xl text-muted-foreground">WKS</span></div>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-xl uppercase mb-4" style={{ color: phaseColor }}>Domain Progression</h3>
          <div className="bg-card border rounded-xl p-4 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 10]} tick={{ fontSize: 10, fontFamily: 'monospace' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Bar dataKey="start" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                <Bar dataKey="current" fill={phaseColor} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-2 font-mono text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1"><div className="w-3 h-3 bg-muted rounded-sm"></div> Start</div>
              <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: phaseColor }}></div> Current</div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-heading text-xl uppercase mb-4">Milestones</h3>
          <div className="space-y-2">
            {[
              { label: "Phase 0 Complete", done: progress.phase0Complete },
              { label: "Month 1 Check-In", done: progress.month1CheckinComplete },
              { label: "Month 2 Check-In", done: progress.month2CheckinComplete },
              { label: "Capstone Complete", done: progress.capstoneComplete }
            ].map(m => (
              <div key={m.label} className="flex justify-between items-center bg-card border p-4 rounded-lg">
                <span className="font-mono text-sm uppercase">{m.label}</span>
                {m.done ? (
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: phaseColor }}>✓</div>
                ) : (
                  <div className="w-6 h-6 rounded-full border-2 border-muted"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
