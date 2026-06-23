-- Families (Tenants)
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_name TEXT NOT NULL,
  pin TEXT NOT NULL,
  created_at BIGINT NOT NULL
);

-- Members
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  role TEXT NOT NULL
);

-- Wallet (1-to-1 with Family)
CREATE TABLE wallet (
  family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  current_balance INTEGER NOT NULL DEFAULT 0,
  minimum_threshold INTEGER NOT NULL DEFAULT 0,
  last_updated BIGINT NOT NULL
);

-- Family Settings
CREATE TABLE settings (
  family_id UUID PRIMARY KEY REFERENCES families(id) ON DELETE CASCADE,
  admin_password_hash TEXT
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL,
  notes TEXT,
  balance_after_transaction INTEGER NOT NULL,
  timestamp BIGINT NOT NULL,
  edited BOOLEAN NOT NULL DEFAULT FALSE,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  edit_history JSONB
);

-- Recurring Transactions
CREATE TABLE recurring_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  member_id TEXT NOT NULL,
  member_name TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  purpose TEXT NOT NULL,
  category TEXT NOT NULL,
  frequency TEXT NOT NULL,
  next_run_date BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at BIGINT NOT NULL
);

-- Monthly Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  total_added INTEGER NOT NULL,
  total_spent INTEGER NOT NULL,
  transactions JSONB NOT NULL,
  created_at BIGINT NOT NULL
);

-- Enable Realtime for relevant tables
alter publication supabase_realtime add table members;
alter publication supabase_realtime add table wallet;
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table recurring_transactions;
alter publication supabase_realtime add table reports;
