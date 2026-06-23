import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Member, Transaction, Wallet, Report } from '../types';

interface AppState {
  // Multi-Tenant Session
  familyId: string | null;
  familyName: string | null;
  setFamilySession: (id: string | null, name: string | null) => void;
  logoutFamily: () => void;

  // Active User Session
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
  
  reports: Report[];
  setReports: (reports: Report[]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      familyId: null,
      familyName: null,
      setFamilySession: (id, name) => set({ familyId: id, familyName: name }),
      logoutFamily: () => set({ familyId: null, familyName: null, activeMember: null, isAdminAuthenticated: false }),

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
      
      reports: [],
      setReports: (reports) => set({ reports }),
    }),
    {
      name: 'gharcash-session',
      partialize: (state) => ({
        familyId: state.familyId,
        familyName: state.familyName,
        activeMember: state.activeMember
      }),
    }
  )
);
