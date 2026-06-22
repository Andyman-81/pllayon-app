import { useLocation } from 'wouter';
import { useGetAthleteProfile, useGetProgress } from '@workspace/api-client-react';
import { Layout } from '@/components/layout';
import { WEEKS, PHASE_COLORS, PHASE_LABELS, PHASE_SUBTITLES } from '@/lib/constants';
import { useEffect } from 'react';

const QUICK_LINKS = [
  { label: 'Competition Review', path: '/competition-review', colour: '#FF4936' },
  { label: 'Appendix A — Warm-Up', path: '/appendix/warmup', colour: '#0B7DF1' },
  { label: 'Appendix B — Gym S&C', path: '/appendix/gym', colour: '#0B7DF1' },
  { label: 'Appendix C — Body Mgmt', path: '/appendix/body', colour: '#0B7DF1' },
  { label: 'Appendix D — Cooldown', path: '/appendix/cooldown', colour: '#0B7DF1' },
  { label: 'Progress Summary', path: '/progress', colour: '#10AC6E' },
];

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data: profile, isLoading: profileLoading, error: profileError } = useGetAthleteProfile({
    query: { retry: false },
  });
  const { data: progress, isLoading: progressLoading } = useGetProgress({
    query: { enabled: !!profile },
  });

  useEffect(() => {
    if (profileError) navigate('/onboarding');
  }, [profileError, navigate]);

  if (profileLoading || progressLoading) {
    return (
      <Layout currentPhase={0} currentSection="Dashboard">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: '4px solid #10AC6E', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  if (!profile || !progress) return null;

  const currentPhase = progress.currentPhase ?? 0;
  const currentWeek = progress.currentWeek ?? 0;
  const phaseColour = PHASE_COLORS[currentPhase] ?? PHASE_COLORS[0];
  const weekData = currentWeek >= 1 && currentWeek <= 12 ? WEEKS[currentWeek - 1] : null;

  // Current week card mission preview: first 80 chars + "..."
  const missionPreview = weekData
    ? weekData.mission.length > 80
      ? weekData.mission.slice(0, 80) + '…'
      : weekData.mission
    : '';

  // Upcoming: next 3 weeks from current
  const upcomingStart = Math.max(1, currentWeek);
  const upcoming = WEEKS.filter(w => w.number >= upcomingStart).slice(0, 3);
  const locked = WEEKS.filter(w => w.number > (progress.phase0Complete ? currentWeek + 2 : 0));

  function isWeekLocked(weekNum: number): boolean {
    if (!progress.phase0Complete) return true;
    return weekNum > currentWeek;
  }

  return (
    <Layout currentPhase={currentPhase} currentSection={`Phase ${currentPhase}: ${PHASE_LABELS[currentPhase]}`}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 120px' }}>

        {/* ── Athlete header ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--font-m)',
            fontSize: 10,
            letterSpacing: '.2em',
            textTransform: 'uppercase',
            color: phaseColour,
            marginBottom: 6,
          }}>
            {PHASE_LABELS[currentPhase]}
          </div>
          <h1 style={{
            fontFamily: 'var(--font-d)',
            fontWeight: 800,
            fontSize: 'clamp(32px,5vw,52px)',
            textTransform: 'uppercase',
            letterSpacing: '-.01em',
            lineHeight: .9,
            color: 'var(--black)',
            marginBottom: 8,
          }}>
            {profile.name}
          </h1>
          <p style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--grey)', letterSpacing: '.08em', textTransform: 'uppercase' }}>
            {profile.sport}{profile.club ? ` · ${profile.club}` : ''}
          </p>
        </div>

        {/* ── Phase 0 CTA ── */}
        {!progress.phase0Complete && (
          <div
            style={{
              borderLeft: `6px solid ${PHASE_COLORS[0]}`,
              background: `${PHASE_COLORS[0]}12`,
              borderRadius: '0 10px 10px 0',
              padding: '20px 22px',
              marginBottom: 32,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/phase0')}
          >
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: PHASE_COLORS[0], marginBottom: 6, opacity: .8 }}>
              Required First
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', color: PHASE_COLORS[0], marginBottom: 6 }}>
              Phase 0: Establishment
            </div>
            <p style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 16 }}>
              Complete all six foundation modules to unlock Week 1.
            </p>
            <button
              style={{
                background: PHASE_COLORS[0],
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 22px',
                fontFamily: 'var(--font-d)',
                fontWeight: 800,
                fontSize: 16,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                cursor: 'pointer',
              }}
            >
              Start Phase 0 →
            </button>
          </div>
        )}

        {/* ── Current week card (large) ── */}
        {progress.phase0Complete && weekData && currentWeek <= 12 && (
          <div
            style={{
              background: '#fff',
              border: `1px solid var(--grey1)`,
              borderLeft: `6px solid ${phaseColour}`,
              borderRadius: '0 10px 10px 0',
              marginBottom: 32,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              cursor: 'pointer',
            }}
            onClick={() => navigate(`/week/${currentWeek}`)}
          >
            <div style={{ padding: '16px 22px', background: 'var(--grey1)', borderBottom: `3px solid ${phaseColour}`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span className="week-num" style={{ color: phaseColour, fontSize: 48 }}>{currentWeek}</span>
              <div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey)' }}>
                  Current Week · Phase {currentPhase}
                </div>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: phaseColour, marginTop: 2 }}>
                  {PHASE_LABELS[currentPhase]}
                </div>
              </div>
            </div>
            <div className="week-body">
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: phaseColour, marginBottom: 4, opacity: .8 }}>
                Mission
              </div>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--dark)', marginBottom: 16, lineHeight: 1.5 }}>
                {missionPreview}
              </p>
              <button
                style={{
                  background: phaseColour,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '10px 22px',
                  fontFamily: 'var(--font-d)',
                  fontWeight: 800,
                  fontSize: 16,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  cursor: 'pointer',
                }}
              >
                Open Reflection →
              </button>
            </div>
          </div>
        )}

        {/* ── Capstone card ── */}
        {progress.phase0Complete && currentWeek > 12 && !progress.capstoneComplete && (
          <div
            style={{
              background: '#fff',
              border: `1px solid var(--grey1)`,
              borderLeft: `6px solid ${PHASE_COLORS[4]}`,
              borderRadius: '0 10px 10px 0',
              marginBottom: 32,
              boxShadow: '0 2px 8px rgba(0,0,0,.06)',
              cursor: 'pointer',
              padding: '20px 22px',
            }}
            onClick={() => navigate('/capstone')}
          >
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', color: PHASE_COLORS[4], marginBottom: 6 }}>
              Phase 4: Capstone
            </div>
            <p style={{ fontSize: 13, color: 'var(--grey)', marginBottom: 16 }}>
              Review your 12-week progression across all domains.
            </p>
            <button style={{ background: PHASE_COLORS[4], color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '.06em', cursor: 'pointer' }}>
              Start Capstone →
            </button>
          </div>
        )}

        {/* ── Quick stats (4 chips) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Weeks Done', value: progress.weeksCompleted },
            { label: 'Reflections', value: progress.reflectionsCompleted },
            { label: 'Streak', value: progress.streakWeeks ?? 0 },
            { label: 'Complete', value: `${Math.round(progress.overallCompletionPct)}%` },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 8, padding: '14px 12px', textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, color: phaseColour, lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', marginTop: 4 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* ── Phase progress strip ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>
            Program Phases
          </div>
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {[0, 1, 2, 3, 4].map(ph => {
              const isActive = ph === currentPhase;
              const isDone = ph < currentPhase;
              const col = PHASE_COLORS[ph];
              return (
                <div
                  key={ph}
                  style={{
                    flex: '1 0 auto',
                    minWidth: 80,
                    padding: '8px 12px',
                    borderRadius: 6,
                    background: isActive ? col : isDone ? `${col}20` : 'var(--grey1)',
                    border: `2px solid ${isActive ? col : isDone ? `${col}40` : 'transparent'}`,
                    textAlign: 'center',
                    opacity: ph > currentPhase ? .45 : 1,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: isActive ? 'rgba(255,255,255,.7)' : isDone ? col : 'var(--grey)', marginBottom: 3 }}>
                    Phase {ph}
                  </div>
                  <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: isActive ? '#fff' : isDone ? col : 'var(--grey)', lineHeight: 1.2 }}>
                    {PHASE_LABELS[ph]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Upcoming weeks grid ── */}
        {progress.phase0Complete && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>
              Upcoming Weeks
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {WEEKS.map(week => {
                const locked = isWeekLocked(week.number);
                const isCurrent = week.number === currentWeek;
                const col = week.colour;
                return (
                  <div
                    key={week.number}
                    onClick={() => !locked && navigate(`/week/${week.number}`)}
                    style={{
                      background: '#fff',
                      border: `1px solid ${isCurrent ? col : 'var(--grey1)'}`,
                      borderTop: `3px solid ${isCurrent ? col : locked ? 'var(--grey2)' : col}`,
                      borderRadius: 8,
                      padding: '12px 14px',
                      cursor: locked ? 'default' : 'pointer',
                      opacity: locked ? .4 : 1,
                      boxShadow: isCurrent ? `0 2px 8px ${col}30` : '0 1px 4px rgba(0,0,0,.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: locked ? 'var(--grey)' : col }}>
                        Week {week.number}
                      </span>
                      {locked && <span style={{ fontSize: 14 }}>🔒</span>}
                    </div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 4 }}>
                      Phase {week.phase}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--grey)', lineHeight: 1.4 }}>
                      {week.mission.slice(0, 60)}…
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Quick links row ── */}
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>
            Quick Links
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {QUICK_LINKS.map(link => (
              <button
                key={link.label}
                onClick={() => navigate(link.path)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1.5px solid ${link.colour}`,
                  background: `${link.colour}10`,
                  fontFamily: 'var(--font-m)',
                  fontSize: 10,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: link.colour,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {link.label}
              </button>
            ))}
            {progress.currentPhase >= 3 && (
              <button
                onClick={() => navigate('/pre-comp')}
                style={{
                  padding: '8px 16px',
                  borderRadius: 6,
                  border: `1.5px solid #FF4936`,
                  background: `#FF493610`,
                  fontFamily: 'var(--font-m)',
                  fontSize: 10,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: '#FF4936',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Pre-Competition Plan
              </button>
            )}
          </div>
        </div>

      </div>
    </Layout>
  );
}
