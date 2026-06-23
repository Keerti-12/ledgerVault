import React, { useState, useMemo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { Card } from '../components/Card';

import { formatCurrency, formatDate, formatTime } from '../utils';
import { Search, Filter, ArrowDownRight, ArrowUpRight, Trash2, Edit3, X, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { deleteTransaction, editTransaction } from '../services/db';

export default function History() {
  const { transactions, isAdminAuthenticated, familyId } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'All' | 'Add' | 'Withdraw'>('All');
  
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');
  const [editPurpose, setEditPurpose] = useState<string>('');

  const handleDelete = async (id: string) => {
    if (!familyId) return;
    if (window.confirm('Are you sure you want to delete this transaction? The wallet balance will be automatically adjusted.')) {
      await deleteTransaction(familyId, id);
    }
  };

  const handleEditClick = (tx: any) => {
    setEditingTxId(tx.id);
    setEditAmount(tx.amount.toString());
    setEditPurpose(tx.purpose);
  };

  const handleEditSubmit = async (txId: string) => {
    if (!familyId) return;
    const amountNum = parseInt(editAmount);
    if (!amountNum || amountNum <= 0 || !editPurpose.trim()) return;
    
    await editTransaction(familyId, txId, {
      amount: amountNum,
      purpose: editPurpose.trim()
    });
    setEditingTxId(null);
  };

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
            {editingTxId === tx.id ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-slate-700 text-sm flex items-center gap-1"><Edit3 size={16} /> Edit Transaction</h3>
                  <button onClick={() => setEditingTxId(null)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                </div>
                <input 
                  type="text" 
                  value={editPurpose} 
                  onChange={(e) => setEditPurpose(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-400"
                  placeholder="Purpose"
                />
                <input 
                  type="number" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-emerald-400"
                  placeholder="Amount"
                />
                <button 
                  onClick={() => handleEditSubmit(tx.id!)}
                  disabled={!editAmount || !editPurpose.trim()}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Check size={18} /> Save Changes
                </button>
              </div>
            ) : (
              <>
                <div 
                  className={`flex justify-between items-start mb-3 ${tx.editHistory?.length ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={() => {
                    if (tx.editHistory?.length) {
                      setExpandedTxId(expandedTxId === tx.id ? null : tx.id);
                    }
                  }}
                >
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
                    <p className="text-xs text-slate-500 flex justify-end gap-1 items-center">
                      {tx.edited && <span className="text-[10px] bg-slate-100 px-1 rounded text-slate-400">Edited</span>}
                      {formatTime(tx.timestamp)}
                      {tx.editHistory?.length ? (
                        expandedTxId === tx.id ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />
                      ) : null}
                    </p>
                  </div>
                </div>
                
                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
                  <span>{formatDate(tx.timestamp)}</span>
                  <div className="flex items-center gap-3">
                    {isAdminAuthenticated && (
                      <div className="flex items-center gap-1 border-r border-slate-200 pr-3">
                        <button onClick={() => handleEditClick(tx)} className="p-1 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded transition-colors">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => handleDelete(tx.id!)} className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                    <span>Bal: {formatCurrency(tx.balanceAfterTransaction)}</span>
                  </div>
                </div>

                {expandedTxId === tx.id && tx.editHistory && tx.editHistory.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 bg-slate-50 rounded-lg p-3 animate-in slide-in-from-top-2 duration-200">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Edit History (Previous Values)</p>
                    {[...tx.editHistory].reverse().map((edit, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs text-slate-500 border-b border-slate-200/50 last:border-0 pb-2 last:pb-0">
                        <span className="truncate max-w-[120px]">{edit.oldPurpose}</span>
                        <div className="flex gap-3 items-center">
                          <span className={tx.transactionType === 'Add' ? 'text-emerald-600/80 font-medium' : 'text-slate-600 font-medium'}>
                            {tx.transactionType === 'Add' ? '+' : '-'}{formatCurrency(edit.oldAmount)}
                          </span>
                          <span className="text-[10px]">{formatDate(edit.editedAt)} {formatTime(edit.editedAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
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
