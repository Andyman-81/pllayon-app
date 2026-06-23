import { useState, useRef } from 'react';
import { useLocation, useSearch } from 'wouter';
import { useMutation } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { apiFetch } from '@/lib/api';
import { RatingBox } from '@/components/ui-elements';
import { getRole } from '@/lib/useRole';

const RED = '#FF4936';

const BODY_AREAS_LEFT  = ['Head / Neck','Upper Back','Lower Back','Hip / Glute','Groin / Adductor','Hamstring','Quad','General Fatigue'];
const BODY_AREAS_RIGHT = ['Shoulder','Elbow / Forearm','Wrist / Hand','Knee','Shin / Calf','Ankle','Foot / Toe','Other'];
const CONCERN_TYPES    = ['Pain','Tightness','Swelling','Fatigue','Other'];
const SIDES            = ['Left','Right','Both','Centre'];
const NO_SIDE_AREAS    = ['General Fatigue','Other'];

const COACH_ACTIONS: Array<{ value: string; label: string; sub: string }> = [
  { value: 'continue_modified', label: 'CONTINUE — MODIFIED', sub: 'Athlete continues with modifications' },
  { value: 'rest',              label: 'REST',                 sub: 'Rest this area completely' },
  { value: 'reduce_load',       label: 'REDUCE LOAD',          sub: 'Reduce volume or intensity' },
  { value: 'physio_referral',   label: 'PHYSIO REFERRAL',      sub: 'Refer to physiotherapist' },
  { value: 'monitor',           label: 'MONITOR',              sub: 'Continue training — monitor closely' },
  { value: 'cleared_to_train',  label: 'CLEARED TO TRAIN',     sub: 'No concern — full training' },
];

function Pill({ label, selected, colour = RED, onClick }: { label: string; selected: boolean; colour?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 14px', borderRadius: 100, cursor: 'pointer', minHeight: 44,
        border: `1.5px solid ${selected ? colour : '#E2E8F0'}`,
        background: selected ? colour : 'transparent',
        fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
        letterSpacing: '.08em', textTransform: 'uppercase',
        color: selected ? '#fff' : '#64748B',
        transition: 'all .15s', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

function ModalField({ label, hint, placeholder, value, onChange }: {
  label: string; hint: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function grow() { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: '#94A3B8', marginBottom: 6, lineHeight: 1.4 }}>{hint}</div>
      <textarea
        ref={ref}
        value={value}
        rows={2}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); grow(); }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = RED; }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
        className="wl"
        style={{ fontSize: 14 }}
      />
    </div>
  );
}

export default function InjuryNew() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const role = getRole();

  const [bodyArea, setBodyArea] = useState('');
  const [bodyAreaOther, setBodyAreaOther] = useState('');
  const [side, setSide] = useState('');
  const [concernType, setConcernType] = useState('');
  const [severity, setSeverity] = useState(0);
  const [onset, setOnset] = useState('');
  const [whenOccurred, setWhenOccurred] = useState('');
  const [description, setDescription] = useState('');
  const [affectsTraining, setAffectsTraining] = useState<boolean | null>(null);

  const canSubmit = !!(bodyArea && concernType && severity && description.trim());

  const mutation = useMutation({
    mutationFn: (data: object) => apiFetch('/injury', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: (flag: any) => navigate(`/injury/${flag.id}`),
  });

  function handleSubmit() {
    if (!canSubmit) return;
    mutation.mutate({
      loggedBy: role,
      bodyArea: bodyArea === 'Other' ? (bodyAreaOther || 'Other') : bodyArea,
      side: NO_SIDE_AREAS.includes(bodyArea) ? null : side || null,
      concernType,
      severity,
      onset: onset || 'gradual',
      whenOccurred: whenOccurred || null,
      description,
      affectsTraining: affectsTraining ?? true,
      weekNumber: params.get('weekNumber') ? parseInt(params.get('weekNumber')!) : null,
      dayOfWeek: params.get('dayOfWeek') || null,
    });
  }

  const showSide = bodyArea && !NO_SIDE_AREAS.includes(bodyArea);

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Header */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: RED, marginBottom: 5 }}>Flag to Coach</div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', textTransform: 'uppercase', color: 'var(--black)', lineHeight: .95 }}>
            Injury &amp; Physical Concern Log
          </div>
          <button onClick={() => navigate('/injury')} style={{ marginTop: 10, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← Back to Flags
          </button>
        </div>

        <div style={{ padding: '24px' }}>

          {/* Medical disclaimer */}
          <div style={{ border: `1.5px solid ${RED}`, borderRadius: 8, padding: '14px 16px', marginBottom: 28, background: '#FFF5F5' }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, letterSpacing: '.12em', textTransform: 'uppercase', color: RED, marginBottom: 6 }}>Important</div>
            <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: '#7F1D1D', lineHeight: 1.6 }}>
              For serious or acute injuries, seek medical attention immediately. Do not wait for a coach response. This tool is for communication — not medical advice.
            </div>
          </div>

          {/* Step 1: Body area */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 12 }}>Where is the concern?</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {BODY_AREAS_LEFT.map((area, i) => (
                <div key={area} style={{ display: 'contents' }}>
                  <Pill label={BODY_AREAS_LEFT[i]} selected={bodyArea === BODY_AREAS_LEFT[i]} onClick={() => { setBodyArea(BODY_AREAS_LEFT[i]); setSide(''); }} />
                  {i < BODY_AREAS_RIGHT.length && (
                    <Pill label={BODY_AREAS_RIGHT[i]} selected={bodyArea === BODY_AREAS_RIGHT[i]} onClick={() => { setBodyArea(BODY_AREAS_RIGHT[i]); setSide(''); }} />
                  )}
                </div>
              ))}
            </div>

            {bodyArea === 'Other' && (
              <div style={{ marginTop: 12 }}>
                <input
                  value={bodyAreaOther}
                  onChange={e => setBodyAreaOther(e.target.value)}
                  placeholder="Describe the area"
                  className="wl"
                  style={{ width: '100%', fontSize: 14 }}
                />
              </div>
            )}

            {showSide && (
              <div style={{ marginTop: 14 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Which side?</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {SIDES.map(s => (
                    <Pill key={s} label={s} selected={side === s} onClick={() => setSide(side === s ? '' : s)} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Concern type */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>What type of concern?</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {CONCERN_TYPES.map(ct => (
                <Pill key={ct} label={ct} selected={concernType === ct} onClick={() => setConcernType(ct)} />
              ))}
            </div>
          </div>

          {/* Step 3: Severity */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>How severe is it right now?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              {[1,2,3,4,5].map(n => (
                <RatingBox key={n} value={n} selected={severity >= n} onSelect={v => setSeverity(v)} phaseColour={RED} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              <span>Mild — noticeable but not limiting</span>
              <span>Severe — significantly limiting</span>
            </div>
          </div>

          {/* Step 4: Onset + timing */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>How did it start?</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              {['Sudden','Gradual'].map(o => (
                <Pill key={o} label={o} selected={onset === o.toLowerCase()} onClick={() => setOnset(onset === o.toLowerCase() ? '' : o.toLowerCase())} />
              ))}
            </div>
            <ModalField
              label="When did it occur?"
              hint="Which session, day or activity"
              placeholder="e.g. During Thursday's S&C session — Nordic curls / Started gradually over the last 3 days"
              value={whenOccurred}
              onChange={setWhenOccurred}
            />
          </div>

          {/* Step 5: Description */}
          <div style={{ marginBottom: 28 }}>
            <ModalField
              label="Describe what you are experiencing *"
              hint="Be specific — what makes it better or worse?"
              placeholder="e.g. Sharp pain on the outside of my left knee when I change direction quickly. Aching at rest. Worse going downstairs. No swelling visible."
              value={description}
              onChange={setDescription}
            />
          </div>

          {/* Step 6: Training impact */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>Is this affecting your training?</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                type="button"
                onClick={() => setAffectsTraining(true)}
                style={{
                  padding: '12px 18px', borderRadius: 8, cursor: 'pointer', minHeight: 48, textAlign: 'left',
                  border: `1.5px solid ${affectsTraining === true ? RED : '#E2E8F0'}`,
                  background: affectsTraining === true ? '#FFF5F5' : 'transparent',
                  fontFamily: 'var(--font-b)', fontSize: 13,
                  color: affectsTraining === true ? RED : '#64748B',
                }}
              >
                <strong>YES</strong> — I am modifying or avoiding sessions
              </button>
              <button
                type="button"
                onClick={() => setAffectsTraining(false)}
                style={{
                  padding: '12px 18px', borderRadius: 8, cursor: 'pointer', minHeight: 48, textAlign: 'left',
                  border: `1.5px solid ${affectsTraining === false ? '#10AC6E' : '#E2E8F0'}`,
                  background: affectsTraining === false ? '#F0FDF4' : 'transparent',
                  fontFamily: 'var(--font-b)', fontSize: 13,
                  color: affectsTraining === false ? '#10AC6E' : '#64748B',
                }}
              >
                <strong>NO</strong> — I can train normally but wanted to flag it
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || mutation.isPending}
            style={{
              width: '100%', minHeight: 52, background: canSubmit ? RED : '#E2E8F0',
              color: canSubmit ? '#fff' : '#94A3B8', border: 'none', borderRadius: 6,
              fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22,
              textTransform: 'uppercase', letterSpacing: '.06em',
              cursor: canSubmit ? 'pointer' : 'default', transition: 'background .15s',
            }}
          >
            {mutation.isPending ? 'Sending…' : 'Flag to Coach'}
          </button>

          {mutation.isError && (
            <div style={{ marginTop: 10, fontFamily: 'var(--font-b)', fontSize: 13, color: RED, textAlign: 'center' }}>
              Failed to submit — please try again.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
