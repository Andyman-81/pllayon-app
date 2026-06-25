import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PHASE_COLORS, PHASE_LABELS, WEEKS } from "@/lib/constants";
import { ProfileMenu } from "@/components/ProfileMenu";

const BLUE = '#0B7DF1';

interface CoachDashboardData {
  coach: { id: number; name: string; club?: string; specialisation?: string };
  linkedAthlete: {
    id: number; name: string; phase: number; currentWeek: number;
    weeksCompleted: number; completionPct: number; lastReflectionDate?: string;
    phase0Complete: boolean;
  } | null;
  schedule: Array<{ id: number; dayOfWeek: string; sessionType: string; timeFrom?: string; timeTo?: string; notes?: string; published: boolean }>;
  reflections: Array<{ weekNumber: number; completedAt?: string; effort?: number; focus?: number }>;
  competitionReviews: Array<{ id: number; competitionName?: string; result?: string; completedAt?: string }>;
  phase0Modules: Array<{ moduleName: string; completed: boolean; completedAt?: string }>;
  cyclePlan: Array<{ id: number; weekNumber: number; eventType: string; eventName?: string; published: boolean }>;
}

function Spinner() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC' }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${BLUE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function StatChip({ label, value, colour }: { label: string; value: string | number; colour: string }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 8, padding: '14px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
      <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, color: colour, lineHeight: 1 }}>{value}</div>
      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return (
    <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 12 }}>{title}</div>
  );
}

export default function CoachDashboard() {
  const [, navigate] = useLocation();

  const { data, isLoading, error } = useQuery<CoachDashboardData>({
    queryKey: ['coach-dashboard'],
    queryFn: () => apiFetch('/coach/dashboard'),
    retry: false,
  });

  useEffect(() => {
    if (error && (error as Error).message.includes('404')) {
      navigate('/register/coach');
    }
  }, [error, navigate]);

  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [reviewTab, setReviewTab] = useState<'weekly' | 'daily'>('weekly');
  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  const linkedAthleteId = data?.linkedAthlete?.id ?? null;
  const currentWeekForQuery = data?.linkedAthlete?.currentWeek ?? 1;

  interface DailyLog {
    id: number; dayOfWeek: string; sessionType?: string | null;
    sessionFocus: string; wentWell?: string | null; challenging?: string | null;
    developmentNote?: string | null; physicalStatus?: string | null;
    sessionRating?: number | null; energyRating?: number | null;
  }
  const { data: dailyLogs = [] } = useQuery<DailyLog[]>({
    queryKey: ['coach-daily-logs', currentWeekForQuery],
    queryFn: () => apiFetch('/coach/daily-logs?weekNumber=' + currentWeekForQuery),
    enabled: !!linkedAthleteId,
  });

  interface InjuryFlagSummary { id: number; status: string; bodyArea: string; severity: number }
  const { data: injuryFlags = [] } = useQuery<InjuryFlagSummary[]>({
    queryKey: ['coach-injury-flags'],
    queryFn: () => apiFetch('/injury'),
    enabled: !!linkedAthleteId,
  });

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { coach, linkedAthlete, schedule, reflections, competitionReviews, phase0Modules } = data;
  const phaseColour = linkedAthlete ? (PHASE_COLORS[linkedAthlete.phase] ?? BLUE) : BLUE;
  const currentWeek = linkedAthlete?.currentWeek ?? 1;
  const completedReflections = reflections.filter(r => r.completedAt);
  const openFlagCount = injuryFlags.filter(f => f.status === 'open').length;

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFBFC', paddingTop: 56, paddingBottom: 80 }}>

      {/* ── Top bar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: 'rgba(15,23,42,.97)', borderBottom: `2px solid ${BLUE}40`, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', zIndex: 1000 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.55)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{coach.name}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: BLUE, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>COACH VIEW</div>
        </div>
        <ProfileMenu roleColour={BLUE} />
      </nav>

      {/* ── Injury banner ── */}
      {!bannerDismissed && openFlagCount > 0 && (
        <div className="injury-banner">
          <span>⚠ {openFlagCount} injury flag{openFlagCount > 1 ? 's' : ''} require your response</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span className="injury-banner-link" onClick={() => navigate('/injury')}>Review now →</span>
            <button onClick={() => setBannerDismissed(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF4936', fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Coach header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: BLUE, marginBottom: 4, fontWeight: 700 }}>COACH</div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--dark)', lineHeight: .9 }}>{coach.name}</div>
          {(coach.club || coach.specialisation) && (
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 6 }}>
              {[coach.specialisation, coach.club].filter(Boolean).join(' · ')}
            </div>
          )}
        </div>

        {/* ── No athlete linked ── */}
        {!linkedAthlete ? (
          <div style={{ background: '#fff', border: `2px dashed ${BLUE}40`, borderRadius: 12, padding: '32px 24px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', color: BLUE, marginBottom: 8 }}>No Athlete Linked</div>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--grey)', marginBottom: 20 }}>
              Create an athlete profile and generate an invite code for your athlete to link their account.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/coach/athlete/new')} style={{ padding: '12px 24px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
                Create Athlete Profile →
              </button>
              <button onClick={() => navigate('/coach/athletes')} style={{ padding: '12px 24px', background: 'transparent', color: BLUE, border: `1.5px solid ${BLUE}`, borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
                View Profiles
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Athlete card ── */}
            <div style={{ background: '#fff', border: `1px solid var(--grey1)`, borderLeft: `6px solid ${phaseColour}`, borderRadius: '0 10px 10px 0', padding: '16px 18px', marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,.05)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1 }}>{linkedAthlete.name}</div>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
                    Phase {linkedAthlete.phase}: {PHASE_LABELS[linkedAthlete.phase]} · Week {linkedAthlete.currentWeek}
                  </div>
                </div>
                <div style={{ padding: '4px 12px', borderRadius: 100, background: phaseColour, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff', fontWeight: 700 }}>
                  PH {linkedAthlete.phase}
                </div>
              </div>
            </div>

            {/* ── Section 1: Program Overview ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="Program Overview" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
                <StatChip label="Phase" value={linkedAthlete.phase} colour={phaseColour} />
                <StatChip label="Week" value={linkedAthlete.currentWeek} colour={phaseColour} />
                <StatChip label="Wks Done" value={linkedAthlete.weeksCompleted} colour={phaseColour} />
                <StatChip label="Complete" value={`${linkedAthlete.completionPct}%`} colour={phaseColour} />
              </div>
              {linkedAthlete.lastReflectionDate && (
                <div style={{ marginTop: 10, fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.06em' }}>
                  Last reflection: {new Date(linkedAthlete.lastReflectionDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>

            {/* ── Section 2: Weekly Schedule ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="This Week's Schedule" />
              {schedule.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '20px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--grey)', marginBottom: 14 }}>No sessions scheduled yet.</div>
                  <button onClick={() => navigate(`/schedule/week/${currentWeek}`)} style={{ padding: '10px 20px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', cursor: 'pointer' }}>
                    Build Schedule →
                  </button>
                </div>
              ) : (
                <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, overflow: 'hidden' }}>
                  {DAYS.filter(d => schedule.some(s => s.dayOfWeek === d)).map(day => {
                    const sessions = schedule.filter(s => s.dayOfWeek === day);
                    return (
                      <div key={day} style={{ display: 'flex', gap: 12, padding: '10px 16px', borderBottom: '1px solid #F1F5F9' }}>
                        <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', width: 80, flexShrink: 0, paddingTop: 2 }}>{day.slice(0, 3)}</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {sessions.map(s => (
                            <span key={s.id} style={{ padding: '3px 10px', background: `${BLUE}18`, border: `1px solid ${BLUE}30`, borderRadius: 100, fontFamily: 'var(--font-m)', fontSize: 10, color: BLUE, letterSpacing: '.06em' }}>
                              {s.sessionType}{s.timeFrom ? ` · ${s.timeFrom}` : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ padding: '12px 16px' }}>
                    <button onClick={() => navigate(`/schedule/week/${currentWeek}`)} style={{ padding: '8px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', cursor: 'pointer' }}>
                      Edit Schedule →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Section 3: 12-Week Plan ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="12-Week Cycle Plan" />
              <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px 18px' }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                  {WEEKS.map(w => {
                    const isActive = w.number === currentWeek;
                    return (
                      <div key={w.number} title={`Week ${w.number}`} style={{ flex: 1, height: 10, borderRadius: 3, background: isActive ? w.colour : w.number < currentWeek ? `${w.colour}70` : 'var(--grey1)' }} />
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                  {[1, 2, 3].map(ph => (
                    <div key={ph} style={{ padding: '4px 10px', borderRadius: 4, background: ph === linkedAthlete.phase ? PHASE_COLORS[ph] : `${PHASE_COLORS[ph]}20`, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: ph === linkedAthlete.phase ? '#fff' : PHASE_COLORS[ph], fontWeight: 700 }}>
                      Phase {ph}
                    </div>
                  ))}
                </div>
                <button onClick={() => navigate('/cycle-planner')} style={{ padding: '10px 20px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Open Full Planner →
                </button>
              </div>
            </div>

            {/* ── Section 4: Athlete Reviews ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="Athlete Reviews" />

              {/* Tab switcher */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                {(['weekly', 'daily'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setReviewTab(tab)}
                    style={{
                      padding: '7px 16px', borderRadius: 100, cursor: 'pointer',
                      fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
                      letterSpacing: '.1em', textTransform: 'uppercase',
                      border: `1.5px solid ${reviewTab === tab ? BLUE : 'var(--grey1)'}`,
                      background: reviewTab === tab ? BLUE : '#fff',
                      color: reviewTab === tab ? '#fff' : 'var(--grey)',
                    }}
                  >
                    {tab === 'weekly' ? 'Weekly Reflections' : 'Daily Session Logs'}
                  </button>
                ))}
              </div>

              {reviewTab === 'weekly' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                  {/* Phase 0 status */}
                  <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 10 }}>Phase 0 Status</div>
                    {phase0Modules.length === 0
                      ? <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--grey)' }}>Not started</div>
                      : phase0Modules.map(m => (
                        <div key={m.moduleName} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                          <span style={{ fontSize: 14 }}>{m.completed ? '✅' : '○'}</span>
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: m.completed ? 'var(--dark)' : 'var(--grey)', letterSpacing: '.04em' }}>{m.moduleName}</span>
                        </div>
                      ))
                    }
                  </div>
                  {/* Reflections */}
                  <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 10 }}>Weekly Reflections</div>
                    {completedReflections.length === 0
                      ? <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--grey)' }}>No reflections yet</div>
                      : completedReflections.slice(0, 6).map(r => (
                        <div key={r.weekNumber} onClick={() => navigate(`/week/${r.weekNumber}`)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #F8FAFC', cursor: 'pointer' }}>
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--dark)', letterSpacing: '.04em' }}>Week {r.weekNumber}</span>
                          <span style={{ fontSize: 11, color: 'var(--grey)' }}>{r.completedAt ? new Date(r.completedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : ''}</span>
                        </div>
                      ))
                    }
                  </div>
                  {/* Injury flags */}
                  <div
                    onClick={() => navigate('/injury')}
                    style={{ background: '#fff', border: `1px solid ${openFlagCount > 0 ? '#FFE4E1' : 'var(--grey1)'}`, borderLeft: `4px solid ${openFlagCount > 0 ? '#FF4936' : '#10AC6E'}`, borderRadius: '0 10px 10px 0', padding: '16px', cursor: 'pointer' }}
                  >
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 10 }}>Injury Flags</div>
                    {openFlagCount > 0 ? (
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#FF4936', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        {openFlagCount} Open Flag{openFlagCount > 1 ? 's' : ''} →
                      </div>
                    ) : (
                      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#10AC6E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        ✓ No open flags
                      </div>
                    )}
                  </div>

                  {/* Competition reviews */}
                  <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px' }}>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 10 }}>Competition Reviews</div>
                    {competitionReviews.length === 0
                      ? <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--grey)' }}>No reviews yet</div>
                      : competitionReviews.slice(0, 6).map(r => (
                        <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: '1px solid #F8FAFC' }}>
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--dark)', letterSpacing: '.04em' }}>{r.competitionName ?? 'Match'}</span>
                          <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: r.result === 'W' ? '#10AC6E' : r.result === 'L' ? '#FF4936' : 'var(--grey)', fontWeight: 700 }}>{r.result ?? ''}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              ) : (
                /* Daily session logs tab */
                <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, overflow: 'hidden' }}>
                  {dailyLogs.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--grey)' }}>
                      No session logs for Week {currentWeek} yet.
                    </div>
                  ) : (
                    <>
                      {/* Table header */}
                      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 55px 55px 28px', gap: 8, padding: '8px 14px', background: '#F8FAFC', borderBottom: '1px solid var(--grey1)' }}>
                        {['DAY','FOCUS','RATING','ENERGY','PHYSICAL',''].map(h => (
                          <div key={h} style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94A3B8' }}>{h}</div>
                        ))}
                      </div>
                      {dailyLogs.map(log => {
                        const isExpanded = expandedLogId === log.id;
                        const hasPhysical = !!(log.physicalStatus && log.physicalStatus.trim());
                        return (
                          <div key={log.id}>
                            <div
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              style={{ display: 'grid', gridTemplateColumns: '80px 1fr 60px 55px 55px 28px', gap: 8, padding: '11px 14px', borderBottom: '1px solid #F8FAFC', cursor: 'pointer', alignItems: 'center' }}
                            >
                              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', letterSpacing: '.1em' }}>{log.dayOfWeek.slice(0,3)}</div>
                              <div style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {log.sessionType && <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: BLUE, marginRight: 6 }}>{log.sessionType}</span>}
                                {log.sessionFocus}
                              </div>
                              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: log.sessionRating ? phaseColour : '#CBD5E1', fontWeight: 700 }}>
                                {log.sessionRating ? `★ ${log.sessionRating}/5` : '—'}
                              </div>
                              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: log.energyRating ? '#64748B' : '#CBD5E1' }}>
                                {log.energyRating ? `${log.energyRating}/5` : '—'}
                              </div>
                              <div style={{ fontSize: 13 }}>
                                {hasPhysical ? <span style={{ color: '#D97706' }} title={log.physicalStatus ?? ''}>⚠</span> : <span style={{ color: '#CBD5E1' }}>—</span>}
                              </div>
                              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, color: '#94A3B8' }}>{isExpanded ? '▲' : '▼'}</div>
                            </div>
                            {isExpanded && (
                              <div style={{ padding: '12px 14px 16px', background: '#F8FAFC', borderBottom: '1px solid var(--grey1)' }}>
                                {[
                                  { label: 'What they worked on', val: log.sessionFocus },
                                  { label: 'What went well', val: log.wentWell },
                                  { label: 'Challenging', val: log.challenging },
                                  { label: 'Development note', val: log.developmentNote },
                                  { label: 'Physical status', val: log.physicalStatus },
                                ].map(f => f.val ? (
                                  <div key={f.label} style={{ marginBottom: 10 }}>
                                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: '#94A3B8', marginBottom: 3 }}>{f.label}</div>
                                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.5 }}>{f.val}</div>
                                  </div>
                                ) : null)}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── Section 5: Coach Review (Week 10+) ── */}
            {currentWeek >= 10 && (
              <div style={{ marginBottom: 32 }}>
                <SectionHead title="My Coach Review" />
                <div style={{ background: '#fff', border: `1px solid ${BLUE}30`, borderLeft: `6px solid ${BLUE}`, borderRadius: '0 10px 10px 0', padding: '18px 18px', boxShadow: '0 2px 8px rgba(11,125,241,.08)' }}>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: BLUE, marginBottom: 6 }}>Coach Review — Module 4.3</div>
                  <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--grey)', marginBottom: 16 }}>Complete your independent coach assessment before the Capstone session.</p>
                  <button onClick={() => navigate('/coach-review')} style={{ padding: '10px 22px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
                    Open Coach Review →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Coach Bottom Nav ── */}
      <nav className="bottom-nav">
        {[
          { id: 'home', label: 'HOME', icon: '⌂', path: '/dashboard/coach' },
          { id: 'schedule', label: 'SCHEDULE', icon: '▤', path: `/schedule/week/${currentWeek}` },
          { id: 'plan', label: '12WK PLAN', icon: '◈', path: '/cycle-planner' },
          { id: 'athlete', label: 'ATHLETE', icon: '◎', path: '/coach/athletes' },
          { id: 'review', label: 'MY REVIEW', icon: '✎', path: '/coach-review' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => tab.path && navigate(tab.path)}
            className="bottom-nav-tab"
            style={{ '--active-colour': BLUE } as React.CSSProperties}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
