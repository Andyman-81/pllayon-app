import React from "react";
import { Check, Lock } from "lucide-react";
import { PHASE_COLORS, PHASE_LABELS } from "@/lib/constants";

export function PhaseBadge({ phase }: { phase: number }) {
  const color = PHASE_COLORS[phase] || PHASE_COLORS[0];
  const label = PHASE_LABELS[phase] || "Unknown";

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border" style={{ borderColor: color, backgroundColor: `${color}15` }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="font-mono text-xs font-bold uppercase tracking-widest" style={{ color }}>PHASE {phase}: {label}</span>
    </div>
  );
}

export function ProgressBar({ current, total, color }: { current: number, total: number, color?: string }) {
  const percentage = Math.min(100, Math.max(0, (current / total) * 100));
  return (
    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
      <div 
        className="h-full transition-all duration-500 ease-out rounded-full" 
        style={{ width: `${percentage}%`, backgroundColor: color || PHASE_COLORS[0] }}
      />
    </div>
  );
}

export function Scorecard({ label, value, onChange, color }: { label: string, value?: number | null, onChange: (val: number) => void, color?: string }) {
  const activeColor = color || PHASE_COLORS[0];
  
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-mono text-sm uppercase tracking-wider">{label}</span>
        {value && <span className="font-heading text-xl" style={{ color: activeColor }}>{value}/5</span>}
      </div>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(rating => (
          <button
            key={rating}
            onClick={() => onChange(rating)}
            className={`flex-1 h-12 rounded-md border-2 transition-all font-heading text-xl flex items-center justify-center`}
            style={{
              borderColor: value === rating ? activeColor : 'var(--color-border)',
              backgroundColor: value === rating ? `${activeColor}15` : 'transparent',
              color: value === rating ? activeColor : 'var(--color-muted-foreground)'
            }}
          >
            {rating}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ImplIntentionTrio({
  when, onWhenChange,
  where, onWhereChange,
  how, onHowChange,
  color
}: {
  when: string, onWhenChange: (val: string) => void,
  where: string, onWhereChange: (val: string) => void,
  how: string, onHowChange: (val: string) => void,
  color?: string
}) {
  const activeColor = color || PHASE_COLORS[0];
  
  return (
    <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-4">
      <h3 className="font-heading text-xl uppercase border-b border-border pb-2 mb-4" style={{ color: activeColor }}>Implementation Intention</h3>
      
      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">WHEN</label>
        <input 
          type="text" 
          value={when || ''} 
          onChange={(e) => onWhenChange(e.target.value)}
          className="w-full bg-background border border-border rounded-md px-3 py-2 font-sans focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': activeColor } as any}
          placeholder="e.g. Immediately after training"
        />
      </div>
      
      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">WHERE</label>
        <input 
          type="text" 
          value={where || ''} 
          onChange={(e) => onWhereChange(e.target.value)}
          className="w-full bg-background border border-border rounded-md px-3 py-2 font-sans focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': activeColor } as any}
          placeholder="e.g. In the car ride home"
        />
      </div>
      
      <div>
        <label className="block font-mono text-xs text-muted-foreground mb-1">HOW</label>
        <textarea 
          value={how || ''} 
          onChange={(e) => onHowChange(e.target.value)}
          className="w-full bg-background border border-border rounded-md px-3 py-2 font-sans min-h-[80px] resize-none focus:outline-none focus:ring-1"
          style={{ '--tw-ring-color': activeColor } as any}
          placeholder="e.g. I will write down three things..."
        />
      </div>
    </div>
  );
}
