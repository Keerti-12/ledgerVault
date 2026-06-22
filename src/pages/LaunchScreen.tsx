import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { Member } from '../types';
import { subscribeToMembers } from '../services/db';
import { Card } from '../components/Card';
import { ShieldCheck } from 'lucide-react';

const DEFAULT_MEMBERS: Member[] = [
  { id: '1', name: 'Mom', avatar: '👩', role: 'Admin' },
  { id: '2', name: 'Dad', avatar: '👨', role: 'Admin' },
  { id: '3', name: 'Son', avatar: '🧑', role: 'Member' },
  { id: '4', name: 'Daughter', avatar: '👧', role: 'Member' }
];

export default function LaunchScreen() {
  const { setActiveMember, members, setMembers } = useAppStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, listen to Firestore. For demo we initialize with defaults if empty
    const unsubscribe = subscribeToMembers((data) => {
      if (data.length > 0) {
        setMembers(data);
      } else {
        setMembers(DEFAULT_MEMBERS); // Fallback for when db is empty
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setMembers]);

  const handleSelectMember = (member: Member) => {
    setActiveMember(member);
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full border-4 border-emerald-500 border-t-transparent h-12 w-12" />
      </div>
    );
  }

  const displayMembers = members.length > 0 ? members : DEFAULT_MEMBERS;

  return (
    <div className="flex flex-col min-h-screen max-w-md mx-auto bg-emerald-600 p-6">
      <div className="flex-1 flex flex-col items-center pt-16">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-lg rotate-3">
          <span className="text-4xl font-bold text-emerald-600">₹</span>
        </div>
        <h1 className="text-3xl font-bold text-white text-center mb-2">LedgerVault</h1>
        <p className="text-emerald-100 font-medium mb-12">Every Rupee Accounted For.</p>

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
                <span className="text-4xl mb-2 group-hover:scale-110 transition-transform">{member.avatar}</span>
                <span className="font-semibold text-slate-700">{member.name}</span>
                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">{member.role}</span>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
