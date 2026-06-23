import { supabase } from './supabase';
import { Transaction, Wallet, Member, Report, RecurringTransaction } from '../types';

// ==========================================
// AUTHENTICATION
// ==========================================

export const registerFamily = async (adminName: string, pin: string) => {
  try {
    if (!/^\d{4}$/.test(pin)) return { success: false, error: 'PIN must be exactly 4 digits' };
    
    // Check if family name exists
    const { data: existing } = await supabase
      .from('families')
      .select('id')
      .eq('admin_name', adminName.trim());
      
    if (existing && existing.length > 0) {
      return { success: false, error: 'Family name already taken. Please choose another.' };
    }
    
    // Create new family
    const { data: family, error } = await supabase
      .from('families')
      .insert({
        admin_name: adminName.trim(),
        pin,
        created_at: Date.now()
      })
      .select('id')
      .single();
      
    if (error) throw error;
    
    // Create initial wallet
    await supabase
      .from('wallet')
      .insert({
        family_id: family.id,
        current_balance: 0,
        minimum_threshold: 0,
        last_updated: Date.now()
      });
      
    // Create initial settings
    await supabase
      .from('settings')
      .insert({
        family_id: family.id,
        admin_password_hash: ''
      });
    
    return { success: true, familyId: family.id };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: e.message || 'Registration failed.' };
  }
};

export const loginFamily = async (adminName: string, pin: string) => {
  try {
    const { data: family, error } = await supabase
      .from('families')
      .select('id')
      .eq('admin_name', adminName.trim())
      .eq('pin', pin)
      .single();
      
    if (error || !family) return { success: false, error: 'Invalid Family Name or PIN' };
    
    return { success: true, familyId: family.id };
  } catch (e: any) {
    console.error(e);
    return { success: false, error: 'Login failed.' };
  }
};

// ==========================================
// SUBSCRIPTIONS
// ==========================================

export const subscribeToWallet = (familyId: string, callback: (wallet: Wallet | null) => void) => {
  const fetchWallet = async () => {
    const { data } = await supabase.from('wallet').select('*').eq('family_id', familyId).single();
    if (data) {
      callback({
        currentBalance: data.current_balance,
        minimumThreshold: data.minimum_threshold,
        lastUpdated: data.last_updated
      });
    } else {
      callback(null);
    }
  };
  
  fetchWallet();
  
  const channel = supabase.channel(`wallet_${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'wallet', filter: `family_id=eq.${familyId}` }, fetchWallet)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToTransactions = (familyId: string, callback: (transactions: Transaction[]) => void) => {
  const fetchTx = async () => {
    const { data } = await supabase.from('transactions').select('*').eq('family_id', familyId).order('timestamp', { ascending: false });
    if (data) {
      callback(data.map(d => ({
        id: d.id,
        memberId: d.member_id,
        memberName: d.member_name,
        transactionType: d.transaction_type,
        amount: d.amount,
        purpose: d.purpose,
        category: d.category,
        notes: d.notes,
        balanceAfterTransaction: d.balance_after_transaction,
        timestamp: d.timestamp,
        edited: d.edited,
        deleted: d.deleted,
        editHistory: d.edit_history || []
      })));
    }
  };
  
  fetchTx();
  
  const channel = supabase.channel(`transactions_${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `family_id=eq.${familyId}` }, fetchTx)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToMembers = (familyId: string, callback: (members: Member[]) => void) => {
  const fetchMembers = async () => {
    const { data } = await supabase.from('members').select('*').eq('family_id', familyId);
    if (data) {
      callback(data.map(d => ({
        id: d.id,
        name: d.name,
        avatar: d.avatar,
        role: d.role as any
      })));
    }
  };
  
  fetchMembers();
  
  const channel = supabase.channel(`members_${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'members', filter: `family_id=eq.${familyId}` }, fetchMembers)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToReports = (familyId: string, callback: (reports: Report[]) => void) => {
  const fetchReports = async () => {
    const { data } = await supabase.from('reports').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
    if (data) {
      callback(data.map(d => ({
        id: d.id,
        monthYear: d.month_year,
        totalAdded: d.total_added,
        totalSpent: d.total_spent,
        transactions: d.transactions || [],
        createdAt: d.created_at
      })));
    }
  };
  
  fetchReports();
  
  const channel = supabase.channel(`reports_${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `family_id=eq.${familyId}` }, fetchReports)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

export const subscribeToRecurringTransactions = (familyId: string, callback: (rtxs: RecurringTransaction[]) => void) => {
  const fetchRtx = async () => {
    const { data } = await supabase.from('recurring_transactions').select('*').eq('family_id', familyId).order('created_at', { ascending: false });
    if (data) {
      callback(data.map(d => ({
        id: d.id,
        memberId: d.member_id,
        memberName: d.member_name,
        transactionType: d.transaction_type,
        amount: d.amount,
        purpose: d.purpose,
        category: d.category,
        frequency: d.frequency as any,
        nextRunDate: d.next_run_date,
        active: d.active,
        createdAt: d.created_at
      })));
    }
  };
  
  fetchRtx();
  
  const channel = supabase.channel(`rtx_${familyId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'recurring_transactions', filter: `family_id=eq.${familyId}` }, fetchRtx)
    .subscribe();
    
  return () => { supabase.removeChannel(channel); };
};

// ==========================================
// OPERATIONS
// ==========================================

export const addTransaction = async (familyId: string, txData: Omit<Transaction, 'id' | 'balanceAfterTransaction' | 'timestamp' | 'edited' | 'deleted'>) => {
  try {
    // In PostgreSQL, to ensure atomic updates across tables, we should normally use an RPC function.
    // For simplicity in this migration without full custom RPC setup, we'll do sequential updates 
    // and rely on RLS/optimistic locking if needed, though RPC is better for production.
    
    // Fetch current wallet
    const { data: wallet, error: wErr } = await supabase.from('wallet').select('current_balance').eq('family_id', familyId).single();
    if (wErr || !wallet) throw new Error("Wallet not found");
    
    let currentBalance = wallet.current_balance;
    if (txData.transactionType === 'Add') {
      currentBalance += txData.amount;
    } else {
      currentBalance -= txData.amount;
    }
    
    const now = Date.now();
    
    // Insert transaction
    const { error: tErr } = await supabase.from('transactions').insert({
      family_id: familyId,
      member_id: txData.memberId,
      member_name: txData.memberName,
      transaction_type: txData.transactionType,
      amount: txData.amount,
      purpose: txData.purpose,
      category: txData.category,
      notes: txData.notes,
      balance_after_transaction: currentBalance,
      timestamp: now,
      edited: false,
      deleted: false
    });
    if (tErr) throw tErr;
    
    // Update wallet
    const { error: uwErr } = await supabase.from('wallet').update({
      current_balance: currentBalance,
      last_updated: now
    }).eq('family_id', familyId);
    if (uwErr) throw uwErr;
    
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    return false;
  }
};

export const addMember = async (familyId: string, memberData: Omit<Member, 'id'>) => {
  try {
    const { error } = await supabase.from('members').insert({
      family_id: familyId,
      name: memberData.name,
      avatar: memberData.avatar,
      role: memberData.role
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error adding member: ", e);
    return false;
  }
};

export const deleteMember = async (familyId: string, memberId: string) => {
  try {
    const { error } = await supabase.from('members').delete().eq('id', memberId).eq('family_id', familyId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error deleting member: ", e);
    return false;
  }
};

export const editMember = async (familyId: string, memberId: string, memberData: Partial<Omit<Member, 'id'>>) => {
  try {
    const { error } = await supabase.from('members').update({
      name: memberData.name,
      avatar: memberData.avatar,
      role: memberData.role
    }).eq('id', memberId).eq('family_id', familyId);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error editing member: ", e);
    return false;
  }
};

export const deleteTransaction = async (familyId: string, transactionId: string) => {
  try {
    const { data: tx, error: tErr } = await supabase.from('transactions').select('*').eq('id', transactionId).eq('family_id', familyId).single();
    if (tErr || !tx) throw new Error("Transaction does not exist!");
    if (tx.deleted) throw new Error("Already deleted!");

    const { data: wallet, error: wErr } = await supabase.from('wallet').select('current_balance').eq('family_id', familyId).single();
    if (wErr || !wallet) throw new Error("Wallet missing!");
    
    let currentBalance = wallet.current_balance;
    if (tx.transaction_type === 'Add') {
      currentBalance -= tx.amount;
    } else {
      currentBalance += tx.amount;
    }
    
    await supabase.from('wallet').update({
      current_balance: currentBalance,
      last_updated: Date.now()
    }).eq('family_id', familyId);
    
    await supabase.from('transactions').delete().eq('id', transactionId);
    
    return true;
  } catch (error) {
    console.error("Delete transaction failed: ", error);
    return false;
  }
};

export const editTransaction = async (familyId: string, transactionId: string, updatedData: Partial<Transaction>) => {
  try {
    const { data: tx, error: tErr } = await supabase.from('transactions').select('*').eq('id', transactionId).eq('family_id', familyId).single();
    if (tErr || !tx) throw new Error("Transaction does not exist!");
    if (tx.deleted) throw new Error("Cannot edit deleted transaction!");

    const { data: wallet, error: wErr } = await supabase.from('wallet').select('current_balance').eq('family_id', familyId).single();
    if (wErr || !wallet) throw new Error("Wallet missing!");
    
    let currentBalance = wallet.current_balance;
    if (tx.transaction_type === 'Add') {
      currentBalance -= tx.amount;
    } else {
      currentBalance += tx.amount;
    }
    
    const newType = updatedData.transactionType || tx.transaction_type;
    const newAmount = updatedData.amount !== undefined ? updatedData.amount : tx.amount;
    
    if (newType === 'Add') {
      currentBalance += newAmount;
    } else {
      currentBalance -= newAmount;
    }
    
    if (currentBalance < 0) {
      throw new Error("Insufficient balance to modify this transaction!");
    }
    
    await supabase.from('wallet').update({
      current_balance: currentBalance,
      last_updated: Date.now()
    }).eq('family_id', familyId);
    
    const newHistory = [...(tx.edit_history || [])];
    newHistory.push({
      oldAmount: tx.amount,
      oldPurpose: tx.purpose,
      oldCategory: tx.category,
      editedAt: Date.now()
    });
    
    await supabase.from('transactions').update({
      amount: newAmount,
      purpose: updatedData.purpose || tx.purpose,
      category: updatedData.category || tx.category,
      transaction_type: newType,
      edited: true,
      edit_history: newHistory,
      balance_after_transaction: currentBalance
    }).eq('id', transactionId);
    
    return { success: true };
  } catch (error: any) {
    console.error("Edit transaction failed: ", error);
    return { success: false, error: error.message || "Failed to edit transaction" };
  }
};

export const resetBalanceAndArchive = async (familyId: string) => {
  try {
    const { data: txs, error: tErr } = await supabase.from('transactions').select('*').eq('family_id', familyId).order('timestamp', { ascending: true });
    if (tErr || !txs || txs.length === 0) return { success: false, error: 'No transactions to archive.' };
    
    const transactions = txs.map(d => ({
      id: d.id,
      memberId: d.member_id,
      memberName: d.member_name,
      transactionType: d.transaction_type,
      amount: d.amount,
      purpose: d.purpose,
      category: d.category,
      notes: d.notes,
      balanceAfterTransaction: d.balance_after_transaction,
      timestamp: d.timestamp,
      edited: d.edited,
      deleted: d.deleted,
      editHistory: d.edit_history || []
    }));
    
    const totalAdded = transactions.filter(t => t.transactionType === 'Add').reduce((acc, t) => acc + t.amount, 0);
    const totalSpent = transactions.filter(t => t.transactionType === 'Withdraw').reduce((acc, t) => acc + t.amount, 0);
    
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    await supabase.from('reports').insert({
      family_id: familyId,
      month_year: monthYear,
      total_added: totalAdded,
      total_spent: totalSpent,
      transactions: JSON.stringify(transactions),
      created_at: now.getTime()
    });
    
    await supabase.from('transactions').delete().eq('family_id', familyId);
    
    await supabase.from('wallet').update({
      current_balance: 0,
      last_updated: now.getTime()
    }).eq('family_id', familyId);
    
    return { success: true };
  } catch (error) {
    console.error("Reset balance failed:", error);
    return { success: false, error: 'Failed to reset balance and archive report.' };
  }
};

export const clearTransactionHistory = async (familyId: string) => {
  try {
    await supabase.from('transactions').delete().eq('family_id', familyId);
    await supabase.from('wallet').update({
      last_updated: Date.now()
    }).eq('family_id', familyId);
    return { success: true };
  } catch (error) {
    console.error("Clear history failed:", error);
    return { success: false, error: 'Failed to clear transaction history.' };
  }
};

export const deleteReport = async (familyId: string, reportId: string) => {
  try {
    await supabase.from('reports').delete().eq('id', reportId).eq('family_id', familyId);
    return { success: true };
  } catch (error) {
    console.error("Delete report failed:", error);
    return { success: false, error: 'Failed to delete report.' };
  }
};

export const changeFamilyPin = async (familyId: string, oldPin: string, newPin: string) => {
  try {
    const { data: family } = await supabase.from('families').select('pin').eq('id', familyId).single();
    if (!family) return { success: false, error: 'Family not found' };
    if (family.pin !== oldPin) return { success: false, error: 'Incorrect previous PIN' };
    if (!/^\d{4}$/.test(newPin)) return { success: false, error: 'PIN must be exactly 4 digits' };
    
    await supabase.from('families').update({ pin: newPin }).eq('id', familyId);
    return { success: true };
  } catch (error) {
    console.error("Change PIN failed:", error);
    return { success: false, error: 'Failed to change PIN.' };
  }
};

export const changeAdminPasswordHash = async (familyId: string, newHash: string) => {
  try {
    await supabase.from('settings').update({ admin_password_hash: newHash }).eq('family_id', familyId);
    return { success: true };
  } catch (error) {
    console.error("Change Admin Password failed:", error);
    return { success: false, error: 'Failed to change admin password.' };
  }
};

export const getAdminPasswordHash = async (familyId: string) => {
  try {
    const { data: settings } = await supabase.from('settings').select('admin_password_hash').eq('family_id', familyId).single();
    return settings ? settings.admin_password_hash : '';
  } catch (e) {
    console.error("Failed to fetch admin password hash:", e);
    return '';
  }
};

export const addRecurringTransaction = async (familyId: string, rtxData: Omit<RecurringTransaction, 'id' | 'createdAt'>) => {
  try {
    const { error } = await supabase.from('recurring_transactions').insert({
      family_id: familyId,
      member_id: rtxData.memberId,
      member_name: rtxData.memberName,
      transaction_type: rtxData.transactionType,
      amount: rtxData.amount,
      purpose: rtxData.purpose,
      category: rtxData.category,
      frequency: rtxData.frequency,
      next_run_date: rtxData.nextRunDate,
      active: rtxData.active,
      created_at: Date.now()
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Error adding recurring transaction: ", e);
    return false;
  }
};

export const deleteRecurringTransaction = async (familyId: string, rtxId: string) => {
  try {
    await supabase.from('recurring_transactions').delete().eq('id', rtxId).eq('family_id', familyId);
    return true;
  } catch (e) {
    console.error("Error deleting recurring transaction: ", e);
    return false;
  }
};

export const toggleRecurringTransaction = async (familyId: string, rtxId: string, active: boolean) => {
  try {
    await supabase.from('recurring_transactions').update({ active }).eq('id', rtxId).eq('family_id', familyId);
    return true;
  } catch (e) {
    console.error("Error toggling recurring transaction: ", e);
    return false;
  }
};

export const processRecurringTransactions = async (familyId: string) => {
  try {
    const now = Date.now();
    const { data: rtxs, error: rErr } = await supabase.from('recurring_transactions')
      .select('*')
      .eq('family_id', familyId)
      .eq('active', true);
      
    if (rErr || !rtxs || rtxs.length === 0) return { success: true, processed: 0, skipped: [] };
    
    let processedCount = 0;
    const skippedEntries: string[] = [];
    
    for (const rtx of rtxs) {
      if (rtx.next_run_date > now) continue;
      
      const { data: wallet } = await supabase.from('wallet').select('current_balance').eq('family_id', familyId).single();
      let currentBalance = wallet ? wallet.current_balance : 0;
      
      let skippedThisTx = false;
      
      if (rtx.transaction_type === 'Withdraw') {
        if (currentBalance < rtx.amount) {
          skippedThisTx = true;
        } else {
          currentBalance -= rtx.amount;
        }
      } else {
        currentBalance += rtx.amount;
      }
      
      if (skippedThisTx) {
        skippedEntries.push(rtx.purpose);
        continue;
      }
      
      // Add transaction
      await supabase.from('transactions').insert({
        family_id: familyId,
        member_id: rtx.member_id,
        member_name: rtx.member_name,
        transaction_type: rtx.transaction_type,
        amount: rtx.amount,
        purpose: rtx.purpose + ' (Auto)',
        category: rtx.category,
        balance_after_transaction: currentBalance,
        timestamp: now,
        edited: false,
        deleted: false
      });
      
      let nextDate = new Date(rtx.next_run_date);
      if (rtx.frequency === 'Daily') {
        nextDate.setDate(nextDate.getDate() + 1);
      } else if (rtx.frequency === 'Weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (rtx.frequency === 'Monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }
      
      await supabase.from('wallet').update({
        current_balance: currentBalance,
        last_updated: now
      }).eq('family_id', familyId);
      
      await supabase.from('recurring_transactions').update({
        next_run_date: nextDate.getTime()
      }).eq('id', rtx.id);
      
      processedCount++;
    }
    
    return { success: true, processed: processedCount, skipped: skippedEntries };
  } catch (error) {
    console.error("Failed to process recurring transactions:", error);
    return { success: false, error };
  }
};
