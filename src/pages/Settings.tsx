import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AdminAuthModal } from '../components/AdminAuthModal';
import { ShieldCheck, User, Settings as SettingsIcon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetBalanceAndArchive } from '../services/db';

export default function Settings() {
  const { activeMember, isAdminAuthenticated, setAdminAuthenticated, logoutFamily, familyName, familyId } = useAppStore();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTarget, setAuthTarget] = useState<'reset' | 'members' | null>(null);

  const requireAdmin = (target: 'reset' | 'members') => {
    if (isAdminAuthenticated) {
      executeAdminAction(target);
    } else {
      setAuthTarget(target);
      setShowAuthModal(true);
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    if (authTarget) {
      executeAdminAction(authTarget);
    }
  };

  const executeAdminAction = async (target: 'reset' | 'members') => {
    if (target === 'reset') {
      if (window.confirm('Are you sure you want to reset the home balance to zero? This action will generate a final report for this month and delete all current transactions.')) {
        if (!familyId) return;
        const res = await resetBalanceAndArchive(familyId);
        if (res.success) {
          alert('Balance has been reset successfully and the report is available in the Reports tab.');
        } else {
          alert(res.error || 'Failed to reset balance');
        }
      }
    } else if (target === 'members') {
      navigate('/manage-members');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">Settings</h2>

      <Card className="flex items-center p-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-3xl mr-4">
          {activeMember?.avatar}
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-800">{activeMember?.name || 'No member selected'}</h3>
          <p className="text-sm text-slate-500 font-medium">Family: {familyName}</p>
        </div>
      </Card>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider ml-1">App Preferences</h3>
        
        <Card className="divide-y divide-slate-100">
          <div className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors">
            <div className="flex items-center text-slate-700">
              <SettingsIcon size={20} className="mr-3 text-slate-400" />
              <span className="font-semibold">App Notifications</span>
            </div>
            <div className="w-11 h-6 bg-emerald-500 rounded-full border-2 border-transparent relative transition-colors cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute right-0 shadow-sm transition-transform"></div>
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider ml-1 flex items-center">
          <ShieldCheck size={16} className="mr-1" /> Admin Zone
        </h3>
        
        <Card className="divide-y divide-slate-100 border-rose-100">
          <div 
            className="py-3 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-colors"
            onClick={() => requireAdmin('members')}
          >
            <span className="font-semibold text-slate-700">Manage Family Members</span>
          </div>
          <div 
            className="py-3 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-colors"
            onClick={() => requireAdmin('reset')}
          >
            <span className="font-semibold text-rose-600">Reset Balance</span>
          </div>
          {isAdminAuthenticated && (
            <div className="py-3 flex justify-between items-center bg-emerald-50 mt-2 px-3 rounded-xl">
              <span className="text-sm text-emerald-700 font-semibold">Admin Mode Active</span>
              <Button size="sm" variant="outline" onClick={() => setAdminAuthenticated(false)}>Logout</Button>
            </div>
          )}
        </Card>
      </div>

      <div className="pt-8 pb-4">
        <Button 
          onClick={() => {
            if (window.confirm('Are you sure you want to sign out of this family vault?')) {
              logoutFamily();
              navigate('/login');
            }
          }}
          className="w-full h-14 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 shadow-none border-0 text-lg font-bold flex justify-center items-center gap-2"
        >
          <LogOut size={20} /> Sign Out of {familyName} Vault
        </Button>
      </div>

      <AdminAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
