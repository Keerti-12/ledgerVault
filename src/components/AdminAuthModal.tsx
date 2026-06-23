import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { ShieldAlert } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { verifyAdminPassword } from '../utils';
import { getAdminPasswordHash } from '../services/db';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAdminAuthenticated, familyId } = useAppStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let storedHash = '';
      if (familyId) {
        storedHash = await getAdminPasswordHash(familyId);
      }
      
      if (!storedHash) {
        // Fallback or initialization handling
        // For this task, "1225" is the default. Its SHA-256 hash is:
        // 6ecf763ff6e7cef7b47e6611e1bf76fe2608a2e32a97b2d88b083ae1d8d02c82
        storedHash = '6ecf763ff6e7cef7b47e6611e1bf76fe2608a2e32a97b2d88b083ae1d8d02c82';
      }

      const isValid = await verifyAdminPassword(password, storedHash);

      if (isValid) {
        setAdminAuthenticated(true);
        setPassword('');
        onSuccess();
      } else {
        setError('Incorrect password');
      }
    } catch (err) {
      console.error(err);
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
      <Card className="w-full max-w-sm animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Admin Authentication Required</h2>
          <p className="text-sm text-slate-500 text-center mt-1">
            Please enter the admin password to continue with this sensitive operation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              placeholder="Enter Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all text-center text-lg tracking-widest"
              autoFocus
            />
            {error && <p className="text-rose-500 text-sm mt-2 text-center font-medium">{error}</p>}
          </div>

          <div className="flex space-x-3 mt-6">
            <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="flex-1" isLoading={loading}>
              Verify
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
