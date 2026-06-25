import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

const BLUE = '#0B7DF1';
const GREEN = '#10AC6E';
const YELLOW = '#F5B809';
const GREY = '#64748B';

interface AthleteProfile {
  id: number;
  name: string;
  sport?: string;
  maturityStage?: string;
  inviteCode: string;
  status: string;
  inviteCodeExpiresAt?: string;
  linkedAthleteId?: number;
}

export default function CoachAthletes() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const KEY = ['coach-athletes'];

  const { data: profiles = [], isLoading } = useQuery<AthleteProfile[]>({
    queryKey: KEY,
    queryFn: () => apiFetch('/api/coach/athletes'),
  });

  const regenMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/coach/athlete/${id}/regenerate-code`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);

  function copyCode(id: number, code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  }

  function statusBadge(status: string) {
    const cfg = {
      pending: { bg: `${YELLOW}20`, border: `${YELLOW}50`, color: YELLOW, label: 'AWAITING LINK' },
      linked:  { bg: `${GREEN}20`,  border: `${GREEN}50`,  color: GREEN,  label: 'LINKED' },
      expired: { bg: `${GREY}20`,   border: `${GREY}40`,   color: GREY,   label: 'EXPIRED' },
    }[status] ?? { bg: `${GREY}20`, border: `${GREY}40`, color: GREY, label: status.toUpperCase() };
    return (
      <span style={{ padding: '3px 10px', borderRadius: 100, background: cfg.bg, border: `1px solid ${cfg.border}`, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase', color: cfg.color, fontWeight: 700 }}>
        {cfg.label}
      </span>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFBFC', paddingBottom: 80 }}>
      {/* Top bar */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 52, background: 'rgba(15,23,42,.97)', borderBottom: `2px solid ${BLUE}40`, display: 'flex', alignItems: 'center', padding: '0 16px', justifyContent: 'space-between', zIndex: 1000 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 17, color: '#10AC6E', textTransform: 'uppercase', letterSpacing: '.06em' }}>PLLAY ON</div>
        <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.55)', letterSpacing: '.1em', textTransform: 'uppercase' }}>ATHLETE PROFILES</div>
        <button onClick={() => navigate('/dashboard/coach')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          ← Dashboard
        </button>
      </nav>

      <div style={{ maxWidth: 680, margin: '0 auto', padding: '72px 16px 0' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.16em', textTransform: 'uppercase', color: BLUE, marginBottom: 4, fontWeight: 700 }}>COACH</div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 32, textTransform: 'uppercase', color: 'var(--dark)', lineHeight: .9 }}>Athlete Profiles</div>
          </div>
          <button
            onClick={() => navigate('/coach/athlete/new')}
            style={{ padding: '10px 18px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 16, textTransform: 'uppercase', cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            + New Athlete
          </button>
        </div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div style={{ width: 32, height: 32, border: `4px solid ${BLUE}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : profiles.length === 0 ? (
          <div style={{ background: '#fff', border: `2px dashed ${BLUE}40`, borderRadius: 12, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: BLUE, marginBottom: 8 }}>No Athlete Profiles Yet</div>
            <p style={{ fontFamily: 'var(--font-b)', fontSize: 13, color: 'var(--grey)', marginBottom: 20 }}>
              Create a profile for your athlete and generate a code for them to link their account.
            </p>
            <button onClick={() => navigate('/coach/athlete/new')} style={{ padding: '12px 24px', background: BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
              Create First Profile →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {profiles.map(p => (
              <div key={p.id} style={{ background: '#fff', border: '1px solid var(--grey1)', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,.04)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 20, textTransform: 'uppercase', color: 'var(--dark)' }}>{p.name}</div>
                    <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--grey)', marginTop: 3 }}>
                      {[p.sport, p.maturityStage].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  {statusBadge(p.status)}
                </div>

                {p.status === 'pending' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, letterSpacing: '.2em', color: '#1E293B', background: '#F8FAFC', border: '1.5px dashed #CBD5E1', borderRadius: 8, padding: '8px 16px' }}>
                      {p.inviteCode}
                    </div>
                    <button
                      onClick={() => copyCode(p.id, p.inviteCode)}
                      style={{ padding: '8px 14px', background: copiedId === p.id ? GREEN : BLUE, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700, transition: 'background .2s' }}
                    >
                      {copiedId === p.id ? 'Copied ✓' : 'Copy Code'}
                    </button>
                    <button
                      onClick={() => navigate(`/coach/athlete/${p.id}/code`)}
                      style={{ padding: '8px 14px', background: 'transparent', color: BLUE, border: `1.5px solid ${BLUE}`, borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}
                    >
                      View Code
                    </button>
                  </div>
                )}

                {p.status === 'linked' && (
                  <button
                    onClick={() => navigate('/dashboard/coach')}
                    style={{ padding: '8px 16px', background: GREEN, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700 }}
                  >
                    View Athlete →
                  </button>
                )}

                {p.status === 'expired' && (
                  <button
                    onClick={() => regenMutation.mutate(p.id)}
                    disabled={regenMutation.isPending}
                    style={{ padding: '8px 16px', background: GREY, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', cursor: 'pointer', fontWeight: 700, opacity: regenMutation.isPending ? .6 : 1 }}
                  >
                    Regenerate Code
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
