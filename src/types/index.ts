export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Member';
}

export interface Transaction {
  id: string;
  memberId: string;
  memberName: string;
  transactionType: 'Add' | 'Withdraw';
  amount: number;
  purpose: string;
  category: string;
  notes?: string;
  balanceAfterTransaction: number;
  timestamp: number;
  edited: boolean;
  deleted: boolean;
}

export interface Wallet {
  currentBalance: number;
  minimumThreshold: number;
  lastUpdated: number;
}

export interface AuditLog {
  id: string;
  transactionId?: string;
  action: string;
  performedBy: string;
  oldValue?: any;
  newValue?: any;
  reason: string;
  timestamp: number;
}

export interface Settings {
  adminPasswordHash: string;
  currency: string;
  minimumThreshold: number;
}
