import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAppStore } from '../store/useAppStore';
import { addTransaction } from '../services/db';
import { ArrowLeft, ShoppingCart, Droplet, Pill, Fuel, Home, Smartphone, BookOpen, MoreHorizontal } from 'lucide-react';
import { cn } from '../components/Button';

const CATEGORIES = [
  { id: 'Grocery', label: 'Grocery', icon: <ShoppingCart size={20} />, color: 'bg-orange-100 text-orange-600' },
  { id: 'Milk', label: 'Milk', icon: <Droplet size={20} />, color: 'bg-blue-100 text-blue-600' },
  { id: 'Medicine', label: 'Medicine', icon: <Pill size={20} />, color: 'bg-rose-100 text-rose-600' },
  { id: 'Petrol', label: 'Petrol', icon: <Fuel size={20} />, color: 'bg-slate-200 text-slate-700' },
  { id: 'Household', label: 'Household', icon: <Home size={20} />, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'Recharge', label: 'Recharge', icon: <Smartphone size={20} />, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'Education', label: 'Education', icon: <BookOpen size={20} />, color: 'bg-purple-100 text-purple-600' },
  { id: 'Other', label: 'Other', icon: <MoreHorizontal size={20} />, color: 'bg-slate-100 text-slate-500' },
];

export default function WithdrawCash() {
  const navigate = useNavigate();
  const { activeMember, wallet, members } = useAppStore();
  
  const [selectedMemberId, setSelectedMemberId] = useState(activeMember?.id || (members.length > 0 ? members[0].id : ''));
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [purpose, setPurpose] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    if (!purpose) return;
    
    const member = members.find(m => m.id === selectedMemberId);
    if (!member) return;

    if (wallet && Number(amount) > wallet.currentBalance) {
      if (!window.confirm("Amount exceeds current balance! Are you sure you want to withdraw?")) {
        return;
      }
    }

    setLoading(true);

    const success = await addTransaction({
      memberId: member.id,
      memberName: member.name,
      transactionType: 'Withdraw',
      amount: Number(amount),
      purpose: purpose,
      category: category,
      notes: notes,
    });

    setLoading(false);
    if (success) {
      navigate('/dashboard');
    } else {
      alert("Failed to withdraw cash. Please try again.");
    }
  };

  const handleQuickSelect = (catId: string, defaultPurpose: string) => {
    setCategory(catId);
    if (!purpose) setPurpose(defaultPurpose);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center space-x-3">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full text-slate-600 hover:bg-slate-100 shadow-sm border border-slate-100">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-bold text-slate-800">Withdraw Cash</h2>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-700">Who is withdrawing cash?</label>
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
            className="text-2xl font-bold tracking-wider text-rose-600"
          />
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 ml-1 mb-2">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleQuickSelect(cat.id, cat.label)}
                  className={cn(
                    "flex flex-col items-center justify-center p-2 rounded-xl border transition-all",
                    category === cat.id ? "border-rose-500 bg-rose-50 shadow-sm" : "border-slate-100 bg-white hover:bg-slate-50"
                  )}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-1 ${category === cat.id ? cat.color : 'bg-slate-100 text-slate-500'}`}>
                    {cat.icon}
                  </div>
                  <span className={`text-[10px] font-semibold ${category === cat.id ? 'text-rose-700' : 'text-slate-500'}`}>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Input 
            label="Purpose"
            type="text"
            placeholder="e.g. Weekly Vegetables"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
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
            <Button type="submit" variant="danger" className="w-full" size="lg" isLoading={loading}>
              Withdraw {amount ? `₹${amount}` : 'Cash'}
            </Button>
          </div>
        </form>
      </Card>
      
      <p className="text-center text-xs text-slate-400 font-medium mt-6">
        Taken by: {activeMember?.name} {activeMember?.avatar}
      </p>
    </div>
  );
}
