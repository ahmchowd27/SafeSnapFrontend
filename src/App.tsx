import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoginPage from '@/pages/LoginPage';
import WorkerDashboard from '@/pages/WorkerDashboard';
import ManagerDashboard from '@/pages/ManagerDashboard';
import CreateIncidentPage from '@/pages/CreateIncidentPage';
import IncidentDetailPage from '@/pages/IncidentDetailPage';
import EditIncidentPage from '@/pages/EditIncidentPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: 'WORKER' | 'MANAGER' }> = ({ 
  children, 
  requiredRole 
}) => {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={user.role === 'MANAGER' ? '/manager' : '/worker'} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={
          !isAuthenticated ? (
            <LoginPage />
          ) : (
            <Navigate to={user?.role === 'MANAGER' ? '/manager' : '/worker'} replace />
          )
        } 
      />
      
      {/* Worker Routes */}
      <Route 
        path="/worker" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <WorkerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/incidents/new" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <CreateIncidentPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/incidents/:id" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <IncidentDetailPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/worker/incidents/:id/edit" 
        element={
          <ProtectedRoute requiredRole="WORKER">
            <EditIncidentPage />
          </ProtectedRoute>
        } 
      />

      {/* Manager Routes */}
      <Route 
        path="/manager" 
        element={
          <ProtectedRoute requiredRole="MANAGER">
            <ManagerDashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/manager/incidents/:id" 
        element={
          <ProtectedRoute requiredRole="MANAGER">
            <IncidentDetailPage />
          </ProtectedRoute>
        } 
      />

      {/* Default redirects */}
      <Route 
        path="/" 
        element={
          <Navigate to={
            !isAuthenticated ? '/login' : 
            user?.role === 'MANAGER' ? '/manager' : '/worker'
          } replace />
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <div className="min-h-screen bg-background">
              <AppRoutes />
            </div>
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
