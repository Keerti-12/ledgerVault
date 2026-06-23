import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';
import { formatCurrency } from '../utils';
import { Card } from '../components/Card';
import { PlusCircle, MinusCircle, ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { processRecurringTransactions } from '../services/db';

export default function Dashboard() {
  const navigate = useNavigate();
  const { wallet, transactions, activeMember, familyId } = useAppStore();

  useEffect(() => {
    if (!activeMember) {
      navigate('/select-member');
    }
  }, [activeMember, navigate]);

  useEffect(() => {
    if (familyId) {
      processRecurringTransactions(familyId)
        .then((res) => {
          if (res.skipped && res.skipped.length > 0) {
            alert(`Skipped auto entries due to insufficient balance: ${res.skipped.join(', ')}`);
          }
        })
        .catch(console.error);
    }
  }, [familyId]);

  const balance = wallet?.currentBalance || 0;
  const isLowBalance = wallet?.minimumThreshold && balance < wallet.minimumThreshold;

  // Calculate stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  
  // Calculate Start of Week (Sunday)
  const day = now.getDay();
  const diff = now.getDate() - day;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff).getTime();
  
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  let todayExpenses = 0;
  let weekExpenses = 0;
  let monthExpenses = 0;
  let todayTxCount = 0;

  transactions.forEach((tx) => {
    if (tx.deleted) return;
    
    if (tx.timestamp >= today) {
      todayTxCount++;
      if (tx.transactionType === 'Withdraw') todayExpenses += tx.amount;
    }
    
    if (tx.timestamp >= startOfWeek && tx.transactionType === 'Withdraw') {
      weekExpenses += tx.amount;
    }
    
    if (tx.timestamp >= startOfMonth && tx.transactionType === 'Withdraw') {
      monthExpenses += tx.amount;
    }
  });

  return (
    <div className="space-y-6">
      
      {/* Balance Card */}
      <Card className={`relative overflow-hidden text-white border-0 ${isLowBalance ? 'bg-amber-500' : 'bg-emerald-600'}`}>
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white opacity-10"></div>
        <div className="relative z-10">
          <p className="text-white/80 font-medium mb-1">Current Home Balance</p>
          <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(balance)}</h2>
          {isLowBalance && (
            <div className="mt-3 bg-white/20 px-3 py-1.5 rounded-lg inline-flex items-center text-sm font-semibold">
              <span className="mr-2">⚠️</span> Balance is below minimum threshold
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-3">
        <button 
          onClick={() => navigate('/add-cash')}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-emerald-200 hover:bg-emerald-50 transition-all group"
        >
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <PlusCircle size={20} />
          </div>
          <span className="font-semibold text-slate-800 text-[13px]">Add Cash</span>
        </button>

        <button 
          onClick={() => navigate('/withdraw-cash')}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-rose-200 hover:bg-rose-50 transition-all group"
        >
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <MinusCircle size={20} />
          </div>
          <span className="font-semibold text-slate-800 text-[13px]">Withdraw</span>
        </button>

        <button 
          onClick={() => navigate('/auto-entries')}
          className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-indigo-200 hover:bg-indigo-50 transition-all group"
        >
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Clock size={20} />
          </div>
          <span className="font-semibold text-slate-800 text-[13px]">Auto Entries</span>
        </button>
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3 ml-1">Spending Summary</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white/60">
            <p className="text-xs text-slate-500 font-medium mb-1">Today</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(todayExpenses)}</p>
          </Card>
          <Card className="p-4 bg-white/60">
            <p className="text-xs text-slate-500 font-medium mb-1">This Week</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(weekExpenses)}</p>
          </Card>
          <Card className="p-4 bg-white/60">
            <p className="text-xs text-slate-500 font-medium mb-1">This Month</p>
            <p className="text-lg font-bold text-slate-800">{formatCurrency(monthExpenses)}</p>
          </Card>
          <Card className="p-4 bg-white/60">
            <p className="text-xs text-slate-500 font-medium mb-1">Transactions Today</p>
            <p className="text-lg font-bold text-slate-800">{todayTxCount}</p>
          </Card>
        </div>
      </div>

      {/* Recent Transactions Preview */}
      <div>
        <div className="flex items-center justify-between mb-3 ml-1">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recent Activity</h3>
          <button onClick={() => navigate('/history')} className="text-sm text-emerald-600 font-semibold hover:underline">View All</button>
        </div>
        
        <div className="space-y-3">
          {transactions.filter(t => !t.deleted).slice(0, 3).map((tx) => (
            <Card key={tx.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.transactionType === 'Add' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {tx.transactionType === 'Add' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="font-semibold text-slate-800">{tx.purpose || tx.category}</p>
                  <p className="text-xs text-slate-500">By {tx.memberName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold ${tx.transactionType === 'Add' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {tx.transactionType === 'Add' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
              </div>
            </Card>
          ))}
          
          {transactions.length === 0 && (
            <div className="text-center py-6 text-slate-500 bg-white rounded-2xl border border-dashed border-slate-200">
              No recent transactions
            </div>
          )}
        </div>
      </div>
      
    </div>
  );
}
