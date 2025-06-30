import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Index = () => {
  const { currentUser, isAuthenticated, isLoading } = useAuth();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-100'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  // If user is authenticated, redirect based on role
  if (currentUser?.role === 'admin') {
    return <Navigate to='/adminuser' replace />;
  } else if (currentUser?.role === 'dra') {
    return <Navigate to='/drauser' replace />;
  }

  // Fallback for any other cases
  return <Navigate to='/login' replace />;
};

export default Index;
