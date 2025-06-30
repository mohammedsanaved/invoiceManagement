import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

const UnauthorizedPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-50'>
      <h1 className='text-5xl font-bold text-red-500'>Access Denied</h1>
      <p className='mt-4 text-xl text-gray-600'>
        You don't have permission to view this page.
      </p>
      <Button asChild className='mt-8'>
        <Link to='/login'>
          Go to {currentUser?.role === 'admin' ? 'Admin' : 'User'} Dashboard
        </Link>
      </Button>
    </div>
  );
};

export default UnauthorizedPage;
