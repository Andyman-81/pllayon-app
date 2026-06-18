import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetWeeklyReflection, 
  useSaveWeeklyReflection,
  getGetWeeklyReflectionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Scorecard, ImplIntentionTrio } from "@/components/ui-elements";
import { WEEKS, DIMENSIONS, PHASE_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

export default function WeeklyReflection() {
  const { weekNumber: weekStr } = useParams();
  const weekNumber = parseInt(weekStr || "1", 10);
  const weekData = WEEKS[weekNumber - 1];
  
  // Phase computation (1-4 = Phase 1, 5-8 = Phase 2, etc)
  const phase = Math.ceil(weekNumber / 4);
  const phaseColor = PHASE_COLORS[phase];

  const queryClient = useQueryClient();
  const { data: reflection, isLoading } = useGetWeeklyReflection(weekNumber, {
    query: {
      enabled: !!weekNumber,
      queryKey: getGetWeeklyReflectionQueryKey(weekNumber)
    }
  });

  const saveMutation = useSaveWeeklyReflection();
  
  const [formData, setFormData] = useState({
    effort: 0,
    focus: 0,
    consistency: 0,
    recovery: 0,
    ownership: 0,
    bestMoment: "",
    biggestChallenge: "",
    keyLearning: "",
    focusAnswer: "",
    implWhen: "",
    implWhere: "",
    implHow: "",
    completed: false
  });

  const initialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (reflection && !initialized.current) {
      setFormData({
        effort: reflection.effort || 0,
        focus: reflection.focus || 0,
        consistency: reflection.consistency || 0,
        recovery: reflection.recovery || 0,
        ownership: reflection.ownership || 0,
        bestMoment: reflection.bestMoment || "",
        biggestChallenge: reflection.biggestChallenge || "",
        keyLearning: reflection.keyLearning || "",
        focusAnswer: reflection.focusAnswer || "",
        implWhen: reflection.implWhen || "",
        implWhere: reflection.implWhere || "",
        implHow: reflection.implHow || "",
        completed: !!reflection.completedAt
      });
      initialized.current = true;
    }
  }, [reflection]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      
      // Auto-save logic
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(
          { weekNumber, data: next },
          {
            onSuccess: (updated) => {
              queryClient.setQueryData(getGetWeeklyReflectionQueryKey(weekNumber), updated);
            }
          }
        );
      }, 2000);
      
      return next;
    });
  };

  const handleComplete = () => {
    const next = { ...formData, completed: true };
    setFormData(next);
    saveMutation.mutate({ weekNumber, data: next }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetWeeklyReflectionQueryKey(weekNumber), updated);
      }
    });
  };

  if (isLoading) {
    return (
      <Layout currentPhase={phase}>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout currentPhase={phase}>
      <PageHeader title={`Week ${weekNumber}`} subtitle={`Phase ${phase}`} phaseColor={phaseColor} />
      
      <div className="p-6 space-y-10">
        <div className="bg-card border-2 p-6 rounded-xl relative overflow-hidden" style={{ borderColor: phaseColor }}>
          <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: phaseColor }}></div>
          <h2 className="font-mono text-xs uppercase tracking-widest text-muted-foreground mb-2">WEEKLY MISSION</h2>
          <p className="font-heading text-3xl uppercase leading-tight">{weekData?.mission}</p>
        </div>

        <div>
          <h3 className="font-heading text-2xl uppercase mb-6" style={{ color: phaseColor }}>Performance Scorecard</h3>
          <div className="space-y-6">
            {DIMENSIONS.map(dim => (
              <Scorecard 
                key={dim.id}
                label={dim.label}
                value={formData[dim.id as keyof typeof formData] as number}
                onChange={(val) => handleChange(dim.id, val)}
                color={phaseColor}
              />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="font-heading text-2xl uppercase border-b pb-2" style={{ borderColor: phaseColor, color: phaseColor }}>Reflection</h3>
          
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">BEST MOMENT OF THE WEEK</label>
            <textarea 
              value={formData.bestMoment} 
              onChange={(e) => handleChange('bestMoment', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
            />
          </div>
          
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">BIGGEST CHALLENGE</label>
            <textarea 
              value={formData.biggestChallenge} 
              onChange={(e) => handleChange('biggestChallenge', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
            />
          </div>

          <div className="bg-muted/30 p-5 rounded-xl border border-border">
            <label className="block font-mono text-xs tracking-widest text-muted-foreground mb-3" style={{ color: phaseColor }}>FOCUS QUESTION</label>
            <p className="font-heading text-xl uppercase mb-4">{weekData?.focusQuestion}</p>
            <textarea 
              value={formData.focusAnswer} 
              onChange={(e) => handleChange('focusAnswer', e.target.value)}
              className="w-full bg-background border border-border rounded-md px-4 py-3 font-sans min-h-[120px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
              placeholder="Your answer..."
            />
          </div>
        </div>

        <ImplIntentionTrio 
          when={formData.implWhen} onWhenChange={v => handleChange('implWhen', v)}
          where={formData.implWhere} onWhereChange={v => handleChange('implWhere', v)}
          how={formData.implHow} onHowChange={v => handleChange('implHow', v)}
          color={phaseColor}
        />

        <button 
          onClick={handleComplete}
          className="w-full py-4 rounded-md font-heading text-2xl uppercase tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
          style={{ 
            backgroundColor: formData.completed ? 'transparent' : phaseColor,
            color: formData.completed ? phaseColor : 'white',
            border: formData.completed ? `2px solid ${phaseColor}` : 'none'
          }}
        >
          {formData.completed ? (
            <><Check size={24} /> Completed</>
          ) : (
            saveMutation.isPending ? "Saving..." : "Mark as Complete"
          )}
        </button>
      </div>
    </Layout>
  );
}
