import { useMemo, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';
import { formatCurrency } from '../utils';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Download, Trash2 } from 'lucide-react';
// @ts-ignore
import jsPDF from 'jspdf';
// @ts-ignore
import autoTable from 'jspdf-autotable';
import { AdminAuthModal } from '../components/AdminAuthModal';
import { deleteReport } from '../services/db';

export default function Reports() {
  const { transactions, reports, familyId, isAdminAuthenticated } = useAppStore();
  const [activeTab, setActiveTab] = useState<'current' | 'past' | 'custom'>('current');
  const [selectedReportId, setSelectedReportId] = useState<string | null>(reports.length > 0 ? reports[0].id : null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const targetTransactions = useMemo(() => {
    if (activeTab === 'current') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return transactions.filter(tx => !tx.deleted && tx.timestamp >= startOfMonth);
    } else if (activeTab === 'custom') {
      if (!customStartDate || !customEndDate) return [];
      const start = new Date(customStartDate).getTime();
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      return transactions.filter(tx => !tx.deleted && tx.timestamp >= start && tx.timestamp <= endTime);
    } else {
      const report = reports.find(r => r.id === selectedReportId);
      return report?.transactions || [];
    }
  }, [activeTab, selectedReportId, transactions, reports, customStartDate, customEndDate]);

  const reportMonthYear = useMemo(() => {
    if (activeTab === 'current') {
      return new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
    } else if (activeTab === 'custom') {
      if (!customStartDate || !customEndDate) return 'Custom Range';
      return `${customStartDate} to ${customEndDate}`;
    } else {
      return reports.find(r => r.id === selectedReportId)?.monthYear || 'Unknown';
    }
  }, [activeTab, selectedReportId, reports, customStartDate, customEndDate]);

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

  const downloadPDF = async () => {
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
    
    const fileName = `GharCash_Report_${reportMonthYear.replace(/ /g, '_')}.pdf`;
    
    // Attempt to use Web Share API for mobile devices
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent) && navigator.canShare) {
      try {
        const pdfBlob = doc.output('blob');
        const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'GharCash Report',
            text: 'Here is the monthly report from GharCash.'
          });
          return;
        }
      } catch (error) {
        console.log("Error sharing:", error);
      }
    }
    
    // Fallback to standard save for desktop or if share fails
    doc.save(fileName);
  };

  const handleDeleteReport = () => {
    if (isAdminAuthenticated) {
      executeDelete();
    } else {
      setShowAuthModal(true);
    }
  };

  const executeDelete = async () => {
    if (!selectedReportId || !familyId) return;
    if (window.confirm('Are you sure you want to permanently delete this report? This action cannot be undone.')) {
      const res = await deleteReport(familyId, selectedReportId);
      if (res.success) {
        const remaining = reports.filter(r => r.id !== selectedReportId);
        if (remaining.length > 0) {
          setSelectedReportId(remaining[0].id);
        } else {
          setSelectedReportId(null);
        }
        alert('Report deleted successfully.');
      } else {
        alert(res.error || 'Failed to delete report.');
      }
    }
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    executeDelete();
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
        <button
          onClick={() => setActiveTab('custom')}
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${
            activeTab === 'custom' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Custom
        </button>
      </div>

      {activeTab === 'custom' && (
        <div className="mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <label className="block text-sm font-medium text-slate-700 mb-3">Select Date Range</label>
          <div className="flex gap-4">
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1">Start Date</span>
              <input
                type="date"
                value={customStartDate}
                max={customEndDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 text-slate-600"
              />
            </div>
            <div className="flex-1">
              <span className="text-xs text-slate-500 block mb-1">End Date</span>
              <input
                type="date"
                value={customEndDate}
                min={customStartDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200 text-slate-600"
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'past' && reports.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Select Report Month</label>
          <div className="flex gap-2">
            <select
              value={selectedReportId || ''}
              onChange={(e) => setSelectedReportId(e.target.value)}
              className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all duration-200"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.monthYear}</option>
              ))}
            </select>
            <button 
              onClick={handleDeleteReport}
              className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors flex items-center justify-center border border-rose-100 shadow-sm"
              title="Delete Report"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'past' && reports.length === 0 && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center">
          <p className="text-slate-500 font-medium">No past reports available yet.</p>
        </div>
      )}

      {(activeTab === 'current' || (activeTab === 'past' && reports.length > 0) || (activeTab === 'custom' && customStartDate && customEndDate)) && (
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

      <AdminAuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onSuccess={handleAuthSuccess} 
      />
    </div>
  );
}
