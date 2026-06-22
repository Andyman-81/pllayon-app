import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useGetPhase0Modules, useSavePhase0Module } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { GuidedField, SectionDivider, SaveIndicator } from '@/components/ui-elements';

const PH = '#0B7DF1';

/* ── Module definitions ───────────────────────────────── */
interface FieldDef {
  key: string;
  label: string;
  hint: string;
  placeholder: string;
  type?: 'textarea' | 'signature';
}
interface SectionDef {
  divider: string;
}
interface ModuleDef {
  name: string;
  title: string;
  intro: string;
  items: (FieldDef | SectionDef)[];
}

function isDivider(item: FieldDef | SectionDef): item is SectionDef {
  return 'divider' in item;
}

const MODULE_DEFS: ModuleDef[] = [
  {
    name: '0.1 Vision',
    title: '0.1 VISION',
    intro: 'This is not about rankings or trophies. It is about the kind of athlete and person you want to become. Answer honestly — these answers drive everything that follows.',
    items: [
      { key: 'vision_12_months', label: 'What does success look like for me in 12 months?', hint: 'Think beyond results. What kind of athlete do you want to be?', placeholder: 'e.g. I want to compete at state level and understand why I win or lose — not just whether I do.' },
      { key: 'vision_24_months', label: 'What does success look like in 24 months?', hint: 'Where is the journey heading?', placeholder: 'e.g. I want my first national ranking event and to feel physically ready to compete at that level.' },
      { key: 'vision_why', label: 'Why does this matter to me — not to my coach or my parents, but to me?', hint: 'This is the most important question in this module. Take your time.', placeholder: 'e.g. I want to prove to myself that I can develop into the athlete I know I can be. Not for anyone else — for me.' },
      { key: 'vision_identity', label: 'What kind of athlete do I want to be known as?', hint: 'Not what you want to achieve — who you want to be.', placeholder: 'e.g. Someone who competes hard, learns fast and handles pressure well.' },
    ],
  },
  {
    name: '0.2 Standards',
    title: '0.2 STANDARDS',
    intro: 'Your standards are the non-negotiables. They are what you do every day — not what you do when you feel like it.',
    items: [
      { key: 'standards_training', label: 'What are my three non-negotiable training standards?', hint: 'These are things you will always do, regardless of how you feel.', placeholder: "e.g. 1. I arrive on time and ready to train. 2. I complete every drill at full effort. 3. I never leave without reviewing one thing I learned." },
      { key: 'standards_competition', label: 'What standard do I hold myself to in competition?', hint: 'Not about winning — about how you compete.', placeholder: 'e.g. I compete hard on every point regardless of the score. I control what I can control and reset after mistakes.' },
      { key: 'standards_recovery', label: 'What standard do I hold myself to in recovery?', hint: 'Sleep, nutrition, how you treat your body between sessions.', placeholder: "e.g. I hit my sleep target at least 5 nights a week. I eat before training. I don't skip cooldowns." },
      { key: 'standards_improve', label: 'What is the one standard I most need to improve right now?', hint: 'Be honest. This is private.', placeholder: "e.g. Showing up mentally when I'm tired. I switch off in the last 20 minutes of long sessions." },
    ],
  },
  {
    name: '0.3 Environment',
    title: '0.3 ENVIRONMENT',
    intro: 'Your development is shaped by the environment around you — not just your talent. Map it honestly.',
    items: [
      { key: 'env_strengths', label: 'What does my training environment currently do well?', hint: 'Think about your coach, facility, training partners and schedule.', placeholder: 'e.g. My coach gives good technical feedback and we have court time 4 days a week. My training partner pushes me.' },
      { key: 'env_gaps', label: 'What is missing or holding me back in my current environment?', hint: 'Be specific. Vague answers produce vague plans.', placeholder: "e.g. I don't have enough competitive match play. I train well but don't get enough pressure situations." },
      { key: 'env_support', label: 'Who in my environment helps my development the most — and how?', hint: 'Could be a coach, parent, teammate, mentor.', placeholder: 'e.g. My S&C coach — she tracks my physical progress properly and adjusts based on data, not guesswork.' },
      { key: 'env_change', label: 'What one change to my environment would make the biggest difference?', hint: 'Something realistic that could actually happen.', placeholder: "e.g. More competitive matches against players slightly better than me. I learn more when I'm being pushed." },
    ],
  },
  {
    name: '0.4 Routines',
    title: '0.4 ROUTINES',
    intro: 'Routines remove the need for willpower. The best athletes do not rely on motivation — they rely on habits that run automatically.',
    items: [
      { key: 'routine_morning', label: 'What is my current morning routine on training days?', hint: 'Walk through what you actually do — not what you wish you did.', placeholder: "e.g. Wake at 7am, breakfast within 30 min, leave by 8:15. Usually check phone too long before getting up — that needs to change." },
      { key: 'routine_pretraining', label: 'What is my pre-training routine?', hint: 'From when you arrive to when training starts.', placeholder: "e.g. Arrive 15 min early, dynamic warm-up, 5 min hitting to settle in. I want to add a mental prep habit — not sure what yet." },
      { key: 'routine_posttraining', label: 'What is my post-training routine?', hint: 'Recovery, nutrition, reviewing the session.', placeholder: 'e.g. Cooldown stretch (10 min), protein shake, write one thing I worked on in my notes. Then off court within 30 min.' },
      { key: 'routine_precomp', label: 'What is my pre-competition routine?', hint: 'The night before and the morning of a match.', placeholder: "e.g. Still figuring this out. I know I need to sleep earlier the night before but I don't always do it." },
      { key: 'routine_weakest', label: 'Which routine needs the most work right now?', hint: 'One honest answer.', placeholder: "e.g. Post-training. I rush off court without recovering properly and it affects the next day." },
    ],
  },
  {
    name: '0.5 Obstacles',
    title: '0.5 OBSTACLES',
    intro: 'Every athlete faces obstacles. The ones who develop fastest are the ones who can name their obstacles accurately and plan for them in advance.',
    items: [
      { key: 'obstacle_primary', label: 'What is the biggest obstacle to my development right now?', hint: 'Could be physical, mental, circumstantial or environmental.', placeholder: "e.g. School workload. Term 3 is always brutal and my training drops off. I haven't found a way to manage it yet." },
      { key: 'obstacle_recurring', label: 'What obstacles come up repeatedly that slow me down?', hint: 'Patterns — not one-off events.', placeholder: "e.g. I lose focus in long sessions. After about 75 minutes my decision-making drops and I stop competing hard." },
      { key: 'obstacle_response', label: 'What do I do when things get hard — honestly?', hint: 'Your actual response — not the response you wish you had.', placeholder: 'e.g. I get quiet and withdraw. I stop trying new things and just go through the motions until the session ends.' },
      { key: 'obstacle_plan', label: 'What is my plan for when my most common obstacle shows up this program?', hint: "Specific — not 'try harder'. WHEN it happens, I will…", placeholder: 'e.g. When I feel myself switching off mid-session, I will stop, take a breath, and set one specific micro-goal for the next 10 minutes.' },
    ],
  },
  {
    name: '0.6 Commitment',
    title: '0.6 COMMITMENT',
    intro: 'This is the final module before Week 1 begins. Read it carefully. Sign it when you mean it — not before.',
    items: [
      { key: 'commitment_statement', label: 'What am I committing to for the next 12 weeks?', hint: 'In your own words — not a copy of the program description.', placeholder: "e.g. I am committing to completing every reflection honestly, acting on what the data shows, and showing up to the Capstone ready to present evidence of how I've developed." },
      { key: 'commitment_baddays', label: "What will I do when I don't feel like it?", hint: 'Plan for the bad days now, while you feel motivated.', placeholder: "e.g. I'll remember why I started. And I'll do the minimum — the weekly reflection takes 5 minutes. I can always do 5 minutes." },
      { key: 'commitment_coachknow', label: 'What does my coach need to know about how I work best?', hint: "Communication style, what motivates you, what doesn't.", placeholder: "e.g. I respond better to questions than instructions. And I need to understand why we're doing something before I can commit to it fully." },
      { key: 'commitment_parentknow', label: 'What does my parent need to know?', hint: 'How you want them to support you. Be direct.', placeholder: "e.g. After matches I need 30 minutes before I can talk about it. Don't ask about the score before I'm ready." },
      { divider: 'SIGNATURE' } as SectionDef,
      { key: 'commitment_signature', label: 'My name — as my digital commitment', hint: 'Type your full name to confirm you are ready to begin.', placeholder: 'Your full name', type: 'signature' },
    ],
  },
];

/* ── Get all required field keys for a module ─────────── */
function getFieldKeys(mod: ModuleDef): string[] {
  return mod.items.filter((item): item is FieldDef => !isDivider(item)).map(f => f.key);
}

/* ── Check if all fields have content ───────────────────── */
function allFilled(fields: Record<string, string>, keys: string[]): boolean {
  return keys.every(k => (fields[k] ?? '').trim().length > 0);
}

export default function Phase0() {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const { data: modules, isLoading } = useGetPhase0Modules();
  const saveMutation = useSavePhase0Module();

  const [activeModule, setActiveModule] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const initialized = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  /* Load saved data when module or API data changes */
  useEffect(() => {
    if (!modules) return;
    const mod = modules[activeModule];
    if (mod?.data && typeof mod.data === 'object') {
      setFields(mod.data as Record<string, string>);
    } else {
      setFields({});
    }
    initialized.current = true;
  }, [activeModule, modules]);

  function triggerSave(nextFields: Record<string, string>, completed = false) {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveTimeoutRef.current = setTimeout(() => {
      saveMutation.mutate(
        { moduleName: MODULE_DEFS[activeModule].name, data: { data: nextFields, completed } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/phase0/modules'] });
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

  function handleFieldChange(key: string, val: string) {
    const next = { ...fields, [key]: val };
    setFields(next);
    triggerSave(next, false);
  }

  function handleComplete() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    setSaveStatus('saving');
    saveMutation.mutate(
      { moduleName: MODULE_DEFS[activeModule].name, data: { data: fields, completed: true } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['/api/phase0/modules'] });
          setSaveStatus('saved');
          setTimeout(() => setSaveStatus('idle'), 1500);
          if (activeModule < MODULE_DEFS.length - 1) {
            setTimeout(() => setActiveModule(activeModule + 1), 400);
          } else {
            setTimeout(() => navigate('/'), 600);
          }
        },
        onError: () => {
          setSaveStatus('error');
          setTimeout(() => setSaveStatus('idle'), 3000);
        },
      }
    );
  }

  if (isLoading) {
    return (
      <Layout currentPhase={0} currentSection="Phase 0">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: `4px solid ${PH}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
      </Layout>
    );
  }

  const def = MODULE_DEFS[activeModule];
  const fieldKeys = getFieldKeys(def);
  const isModCompleted = (idx: number) => !!modules?.[idx]?.completed;
  const canComplete = allFilled(fields, fieldKeys);
  const isAlreadyComplete = isModCompleted(activeModule);
  const today = new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Layout currentPhase={0} currentSection="Phase 0 — Establishment">
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 140px' }}>

        {/* Page header */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: PH, marginBottom: 5 }}>
              Phase 0
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 40, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .9 }}>
              Establishment
            </div>
          </div>
          <SaveIndicator status={saveStatus} />
        </div>

        {/* Module tabs */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '16px 24px 0', scrollbarWidth: 'none' }}>
          {MODULE_DEFS.map((m, idx) => (
            <button
              key={m.name}
              className={`mod-tab${idx === activeModule ? ' active' : isModCompleted(idx) ? ' done' : ''}`}
              onClick={() => setActiveModule(idx)}
            >
              {m.name}{isModCompleted(idx) ? ' ✓' : ''}
            </button>
          ))}
        </div>

        {/* Module content */}
        <div style={{ padding: '28px 24px 0' }}>

          {/* Module title + intro */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 28, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', marginBottom: 8 }}>
              {def.title}
            </div>
            <p style={{ fontSize: 13, color: 'var(--grey)', fontStyle: 'italic', lineHeight: 1.6 }}>
              {def.intro}
            </p>
          </div>

          {/* Guided fields */}
          {def.items.map((item, idx) => {
            if (isDivider(item)) {
              return <SectionDivider key={`div-${idx}`} label={item.divider} colour={PH} />;
            }

            const field = item as FieldDef;

            if (field.type === 'signature') {
              return (
                <div key={field.key} className="guided-field">
                  <label className="guided-label">{field.label}</label>
                  <p className="guided-hint">{field.hint}</p>
                  <input
                    className="guided-input"
                    type="text"
                    placeholder={field.placeholder}
                    value={fields[field.key] ?? ''}
                    onChange={e => handleFieldChange(field.key, e.target.value)}
                    onFocus={e => { e.currentTarget.style.borderBottomColor = PH; }}
                    onBlur={e => { e.currentTarget.style.borderBottomColor = '#F1F5F9'; }}
                  />
                  <div style={{ marginTop: 16, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)' }}>
                    Date: {today}
                  </div>
                </div>
              );
            }

            return (
              <GuidedField
                key={field.key}
                label={field.label}
                hint={field.hint}
                placeholder={field.placeholder}
                value={fields[field.key] ?? ''}
                onChange={val => handleFieldChange(field.key, val)}
                phaseColour={PH}
              />
            );
          })}

          {/* Mark as Complete / Start Week 1 button */}
          <div style={{ marginTop: 32 }}>
            {!canComplete && !isAlreadyComplete && (
              <p style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 10, textAlign: 'center' }}>
                Complete all fields to continue
              </p>
            )}
            <button
              onClick={handleComplete}
              disabled={(!canComplete && !isAlreadyComplete) || saveMutation.isPending}
              style={{
                width: '100%',
                padding: '15px 0',
                borderRadius: 6,
                fontFamily: 'var(--font-d)',
                fontWeight: 800,
                fontSize: 22,
                textTransform: 'uppercase',
                letterSpacing: '.04em',
                cursor: (canComplete || isAlreadyComplete) ? 'pointer' : 'not-allowed',
                border: isAlreadyComplete ? `2px solid ${PH}` : 'none',
                background: isAlreadyComplete
                  ? 'transparent'
                  : canComplete
                    ? activeModule === MODULE_DEFS.length - 1 ? '#10AC6E' : PH
                    : 'var(--grey1)',
                color: isAlreadyComplete
                  ? PH
                  : canComplete ? '#fff' : 'var(--grey)',
                transition: 'all .2s',
              }}
            >
              {isAlreadyComplete
                ? '✓ Completed'
                : saveMutation.isPending
                  ? 'Saving…'
                  : activeModule === MODULE_DEFS.length - 1
                    ? 'Sign & Start Week 1 →'
                    : `Mark ${def.name} Complete →`}
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
