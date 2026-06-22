import { useNavigate } from 'react-router-dom';
import { Member } from '../types';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { ShieldCheck, Users } from 'lucide-react';

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'Mom', avatar: '👩', role: 'Admin' },
  { id: '2', name: 'Dad', avatar: '👨', role: 'Admin' },
  { id: '3', name: 'Son', avatar: '🧑', role: 'Member' },
  { id: '4', name: 'Daughter', avatar: '👧', role: 'Member' }
];

export default function LaunchScreen() {
  const { setActiveMember, members, familyName } = useAppStore();
  const navigate = useNavigate();

  const handleSelectMember = (member: Member) => {
    setActiveMember(member);
    navigate('/dashboard');
  };

  const displayMembers = members;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-emerald-600 p-6">
      <div className="flex-1 flex flex-col items-center pt-16">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <Users size={40} className="text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">{familyName || 'Family'} Vault</h1>
        <p className="text-emerald-100 font-medium mb-12">Select your profile to continue.</p>

        <Card className="w-full bg-white/95 backdrop-blur shadow-2xl rounded-3xl p-6 border-0">
          <h2 className="text-xl font-bold text-slate-800 text-center mb-6">Who is using LedgerVault?</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {displayMembers.map((member) => (
              <button
                key={member.id}
                onClick={() => handleSelectMember(member)}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 hover:bg-emerald-50 border border-slate-100 transition-colors group relative"
              >
                {member.role === 'Admin' && (
                  <ShieldCheck size={14} className="absolute top-2 right-2 text-amber-500" />
                )}
                <span className="font-semibold text-slate-700 text-lg">{member.name}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{member.role}</span>
              </button>
            ))}
            {displayMembers.length === 0 && (
              <div className="col-span-2 text-center py-8 text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200">
                <p className="mb-4">No family members exist yet.</p>
                <p className="text-sm">Please log in to Settings with the Admin PIN '1225' to add members.</p>
                <button onClick={() => navigate('/settings')} className="mt-4 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-lg font-bold">Go to Settings</button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
