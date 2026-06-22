import { create } from 'zustand';
import { Member, Transaction, Wallet } from '../types';

interface AppState {
  // Active Session
  activeMember: Member | null;
  setActiveMember: (member: Member | null) => void;
  
  // Admin Auth
  isAdminAuthenticated: boolean;
  setAdminAuthenticated: (status: boolean) => void;
  
  // Data State
  wallet: Wallet | null;
  setWallet: (wallet: Wallet | null) => void;
  
  transactions: Transaction[];
  setTransactions: (transactions: Transaction[]) => void;
  
  members: Member[];
  setMembers: (members: Member[]) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeMember: null,
  setActiveMember: (member) => set({ activeMember: member }),
  
  isAdminAuthenticated: false,
  setAdminAuthenticated: (status) => set({ isAdminAuthenticated: status }),
  
  wallet: null,
  setWallet: (wallet) => set({ wallet }),
  
  transactions: [],
  setTransactions: (transactions) => set({ transactions }),
  
  members: [],
  setMembers: (members) => set({ members }),
}));
