import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiFetch } from '@/lib/api';

const BLUE = '#0B7DF1';

const MATURITY_STAGES = [
  { value: 'pre-phv',   label: 'PRE-PHV' },
  { value: 'circa-phv', label: 'CIRCA-PHV' },
  { value: 'post-phv',  label: 'POST-PHV' },
];

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ marginTop: 4, fontFamily: 'var(--font-b)', fontSize: 11, color: 'rgba(255,255,255,.3)', lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#1E293B', border: '1.5px solid rgba(255,255,255,.12)',
  borderRadius: 6, padding: '12px 14px', color: '#fff', fontFamily: 'var(--font-b)',
  fontSize: 14, outline: 'none', minHeight: 48, boxSizing: 'border-box',
};

export default function CoachAthleteNew() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    sport: 'Tennis',
    club: '',
    maturityStage: '',
    programStartDate: '',
    notes: '',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError('Athlete name is required'); return; }
    setLoading(true); setError('');
    try {
      const profile = await apiFetch('/api/coach/athlete/new', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/coach/athlete/${profile.id}/code`);
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong');
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#111111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 80px' }}>
      <div style={{ width: '100%', maxWidth: 480, paddingTop: 40 }}>

        {/* Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
          <button onClick={() => navigate('/dashboard/coach')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', padding: 0 }}>
            ← Back
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {['CREATE PROFILE', 'SEND CODE', 'ATHLETE LINKS'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? BLUE : 'rgba(255,255,255,.1)',
                  fontFamily: 'var(--font-m)', fontSize: 9, fontWeight: 700,
                  color: i === 0 ? '#fff' : 'rgba(255,255,255,.3)',
                }}>
                  {i + 1}
                </div>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: i === 0 ? BLUE : 'rgba(255,255,255,.3)', fontWeight: i === 0 ? 700 : 400 }}>
                  {step}
                </span>
              </div>
              {i < 2 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,.15)' }} />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: BLUE, marginBottom: 8 }}>
          COACH — ATHLETE SETUP
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(32px,7vw,48px)', textTransform: 'uppercase', letterSpacing: '-.02em', lineHeight: .9, color: '#fff', marginBottom: 32 }}>
          New Athlete<br />Profile
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <Field label="Athlete Name *">
            <input
              type="text" required value={form.name} onChange={set('name')} placeholder="Full name"
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          <Field label="Date of Birth">
            <input
              type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          <Field label="Sport">
            <input
              type="text" value={form.sport} onChange={set('sport')}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          <Field label="Club / Academy">
            <input
              type="text" value={form.club} onChange={set('club')}
              style={inputStyle}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          <Field label="Current Maturity Stage">
            <div style={{ display: 'flex', gap: 8 }}>
              {MATURITY_STAGES.map(s => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, maturityStage: s.value }))}
                  style={{
                    flex: 1, minHeight: 40, borderRadius: 100,
                    border: `1.5px solid ${form.maturityStage === s.value ? BLUE : 'rgba(255,255,255,.15)'}`,
                    background: form.maturityStage === s.value ? BLUE : 'transparent',
                    fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.08em', textTransform: 'uppercase',
                    color: form.maturityStage === s.value ? '#fff' : 'rgba(255,255,255,.4)',
                    cursor: 'pointer', fontWeight: 700,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Program Start Date" hint="When does the 12-week program begin?">
            <input
              type="date" value={form.programStartDate} onChange={set('programStartDate')}
              style={{ ...inputStyle, colorScheme: 'dark' }}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          <Field label="Coach Notes (Private)" hint="Only visible to you — not shared with athlete or parent.">
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder={`e.g. Strong technically, needs work on match play decision-making.\nPre-PHV so prioritise skill development.`}
              rows={4}
              style={{
                width: '100%', background: '#1E293B', border: '1.5px solid rgba(255,255,255,.12)',
                borderRadius: 6, padding: '12px 14px', color: '#fff', fontFamily: 'var(--font-b)',
                fontSize: 14, outline: 'none', resize: 'vertical', boxSizing: 'border-box',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = BLUE; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </Field>

          {error && (
            <div style={{ padding: '10px 14px', background: '#FF493618', border: '1px solid #FF493640', borderRadius: 8, fontFamily: 'var(--font-b)', fontSize: 12, color: '#FF4936' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', minHeight: 56, background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.04em', cursor: loading ? 'default' : 'pointer', opacity: loading ? .6 : 1, marginTop: 8 }}
          >
            {loading ? 'Creating…' : 'Create Profile & Generate Code'}
          </button>
        </form>
      </div>
    </div>
  );
}
