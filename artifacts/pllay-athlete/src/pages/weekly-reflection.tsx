import { useState, useEffect, useRef } from 'react';
import { useLocation, useParams } from 'wouter';
import {
  useGetWeeklyReflection,
  useSaveWeeklyReflection,
  getGetWeeklyReflectionQueryKey,
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout, PageHeader } from '@/components/layout';
import {
  ScorecardTable,
  WriteField,
  MissionBox,
  FocusQuestion,
  ImplIntention,
  SaveIndicator,
} from '@/components/ui-elements';
import { WEEKS, PHASE_COLORS, getPhaseForWeek } from '@/lib/constants';

const SCORECARD_ROWS = ['Effort', 'Focus', 'Consistency', 'Recovery', 'Ownership'];

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
    effort: 0,
    focus: 0,
    consistency: 0,
    recovery: 0,
    ownership: 0,
    bestMoment: '',
    biggestChallenge: '',
    keyLearning: '',
    focusAnswer: '',
    implWhen: '',
    implWhere: '',
    implHow: '',
    completed: false,
  });

  const initialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

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
    Effort: formData.effort,
    Focus: formData.focus,
    Consistency: formData.consistency,
    Recovery: formData.recovery,
    Ownership: formData.ownership,
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

          {/* Mission box */}
          {weekData && <MissionBox mission={weekData.mission} phaseColour={phaseColour} />}

          {/* Performance scorecard */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: phaseColour, fontWeight: 700, marginBottom: 4 }}>
              Performance Scorecard
            </div>
            <p style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 8 }}>
              Rate each domain 1–5 across this week.
            </p>
            <ScorecardTable
              rows={SCORECARD_ROWS}
              values={scorecardValues}
              onChange={handleScorecardChange}
              phaseColour={phaseColour}
            />
          </div>

          {/* Reflection write fields */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: phaseColour, fontWeight: 700, marginBottom: 16 }}>
              Weekly Reflection
            </div>
            <WriteField
              label="Best training moment:"
              value={formData.bestMoment}
              onChange={v => handleChange('bestMoment', v)}
              phaseColour={phaseColour}
              lines={2}
            />
            <WriteField
              label="Biggest challenge:"
              value={formData.biggestChallenge}
              onChange={v => handleChange('biggestChallenge', v)}
              phaseColour={phaseColour}
              lines={2}
            />
            <WriteField
              label="Key learning:"
              value={formData.keyLearning}
              onChange={v => handleChange('keyLearning', v)}
              phaseColour={phaseColour}
              lines={2}
            />
          </div>

          {/* Focus question */}
          {weekData && (
            <div style={{ marginBottom: 28 }}>
              <FocusQuestion question={weekData.focusQuestion} phaseColour={phaseColour} />
              <WriteField
                label="My answer:"
                value={formData.focusAnswer}
                onChange={v => handleChange('focusAnswer', v)}
                phaseColour={phaseColour}
                lines={3}
              />
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
            <button
              onClick={handleComplete}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 6,
                fontFamily: 'var(--font-d)',
                fontWeight: 800,
                fontSize: 22,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                cursor: 'pointer',
                border: formData.completed ? `2px solid ${phaseColour}` : 'none',
                background: formData.completed ? 'transparent' : phaseColour,
                color: formData.completed ? phaseColour : '#fff',
                transition: 'all .2s',
              }}
            >
              {formData.completed ? '✓ Completed' : saveMutation.isPending ? 'Saving…' : 'Mark Week Complete'}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
