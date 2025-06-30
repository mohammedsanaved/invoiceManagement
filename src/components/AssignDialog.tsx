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
  // If there is no invoice, render nothing:
  const originalAmount = invoice?.actual_amount;
  const originalAssignedTo = invoice?.assigned_to_id ?? null;
  const [amount, setAmount] = useState<number | undefined>(originalAmount);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Keep a copy of the original values for comparison:

  // Local state for any edits:
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
    originalAssignedTo
  );

  // List of employees to choose from:

  // When the dialog opens (or invoice changes), initialize form fields:
  useEffect(() => {
    setSelectedEmployeeId(originalAssignedTo);
    setAmount(originalAmount);
  }, [invoice]);

  console.log('invoice in AssignDialog:', invoice);

  // Fetch all employees once:
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

  if (!invoice) return null;
  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token || !invoice.id) return;

    // Build payload with only fields that have actually changed:
    const payload: Record<string, number | undefined> = {};

    if (selectedEmployeeId !== originalAssignedTo) {
      payload.assigned_to_id = selectedEmployeeId ?? undefined;
    }

    if (amount !== originalAmount) {
      payload.actual_amount = amount;
    }

    // If nothing changed, simply close the dialog:
    if (Object.keys(payload).length === 0) {
      onClose();
      return;
    }

    try {
      await axios.patch(`${API_URL}/api/bills/${invoice.id}/`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Refresh parent data and notify:
      onClose();
      refreshInvoices();
      onAssign();
    } catch (error: unknown) {
      console.error('Error updating invoice:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <form onSubmit={handleAssign}>
          <DialogHeader>
            <DialogTitle>Assign / Update Invoice</DialogTitle>
            <DialogDescription>
              You may change the assigned employee and/or adjust the amount.
            </DialogDescription>
          </DialogHeader>

          <div className='grid gap-4 py-4'>
            {/* Invoice Number (read-only) */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Invoice</Label>
              <div className='col-span-3'>
                <Input value={invoice.invoice_number} readOnly />
              </div>
            </div>

            {/* Outlet (read-only) */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Outlet</Label>
              <div className='col-span-3'>
                <Input value={invoice.outlet_name} readOnly />
              </div>
            </div>

            {/* Amount (editable) */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Amount</Label>
              <div className='col-span-3'>
                <Input
                  type='number'
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min='0'
                  step='0.01'
                />
              </div>
            </div>

            {/* Assign To (select) */}
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label className='text-right'>Assign To</Label>
              <div className='col-span-3'>
                <Select
                  value={selectedEmployeeId?.toString() ?? ''}
                  onValueChange={(val) => {
                    // when user chooses “none,” val==='' so convert to null
                    setSelectedEmployeeId(val === '' ? null : Number(val));
                  }}
                >
                  <SelectTrigger className='w-full'>
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
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit' className='cursor-pointer'>
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssignDialog;
