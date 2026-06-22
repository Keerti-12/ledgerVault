import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAppStore } from '../store/useAppStore';
import { addTransaction } from '../services/db';
import { ArrowLeft, Wallet } from 'lucide-react';

export default function AddCash() {
  const navigate = useNavigate();
  const { activeMember, members, familyId } = useAppStore();
  
  const [selectedMemberId, setSelectedMemberId] = useState(activeMember?.id || (members.length > 0 ? members[0].id : ''));
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    if (!reason) return;
    const member = members.find(m => m.id === selectedMemberId);
    if (!member || !familyId) return;

    setLoading(true);

    const success = await addTransaction(familyId, {
      memberId: member.id,
      memberName: member.name,
      transactionType: 'Add',
      amount: Number(amount),
      purpose: reason,
      category: 'Income',
      notes: notes,
    });

    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      alert("Failed to add cash. Please try again.");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Add Cash</h2>
      </div>

      <Card>
        <div className="flex items-center justify-center w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full mb-6 mx-auto">
          <Wallet size={32} />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Who is adding cash?</label>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
              required
            >
              <option value="" disabled>Select family member</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>{m.avatar} {m.name}</option>
              ))}
            </select>
          </div>

          <Input 
            label="Amount (₹)"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            min="1"
            className="text-2xl font-bold tracking-wider"
          />
          
          <Input 
            label="Reason"
            type="text"
            placeholder="e.g. Salary, ATM Withdrawal"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />

          <Input 
            label="Notes (Optional)"
            type="text"
            placeholder="Any additional details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="pt-4">
            <Button type="submit" variant="primary" className="w-full" size="lg" isLoading={loading}>
              Add {amount ? `₹${amount}` : 'Cash'} to Vault
            </Button>
          </div>
        </form>
      </Card>
      
      <p className="text-center text-xs text-slate-400 font-medium mt-6">
        Added by: {activeMember?.name} {activeMember?.avatar}
      </p>
    </div>
  );
}
