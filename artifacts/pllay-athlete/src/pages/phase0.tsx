import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  useGetPhase0Modules,
  useSavePhase0Module,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { PHASE_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

const MODULES = [
  "0.1 Vision",
  "0.2 Standards",
  "0.3 Environment",
  "0.4 Routines",
  "0.5 Obstacles",
  "0.6 Commitment"
];

export default function Phase0() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: modules, isLoading } = useGetPhase0Modules();
  const saveMutation = useSavePhase0Module();
  
  const [activeModule, setActiveModule] = useState(0);
  const [content, setContent] = useState("");
  
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (modules && modules[activeModule]) {
      const mod = modules[activeModule];
      setContent((mod.data as any)?.content || "");
    } else {
      setContent("");
    }
  }, [activeModule, modules]);

  const handleChange = (val: string) => {
    setContent(val);
    
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate({
        moduleName: MODULES[activeModule],
        data: {
          data: { content: val },
          completed: false
        }
      });
    }, 2000);
  };

  const handleComplete = () => {
    saveMutation.mutate({
      moduleName: MODULES[activeModule],
      data: {
        data: { content },
        completed: true
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/phase0/modules"] });
        if (activeModule < MODULES.length - 1) {
          setActiveModule(activeModule + 1);
        } else {
          setLocation("/");
        }
      }
    });
  };

  if (isLoading) {
    return (
      <Layout currentPhase={0}>
        <div className="flex items-center justify-center h-full min-h-[50vh]">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </Layout>
    );
  }

  const currentMod = modules?.[activeModule];
  const isCompleted = currentMod?.completed;

  return (
    <Layout currentPhase={0}>
      <PageHeader title="Phase 0" subtitle="Establishment" phaseColor={PHASE_COLORS[0]} />
      
      <div className="p-6 space-y-6">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {MODULES.map((mod, idx) => {
            const isModCompleted = modules?.[idx]?.completed;
            const isActive = idx === activeModule;
            return (
              <button
                key={mod}
                onClick={() => setActiveModule(idx)}
                className={`shrink-0 px-4 py-2 rounded-full font-mono text-xs tracking-wider transition-colors border ${isActive ? 'bg-primary text-primary-foreground border-primary' : isModCompleted ? 'bg-muted border-border text-foreground' : 'bg-transparent border-border text-muted-foreground'}`}
                style={isActive ? { backgroundColor: PHASE_COLORS[0], borderColor: PHASE_COLORS[0] } : {}}
              >
                {mod} {isModCompleted && "✓"}
              </button>
            );
          })}
        </div>

        <div className="bg-card border p-6 rounded-xl space-y-6">
          <h2 className="font-heading text-2xl uppercase">{MODULES[activeModule]}</h2>
          
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">REFLECTION</label>
            <textarea 
              value={content} 
              onChange={(e) => handleChange(e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[200px] resize-y focus:outline-none focus:ring-1"
              style={{ '--tw-ring-color': PHASE_COLORS[0] } as any}
            />
          </div>

          <button 
            onClick={handleComplete}
            className="w-full py-4 rounded-md font-heading text-xl uppercase tracking-wide flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
            style={{ 
              backgroundColor: isCompleted ? 'transparent' : PHASE_COLORS[0],
              color: isCompleted ? PHASE_COLORS[0] : 'white',
              border: isCompleted ? `2px solid ${PHASE_COLORS[0]}` : 'none'
            }}
          >
            {isCompleted ? (
              <><Check size={20} /> Completed</>
            ) : (
              saveMutation.isPending ? "Saving..." : "Mark as Complete"
            )}
          </button>
        </div>
      </div>
    </Layout>
  );
}
