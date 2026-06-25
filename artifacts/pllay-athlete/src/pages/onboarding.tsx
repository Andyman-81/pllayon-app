import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateAthleteProfile } from "@workspace/api-client-react";

const GREEN = '#10AC6E';

async function apiFetch(path: string, opts?: RequestInit) {
  const r = await fetch(path, { credentials: 'include', ...opts, headers: { 'Content-Type': 'application/json', ...opts?.headers } });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const createProfile = useCreateAthleteProfile();
  
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    sport: "",
    club: "",
    coachName: "",
    parentName: ""
  });

  const [inviteCode, setInviteCode] = useState('');
  const [linkStatus, setLinkStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [linkMsg, setLinkMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    createProfile.mutate(
      { data: formData },
      {
        onSuccess: async () => {
          if (inviteCode.trim()) {
            try {
              const result = await apiFetch('/api/athlete/use-code', {
                method: 'POST',
                body: JSON.stringify({ code: inviteCode.trim() }),
              });
              setLinkStatus('success');
              setLinkMsg(`Linked to ${result.profileName} ✓`);
            } catch (err: any) {
              setLinkStatus('error');
              setLinkMsg(err.message ?? 'Code not found or expired. Ask your coach for a new one.');
            }
          }
          setTimeout(() => setLocation("/"), linkStatus === 'success' ? 1200 : 0);
        }
      }
    );
  };

  return (
    <div className="min-h-[100dvh] bg-[#111111] text-white w-full flex justify-center font-sans">
      <div className="w-full max-w-[480px] p-6 flex flex-col">
        <div className="flex-1 mt-12 mb-8">
          <p className="text-[#10AC6E] font-mono tracking-widest text-xs mb-4">PLLAY ON EDGE</p>
          <h1 className="font-heading text-5xl leading-[0.9] uppercase mb-4">Establish<br/>Your<br/>Baseline</h1>
          <p className="text-gray-400 text-sm">Create your athlete profile to begin the 12-week development program.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pb-8 flex-1">
          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1">FULL NAME</label>
            <input 
              required
              type="text" 
              className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          
          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1">DATE OF BIRTH</label>
            <input 
              required
              type="date" 
              className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors text-white"
              style={{ colorScheme: 'dark' }}
              value={formData.dob}
              onChange={e => setFormData({...formData, dob: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1">PRIMARY SPORT</label>
            <input 
              required
              type="text" 
              className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors"
              value={formData.sport}
              onChange={e => setFormData({...formData, sport: e.target.value})}
            />
          </div>

          <div>
            <label className="block font-mono text-xs text-gray-400 mb-1">CLUB / TEAM (OPTIONAL)</label>
            <input 
              type="text" 
              className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors"
              value={formData.club}
              onChange={e => setFormData({...formData, club: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs text-gray-400 mb-1">COACH NAME</label>
              <input 
                type="text" 
                className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors"
                value={formData.coachName}
                onChange={e => setFormData({...formData, coachName: e.target.value})}
              />
            </div>
            <div>
              <label className="block font-mono text-xs text-gray-400 mb-1">PARENT NAME</label>
              <input 
                type="text" 
                className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors"
                value={formData.parentName}
                onChange={e => setFormData({...formData, parentName: e.target.value})}
              />
            </div>
          </div>

          {/* ── Coach invite code ── */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,.1)', paddingTop: 20, marginTop: 8 }}>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 10, letterSpacing: '.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: 14 }}>
              Have a Coach Invite Code?
            </div>
            <label style={{ display: 'block', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.45)', marginBottom: 6 }}>
              Enter Your Code (Optional)
            </label>
            <input
              type="text"
              maxLength={6}
              placeholder="e.g. PL4829"
              value={inviteCode}
              onChange={e => setInviteCode(e.target.value.toUpperCase())}
              style={{
                width: '100%', background: '#1E293B', border: '1.5px solid rgba(255,255,255,.12)',
                borderRadius: 6, padding: '12px 14px', color: '#fff',
                fontFamily: 'Space Mono, monospace', fontSize: 18, letterSpacing: '.2em',
                outline: 'none', minHeight: 48, boxSizing: 'border-box', textTransform: 'uppercase',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = GREEN; }}
              onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; }}
            />
            <div style={{ marginTop: 4, fontFamily: 'Space Mono, monospace', fontSize: 10, color: 'rgba(255,255,255,.3)', lineHeight: 1.45 }}>
              Your coach will have given you a 6-digit code. You can also enter it later from your dashboard.
            </div>

            {linkStatus === 'success' && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#10AC6E18', border: '1px solid #10AC6E40', borderRadius: 8, fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#10AC6E', fontWeight: 700 }}>
                {linkMsg}
              </div>
            )}
            {linkStatus === 'error' && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#FF493618', border: '1px solid #FF493640', borderRadius: 8, fontFamily: 'Space Mono, monospace', fontSize: 11, color: '#FF4936' }}>
                {linkMsg}
              </div>
            )}
          </div>

          <button 
            type="submit" 
            disabled={createProfile.isPending}
            className="w-full mt-8 bg-[#10AC6E] text-[#111111] font-heading text-2xl py-4 rounded-md uppercase hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {createProfile.isPending ? "Creating..." : "Begin Program"}
          </button>
        </form>
      </div>
    </div>
  );
}
