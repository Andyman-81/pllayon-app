import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetMonthlyCheckin,
  useSaveMonthlyCheckin,
  getGetMonthlyCheckinQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { PHASE_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

export default function MonthlyCheckin() {
  const { monthNumber: monthStr } = useParams();
  const monthNumber = parseInt(monthStr || "1", 10);
  
  // Phase computation 
  const phase = monthNumber;
  const phaseColor = PHASE_COLORS[phase];

  const queryClient = useQueryClient();
  const { data: checkin, isLoading } = useGetMonthlyCheckin(monthNumber, {
    query: {
      enabled: !!monthNumber,
      queryKey: getGetMonthlyCheckinQueryKey(monthNumber)
    }
  });

  const saveMutation = useSaveMonthlyCheckin();
  
  const [formData, setFormData] = useState({
    goal1Progress: "",
    goal2Progress: "",
    keyHabit: "",
    keyLearning: "",
    changeNextPhase: "",
    completed: false
  });

  const initialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (checkin && !initialized.current) {
      setFormData({
        goal1Progress: checkin.goal1Progress || "",
        goal2Progress: checkin.goal2Progress || "",
        keyHabit: checkin.keyHabit || "",
        keyLearning: checkin.keyLearning || "",
        changeNextPhase: checkin.changeNextPhase || "",
        completed: !!checkin.completedAt
      });
      initialized.current = true;
    }
  }, [checkin]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(
          { data: { monthNumber, ...next } },
          {
            onSuccess: (updated) => {
              queryClient.setQueryData(getGetMonthlyCheckinQueryKey(monthNumber), updated);
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
    saveMutation.mutate({ data: { monthNumber, ...next } }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetMonthlyCheckinQueryKey(monthNumber), updated);
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
      <PageHeader title={`Month ${monthNumber} Check-In`} phaseColor={phaseColor} />
      
      <div className="p-6 space-y-8">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border p-4 rounded-xl text-center">
            <div className="font-mono text-xs text-muted-foreground mb-1">EFFORT AVG</div>
            <div className="font-heading text-3xl" style={{ color: phaseColor }}>{checkin?.effortAvg?.toFixed(1) || "-"}</div>
          </div>
          <div className="bg-card border p-4 rounded-xl text-center">
            <div className="font-mono text-xs text-muted-foreground mb-1">FOCUS AVG</div>
            <div className="font-heading text-3xl" style={{ color: phaseColor }}>{checkin?.focusAvg?.toFixed(1) || "-"}</div>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">GOAL 1 PROGRESS</label>
            <textarea 
              value={formData.goal1Progress} 
              onChange={(e) => handleChange('goal1Progress', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
            />
          </div>
          
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">KEY HABIT DEVELOPED</label>
            <textarea 
              value={formData.keyHabit} 
              onChange={(e) => handleChange('keyHabit', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">KEY LEARNING</label>
            <textarea 
              value={formData.keyLearning} 
              onChange={(e) => handleChange('keyLearning', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': phaseColor } as any}
            />
          </div>
        </div>

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
