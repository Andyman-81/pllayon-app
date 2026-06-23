import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  useGetWeeklyReflection,
  useSaveWeeklyReflection,
  getGetWeeklyReflectionQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import {
  ScorecardTable,
  GuidedField,
  MissionBox,
  FocusQuestion,
  ImplIntention,
  SaveIndicator,
} from '@/components/ui-elements';
import { WEEKS, PHASE_COLORS, getPhaseForWeek } from '@/lib/constants';
import { apiFetch } from '@/lib/api';
import { DailyReflectionModal } from '@/components/DailyReflectionModal';

const SCORECARD_ROWS = ['Effort', 'Focus', 'Consistency', 'Recovery', 'Ownership'];
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

interface DailyLog {
  id: number;
  dayOfWeek: string;
  sessionType?: string | null;
  sessionFocus: string;
  wentWell?: string | null;
  challenging?: string | null;
  developmentNote?: string | null;
  physicalStatus?: string | null;
  sessionRating?: number | null;
  energyRating?: number | null;
}

export default function WeeklyReflection() {
  const { weekNumber: weekStr } = useParams();
  const [, navigate] = useLocation();
  const weekNumber = parseInt(weekStr || '1', 10);
  const weekData = WEEKS[weekNumber - 1];
  const phase = getPhaseForWeek(weekNumber);
  const phaseColour = PHASE_COLORS[phase];

  const queryClient = useQueryClient();
  const { data: reflection, isLoading } = useGetWeeklyReflection(weekNumber, {
    query: { enabled: !!weekNumber, queryKey: getGetWeeklyReflectionQueryKey(weekNumber) },
  });

  const saveMutation = useSaveWeeklyReflection();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [formData, setFormData] = useState({
    effort: 0, focus: 0, consistency: 0, recovery: 0, ownership: 0,
    bestMoment: '', biggestChallenge: '', keyLearning: '',
    focusAnswer: '', implWhen: '', implWhere: '', implHow: '',
    completed: false,
  });

  const initialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Daily reflections for this week
  const { data: dailyLogs = [] } = useQuery<DailyLog[]>({
    queryKey: ['daily-reflections', weekNumber],
    queryFn: () => apiFetch('/daily-reflection?weekNumber=' + weekNumber),
    enabled: !!weekNumber,
  });

  const [modalDay, setModalDay] = useState<string | null>(null);

  useEffect(() => {
    if (reflection && !initialized.current) {
      setFormData({
        effort: reflection.effort ?? 0,
        focus: reflection.focus ?? 0,
        consistency: reflection.consistency ?? 0,
        recovery: reflection.recovery ?? 0,
        ownership: reflection.ownership ?? 0,
        bestMoment: reflection.bestMoment ?? '',
        biggestChallenge: reflection.biggestChallenge ?? '',
        keyLearning: (reflection as any).keyLearning ?? '',
        focusAnswer: reflection.focusAnswer ?? '',
        implWhen: reflection.implWhen ?? '',
        implWhere: reflection.implWhere ?? '',
        implHow: reflection.implHow ?? '',
        completed: !!reflection.completedAt,
      });
      initialized.current = true;
    }
  }, [reflection]);

  function save(data: typeof formData) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(
        { weekNumber, data },
        {
          onSuccess: updated => {
            queryClient.setQueryData(getGetWeeklyReflectionQueryKey(weekNumber), updated);
            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);
          },
          onError: () => {
            setSaveStatus('error');
            setTimeout(() => setSaveStatus('idle'), 3000);
          },
        }
      );
    }, 1500);
  }

  function handleChange(key: string, value: unknown) {
    setFormData(prev => {
      const next = { ...prev, [key]: value };
      save(next);
      return next;
    });
  }

  function handleScorecardChange(label: string, value: number) {
    handleChange(label.toLowerCase(), value);
  }

  function handleComplete() {
    const next = { ...formData, completed: true };
    setFormData(next);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveMutation.mutate(
      { weekNumber, data: next },
      {
        onSuccess: updated => {
          queryClient.setQueryData(getGetWeeklyReflectionQueryKey(weekNumber), updated);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        },
        onError: () => setSaveStatus('error'),
      }
    );
  }

  if (isLoading) {
    return (
      <Layout currentPhase={phase} currentSection={`Week ${weekNumber}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: `4px solid ${phaseColour}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  const scorecardValues: Record<string, number> = {
    Effort: formData.effort, Focus: formData.focus, Consistency: formData.consistency,
    Recovery: formData.recovery, Ownership: formData.ownership,
  };

  return (
    <Layout currentPhase={phase} currentSection={`Week ${weekNumber}`}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Page header */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: phaseColour, marginBottom: 5 }}>
              Phase {phase}
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(28px,4vw,40px)', textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .95 }}>
              Week {weekNumber}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 4 }}>
            <SaveIndicator status={saveStatus} />
            <button onClick={() => navigate('/')} style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              ← Dashboard
            </button>
          </div>
        </div>

        <div style={{ padding: '24px' }}>

          {/* ── SECTION 1: WEEKLY REVIEW ── */}
          <div style={{ background: phaseColour, borderRadius: '8px 8px 0 0', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: '#fff', letterSpacing: '.04em' }}>
              Week {weekNumber} — Weekly Review
            </span>
            <span style={{ padding: '3px 10px', border: '1.5px solid rgba(255,255,255,.6)', borderRadius: 100, fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#fff' }}>
              MANDATORY
            </span>
          </div>

          {/* Daily session summary (if any logs exist) */}
          {dailyLogs.length > 0 && (
            <div className="daily-summary">
              <div className="daily-summary-title">From your session logs this week</div>
              {DAYS.filter(d => dailyLogs.some(l => l.dayOfWeek === d)).map(day => {
                const log = dailyLogs.find(l => l.dayOfWeek === day)!;
                return (
                  <div key={day} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 0' }}>
                    <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', color: '#1E293B', minWidth: 36, letterSpacing: '.1em' }}>{day.slice(0,3)}</span>
                    <span style={{ fontSize: 13, color: '#CBD5E1' }}>·</span>
                    <span style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: '#475569', flex: 1 }}>{log.sessionType ?? 'Session logged'}</span>
                    {log.sessionRating ? (
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: phaseColour, fontWeight: 700 }}>★ {log.sessionRating}/5</span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}

          {/* Mission box */}
          {weekData && <MissionBox mission={weekData.mission} phaseColour={phaseColour} />}

          {/* Performance scorecard */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: phaseColour, fontWeight: 700, marginBottom: 4 }}>
              Performance Scorecard
            </div>
            <p style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 8 }}>Rate each domain 1–5 across this week.</p>
            <ScorecardTable rows={SCORECARD_ROWS} values={scorecardValues} onChange={handleScorecardChange} phaseColour={phaseColour} />
          </div>

          {/* Reflection guided fields */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: phaseColour, fontWeight: 700, marginBottom: 4 }}>
              Weekly Reflection
            </div>
            <GuidedField label="Best training moment this week:" hint="Name the specific moment — not just 'training went well'." placeholder="e.g. My backhand cross-court was clicking in the third set of the practice match. I held the pattern under pressure." value={formData.bestMoment} onChange={v => handleChange('bestMoment', v)} phaseColour={phaseColour} />
            <GuidedField label="Biggest challenge:" hint="What was genuinely hard? Be specific about when and why." placeholder="e.g. The last 20 minutes of Thursday's session. I was flat and my decision-making dropped. I know why — I hadn't eaten enough beforehand." value={formData.biggestChallenge} onChange={v => handleChange('biggestChallenge', v)} phaseColour={phaseColour} />
            <GuidedField label="Key thing I learned:" hint="One insight. Not a list — the single most useful thing." placeholder="e.g. I play better when I slow down between points. When I rush the next point I make worse decisions." value={formData.keyLearning} onChange={v => handleChange('keyLearning', v)} phaseColour={phaseColour} />
          </div>

          {/* Focus question */}
          {weekData && (
            <div style={{ marginBottom: 28 }}>
              <FocusQuestion question={weekData.focusQuestion} phaseColour={phaseColour} />
              <GuidedField label="My answer:" hint="Answer the focus question above directly and honestly." placeholder="e.g. The habit I kept without being reminded was checking my sleep. I logged it every morning without anyone asking." value={formData.focusAnswer} onChange={v => handleChange('focusAnswer', v)} phaseColour={phaseColour} />
            </div>
          )}

          {/* Implementation intention */}
          <ImplIntention
            label="Next week I will:"
            values={{ when: formData.implWhen, where: formData.implWhere, how: formData.implHow }}
            onChange={(field, val) => handleChange(`impl${field.charAt(0).toUpperCase() + field.slice(1)}`, val)}
            phaseColour={phaseColour}
          />

          {/* Complete button */}
          <div style={{ marginTop: 32 }}>
            {formData.completed ? (
              <div style={{ width: '100%', padding: '16px 0', borderRadius: 6, border: `2px solid ${phaseColour}`, background: 'transparent', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '.04em', color: phaseColour, textAlign: 'center' }}>
                ✓ Week Complete
              </div>
            ) : (
              <button
                onClick={handleComplete}
                style={{ width: '100%', padding: '14px 0', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', border: 'none', background: phaseColour, color: '#fff', transition: 'all .2s' }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Mark Week Complete'}
              </button>
            )}
          </div>

          {/* ── SECTION 2: DAILY REFLECTIONS ── */}
          <div style={{ marginTop: 48 }}>

            {/* Divider with label */}
            <div style={{ position: 'relative', textAlign: 'center', margin: '0 0 24px' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: '#E2E8F0', transform: 'translateY(-50%)' }} />
              <span style={{ position: 'relative', background: '#fff', padding: '0 14px', fontFamily: 'Space Mono, monospace', fontSize: 10, textTransform: 'uppercase', color: '#94A3B8', letterSpacing: '.14em' }}>
                Daily Session Logs
              </span>
            </div>

            {/* Section header */}
            <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: '#1E293B', letterSpacing: '.02em' }}>This Week's Sessions</span>
              <span style={{ padding: '4px 11px', border: '1.5px solid #94A3B8', borderRadius: 100, fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: '#94A3B8' }}>OPTIONAL</span>
            </div>

            {/* Day rows */}
            <div
              style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '0 16px', '--phase-colour': phaseColour } as React.CSSProperties}
            >
              {DAYS.map((day, i) => {
                const log = dailyLogs.find(l => l.dayOfWeek === day);
                return (
                  <div key={day} className="day-row" style={i === 6 ? { borderBottom: 'none' } : {}}>
                    <span className="day-label">{day.slice(0, 3)}</span>
                    <span className={`day-status${log ? ' logged' : ''}`}>
                      {log
                        ? `✓ ${log.sessionType ? log.sessionType + ' — ' : ''}${log.sessionFocus.slice(0, 45)}${log.sessionFocus.length > 45 ? '…' : ''}`
                        : 'No session logged'}
                    </span>
                    <button
                      onClick={() => setModalDay(day)}
                      className={`day-log-btn${log ? ' logged' : ''}`}
                    >
                      {log ? 'Edit' : '+ Log'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Daily reflection modal */}
      {modalDay && (
        <DailyReflectionModal
          weekNumber={weekNumber}
          dayOfWeek={modalDay}
          phaseColour={phaseColour}
          existing={dailyLogs.find(l => l.dayOfWeek === modalDay) ?? null}
          onClose={() => setModalDay(null)}
        />
      )}
    </Layout>
  );
}
