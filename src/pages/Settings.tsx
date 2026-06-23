import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AdminAuthModal } from '../components/AdminAuthModal';
import { ShieldCheck, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { resetBalanceAndArchive, clearTransactionHistory, changeFamilyPin, changeAdminPasswordHash, getFamilySettingsRef } from '../services/db';
import { generateHash, verifyAdminPassword } from '../utils';
import { getDoc } from 'firebase/firestore';

export default function Settings() {
  const { activeMember, isAdminAuthenticated, setAdminAuthenticated, logoutFamily, familyName, familyId } = useAppStore();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authTarget, setAuthTarget] = useState<'reset' | 'members' | 'clear_history' | null>(null);

  const [changingPin, setChangingPin] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');

  const [changingAdminPass, setChangingAdminPass] = useState(false);
  const [oldAdminPass, setOldAdminPass] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');

  const handleAdminActionClick = (target: 'reset' | 'members' | 'clear_history') => {
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

  const executeAdminAction = async (target: 'reset' | 'members' | 'clear_history') => {
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
    } else if (target === 'clear_history') {
      if (window.confirm('WARNING: Are you sure you want to completely wipe the current transaction history? This will NOT generate a report. All current transactions will be lost forever.')) {
        if (!familyId) return;
        const res = await clearTransactionHistory(familyId);
        if (res.success) {
          alert('Transaction history cleared successfully.');
        } else {
          alert(res.error || 'Failed to clear history');
        }
      }
    } else if (target === 'members') {
      navigate('/manage-members');
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;
    if (!/^\d{4}$/.test(newPin)) {
      alert('New PIN must be exactly 4 digits');
      return;
    }
    const res = await changeFamilyPin(familyId, oldPin, newPin);
    if (res.success) {
      alert('Family PIN changed successfully!');
      setChangingPin(false);
      setOldPin('');
      setNewPin('');
    } else {
      alert(res.error || 'Failed to change PIN');
    }
  };

  const handleChangeAdminPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId) return;
    const settingsSnap = await getDoc(getFamilySettingsRef(familyId));
    let storedHash = '6ecf763ff6e7cef7b47e6611e1bf76fe2608a2e32a97b2d88b083ae1d8d02c82';
    if (settingsSnap.exists() && settingsSnap.data().adminPasswordHash) {
      storedHash = settingsSnap.data().adminPasswordHash;
    }
    
    const isValid = await verifyAdminPassword(oldAdminPass, storedHash);
    if (!isValid) {
      alert('Incorrect previous admin password');
      return;
    }
    
    const newHash = await generateHash(newAdminPass);
    const res = await changeAdminPasswordHash(familyId, newHash);
    if (res.success) {
      alert('Admin password changed successfully!');
      setChangingAdminPass(false);
      setOldAdminPass('');
      setNewAdminPass('');
    } else {
      alert(res.error || 'Failed to change password');
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
          {isAdminAuthenticated ? (
            <>
              <div className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleAdminActionClick('reset')}>
                <div className="flex items-center text-slate-700">
                  <ShieldCheck size={20} className="mr-3 text-rose-400" />
                  <span className="font-semibold text-rose-600">Reset Balance & Generate Report</span>
                </div>
              </div>
              <div className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => handleAdminActionClick('clear_history')}>
                <div className="flex items-center text-slate-700">
                  <Trash2 size={20} className="mr-3 text-rose-400" />
                  <span className="font-semibold text-rose-600">Clear Transaction History</span>
                </div>
              </div>
            </>
          ) : (
            <div className="py-4 text-center">
              <p className="text-slate-500 text-sm font-medium">Activate Admin Mode below to manage App Preferences.</p>
            </div>
          )}
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-rose-500 uppercase tracking-wider ml-1 flex items-center">
          <ShieldCheck size={16} className="mr-1" /> Admin Zone
        </h3>
        
        <Card className="divide-y divide-slate-100 border-rose-100">
          <div 
            className="py-3 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-colors"
            onClick={() => handleAdminActionClick('members')}
          >
            <span className="font-semibold text-slate-700">Manage Family Members</span>
          </div>
          {isAdminAuthenticated && (
            <div 
              className="py-3 flex justify-between items-center cursor-pointer hover:bg-rose-50 transition-colors border-t border-slate-100"
              onClick={() => navigate('/auto-entries')}
            >
              <span className="font-semibold text-slate-700">Manage Auto Entries</span>
            </div>
          )}
          {isAdminAuthenticated ? (
            <>
              <div className="py-3 flex justify-between items-center bg-emerald-50 mt-2 px-3 rounded-xl mb-2">
                <span className="text-sm text-emerald-700 font-semibold">Admin Mode Active</span>
                <Button size="sm" variant="outline" onClick={() => setAdminAuthenticated(false)}>Deactivate</Button>
              </div>
              <div className="divide-y divide-slate-100">
                <div className="py-3 px-1">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setChangingPin(!changingPin)}>
                    <span className="font-semibold text-slate-700">Change Family PIN</span>
                  </div>
                  {changingPin && (
                    <form onSubmit={handleChangePin} className="mt-3 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input type="password" placeholder="Old 4-Digit PIN" value={oldPin} onChange={(e) => setOldPin(e.target.value)} maxLength={4} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-emerald-500" required />
                      <input type="password" placeholder="New 4-Digit PIN" value={newPin} onChange={(e) => setNewPin(e.target.value)} maxLength={4} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-emerald-500" required />
                      <Button type="submit" variant="primary" size="sm" className="w-full">Update PIN</Button>
                    </form>
                  )}
                </div>
                <div className="py-3 px-1">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => setChangingAdminPass(!changingAdminPass)}>
                    <span className="font-semibold text-slate-700">Change Admin Password</span>
                  </div>
                  {changingAdminPass && (
                    <form onSubmit={handleChangeAdminPass} className="mt-3 space-y-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input type="password" placeholder="Old Admin Password" value={oldAdminPass} onChange={(e) => setOldAdminPass(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-emerald-500" required />
                      <input type="password" placeholder="New Admin Password" value={newAdminPass} onChange={(e) => setNewAdminPass(e.target.value)} className="w-full px-3 py-2 rounded-lg border outline-none focus:border-emerald-500" required />
                      <Button type="submit" variant="primary" size="sm" className="w-full">Update Password</Button>
                    </form>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div 
              className="py-3 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors px-1"
              onClick={() => { setAuthTarget(null); setShowAuthModal(true); }}
            >
              <span className="font-semibold text-slate-700">Enable Admin Mode</span>
              <Button size="sm" variant="outline">Activate</Button>
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
