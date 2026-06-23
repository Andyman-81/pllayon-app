import { useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Layout } from '@/components/layout';
import { apiFetch } from '@/lib/api';
import { getRole } from '@/lib/useRole';

const RED = '#FF4936';

function severityColour(s: number) {
  if (s <= 2) return '#F5B809';
  if (s === 3) return '#F97316';
  return '#FF4936';
}

const STATUS_LABELS: Record<string, string> = {
  open: 'OPEN', coach_reviewed: 'COACH REVIEWED',
  monitoring: 'MONITORING', cleared: 'CLEARED', referred: 'REFERRED',
};
const STATUS_COLORS: Record<string, string> = {
  open: RED, coach_reviewed: '#0B7DF1',
  monitoring: '#F5B809', cleared: '#10AC6E', referred: '#7C3AED',
};

interface InjuryFlag {
  id: number; bodyArea: string; side?: string | null; concernType: string;
  severity: number; status: string; createdAt: string; loggedBy: string; loggedByName?: string | null;
  coachResponse?: string | null; affectsTraining?: boolean;
}

const FILTER_TABS = ['ALL','OPEN','MONITORING','RESOLVED'] as const;
type FilterTab = typeof FILTER_TABS[number];

export default function InjuryList() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<FilterTab>('ALL');
  const role = getRole();

  const { data: flags = [], isLoading } = useQuery<InjuryFlag[]>({
    queryKey: ['injury-flags'],
    queryFn: () => apiFetch('/injury'),
  });

  const filtered = flags.filter(f => {
    if (filter === 'OPEN')       return f.status === 'open' || f.status === 'coach_reviewed';
    if (filter === 'MONITORING') return f.status === 'monitoring';
    if (filter === 'RESOLVED')   return f.status === 'cleared' || f.status === 'referred';
    return true;
  });

  return (
    <Layout>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 0 120px' }}>

        {/* Header */}
        <div style={{ padding: '28px 24px 20px', borderBottom: '1px solid var(--grey1)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: RED, marginBottom: 5 }}>
              {role === 'coach' ? 'Athlete Flags' : role === 'parent' ? 'Athlete Flags' : 'My Flags'}
            </div>
            <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 'clamp(24px,4vw,36px)', textTransform: 'uppercase', color: 'var(--black)', lineHeight: .95 }}>
              Injury &amp; Concern Log
            </div>
          </div>
          {role !== 'coach' && (
            <button
              onClick={() => navigate('/injury/new')}
              style={{
                padding: '10px 16px', borderRadius: 8, cursor: 'pointer',
                border: `1.5px solid ${RED}`, background: 'transparent',
                fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
                letterSpacing: '.1em', textTransform: 'uppercase', color: RED, minHeight: 44,
              }}
            >
              + LOG NEW
            </button>
          )}
        </div>

        <div style={{ padding: '20px 24px 0' }}>

          {/* Filter tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, overflowX: 'auto', scrollbarWidth: 'none' }}>
            {FILTER_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  flexShrink: 0, padding: '7px 14px', borderRadius: 100, cursor: 'pointer',
                  border: `1.5px solid ${filter === tab ? RED : 'var(--grey1)'}`,
                  background: filter === tab ? RED : '#fff',
                  fontFamily: 'Space Mono, monospace', fontSize: 10, fontWeight: 700,
                  letterSpacing: '.1em', textTransform: 'uppercase',
                  color: filter === tab ? '#fff' : 'var(--grey)',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${RED}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 22, textTransform: 'uppercase', color: 'var(--grey)', marginBottom: 8 }}>
                {filter === 'ALL' ? 'No flags logged yet' : `No ${filter.toLowerCase()} flags`}
              </div>
              {role !== 'coach' && filter === 'ALL' && (
                <button onClick={() => navigate('/injury/new')} style={{ marginTop: 16, padding: '12px 24px', background: RED, color: '#fff', border: 'none', borderRadius: 6, fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', cursor: 'pointer' }}>
                  Log a Concern →
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map(flag => {
                const sc = severityColour(flag.severity);
                const sc2 = STATUS_COLORS[flag.status] ?? RED;
                const label = [flag.bodyArea, flag.side].filter(Boolean).join(' — ');
                return (
                  <div
                    key={flag.id}
                    onClick={() => navigate(`/injury/${flag.id}`)}
                    style={{
                      background: '#fff', borderRadius: 10, padding: '14px 16px',
                      borderLeft: `5px solid ${sc}`, border: `1px solid var(--grey1)`,
                      borderLeftWidth: 5, borderLeftColor: sc,
                      cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,.04)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <div style={{ fontFamily: 'var(--font-d)', fontWeight: 800, fontSize: 18, textTransform: 'uppercase', color: 'var(--dark)', lineHeight: 1 }}>
                        {label}
                      </div>
                      <div style={{ padding: '3px 10px', borderRadius: 100, background: sc2, fontFamily: 'Space Mono, monospace', fontSize: 8, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', color: '#fff', flexShrink: 0, marginLeft: 8 }}>
                        {STATUS_LABELS[flag.status] ?? flag.status}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 100, border: `1px solid ${sc}`, fontFamily: 'Space Mono, monospace', fontSize: 9, color: sc, textTransform: 'uppercase', letterSpacing: '.08em' }}>
                        {flag.concernType}
                      </span>
                      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: sc, fontWeight: 700 }}>
                        Severity {flag.severity}/5
                      </span>
                    </div>
                    <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 9, color: '#94A3B8', letterSpacing: '.06em', marginBottom: flag.coachResponse ? 6 : 0 }}>
                      Logged by {flag.loggedByName ?? flag.loggedBy} · {new Date(flag.createdAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {flag.coachResponse && (
                      <div style={{ fontFamily: 'var(--font-b)', fontSize: 12, color: '#0B7DF1', fontStyle: 'italic', lineHeight: 1.4 }}>
                        Coach: {flag.coachResponse.slice(0, 80)}{flag.coachResponse.length > 80 ? '…' : ''}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
