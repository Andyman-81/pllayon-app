import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { 
  useGetCapstone,
  useSaveCapstone,
  getGetCapstoneQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { PHASE_COLORS } from "@/lib/constants";
import { Check } from "lucide-react";

export default function Capstone() {
  const phase = 4;
  const phaseColor = PHASE_COLORS[phase];

  const queryClient = useQueryClient();
  const { data: capstone, isLoading } = useGetCapstone({
    query: {
      queryKey: getGetCapstoneQueryKey()
    }
  });

  const saveMutation = useSaveCapstone();
  
  const [formData, setFormData] = useState({
    physicalStart: 0, physicalNow: 0,
    technicalStart: 0, technicalNow: 0,
    tacticalStart: 0, tacticalNow: 0,
    psychologicalStart: 0, psychologicalNow: 0,
    lifestyleStart: 0, lifestyleNow: 0,
    proudMoment: "",
    learned: "",
    doDifferently: "",
    signatureName: "",
    completed: false
  });

  const initialized = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (capstone && !initialized.current) {
      setFormData({
        physicalStart: capstone.physicalStart || 0,
        physicalNow: capstone.physicalNow || 0,
        technicalStart: capstone.technicalStart || 0,
        technicalNow: capstone.technicalNow || 0,
        tacticalStart: capstone.tacticalStart || 0,
        tacticalNow: capstone.tacticalNow || 0,
        psychologicalStart: capstone.psychologicalStart || 0,
        psychologicalNow: capstone.psychologicalNow || 0,
        lifestyleStart: capstone.lifestyleStart || 0,
        lifestyleNow: capstone.lifestyleNow || 0,
        proudMoment: capstone.proudMoment || "",
        learned: capstone.learned || "",
        doDifferently: capstone.doDifferently || "",
        signatureName: capstone.signatureName || "",
        completed: !!capstone.completedAt
      });
      initialized.current = true;
    }
  }, [capstone]);

  const handleChange = (key: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        saveMutation.mutate(
          { data: next },
          {
            onSuccess: (updated) => {
              queryClient.setQueryData(getGetCapstoneQueryKey(), updated);
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
    saveMutation.mutate({ data: next }, {
      onSuccess: (updated) => {
        queryClient.setQueryData(getGetCapstoneQueryKey(), updated);
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

  const DomainRow = ({ label, startKey, nowKey }: { label: string, startKey: string, nowKey: string }) => (
    <div className="flex items-center justify-between border-b py-3">
      <span className="font-mono text-sm uppercase">{label}</span>
      <div className="flex gap-4 items-center">
        <input 
          type="number" min="1" max="10" 
          value={formData[startKey as keyof typeof formData] as number || ''} 
          onChange={e => handleChange(startKey, parseInt(e.target.value))}
          className="w-16 bg-muted/50 border text-center rounded p-1" 
          placeholder="Start"
        />
        <span>→</span>
        <input 
          type="number" min="1" max="10" 
          value={formData[nowKey as keyof typeof formData] as number || ''} 
          onChange={e => handleChange(nowKey, parseInt(e.target.value))}
          className="w-16 bg-card border border-border text-center rounded p-1" 
          style={{ borderColor: phaseColor }}
          placeholder="Now"
        />
      </div>
    </div>
  );

  return (
    <Layout currentPhase={phase}>
      <PageHeader title="Capstone Review" phaseColor={phaseColor} />
      
      <div className="p-6 space-y-8">
        <div>
          <h3 className="font-heading text-xl uppercase mb-4" style={{ color: phaseColor }}>Domain Progression</h3>
          <div className="bg-card border rounded-xl p-4">
            <DomainRow label="Physical" startKey="physicalStart" nowKey="physicalNow" />
            <DomainRow label="Technical" startKey="technicalStart" nowKey="technicalNow" />
            <DomainRow label="Tactical" startKey="tacticalStart" nowKey="tacticalNow" />
            <DomainRow label="Psychological" startKey="psychologicalStart" nowKey="psychologicalNow" />
            <DomainRow label="Lifestyle" startKey="lifestyleStart" nowKey="lifestyleNow" />
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">PROUDEST MOMENT</label>
            <textarea 
              value={formData.proudMoment} 
              onChange={(e) => handleChange('proudMoment', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">WHAT I LEARNED</label>
            <textarea 
              value={formData.learned} 
              onChange={(e) => handleChange('learned', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y"
            />
          </div>
          <div>
            <label className="block font-mono text-xs text-muted-foreground mb-2">WHAT I WOULD DO DIFFERENTLY</label>
            <textarea 
              value={formData.doDifferently} 
              onChange={(e) => handleChange('doDifferently', e.target.value)}
              className="w-full bg-muted/30 border border-border rounded-md px-4 py-3 font-sans min-h-[100px] resize-y"
            />
          </div>
        </div>

        <div className="bg-muted/30 p-5 rounded-xl border border-border">
          <label className="block font-mono text-xs text-muted-foreground mb-2">ATHLETE SIGNATURE</label>
          <input 
            type="text" 
            value={formData.signatureName} 
            onChange={(e) => handleChange('signatureName', e.target.value)}
            className="w-full bg-background border border-border rounded-md px-4 py-3 font-heading text-xl"
            placeholder="Type your name to sign"
          />
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
            <><Check size={24} /> Program Completed</>
          ) : (
            saveMutation.isPending ? "Saving..." : "Sign & Complete Program"
          )}
        </button>
      </div>
    </Layout>
  );
}
