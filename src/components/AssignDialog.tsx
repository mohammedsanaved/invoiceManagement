import React, { useEffect, useState } from 'react';
import type { Invoice } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import axios from 'axios';
import { API_URL } from '@/lib/url';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AssignDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onAssign: () => void;
}
interface Employee {
  id: number;
  full_name: string;
  username: string;
  role: string;
  is_admin: boolean;
}

const AssignDialog: React.FC<AssignDialogProps> = ({
  invoice,
  open,
  onClose,
  onAssign,
}) => {
  console.log(invoice, '-----------------------Invoice');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    null
  );
  useEffect(() => {
    if (invoice?.assigned_to_id) {
      setSelectedEmployeeId(invoice.assigned_to_id);
    }
  }, [invoice]);
  const { currentUser } = useAuth();
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await axios.get<string>(`${API_URL}/api/auth/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEmployees(response.data);
      } catch (error: any) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployee();
  }, []);
  console.log(employees, '-----------------------Employee');

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAssign();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Assign Invoice for Collection</DialogTitle>
            <DialogDescription>
              This will notify the employee about this collection task.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Invoice</Label>
              <div className='col-span-3'>
                <Input value={invoice.invoice_number} readOnly />
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Outlet</Label>
              <div className='col-span-3'>
                <Input value={invoice.outlet_name} readOnly />
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Amount</Label>
              <div className='col-span-3'>
                <Input value={invoice.amount} readOnly />
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Assign To</Label>
              {/* <div className='col-span-3'>
                <Input value='Employee One' readOnly />
              </div> */}
              <Select
                value={selectedEmployeeId?.toString()}
                onValueChange={(value) => setSelectedEmployeeId(Number(value))}
              >
                <SelectTrigger className='col-span-3'>
                  <SelectValue placeholder='Select Employee' />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Assign Invoice</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
