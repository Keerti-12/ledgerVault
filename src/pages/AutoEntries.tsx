import React, { useState, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Trash2, ArrowLeft, Clock, PlusCircle, Play, Pause } from 'lucide-react';
import { addRecurringTransaction, deleteRecurringTransaction, toggleRecurringTransaction, subscribeToRecurringTransactions } from '../services/db';
import { RecurringTransaction } from '../types';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils';

export default function AutoEntries() {
  const { members, familyId } = useAppStore();
  const navigate = useNavigate();

  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newType, setNewType] = useState<'Add' | 'Withdraw'>('Withdraw');
  const [newAmount, setNewAmount] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newCategory, setNewCategory] = useState('Groceries');
  const [newMemberId, setNewMemberId] = useState('');
  const [newFrequency, setNewFrequency] = useState<'Daily' | 'Weekly' | 'Monthly'>('Monthly');

  useEffect(() => {
    if (familyId) {
      const unsubscribe = subscribeToRecurringTransactions(familyId, (rtxs) => {
        setRecurringTransactions(rtxs);
      });
      return () => unsubscribe();
    }
  }, [familyId]);

  const handleAddAutoEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !newAmount || !newPurpose.trim() || !newMemberId) return;
    
    setIsSubmitting(true);
    const member = members.find(m => m.id === newMemberId);
    
    let nextDate = new Date();
    
    const success = await addRecurringTransaction(familyId, {
      memberId: newMemberId,
      memberName: member?.name || 'Unknown',
      transactionType: newType,
      amount: Number(newAmount),
      purpose: newPurpose.trim(),
      category: newCategory,
      frequency: newFrequency,
      nextRunDate: nextDate.getTime(),
      active: true
    });
    
    if (success) {
      setNewAmount('');
      setNewPurpose('');
    } else {
      alert('Failed to add auto entry.');
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (rtx: RecurringTransaction) => {
    if (!familyId) return;
    await toggleRecurringTransaction(familyId, rtx.id, !rtx.active);
  };

  const handleDelete = async (rtxId: string) => {
    if (!familyId) return;
    if (window.confirm(`Are you sure you want to permanently delete this auto entry?`)) {
      await deleteRecurringTransaction(familyId, rtxId);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Area */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-700 p-6 text-white shadow-xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
          <Clock size={120} />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <button 
            onClick={() => navigate('/settings')} 
            className="p-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full shadow-sm text-white transition-all transform hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1">Auto Entries</h2>
            <p className="text-indigo-50 font-medium opacity-90">Manage automatic recurring transactions.</p>
          </div>
        </div>
      </div>

      {/* Add Auto Entry Card */}
      <Card className="p-7 border border-slate-100 shadow-xl shadow-slate-200/40 bg-white relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 transition-all duration-300 group-hover:w-2"></div>
        
        <div className="relative z-10 mb-6">
          <h3 className="font-bold text-slate-800 text-xl tracking-tight mb-1 flex items-center gap-2">
            <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 shadow-sm border border-indigo-100"><PlusCircle size={20} /></div> 
            Create Auto Entry
          </h3>
          <p className="text-slate-500 text-sm font-medium ml-[44px]">Set it and forget it! E.g. Milk Daily (₹30)</p>
        </div>

        <form onSubmit={handleAddAutoEntry} className="flex flex-col gap-4 relative z-10 pl-[44px]">
          
          <div className="grid grid-cols-2 gap-4">
             <select 
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'Add' | 'Withdraw')}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-700"
            >
              <option value="Withdraw">Withdraw (-)</option>
              <option value="Add">Add (+)</option>
            </select>
            <input 
              type="number" 
              placeholder="Amount" 
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800 text-lg placeholder:text-slate-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <select 
              value={newMemberId}
              onChange={(e) => setNewMemberId(e.target.value)}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-700"
              required
            >
              <option value="" disabled>Select Member</option>
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
            
            <select 
              value={newFrequency}
              onChange={(e) => setNewFrequency(e.target.value as 'Daily' | 'Weekly' | 'Monthly')}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-700"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Purpose (e.g. Milk, Tuition)" 
              value={newPurpose}
              onChange={(e) => setNewPurpose(e.target.value)}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-800"
              required
            />
            
            <select 
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-14 px-4 rounded-xl border-2 border-slate-100 bg-slate-50 outline-none focus:border-indigo-500 font-bold text-slate-700"
            >
              <option value="Groceries">Groceries</option>
              <option value="Education">Education</option>
              <option value="Health">Health</option>
              <option value="Salary">Salary</option>
              <option value="Utilities">Utilities</option>
              <option value="Others">Others</option>
            </select>
          </div>

          <Button type="submit" disabled={isSubmitting || !newAmount || !newPurpose.trim() || !newMemberId} className="w-full h-14 mt-2 rounded-xl shadow-lg shadow-indigo-500/25 shrink-0 bg-indigo-600 hover:bg-indigo-700 transition-all text-lg font-black tracking-wide">
            CREATE AUTO ENTRY
          </Button>

        </form>
      </Card>

      {/* Current Entries List */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs ml-2 flex items-center gap-2">
          Active Schedules <span className="bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full">{recurringTransactions.length}</span>
        </h3>
        
        <div className="grid grid-cols-1 gap-4">
          {recurringTransactions.map(rtx => (
            <Card key={rtx.id} className={`group relative overflow-hidden p-5 border border-slate-100 shadow-sm transition-all duration-300 ${!rtx.active ? 'opacity-70 bg-slate-50' : ''}`}>
              <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${rtx.transactionType === 'Add' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-lg leading-tight">{rtx.purpose}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${rtx.transactionType === 'Add' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {rtx.transactionType === 'Add' ? '+' : '-'} {formatCurrency(rtx.amount)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-slate-500 flex items-center gap-2">
                    <span>{rtx.memberName}</span> • <span>{rtx.category}</span>
                  </div>
                  <div className="text-xs font-bold text-indigo-500 bg-indigo-50 inline-flex px-2 py-1 rounded-md mt-2">
                    Runs {rtx.frequency} (Next: {formatDate(rtx.nextRunDate)})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleToggle(rtx)}
                    className={`p-2 rounded-full shadow-sm flex items-center justify-center transition-all ${rtx.active ? 'bg-amber-100 text-amber-600 hover:bg-amber-200' : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'}`}
                    title={rtx.active ? "Pause Schedule" : "Resume Schedule"}
                  >
                    {rtx.active ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDelete(rtx.id)}
                    className="p-2 rounded-full bg-rose-50 text-rose-500 hover:bg-rose-100 shadow-sm transition-all flex items-center justify-center"
                    title="Delete Schedule"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </Card>
          ))}
          {recurringTransactions.length === 0 && (
            <div className="text-center py-10 text-slate-400 font-medium">
              No auto entries configured.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
