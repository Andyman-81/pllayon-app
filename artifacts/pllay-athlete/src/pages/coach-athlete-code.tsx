import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const BLUE = '#0B7DF1';
const GREEN = '#10AC6E';

export default function CoachAthleteCode() {
  const { profileId } = useParams<{ profileId: string }>();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const KEY = ['coach-athlete', profileId];

  const { data: profile, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => apiFetch(`/api/coach/athlete/${profileId}`),
  });

  const regenMutation = useMutation({
    mutationFn: () => apiFetch(`/api/coach/athlete/${profileId}/regenerate-code`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const [copied, setCopied] = useState(false);

  function copyCode() {
    if (!profile?.inviteCode) return;
    navigator.clipboard.writeText(profile.inviteCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  if (isLoading) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111' }}>
        <div style={{ width: 32, height: 32, border: `4px solid ${BLUE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#111111', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Profile not found</div>
          <button onClick={() => navigate('/coach/athletes')} style={{ background: BLUE, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 20px', cursor: 'pointer', fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 800, textTransform: 'uppercase' }}>
            Back to Athletes
          </button>
        </div>
      </div>
    );
  }

  const expiresAt = profile.inviteCodeExpiresAt ? new Date(profile.inviteCodeExpiresAt) : null;
  const now = new Date();
  const daysLeft = expiresAt ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <div style={{ minHeight: '100dvh', background: '#111111', color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px 80px' }}>
      <div style={{ width: '100%', maxWidth: 480, paddingTop: 40 }}>

        {/* Back */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
          <button onClick={() => navigate('/coach/athletes')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase', padding: 0 }}>
            ← Athletes
          </button>
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {['CREATE PROFILE', 'SEND CODE', 'ATHLETE LINKS'].map((step, i) => (
            <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 1 ? GREEN : i < 1 ? GREEN : 'rgba(255,255,255,.1)',
                  fontFamily: 'var(--font-m)', fontSize: 9, fontWeight: 700,
                  color: i <= 1 ? '#fff' : 'rgba(255,255,255,.3)',
                }}>
                  {i < 1 ? '✓' : i + 1}
                </div>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: i === 1 ? GREEN : i < 1 ? 'rgba(255,255,255,.4)' : 'rgba(255,255,255,.3)', fontWeight: i === 1 ? 700 : 400 }}>
                  {step}
                </span>
              </div>
              {i < 2 && <div style={{ width: 16, height: 1, background: 'rgba(255,255,255,.15)' }} />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(28px,6vw,40px)', textTransform: 'uppercase', color: GREEN, letterSpacing: '-.01em', marginBottom: 4 }}>
          Invite Code Generated ✓
        </div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'rgba(255,255,255,.4)', letterSpacing: '.08em', marginBottom: 28 }}>
          {profile.name}
        </div>

        {/* Code display */}
        <div style={{
          fontFamily: 'Space Mono, monospace', fontSize: 48, fontWeight: 700,
          letterSpacing: '.2em', color: '#1E293B', textAlign: 'center',
          padding: 32, background: '#F8FAFC', border: '2px dashed #CBD5E1',
          borderRadius: 12, marginBottom: 12,
        }}>
          {profile.inviteCode}
        </div>

        <div style={{ textAlign: 'center', fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.35)', textTransform: 'uppercase', marginBottom: 20 }}>
          Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}
        </div>

        <button
          onClick={copyCode}
          style={{ width: '100%', minHeight: 48, background: copied ? GREEN : BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', marginBottom: 20, transition: 'background .2s' }}
        >
          {copied ? 'Copied ✓' : 'Copy Code'}
        </button>

        {/* Instructions card */}
        <div style={{ background: '#0D1F0D', border: `1px solid ${GREEN}40`, borderLeft: `4px solid ${GREEN}`, borderRadius: '0 10px 10px 0', padding: '18px 20px', marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', color: GREEN, marginBottom: 10 }}>Send this to your athlete</div>
          <ol style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              'Share this 6-digit code with your athlete.',
              'Ask them to download and open Pllay On.',
              'They register as an Athlete and enter this code when prompted.',
              'Once they link, their data appears here automatically.',
            ].map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 10, fontFamily: 'var(--font-b)', fontSize: 13, color: 'rgba(255,255,255,.7)', lineHeight: 1.5 }}>
                <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: GREEN, fontWeight: 700, minWidth: 18, marginTop: 2 }}>{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button
            onClick={() => regenMutation.mutate()}
            disabled={regenMutation.isPending}
            style={{ width: '100%', minHeight: 48, background: 'transparent', color: 'rgba(255,255,255,.6)', border: '1.5px solid rgba(255,255,255,.2)', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer', opacity: regenMutation.isPending ? .5 : 1 }}
          >
            {regenMutation.isPending ? 'Regenerating…' : 'Generate New Code'}
          </button>
          <button
            onClick={() => navigate('/coach/athletes')}
            style={{ width: '100%', minHeight: 48, background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', letterSpacing: '.04em', cursor: 'pointer' }}
          >
            View Athlete Profiles
          </button>
        </div>
      </div>
    </div>
  );
}
