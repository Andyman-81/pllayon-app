import { useState } from "react";
import { useParams } from "wouter";
import { useGetSleepLogs, useSaveSleepLog, getGetSleepLogsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Layout, PageHeader } from "@/components/layout";
import { Callout } from "@/components/ui-elements";
import { PHASE_COLORS } from "@/lib/constants";

/* ── Local display-only components ────────────────────── */
function WorkoutCard({ badge, title, duration, colour = '#0B7DF1', coachNote, children }: {
  badge: string; title: string; duration?: string; colour?: string;
  coachNote?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ background: colour, padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ background: 'rgba(0,0,0,.22)', color: '#fff', fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', padding: '3px 9px', borderRadius: 100, fontWeight: 700 }}>{badge}</span>
          <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: '#fff', letterSpacing: '-.01em', lineHeight: 1 }}>{title}</span>
        </div>
        {duration && <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.7)', letterSpacing: '.12em', textTransform: 'uppercase', flexShrink: 0 }}>{duration}</span>}
      </div>
      <div style={{ padding: '0 18px' }}>{children}</div>
      {coachNote && (
        <div style={{ margin: '0 18px 16px', padding: '10px 14px', background: '#F8FAFC', borderLeft: `3px solid ${colour}`, borderRadius: '0 6px 6px 0' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.14em', textTransform: 'uppercase', color: colour, fontWeight: 700, marginBottom: 4 }}>Coach Note</div>
          <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: 'var(--grey)', lineHeight: 1.55 }}>{coachNote}</div>
        </div>
      )}
    </div>
  );
}

function ExerciseRow({ name, sets, reps, rest, duration, note }: {
  name: string; sets?: string; reps?: string; rest?: string; duration?: string; note?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '11px 0', borderBottom: '1px solid #F1F5F9' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 700, color: 'var(--dark)', letterSpacing: '.02em' }}>{name}</div>
        {note && <div style={{ fontSize: 11, color: 'var(--grey)', marginTop: 3, lineHeight: 1.4 }}>{note}</div>}
      </div>
      <div style={{ display: 'flex', gap: 10, flexShrink: 0, marginTop: 1 }}>
        {sets && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase' }}>SETS</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, color: 'var(--dark)', lineHeight: 1 }}>{sets}</div>
          </div>
        )}
        {reps && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase' }}>REPS</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, color: 'var(--dark)', lineHeight: 1 }}>{reps}</div>
          </div>
        )}
        {rest && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase' }}>REST</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, color: 'var(--dark)', lineHeight: 1 }}>{rest}</div>
          </div>
        )}
        {duration && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--grey)', letterSpacing: '.1em', textTransform: 'uppercase' }}>TIME</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, color: 'var(--dark)', lineHeight: 1 }}>{duration}</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Sleep Log (Appendix C only) ───────────────────────── */
function SleepLogInteractive() {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];
  const { data: logs, isLoading } = useGetSleepLogs();
  const saveMutation = useSaveSleepLog();
  const [date, setDate] = useState(todayStr);
  const [rating, setRating] = useState(0);
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');

  if (isLoading) return <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 24, height: 24, border: '3px solid #06B6D4', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;

  const handleSave = () => {
    saveMutation.mutate({ data: { logDate: date, rating, hoursSlept: hours ? parseFloat(hours) : undefined, notes } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetSleepLogsQueryKey() });
        setRating(0); setHours(''); setNotes('');
      }
    });
  };

  return (
    <div style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '18px 18px 14px' }}>
      <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--dark)', marginBottom: 16 }}>Sleep Log</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', outline: 'none', minHeight: 40 }} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>Hours Slept</div>
          <input type="number" step="0.5" value={hours} onChange={e => setHours(e.target.value)} placeholder="e.g. 7.5" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', outline: 'none', minHeight: 40 }} />
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>Quality (1–5)</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[1, 2, 3, 4, 5].map(v => (
            <button key={v} onClick={() => setRating(v)} style={{ flex: 1, minHeight: 44, border: `2px solid ${rating === v ? '#06B6D4' : 'var(--grey1)'}`, borderRadius: 6, background: rating === v ? '#06B6D415' : 'transparent', fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, color: rating === v ? '#06B6D4' : 'var(--grey)', cursor: 'pointer' }}>{v}</button>
          ))}
        </div>
      </div>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 6 }}>Notes</div>
        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Optional notes" style={{ width: '100%', padding: '8px 10px', border: '1.5px solid var(--grey1)', borderRadius: 6, fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--dark)', outline: 'none', minHeight: 40 }} />
      </div>
      <button onClick={handleSave} disabled={saveMutation.isPending || !rating} style={{ width: '100%', padding: '12px', background: '#06B6D4', color: '#fff', border: 'none', borderRadius: 8, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', opacity: (!rating || saveMutation.isPending) ? .5 : 1, minHeight: 48 }}>
        {saveMutation.isPending ? 'Saving…' : 'Log Sleep'}
      </button>
      {(logs?.length ?? 0) > 0 && (
        <div style={{ marginTop: 16, borderTop: '1px solid var(--grey1)', paddingTop: 12 }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>Recent Logs</div>
          {logs?.slice(0, 5).map(log => (
            <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid #F8FAFC' }}>
              <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--dark)' }}>{new Date(log.logDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--grey)' }}>{log.hoursSlept ? `${log.hoursSlept}h` : '—'}</span>
                <span style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, color: '#06B6D4', lineHeight: 1 }}>{log.rating}<span style={{ fontSize: 11, color: 'var(--grey)', fontFamily: 'var(--font-m)' }}>/5</span></span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page content definitions ──────────────────────────── */
function AppendixWarmup() {
  const ph = PHASE_COLORS[1];
  return (
    <>
      <Callout title="Complete this before every training session and match." colour={ph}>
        Total time: 12–15 minutes. Quality over speed. The warm-up predicts the quality of the session that follows.
      </Callout>
      <WorkoutCard badge="STEP 1" title="Global Mobilisation" duration="3–4 MIN" colour="#10AC6E"
        coachNote="Keep moving continuously. This is not stretching — it is raising core temperature and lubricating joints.">
        <ExerciseRow name="Jog + arm circles (forward & backward)" duration="60s" />
        <ExerciseRow name="Leg swings — front to back" sets="2" reps="12 each" note="Hold a fence or wall for balance" />
        <ExerciseRow name="Hip circles" sets="2" reps="10 each direction" />
        <ExerciseRow name="Ankle rotations + toe raises" reps="15 each foot" />
        <ExerciseRow name="Torso rotations with arm reach" reps="10 each side" />
      </WorkoutCard>
      <WorkoutCard badge="STEP 2" title="Dynamic Stretching" duration="4–5 MIN" colour="#0B7DF1"
        coachNote="Move through range — do not hold. Aim to increase range on each repetition, not force it.">
        <ExerciseRow name="World's greatest stretch" sets="2" reps="5 each side" note="Lunge + rotation + overhead reach" />
        <ExerciseRow name="Inchworms" sets="2" reps="6" note="Walk hands out to plank, back to feet" />
        <ExerciseRow name="Walking hip flexor lunge with twist" reps="8 each leg" />
        <ExerciseRow name="Lateral lunge (side to side)" reps="10 each side" note="Drive hips back, heel flat" />
        <ExerciseRow name="Reverse lunge + knee drive" reps="8 each leg" />
        <ExerciseRow name="Spiderman crawl" reps="8 each side" note="Low to ground, open hip toward hand" />
      </WorkoutCard>
      <WorkoutCard badge="STEP 3" title="Neural Activation" duration="3–4 MIN" colour="#7C3AED"
        coachNote="Turn the nervous system on. Short, sharp, powerful. Quality > quantity here.">
        <ExerciseRow name="Pogos (ankle stiffness)" sets="3" reps="10" rest="20s" note="Minimal ground contact, stiff ankle" />
        <ExerciseRow name="A-skips" sets="2" reps="20m" />
        <ExerciseRow name="Lateral shuffles" sets="3" duration="10s" rest="15s" note="Stay low, feet never cross" />
        <ExerciseRow name="Reactive mirror drill" sets="2" duration="15s" note="Partner leads, you mirror. Solo: change direction on clap." />
      </WorkoutCard>
      <WorkoutCard badge="STEP 4" title="Tennis-Specific Readiness" duration="2 MIN" colour="#FF4936"
        coachNote="Your body is now ready. Last 2 minutes: connect warm-up to the session.">
        <ExerciseRow name="Split-step timing series" reps="10" note="Time split step to partner's bounce or your own count" />
        <ExerciseRow name="Shadow swings — forehand + backhand" reps="8 each" note="Full swing, no ball. Contact point, follow-through." />
        <ExerciseRow name="5-10-5 cone sprint" sets="4" rest="30s" note="Decelerate under control — the heel brake matters" />
      </WorkoutCard>
    </>
  );
}

function AppendixGym() {
  const ph = '#0B7DF1';
  return (
    <>
      <Callout title="Record your loads every session." colour={ph}>
        Progressive overload is the mechanism. If you cannot recall what you lifted last week, you cannot improve on it.
        Prioritise movement quality — reduce load before you compromise technique.
      </Callout>
      <WorkoutCard badge="SESSION A" title="Strength / Power" duration="60–70 MIN" colour="#0B7DF1"
        coachNote="Complete in the order shown. Rest periods are minimums — extend if technique degrades. Log every set.">
        <ExerciseRow name="Trap Bar Deadlift (or Romanian DL)" sets="4" reps="5" rest="2–3 min" note="Work at 80–85% of max. Brace before every rep." />
        <ExerciseRow name="Single-Leg Press" sets="3" reps="8 each" rest="90s" note="Full depth, controlled descent (3 sec down)" />
        <ExerciseRow name="Pull-Up or Lat Pulldown" sets="4" reps="8" rest="90s" note="Depress scapula before pulling. Dead hang at the top." />
        <ExerciseRow name="Incline DB Chest Press" sets="3" reps="10" rest="75s" note="Neutral wrist, full range, no bounce off chest" />
        <ExerciseRow name="Cable Core Rotation" sets="3" reps="12 each" rest="60s" note="Hips face forward throughout. Rotate from thoracic spine." />
        <ExerciseRow name="Calf Raise (single leg)" sets="3" reps="15 each" rest="45s" note="Full range — heel below platform level" />
      </WorkoutCard>
      <WorkoutCard badge="SESSION B" title="Speed / Agility" duration="45–55 MIN" colour="#F5B809"
        coachNote="Full recovery between speed sets. Fatigue kills the adaptation. If you cannot maintain top speed, stop the set.">
        <ExerciseRow name="Sprint series — 20m" sets="6" reps="×20m" rest="90s" note="Full effort, rolling start or block start" />
        <ExerciseRow name="T-Drill" sets="6" rest="90s" note="Athlete standard: sub 9.5 sec men, sub 10.5 sec women" />
        <ExerciseRow name="Lateral Band Walks" sets="3" reps="15 each" rest="45s" note="Keep feet hip-width, tension throughout" />
        <ExerciseRow name="Box Jumps" sets="4" reps="5" rest="90s" note="Absorb landing with hips and knees. Step — do not jump — down." />
        <ExerciseRow name="Reactive Cone Change-of-Direction" sets="3" reps="6" rest="60s" note="Coach calls direction. Stay on balls of feet." />
      </WorkoutCard>
      <WorkoutCard badge="SESSION C" title="Conditioning" duration="40–50 MIN" colour="#7C3AED"
        coachNote="On-court conditioning mimics match demands. Work-to-rest ratio should match your playing style (rally length, recovery time).">
        <ExerciseRow name="On-court rally patterns (cross-court)" sets="3" duration="10 min" rest="3 min" note="Controlled baseline rallying. Maintain intensity throughout." />
        <ExerciseRow name="Court coverage intervals" sets="6" duration="4 min on" rest="2 min" note="Coach feeds to corners. Recover for every ball." />
        <ExerciseRow name="Spider drill" sets="8" rest="60s" note="Touch each cone, return to centre. Track your time each set." />
      </WorkoutCard>
    </>
  );
}

function AppendixBody() {
  const ph = '#06B6D4';
  return (
    <>
      <Callout title="Recovery is training." colour={ph}>
        What you do between sessions determines how much you adapt from them.
        Sleep, nutrition, and load management are non-negotiable performance tools.
      </Callout>

      {/* Sleep Log */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--grey)', fontWeight: 700, marginBottom: 10 }}>Sleep Tracking</div>
        <SleepLogInteractive />
      </div>

      {/* Recovery checklist */}
      <WorkoutCard badge="DAILY" title="Recovery Checklist" colour="#06B6D4"
        coachNote="Consistent recovery habits compound over a 12-week cycle. Missing one night rarely matters. Missing five in a row always does.">
        {[
          { name: '8–9 hours sleep (minimum 7)', note: 'Non-negotiable for growth hormone and tissue repair' },
          { name: 'Pre-sleep nutrition', note: '20–30g casein protein or equivalent 90 min before bed' },
          { name: 'Screen-off 45 min before sleep', note: 'Blue light suppresses melatonin for up to 3 hours' },
          { name: 'Hydration — 35ml × bodyweight (kg)', note: 'Add 500–750ml per hour of training on top' },
          { name: 'Post-training protein within 45 min', note: '30–40g quality protein. Pair with carbs if training >60 min.' },
          { name: 'Cold/contrast therapy (optional)', note: '10 min cold or 3×(1 min cold / 1 min hot) alternating' },
        ].map(item => (
          <ExerciseRow key={item.name} name={item.name} note={item.note} />
        ))}
      </WorkoutCard>

      {/* Load monitoring */}
      <WorkoutCard badge="WEEKLY" title="Load Monitoring" colour="#64748B"
        coachNote="Track your subjective load. High perceived effort for the same objective workload is a recovery warning sign.">
        <ExerciseRow name="Rate each session (1–10) in your weekly reflection" note="Effort, focus, quality of movement" />
        <ExerciseRow name="Flag any 3 consecutive days above 8/10" note="Report to coach — this is overload territory" />
        <ExerciseRow name="Planned deload every 4th week" note="Volume drops by 40%. Intensity stays high. Non-negotiable." />
        <ExerciseRow name="Traffic light check-in before training" note="Green = ready, Orange = modified, Red = rest. Be honest." />
      </WorkoutCard>

      {/* Nutrition principles */}
      <WorkoutCard badge="FUEL" title="Nutrition Principles" colour="#10AC6E"
        coachNote="These are principles, not prescriptions. If you have specific dietary requirements, consult a sports dietitian.">
        <ExerciseRow name="Carbohydrate timing" note="Before and after training. Cut refined carbs away from training windows." />
        <ExerciseRow name="Protein distribution" note="4–5 servings per day, 25–40g each. Spread across meals — not all at dinner." />
        <ExerciseRow name="Match-day fuelling" note="Carb-rich meal 3 hrs out. Light snack 60 min out. No new foods on match day." />
        <ExerciseRow name="Travel and tournaments" note="Carry your own snacks. Airports and hotel cafes are not performance kitchens." />
      </WorkoutCard>
    </>
  );
}

function AppendixCooldown() {
  const ph = '#10AC6E';
  return (
    <>
      <Callout title="The cooldown is part of the session — not an optional add-on." colour={ph}>
        Total time: 12–15 minutes. Rushing the cooldown wastes the adaptation you just worked hard to earn.
        The window immediately after training is when recovery either accelerates or stalls.
      </Callout>
      <WorkoutCard badge="STEP 1" title="Active Flush" duration="5 MIN" colour="#10AC6E"
        coachNote="Light movement flushes metabolic by-products from working muscles. Do not stop completely — keep blood moving.">
        <ExerciseRow name="Light jog or fast walk" duration="2 min" note="Reduce pace gradually over the 2 minutes" />
        <ExerciseRow name="Stationary bike (easy)" duration="3 min" note="If available. Otherwise continue walking with deep breathing." />
        <ExerciseRow name="Diaphragmatic breathing — 5 deep cycles" note="4 sec in through nose, hold 2, 6 sec out through mouth" />
      </WorkoutCard>
      <WorkoutCard badge="STEP 2" title="Static Stretching" duration="7–8 MIN" colour="#0B7DF1"
        coachNote="Hold each stretch for 30–45 seconds. Do not force. Aim for mild discomfort — never pain. Breathe out into the stretch.">
        <ExerciseRow name="Quad stretch (standing)" duration="45s each" note="Pull heel toward glute. Keep hips square." />
        <ExerciseRow name="Hip flexor lunge stretch" duration="45s each" note="Posterior tilt pelvis. Reach overhead to increase range." />
        <ExerciseRow name="Hamstring stretch (supine or standing)" duration="45s each" />
        <ExerciseRow name="Standing calf stretch — straight + bent knee" duration="30s each/each" note="Two versions target gastrocnemius and soleus separately." />
        <ExerciseRow name="Cross-body shoulder stretch" duration="30s each" note="Essential for overhead stroke players" />
        <ExerciseRow name="Chest opener (doorframe or foam roller)" duration="45s" note="Arms at 90°, gentle hold, deep breath" />
        <ExerciseRow name="Thoracic rotation (seated or lying)" reps="8 each side" note="Controlled. Do not rotate at the lumbar spine." />
      </WorkoutCard>
      <WorkoutCard badge="STEP 3" title="Recovery Nutrition Window" duration="≤45 MIN" colour="#F5B809"
        coachNote="The 45-minute post-training window is real. Missing it consistently extends recovery time by 24–36 hours over a week.">
        <ExerciseRow name="30–40g protein" note="Whey shake, milk, Greek yoghurt, chicken, tuna — fast options that travel" />
        <ExerciseRow name="1–1.5g carbohydrate per kg bodyweight" note="If training was >60 min or high intensity. Rice, fruit, oats." />
        <ExerciseRow name="Fluids: 1.5× fluid lost" note="Weigh in/out if possible. 1 kg lost ≈ 1 litre of sweat." />
        <ExerciseRow name="Electrolytes after hot-weather or long sessions" note="Sodium is the priority. A banana + pinch of salt + water works fine." />
      </WorkoutCard>
      <WorkoutCard badge="STEP 4" title="Session Debrief (2 min)" colour="#64748B"
        coachNote="The athlete who reflects improves faster than the athlete who just shows up. Two minutes is all it takes.">
        <ExerciseRow name="One thing that went well" note="Specific. Not 'I worked hard'. What actually improved?" />
        <ExerciseRow name="One thing to fix next session" note="Identify it now while it is fresh. Write it in your weekly reflection." />
        <ExerciseRow name="Rate today: effort / focus / quality (1–10)" note="Log in your Weekly Reflection when you get home." />
      </WorkoutCard>
    </>
  );
}

/* ── Route → content map ────────────────────────────────── */
const APPENDIX_META: Record<string, { title: string; eyebrow: string; colour: string; Content: () => React.ReactNode }> = {
  warmup: {
    title:   'DYNAMIC WARM-UP PROTOCOL',
    eyebrow: 'APPENDIX A — USE BEFORE EVERY SESSION',
    colour:  '#10AC6E',
    Content: AppendixWarmup,
  },
  gym: {
    title:   'GYM S&C STANDARDS',
    eyebrow: 'APPENDIX B — STRENGTH & CONDITIONING',
    colour:  '#0B7DF1',
    Content: AppendixGym,
  },
  body: {
    title:   'BODY MANAGEMENT',
    eyebrow: 'APPENDIX C — RECOVERY & DAILY HABITS',
    colour:  '#06B6D4',
    Content: AppendixBody,
  },
  cooldown: {
    title:   'COOLDOWN PROTOCOL',
    eyebrow: 'APPENDIX D — USE AFTER EVERY SESSION',
    colour:  '#10AC6E',
    Content: AppendixCooldown,
  },
} as Record<string, { title: string; eyebrow: string; colour: string; Content: () => React.ReactNode }>;

export default function Appendix() {
  const { id } = useParams<{ id: string }>();
  const key = (id ?? 'warmup').toLowerCase();
  const meta = APPENDIX_META[key] ?? APPENDIX_META['warmup'];
  const { Content } = meta;

  return (
    <Layout currentPhase={1} currentSection={meta.eyebrow}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 0 40px' }}>
        <div style={{ padding: '24px 20px 16px', borderBottom: '1px solid var(--grey1)' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: meta.colour, marginBottom: 6, fontWeight: 700 }}>
            {meta.eyebrow}
          </div>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 36, textTransform: 'uppercase', letterSpacing: '-.01em', color: 'var(--black)', lineHeight: .9 }}>
            {meta.title}
          </div>
        </div>
        <div style={{ padding: '20px 20px 0' }}>
          <Content />
        </div>
      </div>
    </Layout>
  );
}
