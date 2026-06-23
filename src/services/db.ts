import { 
  collection, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  runTransaction,
  addDoc,
  deleteDoc,
  updateDoc,
  getDocs,
  setDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, Wallet, Member, Report } from '../types';

// Dynamic collection getters for Multi-Tenant Architecture
export const getFamilyRef = (familyId: string) => doc(db, 'families', familyId);
export const getMembersRef = (familyId: string) => collection(db, 'families', familyId, 'members');
export const getTransactionsRef = (familyId: string) => collection(db, 'families', familyId, 'transactions');
export const getWalletRef = (familyId: string) => doc(db, 'families', familyId, 'wallet', 'main');
export const getFamilySettingsRef = (familyId: string) => doc(db, 'families', familyId, 'settings', 'main');
export const getReportsRef = (familyId: string) => collection(db, 'families', familyId, 'reports');

// ==========================================
// AUTHENTICATION
// ==========================================

export const registerFamily = async (adminName: string, pin: string) => {
  try {
    if (!/^\d{4}$/.test(pin)) return { success: false, error: 'PIN must be exactly 4 digits' };
    
    // Check if family name already exists
    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, where('adminName', '==', adminName.trim()));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) return { success: false, error: 'Family name already taken. Please choose another.' };
    
    // Create new family
    const newFamilyRef = doc(collection(db, 'families'));
    await setDoc(newFamilyRef, {
      adminName: adminName.trim(),
      pin, // In a real production app, this should be securely hashed.
      createdAt: Date.now()
    });
    
    return { success: true, familyId: newFamilyRef.id };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Registration failed. Check your connection.' };
  }
};

export const loginFamily = async (adminName: string, pin: string) => {
  try {
    const familiesRef = collection(db, 'families');
    const q = query(familiesRef, where('adminName', '==', adminName.trim()), where('pin', '==', pin));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return { success: false, error: 'Invalid Family Name or PIN' };
    
    return { success: true, familyId: snapshot.docs[0].id };
  } catch (e) {
    console.error(e);
    return { success: false, error: 'Login failed. Check your connection.' };
  }
};

// ==========================================
// SUBSCRIPTIONS
// ==========================================

export const subscribeToWallet = (familyId: string, callback: (wallet: Wallet | null) => void) => {
  return onSnapshot(getWalletRef(familyId), (docSnapshot) => {
    if (docSnapshot.exists()) {
      const data = docSnapshot.data() as Wallet;
      // Auto-migrate old wallets to 0 threshold
      if (data.minimumThreshold !== 0) {
        updateDoc(getWalletRef(familyId), { minimumThreshold: 0 });
      }
      callback(data);
    } else {
      callback(null);
    }
  });
};

export const subscribeToTransactions = (familyId: string, callback: (transactions: Transaction[]) => void) => {
  const q = query(getTransactionsRef(familyId), orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((doc) => {
      txs.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    callback(txs);
  });
};

export const subscribeToMembers = (familyId: string, callback: (members: Member[]) => void) => {
  return onSnapshot(getMembersRef(familyId), (snapshot) => {
    const members: Member[] = [];
    snapshot.forEach((doc) => {
      members.push({ id: doc.id, ...doc.data() } as Member);
    });
    callback(members);
  });
};

export const subscribeToReports = (familyId: string, callback: (reports: Report[]) => void) => {
  const q = query(getReportsRef(familyId), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const reports: Report[] = [];
    snapshot.forEach((doc) => {
      reports.push({ id: doc.id, ...doc.data() } as Report);
    });
    callback(reports);
  });
};

// ==========================================
// OPERATIONS
// ==========================================

export const addTransaction = async (familyId: string, txData: Omit<Transaction, 'id' | 'balanceAfterTransaction' | 'timestamp' | 'edited' | 'deleted'>) => {
  try {
    await runTransaction(db, async (transaction) => {
      const walletRef = getWalletRef(familyId);
      const walletDoc = await transaction.get(walletRef);
      
      let currentBalance = 0;
      
      if (!walletDoc.exists()) {
        transaction.set(walletRef, {
          currentBalance: 0,
          minimumThreshold: 0,
          lastUpdated: Date.now()
        });
      } else {
        currentBalance = walletDoc.data().currentBalance;
      }
      let newBalance = currentBalance;
      
      if (txData.transactionType === 'Add') {
        newBalance += txData.amount;
      } else {
        newBalance -= txData.amount;
      }
      
      const newTxRef = doc(getTransactionsRef(familyId));
      const txId = newTxRef.id;
      
      const now = Date.now();
      
      const finalTx: Transaction = {
        ...txData,
        id: txId,
        balanceAfterTransaction: newBalance,
        timestamp: now,
        edited: false,
        deleted: false
      };
      
      transaction.update(walletRef, {
        currentBalance: newBalance,
        lastUpdated: now
      });
      
      transaction.set(newTxRef, finalTx);
    });
    return true;
  } catch (error) {
    console.error("Transaction failed: ", error);
    return false;
  }
};

export const addMember = async (familyId: string, memberData: Omit<Member, 'id'>) => {
  try {
    const docRef = await addDoc(getMembersRef(familyId), memberData);
    await updateDoc(docRef, { id: docRef.id });
    return true;
  } catch (e) {
    console.error("Error adding member: ", e);
    return false;
  }
};

export const deleteMember = async (familyId: string, memberId: string) => {
  try {
    await deleteDoc(doc(db, 'families', familyId, 'members', memberId));
    return true;
  } catch (e) {
    console.error("Error deleting member: ", e);
    return false;
  }
};

export const editMember = async (familyId: string, memberId: string, memberData: Partial<Omit<Member, 'id'>>) => {
  try {
    await updateDoc(doc(db, 'families', familyId, 'members', memberId), memberData);
    return true;
  } catch (e) {
    console.error("Error editing member: ", e);
    return false;
  }
};

export const deleteTransaction = async (familyId: string, transactionId: string) => {
  try {
    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'families', familyId, 'transactions', transactionId);
      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists()) throw "Transaction does not exist!";
      
      const txData = txDoc.data() as Transaction;
      if (txData.deleted) throw "Already deleted!";

      const walletRef = getWalletRef(familyId);
      const walletDoc = await transaction.get(walletRef);
      
      if (!walletDoc.exists()) throw "Wallet missing!";
      
      let currentBalance = walletDoc.data().currentBalance;
      
      if (txData.transactionType === 'Add') {
        currentBalance -= txData.amount;
      } else {
        currentBalance += txData.amount;
      }
      
      transaction.update(walletRef, {
        currentBalance: currentBalance,
        lastUpdated: Date.now()
      });
      
      transaction.update(txRef, {
        deleted: true,
        edited: true,
        timestamp: Date.now()
      });
    });
    return true;
  } catch (error) {
    console.error("Delete transaction failed: ", error);
    return false;
  }
};

export const editTransaction = async (familyId: string, transactionId: string, updatedData: Partial<Transaction>) => {
  try {
    await runTransaction(db, async (transaction) => {
      const txRef = doc(db, 'families', familyId, 'transactions', transactionId);
      const txDoc = await transaction.get(txRef);
      if (!txDoc.exists()) throw "Transaction does not exist!";
      
      const oldTxData = txDoc.data() as Transaction;
      if (oldTxData.deleted) throw "Cannot edit deleted transaction!";

      const walletRef = getWalletRef(familyId);
      const walletDoc = await transaction.get(walletRef);
      if (!walletDoc.exists()) throw "Wallet missing!";
      
      let currentBalance = walletDoc.data().currentBalance;
      
      if (oldTxData.transactionType === 'Add') {
        currentBalance -= oldTxData.amount;
      } else {
        currentBalance += oldTxData.amount;
      }
      
      const newType = updatedData.transactionType || oldTxData.transactionType;
      const newAmount = updatedData.amount !== undefined ? updatedData.amount : oldTxData.amount;
      
      if (newType === 'Add') {
        currentBalance += newAmount;
      } else {
        currentBalance -= newAmount;
      }
      
      transaction.update(walletRef, {
        currentBalance: currentBalance,
        lastUpdated: Date.now()
      });
      
      const newHistory = [...(oldTxData.editHistory || [])];
      newHistory.push({
        oldAmount: oldTxData.amount,
        oldPurpose: oldTxData.purpose,
        oldCategory: oldTxData.category,
        editedAt: Date.now()
      });
      
      transaction.update(txRef, {
        ...updatedData,
        edited: true,
        editHistory: newHistory,
        balanceAfterTransaction: currentBalance
      });
    });
    return true;
  } catch (error) {
    console.error("Edit transaction failed: ", error);
    return false;
  }
};

export const resetBalanceAndArchive = async (familyId: string) => {
  try {
    const txSnapshot = await getDocs(getTransactionsRef(familyId));
    if (txSnapshot.empty) {
      return { success: false, error: 'No transactions to archive.' };
    }
    
    const transactions: Transaction[] = [];
    txSnapshot.forEach(doc => {
      transactions.push({ id: doc.id, ...doc.data() } as Transaction);
    });
    
    transactions.sort((a, b) => a.timestamp - b.timestamp);
    
    const totalAdded = transactions.filter(t => t.transactionType === 'Add').reduce((acc, t) => acc + t.amount, 0);
    const totalSpent = transactions.filter(t => t.transactionType === 'Withdraw').reduce((acc, t) => acc + t.amount, 0);
    
    const now = new Date();
    const monthYear = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    const newReportRef = doc(getReportsRef(familyId));
    const reportData: Omit<Report, 'id'> = {
      monthYear,
      totalAdded,
      totalSpent,
      transactions,
      createdAt: now.getTime()
    };
    
    const batch = writeBatch(db);
    batch.set(newReportRef, reportData);
    
    txSnapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    
    const walletRef = getWalletRef(familyId);
    batch.update(walletRef, {
      currentBalance: 0,
      lastUpdated: now.getTime()
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Reset balance failed:", error);
    return { success: false, error: 'Failed to reset balance and archive report.' };
  }
};

export const clearTransactionHistory = async (familyId: string) => {
  try {
    const txSnapshot = await getDocs(getTransactionsRef(familyId));
    if (txSnapshot.empty) {
      return { success: true };
    }
    
    const batch = writeBatch(db);
    
    txSnapshot.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    
    const walletRef = getWalletRef(familyId);
    batch.update(walletRef, {
      currentBalance: 0,
      lastUpdated: Date.now()
    });
    
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Clear history failed:", error);
    return { success: false, error: 'Failed to clear transaction history.' };
  }
};

export const deleteReport = async (familyId: string, reportId: string) => {
  try {
    await deleteDoc(doc(db, 'families', familyId, 'reports', reportId));
    return { success: true };
  } catch (error) {
    console.error("Delete report failed:", error);
    return { success: false, error: 'Failed to delete report.' };
  }
};
