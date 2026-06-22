import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';

// Lazy load screens for performance
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AddCash = React.lazy(() => import('./pages/AddCash'));
const WithdrawCash = React.lazy(() => import('./pages/WithdrawCash'));
const History = React.lazy(() => import('./pages/History'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Settings = React.lazy(() => import('./pages/Settings'));

const App: React.FC = () => {

  return (
    <BrowserRouter>
      <React.Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full border-4 border-emerald-500 border-t-transparent h-12 w-12" /></div>}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-cash" element={<AddCash />} />
            <Route path="/withdraw-cash" element={<WithdrawCash />} />
            <Route path="/history" element={<History />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  );
};

export default App;
