import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Trash } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';
import { API_URL } from '@/lib/url';

interface Invoice {
  id: number;
  bill: number;
  route_id: number;
  route_name: string;
  outlet_id: number;
  outlet_name: string;
  invoice_number: string;
  invoice_date: string;
  payment_method: string;
  amount: string;
  transaction_number: string | null;
  cheque_type: string;
  cheque_number: string;
  cheque_date: string;
  firm: string;
  created_at: string;
  cheque_status: string;
}

interface ChequePaymentTableProps {
  payments: Invoice[];
  onPaymentUpdate?: (updatedPayment: Invoice) => void;
  onPaymentDelete?: (paymentId: number) => void;
  refreshCheques?: () => void; // Optional callback to refresh cheques
}

const ChequePaymentTable = ({
  payments,
  onPaymentUpdate,
  onPaymentDelete,
  refreshCheques,
}: ChequePaymentTableProps) => {
  const [loadingStates, setLoadingStates] = useState<{
    [key: number]: boolean;
  }>({});
  const [paymentStatus] = useState([
    {
      key: 'cleared',
      label: 'Cleared',
    },
    {
      key: 'pending',
      label: 'Pending',
    },
    {
      key: 'bounced',
      label: 'Bounced',
    },
  ]);

  // Update cheque status
  const updateChequeStatus = async (paymentId: number, newStatus: string) => {
    setLoadingStates((prev) => ({ ...prev, [paymentId]: true }));
    const token = localStorage.getItem('accessToken');

    try {
      const response = await fetch(
        `${API_URL}/api/payments/cheque-history/${paymentId}/`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            // Add authorization header if needed
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cheque_status: newStatus,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update status: ${response.statusText}`);
      }

      const updatedPayment = await response.json();

      // Call the callback to update parent component state
      if (onPaymentUpdate) {
        onPaymentUpdate(updatedPayment);
      }
      toast({
        title: 'Cheque status updated successfully',
        description: `Payment ID ${paymentId} status changed to ${newStatus}`,
        variant: 'default',
      });
      refreshCheques?.(); // Refresh cheques if callback is provided

      // Show success message (you can replace with your preferred notification system)
      console.log('Cheque status updated successfully');
    } catch (error) {
      console.error('Error updating cheque status:', error);
      // Show error message (you can replace with your preferred notification system)
      alert('Failed to update cheque status. Please try again.');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  // Delete payment
  const deletePayment = async (paymentId: number) => {
    // Confirm deletion
    if (
      !window.confirm('Are you sure you want to delete this payment record?')
    ) {
      return;
    }

    setLoadingStates((prev) => ({ ...prev, [paymentId]: true }));
    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.error('No access token found');
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/payments/cheque-history/${paymentId}/`,
        {
          method: 'DELETE',
          headers: {
            // Add authorization header if needed
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete payment: ${response.statusText}`);
      }

      // Call the callback to update parent component state
      if (onPaymentDelete) {
        onPaymentDelete(paymentId);
      }
      refreshCheques?.(); // Refresh cheques if callback is provided

      // Show success message
      console.log('Payment deleted successfully');
    } catch (error) {
      console.error('Error deleting payment:', error);
      // Show error message
      alert('Failed to delete payment. Please try again.');
    } finally {
      setLoadingStates((prev) => ({ ...prev, [paymentId]: false }));
    }
  };

  const handleSelectChange = (paymentId: number, newStatus: string) => {
    updateChequeStatus(paymentId, newStatus);
  };

  const handleDeleteClick = (paymentId: number) => {
    deletePayment(paymentId);
  };

  function formatToIST(datetime: string): string {
    const date = new Date(datetime);

    // Use Intl to get parts in the right timeZone & format
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).formatToParts(date);

    // Pull out the pieces we need
    const map: Record<string, string> = {};
    for (const { type, value } of parts) {
      map[type] = value;
    }

    const year = map.year;
    const month = map.month;
    const day = map.day;
    const hour = map.hour.padStart(2, '0');
    const minute = map.minute.padStart(2, '0');
    const ampm = map.dayPeriod.toLowerCase(); // "am" or "pm"

    return `${year}-${month}-${day} ${hour}:${minute} ${ampm}`;
  }

  return (
    <Table className='mt-4'>
      <TableHeader>
        <TableRow>
          <TableHead>Route Name</TableHead>
          <TableHead>Outlet Name</TableHead>
          <TableHead>Invoice Number</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Firm</TableHead>
          <TableHead>Cheque Type</TableHead>
          <TableHead>Payment Date</TableHead>
          <TableHead>Cheque Date</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Cheque Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment: Invoice) => {
          const isLoading = loadingStates[payment.id] || false;

          const disabled =
            payment.cheque_status === 'cleared' ||
            payment.cheque_status === 'pending';

          const isPending =
            payment.cheque_status === 'bounced' ||
            payment.cheque_status === 'cleared';
          return (
            <TableRow key={payment.id} className='p-2'>
              <TableCell>{payment.route_name}</TableCell>
              <TableCell>{payment.outlet_name}</TableCell>
              <TableCell>{payment.invoice_number}</TableCell>
              <TableCell>{payment.invoice_date || '-'}</TableCell>
              <TableCell>
                {payment.payment_method === 'cash'
                  ? 'Cash'
                  : payment.payment_method === 'upi'
                  ? 'UPI'
                  : payment.payment_method === 'cheque'
                  ? 'Cheque'
                  : payment.payment_method === 'electronic'
                  ? 'Electronic'
                  : payment.payment_method === ''
                  ? '-'
                  : '-'}
              </TableCell>
              <TableCell>{payment.firm || '-'}</TableCell>
              <TableCell>
                {payment.cheque_type === 'imps'
                  ? 'IMPS'
                  : payment.cheque_type === 'neft'
                  ? 'NEFT'
                  : payment.cheque_type === 'rtgs'
                  ? 'RTGS'
                  : payment.cheque_type === null || payment.cheque_type === ''
                  ? '-'
                  : 'Invalid'}
              </TableCell>
              <TableCell>
                {payment.created_at ? formatToIST(payment.created_at) : '-'}
              </TableCell>
              <TableCell>{payment.cheque_date || '-'}</TableCell>
              <TableCell>{payment.amount}</TableCell>
              <TableCell>
                <Select
                  value={payment.cheque_status}
                  disabled={isLoading || isPending}
                  onValueChange={(value) =>
                    handleSelectChange(payment.id, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Update Status' />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentStatus.map((status) => (
                      <SelectItem key={status.key} value={status.key}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Button
                  variant='ghost'
                  className='cursor-pointer'
                  disabled={disabled || isLoading}
                  onClick={() => handleDeleteClick(payment.id)}
                >
                  <Trash size={16} className='text-red-400' />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default ChequePaymentTable;
