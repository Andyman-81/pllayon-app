import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useGetAthleteProfile, useGetProgress } from '@workspace/api-client-react';
import { PHASE_COLORS, PHASE_LABELS } from '@/lib/constants';
import { getRole } from '@/lib/useRole';

const ROLE_COLOURS: Record<string, string> = {
  athlete: '#10AC6E',
  coach:   '#0B7DF1',
  parent:  '#F5B809',
};

/* ── Top Navbar ─────────────────────────────────────────── */
interface NavbarProps {
  phaseColour: string;
  currentSection?: string;
  athleteName?: string;
  onHome: () => void;
}

function Navbar({ phaseColour, currentSection, athleteName, onHome }: NavbarProps) {
  const role = getRole();
  const roleColour = ROLE_COLOURS[role] ?? '#10AC6E';
  return (
    <nav className="nav" style={{ borderBottom: `2px solid ${phaseColour}40` }}>
      <button
        onClick={onHome}
        className="nav-brand"
        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginRight: 0 }}
      >
        PLLAY ON
      </button>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 8px', overflow: 'hidden' }}>
        {athleteName && (
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'rgba(255,255,255,.55)', letterSpacing: '.1em', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
            {athleteName}
          </div>
        )}
        {currentSection && (
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 8, color: phaseColour, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>
            {currentSection}
          </div>
        )}
      </div>

      <div style={{ padding: '3px 10px', borderRadius: 100, border: `1.5px solid ${roleColour}`, background: `${roleColour}20`, fontFamily: 'var(--font-m)', fontSize: 8, letterSpacing: '.12em', textTransform: 'uppercase', color: roleColour, fontWeight: 700, flexShrink: 0 }}>
        {role}
      </div>
    </nav>
  );
}

/* ── Bottom Navigation Bar ──────────────────────────────── */
interface BottomNavProps {
  phaseColour: string;
  currentWeek: number;
  capstoneUnlocked?: boolean;
}

function BottomNav({ phaseColour, currentWeek, capstoneUnlocked }: BottomNavProps) {
  const [location, navigate] = useLocation();
  const [openMenu, setOpenMenu] = useState<null | 'training' | 'more'>(null);

  function isActive(tab: string): boolean {
    if (tab === 'home')     return location === '/' || location === '';
    if (tab === 'week')     return /^\/week\//.test(location);
    if (tab === 'schedule') return location.startsWith('/schedule');
    if (tab === 'plan')     return location.startsWith('/cycle-planner');
    if (tab === 'training') return location.startsWith('/appendix');
    if (tab === 'more')     return ['/competition-review', '/progress', '/phase0', '/capstone', '/pre-comp'].some(p => location.startsWith(p));
    return false;
  }

  const TRAINING_ITEMS = [
    { label: 'Appendix A: Warm-Up',   path: '/appendix/warmup' },
    { label: 'Appendix B: Gym S&C',   path: '/appendix/gym' },
    { label: 'Appendix C: Body Mgmt', path: '/appendix/body' },
    { label: 'Appendix D: Cooldown',  path: '/appendix/cooldown' },
  ];

  const MORE_ITEMS = [
    { label: 'Competition Review', path: '/competition-review', disabled: false },
    { label: 'Progress Summary',   path: '/progress',           disabled: false },
    { label: 'Phase 0 Setup',      path: '/phase0',             disabled: false },
    { label: 'Capstone',           path: '/capstone',           disabled: !capstoneUnlocked },
  ];

  const tabs = [
    { id: 'home',     label: 'HOME',          icon: '⌂', colour: phaseColour, onClick: () => { navigate('/'); setOpenMenu(null); } },
    { id: 'week',     label: `WEEK ${currentWeek || 1}`, icon: '⊞', colour: phaseColour, onClick: () => { navigate(`/week/${currentWeek || 1}`); setOpenMenu(null); } },
    { id: 'schedule', label: 'SCHEDULE',       icon: '▤', colour: phaseColour, onClick: () => { navigate(`/schedule/week/${currentWeek || 1}`); setOpenMenu(null); } },
    { id: 'plan',     label: '12WK PLAN',      icon: '◈', colour: '#0B7DF1',  onClick: () => { navigate('/cycle-planner'); setOpenMenu(null); } },
    { id: 'training', label: 'TRAINING',       icon: '⚡', colour: '#10AC6E', onClick: () => setOpenMenu(openMenu === 'training' ? null : 'training') },
    { id: 'more',     label: 'MORE',           icon: '···', colour: '#64748B', onClick: () => setOpenMenu(openMenu === 'more' ? null : 'more') },
  ];

  const menuItems = openMenu === 'training' ? TRAINING_ITEMS : openMenu === 'more' ? MORE_ITEMS : null;
  const menuColour = openMenu === 'training' ? '#10AC6E' : '#64748B';

  return (
    <>
      {openMenu && (
        <div onClick={() => setOpenMenu(null)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />
      )}

      {openMenu && menuItems && (
        <div style={{ position: 'fixed', bottom: 64, left: 0, right: 0, zIndex: 1001, padding: '0 12px 6px' }}>
          <div style={{ background: '#1E293B', borderRadius: 12, overflow: 'hidden', boxShadow: '0 -4px 32px rgba(0,0,0,.5)' }}>
            {(menuItems as Array<{ label: string; path: string; disabled?: boolean }>).map((item, i) => (
              <button
                key={item.path}
                onClick={() => {
                  if (!(item as any).disabled) { navigate(item.path); setOpenMenu(null); }
                }}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', padding: '14px 18px', background: 'transparent', border: 'none',
                  borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,.07)' : 'none',
                  fontFamily: 'var(--font-m)', fontSize: 12, letterSpacing: '.07em', textTransform: 'uppercase',
                  color: (item as any).disabled ? 'rgba(255,255,255,.2)' : '#fff',
                  cursor: (item as any).disabled ? 'default' : 'pointer', textAlign: 'left', minHeight: 48,
                }}
              >
                {item.label}
                {!(item as any).disabled && <span style={{ color: menuColour, fontSize: 16 }}>→</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <nav className="bottom-nav">
        {tabs.map(tab => {
          const active = isActive(tab.id) || openMenu === tab.id;
          return (
            <button
              key={tab.id}
              onClick={tab.onClick}
              className={`bottom-nav-tab${active ? ' active' : ''}`}
              style={{ '--active-colour': tab.colour } as React.CSSProperties}
            >
              <span className="bottom-nav-icon">{tab.icon}</span>
              <span className="bottom-nav-label">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
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
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, letterSpacing: '.1em', color: 'rgba(255,255,255,.55)', textTransform: 'uppercase' }}>Program</span>
        <span style={{ fontFamily: 'var(--font-m)', fontSize: 12, fontWeight: 700, color: phaseColour }}>{pct}%</span>
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
  const { data: profile } = useGetAthleteProfile();
  const { data: progress } = useGetProgress();

  const phaseColour = PHASE_COLORS[currentPhase] ?? PHASE_COLORS[0];
  const phaseLabel = PHASE_LABELS[currentPhase] ?? 'Phase 0';
  const section = currentSection ?? `Phase ${currentPhase}: ${phaseLabel}`;
  const athleteName = profile?.name ?? '';
  const currentWeek = progress?.currentWeek ?? 1;
  const capstoneUnlocked = (progress?.currentWeek ?? 0) > 12;

  const completed = Math.round(((progress?.overallCompletionPct ?? 0) / 100) * 16);

  return (
    <div style={{ minHeight: '100dvh', background: '#FAFBFC' }}>
      <Navbar
        phaseColour={phaseColour}
        currentSection={section}
        athleteName={athleteName}
        onHome={() => navigate('/')}
      />

      <main style={{ paddingTop: 56, paddingBottom: 80 }}>
        {children}
      </main>

      {progress && (
        <ProgressWidget completed={completed} total={16} phaseColour={phaseColour} />
      )}

      <BottomNav
        phaseColour={phaseColour}
        currentWeek={currentWeek}
        capstoneUnlocked={capstoneUnlocked}
      />
    </div>
  );
}

/* ── PageHeader ────────────────────────────────────────── */
export function PageHeader({ title, subtitle, phaseColour }: { title: string; subtitle?: string; phaseColour?: string }) {
  return (
    <div className="mod-header" style={{ padding: '28px 24px 16px', borderBottom: '1px solid var(--grey1)', marginBottom: 0 }}>
      {subtitle && (
        <div className="mod-eyebrow" style={{ color: phaseColour ?? 'var(--grey)' }}>{subtitle}</div>
      )}
      <div className="mod-title">{title}</div>
    </div>
  );
}
