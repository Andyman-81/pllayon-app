import { useState, useRef } from 'react';
import { useLocation } from 'wouter';
import { Layout } from '@/components/layout';
import { ModuleHeader, WriteField, ImplIntention, Callout, SaveIndicator } from '@/components/ui-elements';

const PHASE_COLOUR = '#FF4936';

export default function PreComp() {
  const [, navigate] = useLocation();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const [form, setForm] = useState({
    competitionName: '',
    matchDate: '',
    courtStrategy: '',
    emotionalApproach: '',
    physicalFocus: '',
    technicalFocus: '',
    routinePhysical: '',
    routineTechnical: '',
    routineMental: '',
    postMatchReview: '',
  });

  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();

  function handleChange(key: string, value: string) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      setSaveStatus('saving');
      saveTimeout.current = setTimeout(() => {
        try {
          localStorage.setItem(`precomp_${key}`, value);
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 2000);
        } catch {
          setSaveStatus('error');
        }
      }, 1500);
      return next;
    });
  }

  return (
    <Layout currentPhase={3} currentSection="Pre-Competition Plan">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>

        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <ModuleHeader
            eyebrow="Phase 3"
            title="Pre-Competition Plan"
            desc="Prepare deliberately. Define your approach before you compete — not during it."
            colour={PHASE_COLOUR}
          />
          <div style={{ paddingTop: 4 }}>
            <SaveIndicator status={saveStatus} />
          </div>
        </div>

        <div style={{ padding: '24px' }}>

          <Callout title="How to use this" colour={PHASE_COLOUR}>
            Complete this plan before your most important session or match. Review it afterwards. Do not generalise — be specific about what you will do.
          </Callout>

          {/* Event info */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 12 }}>
              Event Details
            </div>
            <WriteField label="Competition / session name:" value={form.competitionName} onChange={v => handleChange('competitionName', v)} phaseColour={PHASE_COLOUR} />
            <WriteField label="Date:" value={form.matchDate} onChange={v => handleChange('matchDate', v)} phaseColour={PHASE_COLOUR} />
          </div>

          {/* Performance plan */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 12 }}>
              Performance Plan
            </div>
            <WriteField
              label="Court / tactical strategy:"
              value={form.courtStrategy}
              onChange={v => handleChange('courtStrategy', v)}
              phaseColour={PHASE_COLOUR}
              lines={3}
              placeholder="What is your primary tactical approach?"
            />
            <WriteField
              label="Emotional approach:"
              value={form.emotionalApproach}
              onChange={v => handleChange('emotionalApproach', v)}
              phaseColour={PHASE_COLOUR}
              lines={2}
              placeholder="How do you want to feel and respond?"
            />
            <WriteField
              label="Physical focus:"
              value={form.physicalFocus}
              onChange={v => handleChange('physicalFocus', v)}
              phaseColour={PHASE_COLOUR}
              lines={2}
              placeholder="What physical priority matters most today?"
            />
            <WriteField
              label="Technical focus:"
              value={form.technicalFocus}
              onChange={v => handleChange('technicalFocus', v)}
              phaseColour={PHASE_COLOUR}
              lines={2}
              placeholder="One technical point to execute."
            />
          </div>

          {/* Pre-competition routine */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 4 }}>
              Pre-Competition Routine
            </div>
            <p style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 12 }}>
              Maximum 60 minutes. Cover physical, technical, and mental preparation.
            </p>
            <WriteField label="Physical preparation:" value={form.routinePhysical} onChange={v => handleChange('routinePhysical', v)} phaseColour={PHASE_COLOUR} lines={2} />
            <WriteField label="Technical warm-up:" value={form.routineTechnical} onChange={v => handleChange('routineTechnical', v)} phaseColour={PHASE_COLOUR} lines={2} />
            <WriteField label="Mental preparation:" value={form.routineMental} onChange={v => handleChange('routineMental', v)} phaseColour={PHASE_COLOUR} lines={2} />
          </div>

          {/* Post-match review */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.16em', textTransform: 'uppercase', color: PHASE_COLOUR, fontWeight: 700, marginBottom: 4 }}>
              Post-Competition Review
            </div>
            <p style={{ fontSize: 12, color: 'var(--grey)', marginBottom: 12 }}>
              Complete this after competing. Did you execute your plan?
            </p>
            <WriteField
              label="What did you execute from your plan?"
              value={form.postMatchReview}
              onChange={v => handleChange('postMatchReview', v)}
              phaseColour={PHASE_COLOUR}
              lines={4}
            />
          </div>

          <ImplIntention
            label="Next competition I will:"
            values={{ when: '', where: '', how: '' }}
            onChange={() => {}}
            phaseColour={PHASE_COLOUR}
          />

          <div style={{ marginTop: 24 }}>
            <button
              onClick={() => navigate('/competition-review')}
              style={{
                width: '100%',
                padding: '14px 0',
                borderRadius: 6,
                fontFamily: 'var(--font-d)',
                fontWeight: 800,
                fontSize: 20,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                cursor: 'pointer',
                border: 'none',
                background: PHASE_COLOUR,
                color: '#fff',
              }}
            >
              Complete Competition Review →
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
