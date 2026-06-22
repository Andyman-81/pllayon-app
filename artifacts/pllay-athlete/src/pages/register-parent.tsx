import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@workspace/replit-auth-web";
import { apiFetch } from "@/lib/api";

const AMBER = '#D97706';

function Field({ label, value, onChange, required, type = 'text', placeholder, hint }: {
  label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean; type?: string; placeholder?: string; hint?: string;
}) {
  return (
    <div>
      <label style={{ display: 'block', fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>
        {label}{required && <span style={{ color: AMBER }}> *</span>}
      </label>
      <input
        type={type} value={value} onChange={onChange} required={required} placeholder={placeholder}
        style={{ width: '100%', background: '#1E293B', border: '1.5px solid rgba(255,255,255,.12)', borderRadius: 6, padding: '12px 14px', color: '#fff', fontFamily: 'var(--font-b)', fontSize: 14, outline: 'none', minHeight: 48, boxSizing: 'border-box' }}
        onFocus={e => { e.currentTarget.style.borderColor = AMBER; }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
      />
      {hint && <div style={{ marginTop: 4, fontFamily: 'var(--font-b)', fontSize: 11, color: 'rgba(255,255,255,.3)', lineHeight: 1.45 }}>{hint}</div>}
    </div>
  );
}

export default function RegisterParent() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [form, setForm] = useState({ name: '', athleteEmail: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setLinkError('');
    try {
      await apiFetch('/parent/profile', { method: 'POST', body: JSON.stringify({ name: form.name }) });
      if (form.athleteEmail) {
        try {
          await apiFetch('/parent/link-athlete', { method: 'POST', body: JSON.stringify({ athleteEmail: form.athleteEmail }) });
        } catch (e: any) {
          setLinkError(e.message);
          setLoading(false);
          return;
        }
      }
      navigate('/dashboard/parent');
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#111111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 28 }}>
          PLLAY ON
        </div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: AMBER, marginBottom: 8 }}>
          PARENT REGISTRATION
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(36px,7vw,56px)', textTransform: 'uppercase', letterSpacing: '-.02em', lineHeight: .9, marginBottom: 32 }}>
          Set Up Your<br />Parent Profile
        </h1>

        {user?.email && (
          <div style={{ marginBottom: 24, padding: '10px 14px', background: `${AMBER}18`, border: `1px solid ${AMBER}40`, borderRadius: 8, fontFamily: 'var(--font-m)', fontSize: 11, color: AMBER }}>
            Signed in as {user.email}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Parent Name" value={form.name} onChange={set('name')} required />

          <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', margin: '10px 0 4px' }} />
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)' }}>
            LINK TO ATHLETE
          </div>
          <Field
            label="Athlete Email" value={form.athleteEmail} onChange={set('athleteEmail')} type="email"
            hint="Enter your child's email address. They must already have a Pllay On account."
          />

          {linkError && (
            <div style={{ padding: '10px 14px', background: '#FF493618', border: '1px solid #FF493640', borderRadius: 8, fontFamily: 'var(--font-b)', fontSize: 12, color: '#FF4936', lineHeight: 1.5 }}>
              {linkError}
            </div>
          )}
          {error && (
            <div style={{ padding: '10px 14px', background: '#FF493618', border: '1px solid #FF493640', borderRadius: 8, fontFamily: 'var(--font-b)', fontSize: 12, color: '#FF4936' }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} style={{ width: '100%', minHeight: 52, background: AMBER, color: '#fff', border: 'none', borderRadius: 4, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', letterSpacing: '.06em', cursor: loading ? 'default' : 'pointer', opacity: loading ? .6 : 1, marginTop: 10 }}>
            {loading ? 'Registering…' : 'Register as Parent'}
          </button>
        </form>
      </div>
    </div>
  );
}
