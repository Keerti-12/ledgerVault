import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { loginFamily, registerFamily } from '../services/db';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { ShieldCheck, UserPlus, LogIn, KeySquare } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [familyName, setFamilyName] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setFamilySession } = useAppStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!familyName.trim()) {
      setError('Family Name is required');
      return;
    }

    if (!/^\d{4}$/.test(pin)) {
      setError('PIN must be exactly 4 digits');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const res = await loginFamily(familyName, pin);
      if (res.success && res.familyId) {
        setFamilySession(res.familyId, familyName.trim());
        navigate('/dashboard');
      } else {
        setError(res.error || 'Login failed');
      }
    } else {
      const res = await registerFamily(familyName, pin);
      if (res.success && res.familyId) {
        setFamilySession(res.familyId, familyName.trim());
        navigate('/dashboard');
      } else {
        setError(res.error || 'Registration failed');
      }
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 sm:p-12">
      <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center mb-8">
          <img src="/logo.png" alt="GharCash Logo" className="w-24 h-24 mx-auto mb-4 object-contain drop-shadow-md" />
          <h1 className="text-4xl font-black text-slate-800 tracking-tight">GharCash</h1>
          <p className="text-slate-500 font-medium mt-2">Secure Family Finance Tracker</p>
        </div>

        <Card className="p-8 shadow-xl shadow-emerald-500/10 border-0 bg-white/90 backdrop-blur-xl rounded-[2rem]">
          
          <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
            <button 
              onClick={() => { setIsLogin(true); setError(''); setPin(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LogIn size={16} /> Login
            </button>
            <button 
              onClick={() => { setIsLogin(false); setError(''); setPin(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold rounded-lg transition-all ${!isLogin ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <UserPlus size={16} /> Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Family Name</label>
              <input 
                type="text" 
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                placeholder="e.g. SmithHousehold"
                className="w-full h-14 px-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-medium text-slate-800"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Home PIN (4 Digits)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <KeySquare size={20} />
                </div>
                <input 
                  type="password"
                  inputMode="numeric"
                  pattern="\d{4}"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="• • • •"
                  className="w-full h-14 pl-12 pr-4 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all font-bold text-slate-800 text-xl tracking-widest placeholder:text-base placeholder:font-medium placeholder:tracking-normal"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-600 rounded-xl text-sm font-bold text-center animate-in fade-in zoom-in-95">
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              disabled={loading || !familyName || pin.length !== 4} 
              className="w-full h-14 text-lg rounded-xl shadow-lg shadow-emerald-500/20 mt-2"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isLogin ? 'Access Vault' : 'Create Vault'}
            </Button>
            
          </form>
        </Card>
        
        <p className="text-center text-slate-400 text-sm mt-8 font-medium">
          Your family's data is completely isolated and secure.
        </p>

      </div>
    </div>
  );
}
