import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../context/AuthContext';

export default function VerifyOTP() {
  // State for each OTP digit
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  // Refs to each input for focus management
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { verifyOtp } = useAuth();

  // Autofocus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Handle change in a single digit
  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return; // Only allow digits
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Move focus to next input if a digit was entered
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace to move focus backwards
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Verify button handler
  const handleVerify = async () => {
    const code = otp.join('');
    // TODO: call your verify OTP API here
    console.log('Verifying OTP:', code);
    await verifyOtp(code);
  };

  return (
    <div className='min-h-screen flex flex-col items-center justify-center bg-gray-100'>
      <Label htmlFor='otpGroup' className='text-2xl font-bold text-center'>
        Enter the 6‑digit OTP
      </Label>
      <div id='otpGroup' className='flex space-x-2 mt-4'>
        {otp.map((digit, idx) => (
          <Input
            key={idx}
            type='text'
            inputMode='numeric'
            maxLength={1}
            className='w-12 h-12 text-center text-xl'
            value={digit}
            onChange={(e) => handleChange(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
          />
        ))}
      </div>
      <Button
        disabled={otp.some((d) => d === '')}
        onClick={handleVerify}
        className='mt-6 w-1/2'
      >
        Verify OTP
      </Button>
    </div>
  );
}
