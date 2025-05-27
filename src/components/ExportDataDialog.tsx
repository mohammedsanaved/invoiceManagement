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
import { DatePickerWithRange } from './DatePickerWithRange';

interface AssignDialogProps {
  //   invoice: Invoice | null;
  open: boolean;
  onClose: () => void;
  //   onAssign: () => void;
}
// interface ExportData {
//   id: number;
//   start_name: string;
//   end_name: string;
// }

const ExportDataDialog: React.FC<AssignDialogProps> = ({ open, onClose }) => {
  //   console.log(invoice, '-----------------------Invoice');
  //   const [employees, setEmployees] = useState<Employee[]>([]);
  //   const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(
  // null
  //   );
  //   useEffect(() => {
  //     if (invoice?.assigned_to_id) {
  //       setSelectedEmployeeId(invoice.assigned_to_id);
  //     }
  //   }, [invoice]);
  //   const { currentUser } = useAuth();
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
        // setEmployees(response.data);
      } catch (error: any) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployee();
  }, []);
  //   console.log(employees, '-----------------------Employee');

  //   if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // onAssign();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-lg'>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Export the Invoice Data</DialogTitle>
            <DialogDescription>Select Start Date & End Date</DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <DatePickerWithRange />
          </div>
          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose}>
              Cancel
            </Button>
            <Button type='submit'>Export</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDataDialog;
