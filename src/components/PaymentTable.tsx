import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';

interface Payment {
  id: number;
  route_name: string;
  outlet_name: string;
  invoice_number: string;
  created_at: string;
  payment_method: 'cash' | 'upi' | 'cheque';
  transaction_number: string | null;
  cheque_type: 'imps' | 'neft' | 'rtgs' | null | '';
  cheque_date: string | null;
  firm: string;
  amount: number;
}

const PaymentTable = ({ payments }: { payments: Payment[] }) => {
  return (
    <Table className='mt-4'>
      <TableHeader>
        <TableRow>
          <TableHead>Route Name</TableHead>
          <TableHead>Outlet Name</TableHead>
          <TableHead>Invoice Number</TableHead>
          <TableHead>Collection Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Transaction Number</TableHead>
          <TableHead>Cheque Type</TableHead>
          <TableHead>Firm</TableHead>
          <TableHead>Cheque Date</TableHead>

          <TableHead>Amount</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment: Payment) => {
          const paymentDate = payment.created_at.split('T')?.[0];
          //   const selectedEmployeeId = selectedAssignments[payment.id];

          return (
            <TableRow key={payment.id} className='p-2'>
              <TableCell>{payment.route_name}</TableCell>
              <TableCell>{payment.outlet_name}</TableCell>
              <TableCell>{payment.invoice_number}</TableCell>
              <TableCell>{paymentDate}</TableCell>
              <TableCell>
                {payment.payment_method === 'cash'
                  ? 'Cash'
                  : payment.payment_method === 'upi'
                  ? 'UPI'
                  : 'Cheque'}
              </TableCell>
              <TableCell>{payment.transaction_number || '-'}</TableCell>
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
              <TableCell>{payment.firm || '-'}</TableCell>
              <TableCell>{payment.cheque_date || '-'}</TableCell>
              <TableCell>{payment.amount}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PaymentTable;
