import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { useGetSleepLogs, useSaveSleepLog, getGetSleepLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { PHASE_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

function SleepLogInteractive() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: logs, isLoading } = useGetSleepLogs();
  const saveMutation = useSaveSleepLog();

  const [date, setDate] = useState(todayStr);
  const [rating, setRating] = useState(0);
  const [hours, setHours] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) {
    return <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>;
  }

  const handleSave = () => {
    saveMutation.mutate({
      data: {
        logDate: date,
        rating,
        hoursSlept: hours ? parseFloat(hours) : undefined,
        notes
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSleepLogsQueryKey() });
        setRating(0);
        setHours("");
        setNotes("");
      }
    });
  };

  return (
    <div className="bg-card border p-4 rounded-xl space-y-4">
      <h3 className="font-heading text-xl uppercase">Sleep Log</h3>
      
      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">DATE</label>
        <input 
          type="date" 
          value={date} 
          onChange={e => setDate(e.target.value)}
          className="w-full bg-background border rounded-md px-3 py-2"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">QUALITY (1-5)</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(val => (
            <button
              key={val}
              onClick={() => setRating(val)}
              className={`flex-1 h-10 rounded border font-heading text-lg ${rating === val ? 'bg-primary text-primary-foreground border-primary' : 'bg-transparent text-muted-foreground'}`}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">HOURS SLEPT</label>
        <input 
          type="number" 
          step="0.5"
          value={hours} 
          onChange={e => setHours(e.target.value)}
          className="w-full bg-background border rounded-md px-3 py-2"
          placeholder="e.g. 7.5"
        />
      </div>

      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">NOTES</label>
        <input 
          type="text" 
          value={notes} 
          onChange={e => setNotes(e.target.value)}
          className="w-full bg-background border rounded-md px-3 py-2"
          placeholder="Optional notes"
        />
      </div>

      <button 
        onClick={handleSave}
        disabled={saveMutation.isPending || !rating}
        className="w-full py-3 bg-primary text-primary-foreground rounded-md font-heading uppercase tracking-wide disabled:opacity-50"
      >
        {saveMutation.isPending ? "Saving..." : "Log Sleep"}
      </button>

      <div className="mt-6 pt-4 border-t space-y-2">
        <h4 className="font-mono text-xs text-muted-foreground mb-2">RECENT LOGS</h4>
        {logs?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sleep logged yet.</p>
        ) : (
          logs?.slice(0, 5).map(log => (
            <div key={log.id} className="flex justify-between items-center bg-muted/30 p-2 rounded text-sm">
              <span className="font-mono">{new Date(log.logDate).toLocaleDateString()}</span>
              <div className="flex items-center gap-4">
                <span>{log.hoursSlept ? `${log.hoursSlept}h` : '-'}</span>
                <span className="font-heading text-lg text-primary">{log.rating}/5</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function Appendix() {
  const { id } = useParams();
  
  const contentMap: Record<string, { title: string, content: React.ReactNode }> = {
    'a': {
      title: "Warm-Up Protocols",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Standardized preparation routines prior to technical or physical sessions.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>5 min global mobility</li>
            <li>5 min dynamic stretching</li>
            <li>5 min neural activation (pogos, short sprints)</li>
          </ul>
        </div>
      )
    },
    'b': {
      title: "Gym Standards",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Execution standards for the weight room.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Always record your loads.</li>
            <li>Prioritize movement quality over weight.</li>
            <li>If returning from injury, clear all movements with medical staff.</li>
          </ul>
        </div>
      )
    },
    'c': {
      title: "Body Management",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">Track your recovery to optimize adaptation.</p>
          <SleepLogInteractive />
        </div>
      )
    },
    'd': {
      title: "Cooldown & Recovery",
      content: (
        <div className="space-y-4">
          <p className="text-muted-foreground">Post-session protocols to accelerate baseline return.</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>5-10 min light aerobic flush.</li>
            <li>Hydration: 1.5x bodyweight lost in fluid.</li>
            <li>Protein intake within 45 mins.</li>
          </ul>
        </div>
      )
    }
  };

  const current = contentMap[(id || 'a').toLowerCase()] || contentMap['a'];

  return (
    <Layout>
      <PageHeader title={`Appendix ${id?.toUpperCase() || 'A'}`} subtitle={current.title} phaseColor={PHASE_COLORS[0]} />
      
      <div className="p-6">
        {current.content}
      </div>
    </Layout>
  );
}
