import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { PHASE_COLORS, PHASE_LABELS } from "@/lib/constants";
import { ProfileMenu } from "@/components/ProfileMenu";

const AMBER = '#D97706';

interface ParentDashboardData {
  parent: { id: number; name: string };
  linkedAthlete: { id: number; name: string; phase: number; currentWeek: number } | null;
  currentWeek: number;
  parentQuestion: string;
  schedule: Array<{ id: number; dayOfWeek: string; sessionType: string; timeFrom?: string; timeTo?: string }>;
}

interface Observation { id: number; weekNumber: number; observation?: string; createdAt: string }

const WEEK_MISSIONS: Record<number, string> = {
  1: "Establish your baseline.", 2: "Commit to the process.",
  3: "Develop daily habits.", 4: "Month 1 check-in.",
  5: "Raise the standard.", 6: "Manage the hard days.",
  7: "Compete with what you have.", 8: "Month 2 check-in.",
  9: "Pre-competition preparation.", 10: "Execute the plan.",
  11: "Peak performance week.", 12: "Capstone — 12-week review.",
};

function Spinner() {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FAFBFC' }}>
      <div style={{ width: 32, height: 32, border: `4px solid ${AMBER}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
    </div>
  );
}

function SectionHead({ title }: { title: string }) {
  return <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 12 }}>{title}</div>;
}

export default function ParentDashboard() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<ParentDashboardData>({
    queryKey: ['parent-dashboard'],
    queryFn: () => apiFetch('/parent/dashboard'),
    retry: false,
  });

  const { data: observations = [] } = useQuery<Observation[]>({
    queryKey: ['parent-observations'],
    queryFn: () => apiFetch('/parent/observations'),
    enabled: !!data,
  });

  useEffect(() => {
    if (error && (error as Error).message.includes('404')) navigate('/register/parent');
  }, [error, navigate]);

  const [obsText, setObsText] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mutation = useMutation({
    mutationFn: (obs: string) => apiFetch('/parent/observations', {
      method: 'POST',
      body: JSON.stringify({ weekNumber: data?.currentWeek ?? 1, observation: obs }),
    }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['parent-observations'] }),
  });

  const handleObsChange = useCallback((val: string) => {
    setObsText(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => mutation.mutate(val), 1500);
  }, [mutation]);

  useEffect(() => {
    const current = observations.find(o => o.weekNumber === data?.currentWeek);
    if (current?.observation) setObsText(current.observation);
  }, [observations, data?.currentWeek]);

  if (isLoading) return <Spinner />;
  if (!data) return null;

  const { parent, linkedAthlete, currentWeek, parentQuestion, schedule } = data;
  const phaseColour = linkedAthlete ? (PHASE_COLORS[linkedAthlete.phase] ?? AMBER) : AMBER;
  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const recent = [...observations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
  const overdue = linkedAthlete && (() => {
    const last = observations.find(o => o.weekNumber === currentWeek - 1);
    return !last?.observation;
  })();

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFBFC', paddingTop: 56, paddingBottom: 80 }}>

      {/* ── Top bar ── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: 'rgba(15,23,42,.97)', borderBottom: `2px solid ${AMBER}40`, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', zIndex: 1000 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.55)', letterSpacing: '.1em', textTransform: 'uppercase' }}>{parent.name}</div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: AMBER, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700 }}>PARENT VIEW</div>
        </div>
        <ProfileMenu roleColour={AMBER} />
      </nav>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 16px 0' }}>

        {/* ── Parent header ── */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: AMBER, marginBottom: 4, fontWeight: 700 }}>PARENT</div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--dark)', lineHeight: .9 }}>{parent.name}</div>
          {linkedAthlete && (
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 6 }}>
              Viewing: {linkedAthlete.name}
            </div>
          )}
        </div>

        {/* ── No athlete linked ── */}
        {!linkedAthlete ? (
          <div style={{ background: '#fff', border: `2px dashed ${AMBER}40`, borderRadius: 12, padding: '32px 24px', textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 24, textTransform: 'uppercase', color: AMBER, marginBottom: 8 }}>No Athlete Linked</div>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--grey)', marginBottom: 20 }}>Link your child's account to see their program here.</p>
            <button onClick={() => navigate('/register/parent')} style={{ padding: '12px 24px', background: AMBER, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
              Link Your Athlete →
            </button>
          </div>
        ) : (
          <>
            {/* ── Section 1: Athlete Status ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="Athlete Status" />
              <div style={{ background: '#fff', border: `1px solid var(--grey1)`, borderLeft: `6px solid ${phaseColour}`, borderRadius: '0 10px 10px 0', padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 26, textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1 }}>{linkedAthlete.name}</div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 4 }}>
                      Phase {linkedAthlete.phase}: {PHASE_LABELS[linkedAthlete.phase]} · Week {currentWeek}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: overdue ? '#FF4936' : '#10AC6E', fontWeight: 700 }}>
                      {overdue ? '⚠ Reflection overdue' : '✓ On track'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section 2: This Week ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title={`This Week — Week ${currentWeek}`} />
              <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: phaseColour, marginBottom: 4, fontWeight: 700 }}>WEEKLY MISSION</div>
                <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1.1 }}>{WEEK_MISSIONS[currentWeek] ?? '—'}</div>
              </div>

              <div style={{ background: '#fff', border: `2px solid ${AMBER}30`, borderLeft: `6px solid ${AMBER}`, borderRadius: '0 10px 10px 0', padding: '16px 18px', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: AMBER, marginBottom: 6, fontWeight: 700 }}>YOUR QUESTION THIS WEEK</div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 15, color: 'var(--dark)', lineHeight: 1.55, fontStyle: 'italic' }}>"{parentQuestion}"</div>
              </div>

              {schedule.length > 0 && (
                <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '14px 18px' }}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>THIS WEEK'S SESSIONS</div>
                  {DAYS.filter(d => schedule.some(s => s.dayOfWeek === d)).map(day => (
                    <div key={day} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #F8FAFC' }}>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', width: 72, flexShrink: 0, paddingTop: 1 }}>{day.slice(0, 3)}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                        {schedule.filter(s => s.dayOfWeek === day).map(s => (
                          <span key={s.id} style={{ padding: '2px 9px', background: `${AMBER}15`, border: `1px solid ${AMBER}30`, borderRadius: 100, fontFamily: 'var(--font-m)', fontSize: 10, color: AMBER, letterSpacing: '.06em' }}>
                            {s.sessionType}{s.timeFrom ? ` · ${s.timeFrom}` : ''}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section 3: My Observations ── */}
            <div style={{ marginBottom: 32 }}>
              <SectionHead title="My Weekly Observation" />
              <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '18px 18px 14px' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 4 }}>WHAT I NOTICED THIS WEEK</div>
                <div style={{ fontFamily: 'var(--font-b)', fontSize: 11, color: 'var(--grey)', marginBottom: 8, lineHeight: 1.4 }}>One honest observation — not your assessment of the result</div>
                <textarea
                  value={obsText}
                  onChange={e => handleObsChange(e.target.value)}
                  placeholder="e.g. He seemed more focused in training this week. Less distracted between drills than last month."
                  rows={3}
                  onFocus={e => { e.currentTarget.style.borderBottomColor = AMBER; }}
                  onBlur={e => { e.currentTarget.style.borderBottomColor = 'var(--grey1)'; }}
                  className="wl"
                  style={{ marginBottom: 12 }}
                />
                <button
                  onClick={() => mutation.mutate(obsText)}
                  disabled={mutation.isPending || !obsText.trim()}
                  style={{ padding: '10px 20px', background: AMBER, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer', opacity: (!obsText.trim() || mutation.isPending) ? .5 : 1, minHeight: 44 }}
                >
                  {mutation.isPending ? 'Saving…' : 'Save Observation'}
                </button>
              </div>

              {recent.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>RECENT OBSERVATIONS</div>
                  {recent.map(obs => (
                    <div key={obs.id} style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 8, padding: '12px 14px', marginBottom: 8 }}>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: AMBER, marginBottom: 4 }}>Week {obs.weekNumber} · {new Date(obs.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</div>
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', lineHeight: 1.5 }}>{obs.observation}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Parent Bottom Nav ── */}
      <nav className="bottom-nav">
        {[
          { label: 'HOME',      icon: '⌂', path: '/dashboard/parent' },
          { label: 'THIS WEEK', icon: '⊞', path: '/dashboard/parent' },
          { label: 'SCHEDULE',  icon: '▤', path: `/schedule/week/${currentWeek}` },
          { label: '12WK PLAN', icon: '◈', path: '/cycle-planner' },
          { label: 'MY NOTES',  icon: '✎', path: '/dashboard/parent' },
        ].map(tab => (
          <button
            key={tab.label}
            onClick={() => navigate(tab.path)}
            className="bottom-nav-tab"
            style={{ '--active-colour': AMBER } as React.CSSProperties}
          >
            <span className="bottom-nav-icon">{tab.icon}</span>
            <span className="bottom-nav-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
