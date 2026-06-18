import { useState } from "react";
import { useLocation } from "wouter";
import { useCreateAthleteProfile } from "@workspace/api-client-react";

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProfile.mutate(
      { data: formData },
      {
        onSuccess: () => setLocation("/")
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
              className="w-full bg-[#1E293B] border border-gray-800 rounded-md px-4 py-3 focus:outline-none focus:border-[#10AC6E] transition-colors text-white color-scheme-dark"
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
