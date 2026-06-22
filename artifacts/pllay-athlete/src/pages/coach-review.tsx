import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Callout } from "@/components/ui-elements";
import { apiFetch } from "@/lib/api";

const BLUE = '#0B7DF1';

interface ReviewData {
  technicalRating?: number; tacticalRating?: number; physicalRating?: number;
  coachabilityRating?: number; awarenessRating?: number;
  biggestImprovement?: string; remainingConstraint?: string;
  technicalPriority?: string; tacticalPriority?: string; physicalPriority?: string;
  competitionRecommendation?: string; behaviourNote?: string; additionalNotes?: string;
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ flex: 1, fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 700, color: 'var(--dark)', letterSpacing: '.02em' }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button
            key={v} type="button" onClick={() => onChange(v)}
            style={{ width: 36, height: 36, border: `2px solid ${value === v ? BLUE : 'var(--grey1)'}`, borderRadius: 6, background: value === v ? `${BLUE}18` : 'transparent', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, color: value === v ? BLUE : 'var(--grey)', cursor: 'pointer', transition: 'all .12s' }}
          >
            {v}
          </button>
        ))}
      </div>
    </div>
  );
}

function ObsField({ label, hint, placeholder, value, onChange }: {
  label: string; hint?: string; placeholder?: string; value: string; onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 4 }}>{label}</div>
      {hint && <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--grey)', marginBottom: 6, lineHeight: 1.4 }}>{hint}</div>}
      <textarea
        ref={ref} value={value} rows={2} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        onFocus={e => { e.currentTarget.style.borderBottomColor = BLUE; }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
        className="wl"
        style={{ minHeight: 60 }}
      />
    </div>
  );
}

export default function CoachReview() {
  const queryClient = useQueryClient();
  const { data: saved } = useQuery({ queryKey: ['coach-review'], queryFn: () => apiFetch<ReviewData | null>('/coach/review') });

  const [data, setData] = useState<ReviewData>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (saved) setData(saved);
  }, [saved]);

  const mutation = useMutation({
    mutationFn: (d: ReviewData) => apiFetch('/coach/review', { method: 'PUT', body: JSON.stringify(d) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['coach-review'] }); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); },
    onSettled: () => { if (saveStatus === 'saving') setSaveStatus('idle'); }
  });

  const update = useCallback(<K extends keyof ReviewData>(key: K, val: ReviewData[K]) => {
    setData(d => {
      const next = { ...d, [key]: val };
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setSaveStatus('saving');
      debounceRef.current = setTimeout(() => mutation.mutate(next), 1500);
      return next;
    });
  }, [mutation]);

  const setRating = (key: keyof ReviewData) => (v: number) => update(key, v);
  const setText = (key: keyof ReviewData) => (v: string) => update(key, v);

  return (
    <Layout currentSection="COACH REVIEW — MODULE 4.3">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 40px' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--grey1)' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: BLUE, marginBottom: 6, fontWeight: 700 }}>
            COMPLETE INDEPENDENTLY BEFORE THE CAPSTONE SESSION
          </div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .9 }}>
            COACH REVIEW
          </div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--grey)', marginTop: 6 }}>Module 4.3</div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <Callout title="Write your assessment before reviewing it with the athlete." colour={BLUE}>
            Your independent observation is more valuable than one formed in the room.
          </Callout>

          {/* 5-dimension scorecard */}
          <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, overflow: 'hidden', marginBottom: 20 }}>
            <div style={{ background: BLUE, padding: '12px 18px' }}>
              <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: '#fff', letterSpacing: '-.01em' }}>12-WEEK DEVELOPMENT RATINGS</span>
            </div>
            <div style={{ padding: '0 18px' }}>
              <RatingRow label="Technical development across 12 weeks" value={data.technicalRating ?? 0} onChange={setRating('technicalRating')} />
              <RatingRow label="Tactical development across 12 weeks" value={data.tacticalRating ?? 0} onChange={setRating('tacticalRating')} />
              <RatingRow label="Physical development across 12 weeks" value={data.physicalRating ?? 0} onChange={setRating('physicalRating')} />
              <RatingRow label="Attitude and coachability" value={data.coachabilityRating ?? 0} onChange={setRating('coachabilityRating')} />
              <RatingRow label="Self-awareness — does the athlete understand their own development?" value={data.awarenessRating ?? 0} onChange={setRating('awarenessRating')} />
            </div>
          </div>

          {/* Observation fields */}
          <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '18px 18px 4px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 16 }}>OBSERVATIONS</div>
            <ObsField label="Biggest observable improvement" hint="Be specific — not 'they improved overall'" placeholder="e.g. Backhand return consistency under pressure. In Week 1 this was the primary weakness — by Week 10 it had become a reliable shot." value={data.biggestImprovement ?? ''} onChange={setText('biggestImprovement')} />
            <ObsField label="Biggest remaining constraint" hint="What is still limiting overall performance most?" placeholder="e.g. Decision-making speed when fatigued. Quality drops significantly in the third set." value={data.remainingConstraint ?? ''} onChange={setText('remainingConstraint')} />
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '18px 18px 4px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 16 }}>NEXT CYCLE PRIORITIES</div>
            <ObsField label="Technical priority for next cycle" placeholder="e.g. Serve kick development — ready physically now post-PHV." value={data.technicalPriority ?? ''} onChange={setText('technicalPriority')} />
            <ObsField label="Tactical priority for next cycle" placeholder="e.g. Net approach patterns — currently avoids the net under pressure." value={data.tacticalPriority ?? ''} onChange={setText('tacticalPriority')} />
            <ObsField label="Physical / S&C priority for next cycle" placeholder="e.g. Rotational power — strength base is now sufficient to load it." value={data.physicalPriority ?? ''} onChange={setText('physicalPriority')} />
            <ObsField label="Competition level recommendation" hint="What level should this athlete be targeting next cycle?" placeholder="e.g. Ready for consistent national ranking events. State level is no longer the developmental stretch." value={data.competitionRecommendation ?? ''} onChange={setText('competitionRecommendation')} />
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '18px 18px 4px', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 16 }}>ADDITIONAL OBSERVATIONS</div>
            <ObsField label="Behaviour or mindset note" hint="One observation about how this athlete approaches development" placeholder="e.g. Significantly more self-aware by Week 12. Uses PHV language unprompted. Takes ownership of review sessions." value={data.behaviourNote ?? ''} onChange={setText('behaviourNote')} />
            <ObsField label="Additional observations" placeholder="Anything else relevant to next cycle planning." value={data.additionalNotes ?? ''} onChange={setText('additionalNotes')} />
          </div>

          <button
            onClick={() => { setSaveStatus('saving'); mutation.mutate(data); }}
            disabled={mutation.isPending}
            style={{ width: '100%', minHeight: 52, background: BLUE, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer', opacity: mutation.isPending ? .7 : 1 }}
          >
            {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Coach Review'}
          </button>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', textAlign: 'center', marginTop: 8, letterSpacing: '.06em' }}>
            Auto-saves as you type
          </div>
        </div>
      </div>
    </Layout>
  );
}
