import { 
  collection, 
  doc, 
  onSnapshot,
  query,
  orderBy,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, Wallet, Member } from '../types';

export const collections = {
  members: collection(db, 'members'),
  wallet: collection(db, 'wallet'),
  transactions: collection(db, 'transactions'),
  auditLogs: collection(db, 'auditLogs'),
  settings: collection(db, 'settings')
};

// Helper to get main wallet
export const getWalletRef = () => doc(db, 'wallet', 'main');
export const getSettingsRef = () => doc(db, 'settings', 'main');

// Listen to wallet changes
export const subscribeToWallet = (callback: (wallet: Wallet | null) => void) => {
  return onSnapshot(getWalletRef(), (docSnapshot) => {
    if (docSnapshot.exists()) {
      callback(docSnapshot.data() as Wallet);
    } else {
      callback(null);
    }
  });
};

// Listen to transactions
export const subscribeToTransactions = (callback: (transactions: Transaction[]) => void) => {
  const q = query(collections.transactions, orderBy('timestamp', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const txs: Transaction[] = [];
    snapshot.forEach((doc) => {
      txs.push(doc.data() as Transaction);
    });
    callback(txs);
  });
};

// Listen to members
export const subscribeToMembers = (callback: (members: Member[]) => void) => {
  return onSnapshot(collections.members, (snapshot) => {
    const members: Member[] = [];
    snapshot.forEach((doc) => {
      members.push(doc.data() as Member);
    });
    callback(members);
  });
};

export const addTransaction = async (txData: Omit<Transaction, 'id' | 'balanceAfterTransaction' | 'timestamp' | 'edited' | 'deleted'>) => {
  try {
    await runTransaction(db, async (transaction) => {
      const walletRef = getWalletRef();
      const walletDoc = await transaction.get(walletRef);
      
      let currentBalance = 0;
      
      if (!walletDoc.exists()) {
        // Initialize the wallet if it doesn't exist yet
        transaction.set(walletRef, {
          currentBalance: 0,
          minimumThreshold: 1000,
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
      
      const newTxRef = doc(collections.transactions);
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
