import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
// import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import NotFoundPage from './pages/NotFoundPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import Index from './pages/Index';
import AdminPaymentDashboard from './pages/AdminPaymentDashboard';
import VerifyOtp from './pages/VerifyOtp';
import AdminChequeDashboard from './pages/AdminChequeDashboard';

// const queryClient = new QueryClient();

const App = () => (
  // <QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <TooltipProvider>
      <AuthProvider>
        <DataProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path={'/'} element={<Login />} />
            <Route path='/login' element={<Login />} />
            <Route path='/verify' element={<VerifyOtp />} />

            {/* Protected Admin Route */}
            <Route
              path='/admin'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path='/admin/payments'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminPaymentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path='/admin/payments/cheque'
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminChequeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Protected User Route */}
            <Route
              path='/user'
              element={
                <ProtectedRoute allowedRoles={['dra']}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />

            <Route path='/unauthorized' element={<UnauthorizedPage />} />

            {/* Main route that redirects based on role */}
            <Route path='/' element={<Index />} />

            <Route path='*' element={<NotFoundPage />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </TooltipProvider>
  </BrowserRouter>
  // </QueryClientProvider>
);

export default App;
