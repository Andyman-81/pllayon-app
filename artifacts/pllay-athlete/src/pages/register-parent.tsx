import { useState } from "react";
import { useLocation } from "wouter";
import { apiUrl, apiFetch } from "@/lib/api";

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
  const [form, setForm] = useState({ email: '', password: '', name: '', athleteEmail: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setLinkError('');
    try {
      await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password, firstName: form.name }),
      }).then(async r => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error((d as any).error || `HTTP ${r.status}`);
        return d;
      });

      await apiFetch('/parent/profile', {
        method: 'POST',
        body: JSON.stringify({ name: form.name }),
      });

      if (form.athleteEmail) {
        try {
          await apiFetch('/parent/link-athlete', {
            method: 'POST',
            body: JSON.stringify({ athleteEmail: form.athleteEmail }),
          });
        } catch (e: any) {
          setLinkError(e.message);
          setLoading(false);
          return;
        }
      }

      const base = import.meta.env.BASE_URL.replace(/\/+$/, '');
      window.location.href = base + '/dashboard/parent';
    } catch (e: any) {
      setError(e.message);
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#111111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>
            PLLAY ON
          </div>
          <button
            onClick={() => navigate('/login')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', padding: 0 }}
          >
            ← Back
          </button>
        </div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: AMBER, marginBottom: 8 }}>
          PARENT REGISTRATION
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(36px,7vw,56px)', textTransform: 'uppercase', letterSpacing: '-.02em', lineHeight: .9, marginBottom: 32 }}>
          Set Up Your<br />Parent Profile
        </h1>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Email" value={form.email} onChange={set('email')} required type="email" />
          <Field label="Password (min 8 characters)" value={form.password} onChange={set('password')} required type="password" />
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

          <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-b)', fontSize: 13, color: 'rgba(255,255,255,.4)' }}>
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: AMBER, fontFamily: 'var(--font-b)', fontSize: 13, padding: 0, textDecoration: 'underline' }}
            >
              Log in →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
