import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { API_URL } from '@/lib/url';
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
  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        await axios.get<string>(`${API_URL}/api/auth/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        // setEmployees(response.data);
      } catch (error: unknown) {
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
