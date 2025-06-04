import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className='min-h-screen flex flex-col bg-gray-50'>
      <header className='bg-white shadow'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center'>
          <Link to='/' className='text-xl font-bold text-brand-primary'>
            IMS
          </Link>
          {currentUser && (
            <div className='flex items-center gap-4'>
              <span className='text-gray-600'>
                {currentUser.full_name} ({currentUser.role})
              </span>
              <Button
                variant='outline'
                className='cursor-pointer'
                onClick={handleLogout}
              >
                Logout
              </Button>
            </div>
          )}
        </div>
      </header>
      <main className='flex-1 p-2 sm:p-4 lg:p-6'>{children}</main>
      <footer className='bg-white border-t py-4'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500'>
          &copy; 2025 Invoice Management System
        </div>
      </footer>
    </div>
  );
};

export default Layout;
