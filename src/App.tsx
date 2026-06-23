import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { subscribeToMembers, subscribeToWallet, subscribeToTransactions, subscribeToReports } from './services/db';
import { useAppStore } from './store/useAppStore';

// Lazy load screens for performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AddCash = React.lazy(() => import('./pages/AddCash'));
const WithdrawCash = React.lazy(() => import('./pages/WithdrawCash'));
const History = React.lazy(() => import('./pages/History'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));
const ManageMembers = React.lazy(() => import('./pages/ManageMembers'));
const Login = React.lazy(() => import('./pages/Login'));
const LaunchScreen = React.lazy(() => import('./pages/LaunchScreen'));

  const App: React.FC = () => {
  const { setMembers, setWallet, setTransactions, setReports, familyId } = useAppStore();

  React.useEffect(() => {
    if (!familyId) return;

    // Global persistent listeners for the authenticated family
    const unsubMembers = subscribeToMembers(familyId, (data) => setMembers(data));
    const unsubWallet = subscribeToWallet(familyId, (data) => setWallet(data));
    const unsubTxs = subscribeToTransactions(familyId, (data) => setTransactions(data));
    const unsubReports = subscribeToReports(familyId, (data) => setReports(data));

    return () => {
      unsubMembers();
      unsubWallet();
      unsubTxs();
      unsubReports();
    };
  }, [familyId, setMembers, setWallet, setTransactions, setReports]);

  if (!familyId) {
    return (
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full border-4 border-emerald-500 border-t-transparent h-12 w-12" /></div>}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </React.Suspense>
      </BrowserRouter>
    );
  }

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full border-4 border-emerald-500 border-t-transparent h-12 w-12" /></div>}>
        <Routes>
          <Route path="/select-member" element={<LaunchScreen />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-cash" element={<AddCash />} />
            <Route path="/withdraw-cash" element={<WithdrawCash />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/manage-members" element={<ManageMembers />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default App;
