import React from 'react';
import { useLocation } from 'wouter';
import { useGetAthleteProfile, useGetProgress } from '@workspace/api-client-react';
import { PHASE_COLORS, PHASE_LABELS } from '@/lib/constants';

/* ── Navbar ────────────────────────────────────────────── */
interface NavbarProps {
  phaseColour: string;
  currentSection?: string;
  athleteName?: string;
  onHome: () => void;
}

function Navbar({ phaseColour, currentSection, athleteName, onHome, currentWeek }: NavbarProps & { currentWeek?: number }) {
  const [, navigate] = useLocation();
  return (
    <nav
      className="nav"
      style={{ borderBottom: `4px solid ${phaseColour}` }}
    >
      <button
        className="nav-brand"
        onClick={onHome}
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        PLLAY
      </button>
      {currentSection && (
        <span className="nav-wkb" style={{ background: phaseColour }}>{currentSection}</span>
      )}
      <div style={{ flex: 1 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {(currentWeek ?? 0) >= 1 && (
          <button
            onClick={() => navigate(`/schedule/week/${currentWeek}`)}
            title="Weekly Schedule"
            style={{ minHeight: 32, padding: '5px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
          >
            Schedule
          </button>
        )}
        <button
          onClick={() => navigate('/cycle-planner')}
          title="12-Week Plan"
          style={{ minHeight: 32, padding: '5px 10px', background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)', borderRadius: 6, fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,.65)', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
        >
          12Wk Plan
        </button>
        {athleteName && (
          <span style={{
            fontFamily: 'var(--font-m)',
            fontSize: 11,
            color: 'rgba(255,255,255,.55)',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}>
            {athleteName}
          </span>
        )}
      </div>
    </nav>
  );
}

/* ── ProgressWidget ────────────────────────────────────── */
function ProgressWidget({ completed, total, phaseColour }: { completed: number; total: number; phaseColour: string }) {
  const pct = Math.min(100, Math.round((completed / total) * 100));
  return (
    <div className="progress-widget">
      <div className="p-bar-out">
        <div className="p-bar-in" style={{ width: `${pct}%`, background: phaseColour }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' }}>
          Program
        </span>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 700, color: phaseColour }}>
          {pct}%
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>
        {completed}/{total} complete
      </div>
    </div>
  );
}

/* ── Layout ────────────────────────────────────────────── */
interface LayoutProps {
  children: React.ReactNode;
  currentPhase?: number;
  currentSection?: string;
}

export function Layout({ children, currentPhase = 0, currentSection }: LayoutProps) {
  const [, navigate] = useLocation();
  const { data: profile } = useGetAthleteProfile({ query: { retry: false } });
  const { data: progress } = useGetProgress({ query: { retry: false } });

  const phaseColour = PHASE_COLORS[currentPhase] ?? PHASE_COLORS[0];
  const phaseLabel = PHASE_LABELS[currentPhase] ?? 'Phase 0';
  const section = currentSection ?? `Phase ${currentPhase}: ${phaseLabel}`;
  const athleteName = profile?.name ?? '';

  const completed = Math.round(((progress?.overallCompletionPct ?? 0) / 100) * 16);
  const total = 16;

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFBFC' }}>
      <Navbar
        phaseColour={phaseColour}
        currentSection={section}
        athleteName={athleteName}
        onHome={() => navigate('/')}
        currentWeek={progress?.currentWeek ?? 0}
      />

      <main style={{ paddingTop: 56 }}>
        {children}
      </main>

      {progress && (
        <ProgressWidget
          completed={completed}
          total={total}
          phaseColour={phaseColour}
        />
      )}
    </div>
  );
}

/* ── PageHeader ────────────────────────────────────────── */
export function PageHeader({
  title,
  subtitle,
  phaseColour,
}: {
  title: string;
  subtitle?: string;
  phaseColour?: string;
}) {
  return (
    <div className="mod-header" style={{ padding: '28px 24px 16px', borderBottom: '1px solid var(--grey1)', marginBottom: 0 }}>
      {subtitle && (
        <div className="mod-eyebrow" style={{ color: phaseColour ?? 'var(--grey)' }}>{subtitle}</div>
      )}
      <div className="mod-title">{title}</div>
    </div>
  );
}
