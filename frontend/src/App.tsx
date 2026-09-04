import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages — named exports
import { LoadingPage } from './pages/LoadingPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { TermsPage } from './pages/TermsPage';

// Dashboard Pages — named exports
import { OverviewPage } from './pages/dashboard/OverviewPage';
import { RecoveryQueuePage } from './pages/dashboard/RecoveryQueuePage';
import { PromisesPage } from './pages/dashboard/PromisesPage';
import { TransactionsPage } from './pages/dashboard/TransactionsPage';
import { TransactionDetailPage } from './pages/dashboard/TransactionDetailPage';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { CustomerDetailPage } from './pages/dashboard/CustomerDetailPage';
import { AIDecisionsPage } from './pages/dashboard/AIDecisionsPage';
import { PoliciesPage } from './pages/dashboard/PoliciesPage';
import { AnalyticsPage } from './pages/dashboard/AnalyticsPage';
import { AuditTrailPage } from './pages/dashboard/AuditTrailPage';
import { SimulationPage } from './pages/dashboard/SimulationPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

// Error boundary
class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 selection:bg-green-500/30">
            <div className="bg-[#0c0c0e] border border-red-500/30 rounded-3xl p-8 max-w-md w-full text-center shadow-[0_20px_50px_rgba(0,0,0,0.9)] relative overflow-hidden backdrop-blur-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-2xl pointer-events-none" />
              <h2 className="text-lg font-bold text-white font-mono mb-2">System Exception Encountered</h2>
              <p className="text-xs font-mono text-neutral-400 mb-6 leading-relaxed">{this.state.error?.message || 'An unexpected runtime error occurred in the recovery console.'}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="w-full px-4 py-3 bg-green-500 hover:bg-green-400 text-black font-extrabold font-mono uppercase tracking-wider text-xs rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] cursor-pointer"
              >
                Reload Console
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = typeof window !== 'undefined' 
    ? (localStorage.getItem('recover_ai_token') || sessionStorage.getItem('recover_ai_token'))
    : null;

  if (!token) {
    return <Navigate to="/register" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="sync" initial={false}>
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/" element={<LoadingPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />

        {/* Protected dashboard routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="recovery" element={<RecoveryQueuePage />} />
          <Route path="recovery/:id" element={<RecoveryQueuePage />} />
          <Route path="promises" element={<PromisesPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="transactions/:id" element={<TransactionDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="ai-decisions" element={<AIDecisionsPage />} />
          <Route path="policies" element={<PoliciesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="audit" element={<AuditTrailPage />} />
          <Route path="simulation" element={<SimulationPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}