import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';

import { formatCurrency, formatDate, formatTime } from '../utils';
import { Search, Filter, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export default function History() {
  const { transactions } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Add' | 'Withdraw'>('All');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(tx => !tx.deleted)
      .filter(tx => {
        if (filterType !== 'All' && tx.transactionType !== filterType) return false;
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          return (
            tx.purpose.toLowerCase().includes(lowerTerm) ||
            tx.memberName.toLowerCase().includes(lowerTerm) ||
            tx.category.toLowerCase().includes(lowerTerm)
          );
        }
        return true;
      });
  }, [transactions, searchTerm, filterType]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">Transaction History</h2>

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Search by purpose, member, or category..."
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
          <Filter size={18} className="text-slate-400 mr-1" />
          <FilterButton active={filterType === 'All'} onClick={() => setFilterType('All')}>All</FilterButton>
          <FilterButton active={filterType === 'Add'} onClick={() => setFilterType('Add')}>Added</FilterButton>
          <FilterButton active={filterType === 'Withdraw'} onClick={() => setFilterType('Withdraw')}>Withdrawn</FilterButton>
        </div>
      </div>

      <div className="space-y-4">
        {filteredTransactions.map((tx) => (
          <Card key={tx.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.transactionType === 'Add' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                  {tx.transactionType === 'Add' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{tx.purpose}</h3>
                  <p className="text-xs text-slate-500">{tx.category} • By {tx.memberName}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-lg leading-tight ${tx.transactionType === 'Add' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {tx.transactionType === 'Add' ? '+' : '-'}{formatCurrency(tx.amount)}
                </p>
                <p className="text-xs text-slate-500">{formatTime(tx.timestamp)}</p>
              </div>
            </div>
            
            <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
              <span>{formatDate(tx.timestamp)}</span>
              <span>Bal: {formatCurrency(tx.balanceAfterTransaction)}</span>
            </div>
          </Card>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Search size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-700">No transactions found</h3>
            <p className="text-slate-500 text-sm">Try adjusting your filters or search term.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const FilterButton = ({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) => (
  <button
    onClick={onClick}
    className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors whitespace-nowrap border ${
      active 
        ? 'bg-slate-800 text-white border-slate-800' 
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
    }`}
  >
    {children}
  </button>
);
