import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Download } from 'lucide-react';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';

export default function Reports() {
  const { transactions, reports } = useAppStore();
  const [activeTab, setActiveTab] = useState<'current' | 'past'>('current');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports.length > 0 ? reports[0].id : null);

  const targetTransactions = useMemo(() => {
    if (activeTab === 'current') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return transactions.filter(tx => !tx.deleted && tx.timestamp >= startOfMonth);
    } else {
      const report = reports.find(r => r.id === selectedReportId);
      return report?.transactions || [];
    }
  }, [activeTab, selectedReportId, transactions, reports]);

  const reportMonthYear = useMemo(() => {
    if (activeTab === 'current') {
      return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    } else {
      return reports.find(r => r.id === selectedReportId)?.monthYear || 'Unknown';
    }
  }, [activeTab, selectedReportId, reports]);

  // Calculations for charts
  const categoryData = useMemo(() => {
    const withdrawals = targetTransactions.filter(tx => tx.transactionType === 'Withdraw');
    const categories: Record<string, number> = {};
    
    withdrawals.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });

    return Object.keys(categories)
      .map(key => ({ name: key, value: categories[key] }))
      .sort((a, b) => b.value - a.value);
  }, [targetTransactions]);

  const memberSpendingData = useMemo(() => {
    const withdrawals = targetTransactions.filter(tx => tx.transactionType === 'Withdraw');
    const spending: Record<string, number> = {};
    
    withdrawals.forEach(tx => {
      spending[tx.memberName] = (spending[tx.memberName] || 0) + tx.amount;
    });

    return Object.keys(spending)
      .map(key => ({ name: key, amount: spending[key] }))
      .sort((a, b) => b.amount - a.amount);
  }, [targetTransactions]);

  const totalAdded = targetTransactions
    .filter(tx => tx.transactionType === 'Add')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = targetTransactions
    .filter(tx => tx.transactionType === 'Withdraw')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const COLORS = ['#10b981', '#f59e0b', '#3b82f6', '#f43f5e', '#8b5cf6', '#ec4899', '#64748b'];

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.text(`Monthly Report - ${reportMonthYear}`, 14, 22);
    
    // Summary
    doc.setFontSize(12);
    doc.text(`Total Added: ${formatCurrency(totalAdded)}`, 14, 32);
    doc.text(`Total Spent: ${formatCurrency(totalSpent)}`, 14, 40);
    
    // Category Data
    doc.setFontSize(16);
    doc.text('Spending by Category', 14, 55);
    autoTable(doc, {
      startY: 60,
      head: [['Category', 'Amount']],
      body: categoryData.map(cat => [cat.name, formatCurrency(cat.value)]),
    });
    
    // Member Data
    let finalY = (doc as any).lastAutoTable.finalY || 60;
    doc.setFontSize(16);
    doc.text('Spending by Member', 14, finalY + 15);
    autoTable(doc, {
      startY: finalY + 20,
      head: [['Member', 'Amount']],
      body: memberSpendingData.map(member => [member.name, formatCurrency(member.amount)]),
    });
    
    // Detailed Transactions
    finalY = (doc as any).lastAutoTable.finalY || finalY + 20;
    doc.setFontSize(16);
    doc.text('Detailed Transactions', 14, finalY + 15);
    
    const tableData = targetTransactions.map(tx => [
      new Date(tx.timestamp).toLocaleDateString(),
      tx.transactionType,
      tx.memberName,
      tx.category,
      tx.notes || '-',
      formatCurrency(tx.amount)
    ]);

    autoTable(doc, {
      startY: finalY + 20,
      head: [['Date', 'Type', 'Member', 'Category', 'Description', 'Amount']],
      body: tableData,
    });
    
    doc.save(`GharCash_Report_${reportMonthYear.replace(' ', '_')}.pdf`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Reports</h2>
        <button
          onClick={downloadPDF}
          disabled={targetTransactions.length === 0}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl">
        <button
          onClick={() => setActiveTab('current')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'current' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Current Month
        </button>
        <button
          onClick={() => {
            setActiveTab('past');
            if (!selectedReportId && reports.length > 0) {
              setSelectedReportId(reports[0].id);
            }
          }}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'past' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Past Reports
        </button>
      </div>

      {activeTab === 'past' && reports.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Report Month</label>
          <select
            value={selectedReportId || ''}
            onChange={(e) => setSelectedReportId(e.target.value)}
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
          >
            {reports.map((r) => (
              <option key={r.id} value={r.id}>{r.monthYear}</option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'past' && reports.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 font-medium">No past reports available yet.</p>
        </div>
      )}

      {(activeTab === 'current' || (activeTab === 'past' && reports.length > 0)) && (
        <>
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
        </>
      )}
    </div>
  );
}
