import React, { useEffect, useState } from 'react';
import type { Invoice } from '../types';
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
// import { ref } from 'process';

interface AssignDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  onAssign: () => void;
  refreshInvoices: () => void;
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
  refreshInvoices,
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
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await axios.get<Employee[]>(
          `${API_URL}/api/auth/users/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setEmployees(response.data);
      } catch (error: unknown) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployee();
  }, []);
  console.log(employees, '-----------------------Employee');

  if (!invoice) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token || !invoice?.id || selectedEmployeeId === null) return;

    // console.log('invoiceId', invoice?.id, 'selectedID', selectedEmployeeId);

    try {
      await axios.patch(
        `${API_URL}/api/bills/${invoice.id}/`,
        {
          assigned_to_id: selectedEmployeeId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      onClose();
      refreshInvoices();
      onAssign(); // Call the onAssign function to notify parent component
    } catch (error: unknown) {
      console.error('Error assigning employee:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <form onSubmit={handleAssign}>
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
                <Input value={invoice.actual_amount} readOnly />
              </div>
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Assign To</Label>
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
            <Button className='cursor-pointer' type='submit'>
              Assign Invoice
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
