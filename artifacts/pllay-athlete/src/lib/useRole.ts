import { useState } from 'react';

export type Role = 'athlete' | 'coach' | 'parent';

export function getRole(): Role {
  try {
    return (localStorage.getItem('po_role') as Role) ?? 'athlete';
  } catch {
    return 'athlete';
  }
}

export function saveRole(role: Role) {
  try { localStorage.setItem('po_role', role); } catch { /* ignore */ }
}

export function useRole() {
  const [role, setRoleState] = useState<Role>(getRole());

  function updateRole(r: Role) {
    saveRole(r);
    setRoleState(r);
  }

  return { role, setRole: updateRole };
}
