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
  amount: number;
}

const PaymentTable = ({ payments }: { payments: Payment[] }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Route Name</TableHead>
          <TableHead>Outlet Name</TableHead>
          <TableHead>Invoice Number</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payment Method</TableHead>
          <TableHead>Transaction Number</TableHead>
          <TableHead>Cheque Type</TableHead>
          <TableHead>Cheque Date</TableHead>

          <TableHead>Amount</TableHead>
          {/* <TableHead>Overdue Days</TableHead> */}
          {/* <TableHead>Brand</TableHead> */}
          {/* <TableHead>Assign To</TableHead> */}
          {/* <TableHead>Status</TableHead> */}
          {/* <TableHead>Action</TableHead> */}
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((payment: Payment) => {
          const paymentDate = payment.created_at.split('T')?.[0];
          //   const selectedEmployeeId = selectedAssignments[payment.id];

          return (
            <TableRow key={payment.id}>
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
              <TableCell>{payment.cheque_date || '-'}</TableCell>

              <TableCell>{payment.amount}</TableCell>
              {/* <TableCell>{payment.overdue_days}</TableCell> */}
              {/* <TableCell>{payment.brand}</TableCell> */}
              {/* <TableCell>
                            <Select
                              value={
                                selectedEmployeeId
                                  ? String(selectedEmployeeId)
                                  : isAssigned
                                  ? String(payment.assigned_to_id)
                                  : ''
                              }
                              disabled={isAssigned}
                              onValueChange={(value) =>
                                handleSelectChange(payment.id, parseInt(value))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder='Select Employee' />
                              </SelectTrigger>
                              <SelectContent>
                                {employees.map((emp) => (
                                  <SelectItem key={emp.id} value={String(emp.id)}>
                                    {emp.full_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell> */}

              {/* <TableCell>
                            <span
                              className={`${
                                payment.status === 'cleared'
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-gray-100 text-gray-800'
                              } px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                                payment.status
                              )}`}
                            >
                              {payment.status}
                            </span>
                          </TableCell> */}

              {/* <TableCell>
                        {isAssigned ? (
                          <Button
                            variant='outline'
                            size='sm'
                            className='cursor-pointer'
                            onClick={
                              () => onOpenUpdateAssignDialog(payment)
                              // Uncomment the line below if you want to handle assignment updates
                              // directly in this component instead of opening a dialog
                            }
                          >
                            Update
                          </Button>
                        ) : (
                          <Button
                            variant='outline'
                            size='sm'
                            className='cursor-pointer'
                            disabled={!selectedEmployeeId}
                            onClick={() => onAssign(payment.id, selectedEmployeeId!)}
                          >
                            Assign
                          </Button>
                        )}
                      </TableCell> */}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default PaymentTable;
