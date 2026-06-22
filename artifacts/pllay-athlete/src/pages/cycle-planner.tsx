import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { getRole } from '@/lib/useRole';
import { PHASE_COLORS, PHASE_LABELS, getPhaseForWeek } from '@/lib/constants';

const WEEKS_12 = Array.from({ length: 12 }, (_, i) => i + 1);

const EVENT_COLOURS: Record<string, string> = {
  tournament: '#FF4936',
  testing:    '#0B7DF1',
  recovery:   '#06B6D4',
  review:     '#10AC6E',
  other:      '#64748B',
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  tournament: 'Tournament',
  testing:    'Testing',
  recovery:   'Recovery Week',
  review:     'Review',
  other:      'Other',
};

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(path, { credentials: 'include', ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function CyclePlanner() {
  const role = getRole();
  const qc = useQueryClient();
  const KEY = ['/api/cycle-planner'];
  const GOALS_KEY = ['/api/cycle-planner/goals'];

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch('/api/cycle-planner'),
  });

  const { data: goalsData } = useQuery({
    queryKey: GOALS_KEY,
    queryFn: () => apiFetch('/api/cycle-planner/goals'),
  });

  const addEventMutation = useMutation({
    mutationFn: (body: object) => apiFetch('/api/cycle-planner/events', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const deleteEventMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/cycle-planner/events/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const publishMutation = useMutation({
    mutationFn: (published: boolean) => apiFetch('/api/cycle-planner/publish', { method: 'PATCH', body: JSON.stringify({ published }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const seedMutation = useMutation({
    mutationFn: () => apiFetch('/api/cycle-planner/seed', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const goalMutation = useMutation({
    mutationFn: ({ weekNumber, goal }: { weekNumber: number; goal: string }) =>
      apiFetch(`/api/cycle-planner/goals/${weekNumber}`, { method: 'PUT', body: JSON.stringify({ goal }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: GOALS_KEY }),
  });

  const [showModal, setShowModal] = useState(false);
  const [modalWeek, setModalWeek] = useState(1);
  const [form, setForm] = useState({ eventType: 'tournament', eventName: '', dateFrom: '', dateTo: '', focusNote: '', notes: '' });
  const goalTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  function handleGoalChange(weekNumber: number, goal: string) {
    if (goalTimers.current[weekNumber]) clearTimeout(goalTimers.current[weekNumber]);
    goalTimers.current[weekNumber] = setTimeout(() => goalMutation.mutate({ weekNumber, goal }), 1500);
  }

  const seedOnFirstOpen = useCallback(() => {
    if (role === 'coach') seedMutation.mutate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Seed on first coach load
  const seedRef = useRef(false);
  if (role === 'coach' && !seedRef.current && !isLoading) {
    seedRef.current = true;
    seedOnFirstOpen();
  }

  if (isLoading) {
    return (
      <Layout currentPhase={0} currentSection="12-Week Plan">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: '4px solid #0B7DF1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  const events: any[] = data?.events ?? [];
  const published: boolean = data?.published ?? false;
  const goals: any[] = goalsData ?? [];

  const isUnpublished = !published && (role === 'athlete' || role === 'parent');

  if (isUnpublished) {
    return (
      <Layout currentPhase={0} currentSection="12-Week Plan">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 32, textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 12 }}>Plan Not Ready</div>
            <p style={{ fontFamily: 'var(--font-b)', color: 'var(--grey)', fontSize: 15, lineHeight: 1.6 }}>
              Your coach is still building your 12-week plan.<br />You'll see it here once it's published.
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  function eventsForWeek(weekNum: number) {
    return events.filter((e: any) => e.weekNumber === weekNum);
  }

  function goalForWeek(weekNum: number) {
    return goals.find((g: any) => g.weekNumber === weekNum)?.goal ?? '';
  }

  return (
    <Layout currentPhase={0} currentSection="12-Week Plan">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: '#0B7DF1', marginBottom: 4 }}>Pllay On Edge</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .9 }}>12-Week Plan</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!published && role === 'coach' && (
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#F5B809', background: '#F5B80915', border: '1px solid #F5B809', borderRadius: 100, padding: '4px 10px' }}>Draft</span>
            )}
            {role === 'coach' && (
              <button
                onClick={() => publishMutation.mutate(!published)}
                style={{ padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${published ? '#10AC6E' : '#0B7DF1'}`, background: published ? '#10AC6E15' : '#0B7DF115', fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: published ? '#10AC6E' : '#0B7DF1', cursor: 'pointer', fontWeight: 700 }}
              >
                {published ? '✓ Published' : 'Publish Plan'}
              </button>
            )}
            {role === 'parent' && (
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.08em' }}>Coach's plan</div>
            )}
          </div>
        </div>

        {/* ── Section 1: Phase Timeline Grid ── */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>Phase Timeline</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 4, marginBottom: 8 }}>
            {WEEKS_12.map(wk => {
              const phase = getPhaseForWeek(wk);
              const col = PHASE_COLORS[phase];
              const wkEvents = eventsForWeek(wk);
              return (
                <div
                  key={wk}
                  onClick={() => { if (role === 'coach') { setModalWeek(wk); setShowModal(true); } }}
                  style={{ background: `${col}18`, border: `1.5px solid ${col}35`, borderRadius: 6, padding: '8px 4px', textAlign: 'center', cursor: role === 'coach' ? 'pointer' : 'default', minHeight: 64, position: 'relative' }}
                >
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.1em', textTransform: 'uppercase', color: col, marginBottom: 4, fontWeight: 700 }}>W{wk}</div>
                  {wkEvents.map((ev: any) => (
                    <div key={ev.id} style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLOURS[ev.eventType] ?? '#64748B', margin: '2px auto' }} title={ev.eventName ?? ev.eventType} />
                  ))}
                  {role === 'coach' && <div style={{ position: 'absolute', bottom: 3, right: 4, fontSize: 10, color: `${col}80` }}>+</div>}
                </div>
              );
            })}
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--grey)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLOURS[k] }} />{label}
              </div>
            ))}
          </div>
        </div>

        {/* ── Section 2: Week-by-week table ── */}
        <div style={{ padding: '0 20px' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>Week by Week</div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: 'var(--dark)' }}>
                  {['Week', 'Phase', 'Events', 'Focus', role !== 'parent' ? 'My Goal' : null].filter(Boolean).map(h => (
                    <th key={h!} style={{ padding: '9px 12px', textAlign: 'left', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', fontWeight: 700, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {WEEKS_12.map((wk, idx) => {
                  const phase = getPhaseForWeek(wk);
                  const col = PHASE_COLORS[phase];
                  const wkEvents = eventsForWeek(wk);
                  const lockedReview = wkEvents.find((e: any) => e.locked);
                  const nonLocked = wkEvents.filter((e: any) => !e.locked);
                  const focusEvent = wkEvents.find((e: any) => e.focusNote);
                  return (
                    <tr key={wk} style={{ background: idx % 2 === 0 ? '#fff' : 'var(--grey1)' }}>
                      {/* Week */}
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, color: col, whiteSpace: 'nowrap' }}>
                        W{wk}
                      </td>
                      {/* Phase */}
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase', color: col, whiteSpace: 'nowrap', fontWeight: 700 }}>
                        Ph{phase} {PHASE_LABELS[phase]}
                      </td>
                      {/* Events */}
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                          {lockedReview && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '3px 8px', borderRadius: 100, background: `${EVENT_COLOURS.review}15`, border: `1px solid ${EVENT_COLOURS.review}40`, fontFamily: 'var(--font-m)', fontSize: 8, color: EVENT_COLOURS.review, letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                              🔒 {lockedReview.eventName}
                            </span>
                          )}
                          {nonLocked.map((ev: any) => (
                            <span key={ev.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 100, background: `${EVENT_COLOURS[ev.eventType] ?? '#64748B'}15`, border: `1px solid ${EVENT_COLOURS[ev.eventType] ?? '#64748B'}40`, fontFamily: 'var(--font-m)', fontSize: 8, color: EVENT_COLOURS[ev.eventType] ?? '#64748B', letterSpacing: '.08em', textTransform: 'uppercase', fontWeight: 700 }}>
                              {ev.eventName || EVENT_TYPE_LABELS[ev.eventType] || ev.eventType}
                              {role === 'coach' && !ev.locked && (
                                <button onClick={e => { e.stopPropagation(); deleteEventMutation.mutate(ev.id); }} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 11, padding: 0, lineHeight: 1, opacity: .6 }}>×</button>
                              )}
                            </span>
                          ))}
                        </div>
                      </td>
                      {/* Focus */}
                      <td style={{ padding: '10px 12px', fontSize: 12, color: 'var(--grey)', maxWidth: 180 }}>
                        {focusEvent?.focusNote && <span>{focusEvent.focusNote}</span>}
                      </td>
                      {/* My Goal (athlete only) */}
                      {role !== 'parent' && (
                        <td style={{ padding: '10px 12px', minWidth: 180 }}>
                          {role === 'athlete' ? (
                            <input
                              type="text"
                              defaultValue={goalForWeek(wk)}
                              placeholder="e.g. Win my first match at the tournament"
                              onChange={e => handleGoalChange(wk, e.target.value)}
                              style={{ width: '100%', border: 'none', borderBottom: '1.5px solid var(--grey1)', background: 'transparent', fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--dark)', padding: '4px 0', outline: 'none', minHeight: 36 }}
                              onFocus={e => { e.currentTarget.style.borderBottomColor = '#0B7DF1'; }}
                              onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
                            />
                          ) : (
                            <span style={{ fontSize: 11, color: 'var(--grey)', fontStyle: 'italic' }}>{goalForWeek(wk)}</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Event modal (coach) */}
      {showModal && role === 'coach' && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px', boxShadow: '0 -8px 32px rgba(0,0,0,.12)' }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', color: 'var(--black)', marginBottom: 4 }}>Add Event</div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 20 }}>Week {modalWeek}</div>

            {/* Event type */}
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>Event Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {['tournament', 'testing', 'recovery', 'other'].map(et => (
                <button
                  key={et}
                  onClick={() => setForm(f => ({ ...f, eventType: et }))}
                  style={{ minHeight: 36, padding: '6px 14px', borderRadius: 100, border: `1.5px solid ${form.eventType === et ? EVENT_COLOURS[et] : 'var(--grey2)'}`, background: form.eventType === et ? `${EVENT_COLOURS[et]}15` : 'transparent', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: form.eventType === et ? EVENT_COLOURS[et] : 'var(--grey)', cursor: 'pointer', fontWeight: 700 }}
                >
                  {EVENT_TYPE_LABELS[et]}
                </button>
              ))}
            </div>

            {(['eventName', 'dateFrom', 'dateTo', 'focusNote', 'notes'] as const).map(field => {
              const labels: Record<string, string> = { eventName: 'Event Name', dateFrom: 'Date From', dateTo: 'Date To', focusNote: 'Coaching Focus', notes: 'Notes (optional)' };
              const placeholders: Record<string, string> = { eventName: 'e.g. Mornington Open', dateFrom: 'e.g. 14 Jul', dateTo: 'e.g. 16 Jul', focusNote: 'What is the focus this week?', notes: '' };
              return (
                <div key={field} style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 5 }}>{labels[field]}</div>
                  <input
                    type="text"
                    value={form[field]}
                    onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                    placeholder={placeholders[field]}
                    style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', outline: 'none', minHeight: 44 }}
                  />
                </div>
              );
            })}

            <button
              onClick={async () => {
                await addEventMutation.mutateAsync({ weekNumber: modalWeek, ...form });
                setShowModal(false);
                setForm({ eventType: 'tournament', eventName: '', dateFrom: '', dateTo: '', focusNote: '', notes: '' });
              }}
              disabled={addEventMutation.isPending}
              style={{ width: '100%', padding: '14px', marginTop: 8, background: '#0B7DF1', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', minHeight: 52 }}
            >
              {addEventMutation.isPending ? 'Saving…' : 'Add Event'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
