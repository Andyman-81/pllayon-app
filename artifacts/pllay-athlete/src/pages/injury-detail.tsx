import { useState, useRef } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { apiFetch } from '@/lib/api';
import { RatingBox } from '@/components/ui-elements';
import { getRole } from '@/lib/useRole';

const RED = '#FF4936';
const BLUE = '#0B7DF1';

function severityColour(s: number) {
  if (s <= 2) return '#F5B809';
  if (s === 3) return '#F97316';
  return RED;
}

const STATUS_LABELS: Record<string, string> = {
  open: 'OPEN', coach_reviewed: 'COACH REVIEWED',
  monitoring: 'MONITORING', cleared: 'CLEARED', referred: 'REFERRED',
};
const STATUS_COLORS: Record<string, string> = {
  open: RED, coach_reviewed: BLUE,
  monitoring: '#F5B809', cleared: '#10AC6E', referred: '#7C3AED',
};

const COACH_ACTIONS: Array<{ value: string; label: string }> = [
  { value: 'continue_modified', label: 'CONTINUE — MODIFIED' },
  { value: 'rest',              label: 'REST' },
  { value: 'reduce_load',       label: 'REDUCE LOAD' },
  { value: 'physio_referral',   label: 'PHYSIO REFERRAL' },
  { value: 'monitor',           label: 'MONITOR' },
  { value: 'cleared_to_train',  label: 'CLEARED TO TRAIN' },
];

const STATUS_OPTIONS = [
  { value: 'monitoring', label: 'MONITORING' },
  { value: 'referred',   label: 'REFERRED' },
  { value: 'cleared',    label: 'CLEARED' },
  { value: 'open',       label: 'KEEP OPEN' },
];

interface InjuryFlag {
  id: number; bodyArea: string; side?: string | null; concernType: string;
  severity: number; onset: string; whenOccurred?: string | null; description: string;
  affectsTraining?: boolean; weekNumber?: number | null; dayOfWeek?: string | null;
  loggedBy: string; loggedByName?: string | null; createdAt: string; status: string;
  coachResponse?: string | null; coachAction?: string | null; coachRespondedAt?: string | null;
  trainingModification?: string | null; returnToFullTraining?: string | null;
  followUpRequired?: boolean; followUpDate?: string | null; resolvedAt?: string | null;
  viewerRole?: string;
}

function GuidedField({ label, hint, placeholder, value, onChange, colour = BLUE }: {
  label: string; hint: string; placeholder: string; value: string; onChange: (v: string) => void; colour?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  function grow() { const el = ref.current; if (!el) return; el.style.height = 'auto'; el.style.height = el.scrollHeight + 'px'; }
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: '#94A3B8', marginBottom: 6, lineHeight: 1.4 }}>{hint}</div>
      <textarea
        ref={ref}
        value={value}
        rows={2}
        placeholder={placeholder}
        onChange={e => { onChange(e.target.value); grow(); }}
        onFocus={e => { e.currentTarget.style.borderBottomColor = colour; }}
        onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
        className="wl"
        style={{ fontSize: 14 }}
      />
    </div>
  );
}

function Pill({ label, selected, colour = BLUE, onClick }: { label: string; selected: boolean; colour?: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: '8px 14px', borderRadius: 100, cursor: 'pointer', minHeight: 40,
      border: `1.5px solid ${selected ? colour : '#E2E8F0'}`,
      background: selected ? colour : 'transparent',
      fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
      letterSpacing: '.08em', textTransform: 'uppercase',
      color: selected ? '#fff' : '#64748B', transition: 'all .15s', whiteSpace: 'nowrap',
    }}>
      {label}
    </button>
  );
}

export default function InjuryDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const role = getRole();

  const { data: flag, isLoading } = useQuery<InjuryFlag>({
    queryKey: ['injury-flag', id],
    queryFn: () => apiFetch(`/injury/${id}`),
  });

  const [coachAction, setCoachAction] = useState('');
  const [coachResponse, setCoachResponse] = useState('');
  const [trainingMod, setTrainingMod] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [followUp, setFollowUp] = useState<boolean | null>(null);
  const [followUpDate, setFollowUpDate] = useState('');
  const [newStatus, setNewStatus] = useState('open');
  const [responseSent, setResponseSent] = useState(false);

  const respondMutation = useMutation({
    mutationFn: (data: object) => apiFetch(`/injury/${id}/respond`, { method: 'PUT', body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['injury-flag', id] });
      queryClient.invalidateQueries({ queryKey: ['injury-flags'] });
      setResponseSent(true);
    },
  });

  function handleRespond() {
    if (!coachAction || !coachResponse.trim()) return;
    respondMutation.mutate({
      coachAction, coachResponse, trainingModification: trainingMod || null,
      returnToFullTraining: returnDate || null, followUpRequired: followUp ?? false,
      followUpDate: followUpDate || null, status: newStatus,
    });
  }

  if (isLoading) {
    return (
      <Layout>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ width: 28, height: 28, border: `3px solid ${RED}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (!flag) {
    return (
      <Layout>
        <div style={{ padding: 40, textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 15, color: 'var(--grey)' }}>Flag not found.</div>
      </Layout>
    );
  }

  const sc = severityColour(flag.severity);
  const statusColour = STATUS_COLORS[flag.status] ?? RED;
  const areaLabel = [flag.bodyArea, flag.side].filter(Boolean).join(' — ');
  const isCoachView = (flag.viewerRole === 'coach') || role === 'coach';
  const canRespond = isCoachView && flag.status === 'open';
  const showModFields = coachAction === 'continue_modified' || coachAction === 'reduce_load';

  const timeline: Array<{ label: string; date: string }> = [
    { label: `Flag logged by ${flag.loggedByName ?? flag.loggedBy}`, date: flag.createdAt },
    flag.coachRespondedAt ? { label: 'Coach responded', date: flag.coachRespondedAt } : null,
    flag.resolvedAt ? { label: 'Resolved / Cleared', date: flag.resolvedAt } : null,
  ].filter(Boolean) as Array<{ label: string; date: string }>;

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Header */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button onClick={() => navigate('/injury')} style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            ← All Flags
          </button>
          <div style={{ padding: '4px 12px', borderRadius: 100, background: statusColour, fontFamily: 'Space Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff' }}>
            {STATUS_LABELS[flag.status] ?? flag.status}
          </div>
        </div>

        <div style={{ padding: '20px 24px 0' }}>

          {/* Flag header card */}
          <div style={{ background: '#FFF5F5', borderRadius: 10, borderLeft: `5px solid ${sc}`, border: `1px solid #FFE4E1`, borderLeftWidth: 5, borderLeftColor: sc, padding: '16px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(20px,3vw,28px)', textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1 }}>
                {areaLabel}
              </div>
              <div style={{ padding: '3px 10px', borderRadius: 100, background: sc, fontFamily: 'Space Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', flexShrink: 0, marginLeft: 8 }}>
                {flag.severity}/5
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <span style={{ padding: '3px 10px', borderRadius: 100, border: `1px solid ${sc}`, fontFamily: 'Space Mono, monospace', fontSize: 9, color: sc, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {flag.concernType}
              </span>
            </div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', letterSpacing: '.06em' }}>
              Logged by {flag.loggedByName ?? flag.loggedBy} · {new Date(flag.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>

          {/* Detail section */}
          <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px', marginBottom: 20 }}>
            {flag.whenOccurred && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4 }}>When it occurred</div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--dark)', lineHeight: 1.6 }}>{flag.whenOccurred}</div>
              </div>
            )}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4 }}>Description</div>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--dark)', lineHeight: 1.6 }}>{flag.description}</div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: '#F1F5F9', fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#64748B', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                Onset: {flag.onset}
              </span>
              <span style={{ padding: '3px 10px', borderRadius: 100, background: flag.affectsTraining ? '#FFF5F5' : '#F0FDF4', fontFamily: 'Space Mono, monospace', fontSize: 9, color: flag.affectsTraining ? RED : '#10AC6E', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                {flag.affectsTraining ? 'Affecting training' : 'Not affecting training'}
              </span>
            </div>
          </div>

          {/* Coach response — if already responded */}
          {flag.coachResponse && (
            <div style={{ background: '#EFF6FF', border: `1px solid ${BLUE}30`, borderRadius: 10, padding: '16px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: BLUE, fontWeight: 700, marginBottom: 2 }}>Coach Response</div>
              {flag.coachRespondedAt && (
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', marginBottom: 10 }}>
                  Responded {new Date(flag.coachRespondedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
              {flag.coachAction && (
                <div style={{ marginBottom: 10 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 100, background: BLUE, fontFamily: 'Space Mono, monospace', fontSize: 9, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: '#fff' }}>
                    {COACH_ACTIONS.find(a => a.value === flag.coachAction)?.label ?? flag.coachAction}
                  </span>
                </div>
              )}
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--dark)', lineHeight: 1.6, marginBottom: flag.trainingModification ? 12 : 0 }}>{flag.coachResponse}</div>
              {flag.trainingModification && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4 }}>Training modification</div>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>{flag.trainingModification}</div>
                </div>
              )}
              {flag.returnToFullTraining && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 4 }}>Return to full training</div>
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>{flag.returnToFullTraining}</div>
                </div>
              )}
              {flag.followUpRequired && (
                <div style={{ marginTop: 12, fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#F97316', textTransform: 'uppercase', letterSpacing: '.08em' }}>
                  ⚠ Follow-up required{flag.followUpDate ? ` — ${flag.followUpDate}` : ''}
                </div>
              )}
            </div>
          )}

          {/* Coach response form */}
          {canRespond && !responseSent && (
            <div style={{ background: '#fff', border: `1px solid ${BLUE}30`, borderLeft: `4px solid ${BLUE}`, borderRadius: '0 10px 10px 0', padding: '20px', marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: BLUE, marginBottom: 4 }}>Respond to Flag</div>
              <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: '#64748B', marginBottom: 20 }}>Your response is visible to the athlete and parent.</div>

              {/* Course of action */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 10 }}>Course of action *</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {COACH_ACTIONS.map(a => (
                    <Pill key={a.value} label={a.label} selected={coachAction === a.value} colour={BLUE} onClick={() => setCoachAction(a.value)} />
                  ))}
                </div>
              </div>

              {/* Response text */}
              <GuidedField
                label="Your assessment and advice *"
                hint="Be specific. The athlete and parent will read this."
                placeholder="e.g. This sounds like IT band tightness — common with increased training load. Continue with court sessions but remove lateral agility drills for this week. If it does not improve by Thursday, we will refer to the physio."
                value={coachResponse}
                onChange={setCoachResponse}
              />

              {/* Training modification */}
              {showModFields && (
                <GuidedField
                  label="What specifically should be modified?"
                  hint="Name the sessions, drills or movements to avoid"
                  placeholder="e.g. Avoid lateral change of direction drills. Court sessions — straight-line work only. S&C: remove squats and lunges this week."
                  value={trainingMod}
                  onChange={setTrainingMod}
                />
              )}

              {/* Return date */}
              <GuidedField
                label="Expected return to full training"
                hint="Give a timeframe or condition — not a guarantee"
                placeholder="e.g. Reassess Thursday session. Full return expected next week if improving."
                value={returnDate}
                onChange={setReturnDate}
              />

              {/* Follow-up */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Is follow-up required?</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: followUp ? 12 : 0 }}>
                  <Pill label="YES" selected={followUp === true} colour={BLUE} onClick={() => setFollowUp(true)} />
                  <Pill label="NO"  selected={followUp === false} colour={BLUE} onClick={() => setFollowUp(false)} />
                </div>
                {followUp && (
                  <input
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    placeholder="e.g. Check in Thursday before session"
                    className="wl"
                    style={{ width: '100%', fontSize: 14, marginTop: 8 }}
                  />
                )}
              </div>

              {/* Update status */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#64748B', marginBottom: 8 }}>Update flag status to</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {STATUS_OPTIONS.map(s => (
                    <Pill key={s.value} label={s.label} selected={newStatus === s.value} colour={BLUE} onClick={() => setNewStatus(s.value)} />
                  ))}
                </div>
              </div>

              <button
                onClick={handleRespond}
                disabled={!coachAction || !coachResponse.trim() || respondMutation.isPending}
                style={{
                  width: '100%', minHeight: 52, background: (coachAction && coachResponse.trim()) ? BLUE : '#E2E8F0',
                  color: (coachAction && coachResponse.trim()) ? '#fff' : '#94A3B8',
                  border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800,
                  fontSize: 22, textTransform: 'uppercase', letterSpacing: '.06em',
                  cursor: (coachAction && coachResponse.trim()) ? 'pointer' : 'default',
                }}
              >
                {respondMutation.isPending ? 'Sending…' : 'Send Response'}
              </button>
            </div>
          )}

          {responseSent && (
            <div style={{ background: '#F0FDF4', border: '1px solid #10AC6E', borderRadius: 8, padding: '14px 16px', marginBottom: 20, textAlign: 'center', fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.1em' }}>
              ✓ Response sent — athlete and parent can now see your response.
            </div>
          )}

          {/* Timeline */}
          <div style={{ marginTop: 28 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 12 }}>Timeline</div>
            <div style={{ borderLeft: '2px solid #E2E8F0', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {timeline.map((t, i) => (
                <div key={i} style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: -21, top: 3, width: 8, height: 8, borderRadius: '50%', background: i === 0 ? RED : '#94A3B8', border: '2px solid #fff' }} />
                  <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)' }}>{t.label}</div>
                  <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', marginTop: 2 }}>
                    {new Date(t.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
