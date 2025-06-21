import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useData } from '@/context/DataContext';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();

  const { toast } = useToast();
  // const navigate = useNavigate();
  const { refreshInvoices, refreshUserInvoices } = useData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter both email and password',
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password);
      await refreshInvoices();
      await refreshUserInvoices();
      // console.log('--------------------------------User Data', user);
      // if (user.username === 'admin') {
      //   navigate('/verify');
      //   await refreshInvoices();
      // } else if (user.is_admin === false) {
      //   navigate('/user');
      //   await refreshUserInvoices();
      // } else {
      //   toast({
      //     variant: 'destructive',
      //     title: 'Error',
      //     description: 'Invalid user role. Please contact admin.',
      //   });
      // }
    } catch (error: string | unknown) {
      if (error instanceof Error) {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: error.message,
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Login Failed',
          description: 'An unknown error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-100'>
      <Card className='w-full max-w-md'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-2xl text-center'>
            Invoice Management System
          </CardTitle>
          <CardDescription className='text-center'>
            Enter your credentials to sign in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                // type="email"
                placeholder='admin@example.com or employee1@example.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='admin123 or employee123'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className='pr-10' // ensures space for icon
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <Button type='submit' className='w-full' disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className='text-center text-sm text-muted-foreground w-full'>
            Demo credentials:
            <br />
            Admin: admin@example.com / admin123
            <br />
            User: employee1@example.com / employee123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
