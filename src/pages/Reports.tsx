import { useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

export default function Reports() {
  const { transactions } = useAppStore();

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return transactions.filter(tx => !tx.deleted && tx.timestamp >= startOfMonth);
  }, [transactions]);

  // Calculations for charts
  const categoryData = useMemo(() => {
    const withdrawals = currentMonthTransactions.filter(tx => tx.transactionType === 'Withdraw');
    const categories: Record<string, number> = {};
    
    withdrawals.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });

    return Object.keys(categories)
      .map(key => ({ name: key, value: categories[key] }))
      .sort((a, b) => b.value - a.value);
  }, [currentMonthTransactions]);

  const memberSpendingData = useMemo(() => {
    const withdrawals = currentMonthTransactions.filter(tx => tx.transactionType === 'Withdraw');
    const spending: Record<string, number> = {};
    
    withdrawals.forEach(tx => {
      spending[tx.memberName] = (spending[tx.memberName] || 0) + tx.amount;
    });

    return Object.keys(spending)
      .map(key => ({ name: key, amount: spending[key] }))
      .sort((a, b) => b.amount - a.amount);
  }, [currentMonthTransactions]);

  const totalAdded = currentMonthTransactions
    .filter(tx => tx.transactionType === 'Add')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = currentMonthTransactions
    .filter(tx => tx.transactionType === 'Withdraw')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899', '#64748b'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">Monthly Reports</h2>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-emerald-50 border-emerald-100 p-4">
          <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Added This Month</p>
          <p className="text-xl font-bold text-emerald-700">{formatCurrency(totalAdded)}</p>
        </Card>
        <Card className="bg-rose-50 border-rose-100 p-4">
          <p className="text-xs font-semibold text-rose-600 uppercase mb-1">Spent This Month</p>
          <p className="text-xl font-bold text-rose-700">{formatCurrency(totalSpent)}</p>
        </Card>
      </div>

      <Card>
        <h3 className="font-bold text-slate-800 mb-4">Spending by Category</h3>
        {categoryData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No expenses this month</div>
        )}
        
        <div className="mt-4 space-y-2">
          {categoryData.map((cat, idx) => (
            <div key={cat.name} className="flex justify-between items-center text-sm">
              <div className="flex items-center">
                <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                <span className="text-slate-600">{cat.name}</span>
              </div>
              <span className="font-semibold text-slate-800">{formatCurrency(cat.value)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="font-bold text-slate-800 mb-4">Spending by Member</h3>
        {memberSpendingData.length > 0 ? (
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={memberSpendingData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(val) => `₹${val}`} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} formatter={(value: any) => formatCurrency(value)} />
                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
           <div className="h-32 flex items-center justify-center text-slate-400 text-sm">No expenses this month</div>
        )}
      </Card>
    </div>
  );
}
