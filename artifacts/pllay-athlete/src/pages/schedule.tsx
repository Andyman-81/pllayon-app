import { useState, useRef } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { getRole } from '@/lib/useRole';
import { PHASE_COLORS } from '@/lib/constants';
import { apiUrl } from '@/lib/api';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const PH = '#0B7DF1';

const SESSION_TYPES: { label: string; colour: string }[] = [
  { label: 'Tennis — Court',        colour: '#10AC6E' },
  { label: 'Tennis — Match',        colour: '#FF4936' },
  { label: 'S&C — Strength/Power',  colour: '#0B7DF1' },
  { label: 'S&C — Speed/Agility',   colour: '#F5B809' },
  { label: 'S&C — Conditioning',    colour: '#7C3AED' },
  { label: 'Body Management',       colour: '#64748B' },
  { label: 'Recovery',              colour: '#06B6D4' },
  { label: 'School — Lessons',      colour: '#1E293B' },
  { label: 'School — Sport',        colour: '#334155' },
  { label: 'School — Exam',         colour: '#FF4936' },
  { label: 'Rest Day',              colour: '#94A3B8' },
];

function sessionColour(type: string) {
  return SESSION_TYPES.find(s => s.label === type)?.colour ?? '#64748B';
}

/* ── Load category mapping ───────────────────────────── */
type LoadCatKey = 'sport' | 'strength' | 'speed' | 'conditioning';

const LOAD_CATS: { key: LoadCatKey; label: string; barColour: string; pillBg: string; pillText: string; pillLabel: string }[] = [
  { key: 'sport',        label: 'Sport / Tennis',   barColour: '#10AC6E', pillBg: '#10AC6E', pillText: '#fff', pillLabel: 'SPORT' },
  { key: 'strength',     label: 'Strength & Power', barColour: '#0B7DF1', pillBg: '#0B7DF1', pillText: '#fff', pillLabel: 'STR' },
  { key: 'speed',        label: 'Speed & Agility',  barColour: '#F5B809', pillBg: '#F5B809', pillText: '#1E293B', pillLabel: 'SPD' },
  { key: 'conditioning', label: 'Conditioning',     barColour: '#7C3AED', pillBg: '#7C3AED', pillText: '#fff', pillLabel: 'COND' },
];

function catForSession(type: string): LoadCatKey | null {
  if (type === 'Tennis — Court' || type === 'Tennis — Match') return 'sport';
  if (type === 'S&C — Strength/Power') return 'strength';
  if (type === 'S&C — Speed/Agility') return 'speed';
  if (type === 'S&C — Conditioning' || type === 'Body Management' || type === 'Recovery') return 'conditioning';
  return null;
}

function durationHours(from?: string | null, to?: string | null): number {
  if (!from || !to) return 0;
  const parse = (t: string) => { const [h, m] = t.split(':').map(Number); return h + m / 60; };
  const d = parse(to) - parse(from);
  return d > 0 ? Math.round(d * 10) / 10 : 0;
}

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(apiUrl(path), { credentials: 'include', ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINS = ['00', '30'];
function timeOptions() {
  const out: string[] = [];
  for (const h of HOURS) for (const m of MINS) out.push(`${h}:${m}`);
  return out;
}
const TIME_OPTS = timeOptions();

export default function SchedulePage() {
  const { weekNum } = useParams<{ weekNum: string }>();
  const weekNumber = parseInt(weekNum || '1', 10);
  const role = getRole();
  const qc = useQueryClient();
  const KEY = ['/api/schedule', weekNumber];
  const NOTES_KEY = ['/api/schedule/notes', weekNumber];

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch(`/api/schedule/${weekNumber}`),
  });

  const { data: notesData } = useQuery({
    queryKey: NOTES_KEY,
    queryFn: () => apiFetch(`/api/schedule/${weekNumber}/notes`),
  });

  const addMutation = useMutation({
    mutationFn: (body: object) => apiFetch(`/api/schedule/${weekNumber}/sessions`, { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/schedule/sessions/${id}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const publishMutation = useMutation({
    mutationFn: (published: boolean) => apiFetch(`/api/schedule/${weekNumber}/publish`, { method: 'PATCH', body: JSON.stringify({ published }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const copyMutation = useMutation({
    mutationFn: () => apiFetch(`/api/schedule/${weekNumber}/copy-from/${weekNumber - 1}`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
  const noteMutation = useMutation({
    mutationFn: ({ day, note }: { day: string; note: string }) =>
      apiFetch(`/api/schedule/${weekNumber}/notes/${day}`, { method: 'PUT', body: JSON.stringify({ note }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: NOTES_KEY }),
  });

  const [modalDay, setModalDay] = useState<string | null>(null);
  const [newSession, setNewSession] = useState({ sessionType: SESSION_TYPES[0].label, timeFrom: '07:00', timeTo: '08:00', notes: '' });
  const noteTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  function handleNoteChange(day: string, note: string) {
    if (noteTimers.current[day]) clearTimeout(noteTimers.current[day]);
    noteTimers.current[day] = setTimeout(() => noteMutation.mutate({ day, note }), 1500);
  }

  if (isLoading) {
    return (
      <Layout currentPhase={0} currentSection={`Week ${weekNumber} Schedule`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: `4px solid ${PH}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  const sessions: any[] = data?.sessions ?? [];
  const published: boolean = data?.published ?? false;
  const notes: any[] = notesData ?? [];
  const hasSessions = sessions.length > 0;

  /* ── Per-category weekly totals ── */
  const weeklyTotals: Record<LoadCatKey, number> = { sport: 0, strength: 0, speed: 0, conditioning: 0 };
  for (const s of sessions) {
    const cat = catForSession(s.sessionType);
    if (cat) weeklyTotals[cat] += durationHours(s.timeFrom, s.timeTo);
  }
  const totalTrainingLoad = Object.values(weeklyTotals).reduce((a, b) => a + b, 0);
  const maxCatLoad = Math.max(...Object.values(weeklyTotals), 0.01);

  /* ── Per-day category totals ── */
  function dayLoadByCategory(day: string): Partial<Record<LoadCatKey, number>> {
    const result: Partial<Record<LoadCatKey, number>> = {};
    for (const s of sessions.filter((s: any) => s.dayOfWeek === day)) {
      const cat = catForSession(s.sessionType);
      if (cat) {
        result[cat] = (result[cat] ?? 0) + durationHours(s.timeFrom, s.timeTo);
      }
    }
    return result;
  }

  const isPublished = published;
  const showUnpublished = (role === 'athlete' || role === 'parent') && !isPublished;

  const totalSessions = sessions.length;
  const activeDays = DAYS.filter(d => sessions.some((s: any) => s.dayOfWeek === d)).length;

  return (
    <Layout currentPhase={0} currentSection={`Week ${weekNumber} Schedule`}>
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Header */}
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: PH, marginBottom: 4 }}>Week {weekNumber}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .9 }}>Schedule</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {role === 'parent' && (
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.08em' }}>Coach's schedule</div>
            )}
            {role === 'coach' && (
              <button
                onClick={() => publishMutation.mutate(!isPublished)}
                style={{ padding: '8px 16px', borderRadius: 100, border: `1.5px solid ${isPublished ? '#10AC6E' : 'var(--grey2)'}`, background: isPublished ? '#10AC6E15' : 'transparent', fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: isPublished ? '#10AC6E' : 'var(--grey)', cursor: 'pointer', fontWeight: 700 }}
              >
                {isPublished ? '✓ Published' : 'Draft'}
              </button>
            )}
          </div>
        </div>

        {/* Unpublished banner */}
        {showUnpublished && (
          <div style={{ margin: '20px 20px 0', padding: '16px', background: 'var(--grey1)', borderRadius: 8, fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--grey)', letterSpacing: '.06em', fontStyle: 'italic' }}>
            Your coach hasn't published this week's schedule yet.
          </div>
        )}

        {/* Carry forward prompt */}
        {role === 'coach' && !hasSessions && weekNumber > 1 && (
          <div style={{ margin: '20px 20px 0', padding: '16px', background: '#0B7DF115', border: '1px solid #0B7DF130', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: PH, letterSpacing: '.06em' }}>Copy from Week {weekNumber - 1}?</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => copyMutation.mutate()} style={{ padding: '7px 14px', background: PH, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}>Yes, copy</button>
              <button onClick={() => qc.setQueryData(KEY, { sessions: [{ _placeholder: true }], published: false })} style={{ padding: '7px 14px', background: 'transparent', color: 'var(--grey)', border: '1px solid var(--grey2)', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer' }}>Start fresh</button>
            </div>
          </div>
        )}

        {/* Day grid */}
        <div style={{ padding: '16px 20px 0' }}>
          {DAYS.map(day => {
            const daySessions = sessions.filter((s: any) => s.dayOfWeek === day);
            const dayNote = notes.find((n: any) => n.dayOfWeek === day);
            const dayLoad = dayLoadByCategory(day);
            const hasDayLoad = Object.keys(dayLoad).length > 0;

            return (
              <div key={day} style={{ marginBottom: 16, background: '#fff', border: '1px solid var(--grey1)', borderRadius: 8, overflow: 'hidden' }}>
                {/* Day row header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--grey1)', borderBottom: daySessions.length > 0 || hasDayLoad ? '1px solid var(--grey1)' : 'none' }}>
                  <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--dark)' }}>{day}</span>
                  {role === 'coach' && (
                    <button
                      onClick={() => setModalDay(day)}
                      style={{ minHeight: 32, padding: '5px 12px', background: PH, color: '#fff', border: 'none', borderRadius: 100, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add Session
                    </button>
                  )}
                </div>

                {/* Sessions */}
                {daySessions.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px 6px' }}>
                    {daySessions.map((s: any) => (
                      <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: `${sessionColour(s.sessionType)}15`, border: `1.5px solid ${sessionColour(s.sessionType)}40`, borderLeft: `4px solid ${sessionColour(s.sessionType)}`, borderRadius: '0 6px 6px 0', padding: '7px 10px', minHeight: 44 }}>
                        <div>
                          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: sessionColour(s.sessionType) }}>{s.sessionType}</div>
                          {(s.timeFrom || s.timeTo) && (
                            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--grey)', letterSpacing: '.06em', marginTop: 2 }}>{s.timeFrom} – {s.timeTo}</div>
                          )}
                          {s.notes && <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 2, maxWidth: 180 }}>{s.notes}</div>}
                        </div>
                        {role === 'coach' && (
                          <button
                            onClick={() => deleteMutation.mutate(s.id)}
                            style={{ minHeight: 28, minWidth: 28, background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: 4, marginLeft: 4 }}
                            aria-label="Delete session"
                          >×</button>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Daily load pills */}
                {hasDayLoad && (
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '4px 14px 10px' }}>
                    {LOAD_CATS.filter(cat => (dayLoad[cat.key] ?? 0) > 0).map(cat => (
                      <span
                        key={cat.key}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 10px', borderRadius: 100,
                          background: cat.pillBg, color: cat.pillText,
                          fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 700, letterSpacing: '.06em',
                        }}
                      >
                        {cat.pillLabel} {(dayLoad[cat.key]!).toFixed(1)}h
                      </span>
                    ))}
                  </div>
                )}

                {/* Athlete focus note */}
                {role === 'athlete' && (isPublished || !showUnpublished) && (
                  <div style={{ padding: '8px 14px 12px' }}>
                    <label style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', display: 'block', marginBottom: 4 }}>My focus for today</label>
                    <input
                      type="text"
                      defaultValue={dayNote?.note ?? ''}
                      placeholder="e.g. Work on my backhand return in the squad session"
                      onChange={e => handleNoteChange(day, e.target.value)}
                      style={{ width: '100%', border: 'none', borderBottom: '1.5px solid var(--grey1)', background: 'transparent', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', padding: '4px 0', outline: 'none', minHeight: 36 }}
                      onFocus={e => { e.currentTarget.style.borderBottomColor = PH; }}
                      onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Weekly Load Card ── */}
        <div style={{ margin: '8px 20px 0', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '20px 24px' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: '#64748B', marginBottom: 16 }}>Weekly Training Load</div>

          {LOAD_CATS.map(cat => {
            const hours = weeklyTotals[cat.key];
            const barWidth = hours > 0 ? (hours / maxCatLoad) * 100 : 0;
            return (
              <div key={cat.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #F1F5F9' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1E293B', minWidth: 140 }}>{cat.label}</div>
                <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${barWidth}%`, background: cat.barColour, borderRadius: 4, transition: 'width .4s ease' }} />
                </div>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 18, color: '#1E293B', minWidth: 44, textAlign: 'right' }}>{hours.toFixed(1)}</div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: '#94A3B8', minWidth: 16 }}>h</div>
              </div>
            );
          })}

          {/* Total */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0 0' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#1E293B', minWidth: 140 }}>Total Training</div>
            <div style={{ flex: 1, height: 8, background: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '100%', background: '#1E293B', borderRadius: 4 }} />
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 700, fontSize: 18, color: '#1E293B', minWidth: 44, textAlign: 'right' }}>{totalTrainingLoad.toFixed(1)}</div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: '#94A3B8', minWidth: 16 }}>h</div>
          </div>

          <div style={{ marginTop: 14, fontFamily: 'var(--font-m)', fontSize: 10, color: '#94A3B8', letterSpacing: '.06em' }}>
            {totalSessions} session{totalSessions !== 1 ? 's' : ''} this week · {activeDays} day{activeDays !== 1 ? 's' : ''} active
          </div>
        </div>

      </div>

      {/* Add Session bottom sheet */}
      {modalDay && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setModalDay(null); }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 200, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <div style={{ width: '100%', maxWidth: 500, background: '#fff', borderRadius: '16px 16px 0 0', padding: '24px 20px 40px', boxShadow: '0 -8px 32px rgba(0,0,0,.12)' }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', color: 'var(--black)', marginBottom: 4 }}>Add Session</div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 20 }}>{modalDay}</div>

            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>Session Type</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {SESSION_TYPES.map(st => (
                <button
                  key={st.label}
                  onClick={() => setNewSession(s => ({ ...s, sessionType: st.label }))}
                  style={{ minHeight: 36, padding: '6px 12px', borderRadius: 100, border: `1.5px solid ${newSession.sessionType === st.label ? st.colour : 'var(--grey2)'}`, background: newSession.sessionType === st.label ? `${st.colour}15` : 'transparent', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: newSession.sessionType === st.label ? st.colour : 'var(--grey)', cursor: 'pointer', fontWeight: 700 }}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              {(['timeFrom', 'timeTo'] as const).map(field => (
                <div key={field}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>{field === 'timeFrom' ? 'From' : 'To'}</div>
                  <select
                    value={newSession[field]}
                    onChange={e => setNewSession(s => ({ ...s, [field]: e.target.value }))}
                    style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--dark)', background: '#fff', minHeight: 44 }}
                  >
                    {TIME_OPTS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>Notes (optional)</div>
              <input
                type="text"
                value={newSession.notes}
                onChange={e => setNewSession(s => ({ ...s, notes: e.target.value }))}
                placeholder="Visible to athlete and parent"
                style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 14, color: 'var(--dark)', outline: 'none', minHeight: 44 }}
              />
            </div>

            <button
              onClick={async () => {
                await addMutation.mutateAsync({ dayOfWeek: modalDay, ...newSession });
                setModalDay(null);
                setNewSession({ sessionType: SESSION_TYPES[0].label, timeFrom: '07:00', timeTo: '08:00', notes: '' });
              }}
              disabled={addMutation.isPending}
              style={{ width: '100%', padding: '14px', background: PH, color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', minHeight: 52 }}
            >
              {addMutation.isPending ? 'Adding…' : 'Add Session'}
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
