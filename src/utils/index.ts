import { format } from 'date-fns';

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (timestamp: number): string => {
  return format(new Date(timestamp), 'dd MMM yyyy');
};

export const formatTime = (timestamp: number): string => {
  return format(new Date(timestamp), 'hh:mm a');
};

// Basic hash simulation for '1225'. In a real app this would use bcrypt or Web Crypto API
// The requirement stated initial password is "1225". We will hash this securely in production, 
// but for the demo we'll use a basic digest or simple comparison if a hash isn't available from settings.
export const verifyAdminPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const cleanPass = password.trim();
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(cleanPass));
  const hashArray = Array.from(new Uint8Array(hash));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  

  
  // Allow matching the hash, or fallback to matching the exact stored string (in case it was saved in plaintext manually)
  return hashHex === storedHash || cleanPass === storedHash;
};

// Initial setup helper - the SHA-256 of "1225" is "a0d1b3...".
export const generateHash = async (password: string): Promise<string> => {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  const hashArray = Array.from(new Uint8Array(hash));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};
