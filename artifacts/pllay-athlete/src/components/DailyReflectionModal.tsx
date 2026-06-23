import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { RatingBox } from '@/components/ui-elements';

const SESSION_TYPES = [
  { label: 'Tennis — Court',  colour: '#10AC6E' },
  { label: 'Tennis — Match',  colour: '#FF4936' },
  { label: 'S&C Session',     colour: '#0B7DF1' },
  { label: 'Speed & Agility', colour: '#F5B809' },
  { label: 'Recovery',        colour: '#06B6D4' },
  { label: 'School Sport',    colour: '#1E293B' },
  { label: 'Other',           colour: '#64748B' },
];

interface DailyLog {
  id?: number;
  sessionType?: string | null;
  sessionFocus?: string;
  wentWell?: string | null;
  challenging?: string | null;
  developmentNote?: string | null;
  physicalStatus?: string | null;
  sessionRating?: number | null;
  energyRating?: number | null;
}

interface Props {
  weekNumber: number;
  dayOfWeek: string;
  phaseColour: string;
  existing: DailyLog | null;
  onClose: () => void;
}

interface FormData {
  sessionType: string;
  sessionFocus: string;
  wentWell: string;
  challenging: string;
  developmentNote: string;
  physicalStatus: string;
  sessionRating: number;
  energyRating: number;
}

function ModalField({ label, hint, placeholder, value, onChange, phaseColour, required }: {
  label: string; hint: string; placeholder: string;
  value: string; onChange: (v: string) => void; phaseColour: string; required?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function grow() {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }
  useEffect(() => { grow(); }, [value]);

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 3 }}>
        {label}{required && <span style={{ color: phaseColour }}> *</span>}
      </div>
      <div style={{ fontFamily: 'var(--font-b)', fontSize: 10, color: '#94A3B8', marginBottom: 6, lineHeight: 1.4 }}>{hint}</div>
      <textarea
        ref={ref}
        value={value}
        rows={2}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); grow(); }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = phaseColour; }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
        className="wl"
        style={{ fontSize: 14 }}
      />
    </div>
  );
}

export function DailyReflectionModal({ weekNumber, dayOfWeek, phaseColour, existing, onClose }: Props) {
  const queryClient = useQueryClient();

  const [form, setForm] = useState<FormData>({
    sessionType: existing?.sessionType ?? '',
    sessionFocus: existing?.sessionFocus ?? '',
    wentWell: existing?.wentWell ?? '',
    challenging: existing?.challenging ?? '',
    developmentNote: existing?.developmentNote ?? '',
    physicalStatus: existing?.physicalStatus ?? '',
    sessionRating: existing?.sessionRating ?? 0,
    energyRating: existing?.energyRating ?? 0,
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (data: FormData) => apiFetch('/daily-reflection', {
      method: 'POST',
      body: JSON.stringify({ weekNumber, dayOfWeek, ...data }),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-reflections', weekNumber] });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    },
  });

  const autoSave = useCallback((data: FormData) => {
    if (!data.sessionFocus.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    debounceRef.current = setTimeout(() => {
      mutation.mutate(data);
    }, 1500);
  }, [mutation]);

  function update(key: keyof FormData, value: string | number) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      autoSave(next);
      return next;
    });
  }

  function handleSave() {
    if (!form.sessionFocus.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    mutation.mutate(form, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['daily-reflections', weekNumber] });
        onClose();
      },
    });
  }

  const canSave = form.sessionFocus.trim().length > 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 3000 }}
      />

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxHeight: '92dvh', overflowY: 'auto',
        background: '#fff', borderRadius: '16px 16px 0 0',
        zIndex: 3001, animation: 'slideUp .22s ease-out',
        paddingBottom: 'max(env(safe-area-inset-bottom), 24px)',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', padding: '20px 20px 14px', borderBottom: '1px solid #F1F5F9', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', color: phaseColour, lineHeight: 1 }}>
                {dayOfWeek} — Session Log
              </div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94A3B8', marginTop: 5 }}>
                Optional · Takes 2 minutes
                {saveStatus === 'saving' && <span style={{ color: phaseColour }}> · Saving…</span>}
                {saveStatus === 'saved' && <span style={{ color: '#10AC6E' }}> · Saved</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#94A3B8', padding: '0 0 0 12px', lineHeight: 1 }}>×</button>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>

          {/* Session type pills */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>
              What type of session?
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
              {SESSION_TYPES.map(t => {
                const selected = form.sessionType === t.label;
                return (
                  <button
                    key={t.label}
                    onClick={() => update('sessionType', selected ? '' : t.label)}
                    style={{
                      flexShrink: 0, padding: '7px 14px', borderRadius: 100,
                      border: `1.5px solid ${selected ? t.colour : 'rgba(0,0,0,.12)'}`,
                      background: selected ? t.colour : 'transparent',
                      fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
                      letterSpacing: '.08em', textTransform: 'uppercase',
                      color: selected ? '#fff' : '#64748B',
                      cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap',
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields */}
          <ModalField
            label="What did I work on today?"
            hint="Name the specific focus — not just the session type"
            placeholder="e.g. Serve + return patterns in the squad session. Coach focused on my kick serve placement to the ad court."
            value={form.sessionFocus}
            onChange={v => update('sessionFocus', v)}
            phaseColour={phaseColour}
            required
          />
          <ModalField
            label="What went well?"
            hint="One specific moment or quality — not 'everything was good'"
            placeholder="e.g. My backhand cross-court was clicking. I held the pattern under pressure in the practice match."
            value={form.wentWell}
            onChange={v => update('wentWell', v)}
            phaseColour={phaseColour}
          />
          <ModalField
            label="What was challenging?"
            hint="What was genuinely hard? Be specific."
            placeholder="e.g. The last 20 minutes. I was flat and my decision-making dropped. I know why — didn't eat enough."
            value={form.challenging}
            onChange={v => update('challenging', v)}
            phaseColour={phaseColour}
          />
          <ModalField
            label="One thing I noticed about my development today"
            hint="Not a result — an observation about how you are improving"
            placeholder="e.g. I stayed in the point longer before going for the winner. Six weeks ago I would have gone early."
            value={form.developmentNote}
            onChange={v => update('developmentNote', v)}
            phaseColour={phaseColour}
          />
          <ModalField
            label="Physical status"
            hint="Any niggles, fatigue or anything to flag"
            placeholder="e.g. Left calf a bit tight after the sprint work. Worth flagging at the next S&C session."
            value={form.physicalStatus}
            onChange={v => update('physicalStatus', v)}
            phaseColour={phaseColour}
          />
          <div style={{ marginTop: -14, marginBottom: 20 }}>
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams();
                if (weekNumber) params.set('weekNumber', String(weekNumber));
                if (form.dayOfWeek) params.set('dayOfWeek', form.dayOfWeek);
                if (form.sessionType) params.set('sessionType', form.sessionType);
                window.location.href = `/injury/new?${params.toString()}`;
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-b)', fontSize: 12, color: '#FF4936', textDecoration: 'underline' }}
            >
              Flag this to your coach →
            </button>
          </div>

          {/* Session rating */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>
              How was the session overall?
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {[1,2,3,4,5].map(n => (
                <RatingBox key={n} value={n} selected={(form.sessionRating ?? 0) >= n} onSelect={v => update('sessionRating', v)} phaseColour={phaseColour} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              <span>Poor</span><span>Excellent</span>
            </div>
          </div>

          {/* Energy rating */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>
              My energy level today
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {[1,2,3,4,5].map(n => (
                <RatingBox key={n} value={n} selected={(form.energyRating ?? 0) >= n} onSelect={v => update('energyRating', v)} phaseColour={phaseColour} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              <span>Very low</span><span>Very high</span>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={!canSave || mutation.isPending}
            style={{
              width: '100%', minHeight: 52, background: canSave ? phaseColour : '#E2E8F0',
              color: canSave ? '#fff' : '#94A3B8', border: 'none', borderRadius: 6,
              fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22,
              textTransform: 'uppercase', letterSpacing: '.06em',
              cursor: canSave ? 'pointer' : 'default', marginBottom: 8,
            }}
          >
            {mutation.isPending ? 'Saving…' : 'Save Session Log'}
          </button>
        </div>
      </div>
    </>
  );
}
