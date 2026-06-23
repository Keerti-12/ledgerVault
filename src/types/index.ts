export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: 'Admin' | 'Member' | 'Parent' | 'Kid';
}

export interface TransactionEdit {
  oldAmount: number;
  oldPurpose: string;
  oldCategory?: string;
  editedAt: number;
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
  editHistory?: TransactionEdit[];
}

export interface Wallet {
  currentBalance: number;
  minimumThreshold: number;
  lastUpdated: number;
}

export interface Report {
  id: string;
  monthYear: string;
  totalAdded: number;
  totalSpent: number;
  transactions: Transaction[];
  createdAt: number;
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
