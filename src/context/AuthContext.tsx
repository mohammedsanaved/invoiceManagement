import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { API_URL } from '@/lib/url';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  currentUser: User | null;
  login: (email: string, password: string) => Promise<User>;
  verifyOtp: (otp: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  accessToken: string | null;
  isLoading: boolean;
  pendingAdminUsername: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingAdminUsername, setPendingAdminUsername] = useState<
    string | null
  >(null);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        const storedToken = localStorage.getItem('accessToken');
        if (storedUser && storedToken) {
          setCurrentUser(JSON.parse(storedUser));
          setAccessToken(storedToken);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        localStorage.clear();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_URL}/api/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password }),
    });
    if (!response.ok) {
      throw new Error('Invalid credentials');
    }
    const data = await response.json();
    const { user, access, refresh } = data;

    if (user.username === 'admin') {
      // Admin: hold for OTP
      setPendingAdminUsername(user.username);
      localStorage.setItem('pendingAdminUsername', user.username);
      // we navigate to /verify but still return user
      navigate('/verify');
    } else {
      // Normal user: store tokens & user, mark authenticated
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('currentUser', JSON.stringify(user));
      setAccessToken(access);
      setCurrentUser(user);
      setIsAuthenticated(true);
      navigate('/user');
    }

    return user;
  };

  const verifyOtp = async (code: string) => {
    const username =
      pendingAdminUsername || localStorage.getItem('pendingAdminUsername');
    if (!username) throw new Error('No pending admin login found');

    const response = await fetch(`${API_URL}/api/auth/verify-otp/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, code }),
    });
    if (!response.ok) {
      throw new Error('OTP verification failed');
    }
    const data = await response.json();
    const { access, refresh, user } = data;

    // Save tokens and user
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.removeItem('pendingAdminUsername');

    setAccessToken(access);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setPendingAdminUsername(null);
    navigate('/admin');
  };

  const logout = () => {
    setCurrentUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    localStorage.clear();
    navigate('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        login,
        verifyOtp,
        logout,
        isAuthenticated,
        accessToken,
        isLoading,
        pendingAdminUsername,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be inside AuthProvider');
  return context;
};
