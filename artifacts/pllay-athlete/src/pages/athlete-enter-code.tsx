import { useState } from 'react';
import { useLocation } from 'wouter';
import { apiFetch } from '@/lib/api';

const GREEN = '#10AC6E';

export default function AthleteEnterCode() {
  const [, navigate] = useLocation();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true); setStatus('idle'); setMsg('');
    try {
      const result = await apiFetch('/api/athlete/use-code', {
        method: 'POST',
        body: JSON.stringify({ code: code.trim() }),
      });
      setStatus('success');
      setMsg(`Linked to ${result.profileName} ✓`);
    } catch (err: any) {
      setStatus('error');
      setMsg(err.message ?? 'Code not found or expired. Ask your coach for a new one.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#111111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 36 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: GREEN, textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', padding: 0 }}>
            ← Dashboard
          </button>
        </div>

        <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.2em', textTransform: 'uppercase', color: GREEN, marginBottom: 8 }}>
          ATHLETE — LINK TO COACH
        </div>
        <h1 style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(32px,7vw,48px)', textTransform: 'uppercase', letterSpacing: '-.02em', lineHeight: .9, marginBottom: 12 }}>
          Enter Coach<br />Invite Code
        </h1>
        <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'rgba(255,255,255,.4)', lineHeight: 1.55, marginBottom: 32 }}>
          Your coach will have given you a 6-character code. Enter it below to link your account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 8 }}>
              Your Invite Code
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. PL4829"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              style={{
                width: '100%', background: '#1E293B', border: '1.5px solid rgba(255,255,255,.12)',
                borderRadius: 6, padding: '14px 18px', color: '#fff',
                fontFamily: 'Space Mono, monospace', fontSize: 24, letterSpacing: '.25em',
                outline: 'none', minHeight: 60, boxSizing: 'border-box', textTransform: 'uppercase', textAlign: 'center',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = GREEN; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
          </div>

          {status === 'success' && (
            <div style={{ padding: '12px 16px', background: '#10AC6E18', border: '1px solid #10AC6E40', borderRadius: 8, fontFamily: 'Space Mono, monospace', fontSize: 12, color: GREEN, fontWeight: 700 }}>
              {msg}
            </div>
          )}
          {status === 'error' && (
            <div style={{ padding: '12px 16px', background: '#FF493618', border: '1px solid #FF493640', borderRadius: 8, fontFamily: 'var(--font-b)', fontSize: 12, color: '#FF4936', lineHeight: 1.5 }}>
              {msg}
            </div>
          )}

          {status !== 'success' && (
            <button
              type="submit"
              disabled={loading || !code.trim()}
              style={{ width: '100%', minHeight: 52, background: GREEN, color: '#111111', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.04em', cursor: loading || !code.trim() ? 'default' : 'pointer', opacity: loading || !code.trim() ? .5 : 1 }}
            >
              {loading ? 'Linking…' : 'Link to Coach'}
            </button>
          )}

          {status === 'success' && (
            <button
              type="button"
              onClick={() => navigate('/')}
              style={{ width: '100%', minHeight: 52, background: GREEN, color: '#111111', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer' }}
            >
              Go to Dashboard →
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
