import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@workspace/replit-auth-web';
import { getRole, saveRole, type Role } from '@/lib/useRole';
import { apiFetch } from '@/lib/api';

const ROLES: { value: Role; label: string; colour: string }[] = [
  { value: 'athlete', label: 'Athlete', colour: '#10AC6E' },
  { value: 'coach',   label: 'Coach',   colour: '#0B7DF1' },
  { value: 'parent',  label: 'Parent',  colour: '#D97706' },
];

const ROLE_DASHBOARD: Record<Role, string> = {
  athlete: '/',
  coach:   '/dashboard/coach',
  parent:  '/dashboard/parent',
};

const ROLE_REGISTER: Record<Role, string> = {
  athlete: '/onboarding',
  coach:   '/register/coach',
  parent:  '/register/parent',
};

const PROFILE_ENDPOINT: Record<Role, string> = {
  athlete: '/athlete/profile',
  coach:   '/coach/profile',
  parent:  '/parent/profile',
};

function getInitials(firstName?: string | null, lastName?: string | null, email?: string | null): string {
  if (firstName || lastName) {
    return [(firstName ?? '')[0], (lastName ?? '')[0]].filter(Boolean).join('').toUpperCase() || '?';
  }
  if (email) return email[0].toUpperCase();
  return '?';
}

export function ProfileMenu({ roleColour }: { roleColour: string }) {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const currentRole = getRole();

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  async function switchRole(role: Role) {
    saveRole(role);
    setOpen(false);
    try {
      await apiFetch(PROFILE_ENDPOINT[role]);
      navigate(ROLE_DASHBOARD[role]);
    } catch {
      navigate(ROLE_REGISTER[role]);
    }
  }

  function handleLogout() {
    try { localStorage.clear(); } catch { /* ignore */ }
    logout();
  }

  const initials = getInitials(user?.firstName, user?.lastName, user?.email);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';

  return (
    <div ref={menuRef} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Profile menu"
        style={{
          width: 36, height: 36, borderRadius: '50%',
          background: roleColour, border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Barlow Condensed', sans-serif",
          fontWeight: 700, fontSize: 14, color: '#fff',
          textTransform: 'uppercase', letterSpacing: '.04em',
          flexShrink: 0, transition: 'opacity .15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '.85'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        {initials}
      </button>

      {open && (
        <div className="profile-menu">
          <div className="profile-menu-header">
            <div className="profile-menu-name">{displayName}</div>
            <div style={{ marginTop: 5, marginBottom: 4 }}>
              <span style={{
                padding: '2px 8px', borderRadius: 100,
                background: `${roleColour}25`, border: `1px solid ${roleColour}50`,
                fontFamily: 'var(--font-m)', fontSize: 9, letterSpacing: '.12em',
                textTransform: 'uppercase', color: roleColour, fontWeight: 700,
              }}>
                {currentRole}
              </span>
            </div>
            {user?.email && <div className="profile-menu-email">{user.email}</div>}
          </div>

          <div className="profile-menu-section">
            <div className="profile-menu-label">Switch Role</div>
            <div className="role-pills">
              {ROLES.map(r => (
                <button
                  key={r.value}
                  onClick={() => switchRole(r.value)}
                  className={`role-pill-btn${r.value === currentRole ? ' active' : ''}`}
                  style={r.value === currentRole
                    ? { borderColor: r.colour, color: r.colour, background: `${r.colour}18` }
                    : {}}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <button className="logout-btn" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
