import React, { useState } from 'react';
import type { Invoice } from '../types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Employee {
  id: number;
  full_name: string;
  username: string;
  role: string;
  is_admin: boolean;
}

interface InvoiceTableProps {
  invoices: Invoice[];
  employees: Employee[];
  onAssign: (invoiceId: number, employeeId: number) => void; // Pass selected user on click
  onOpenUpdateAssignDialog: (invoice: Invoice) => void; // Function to open the update assign dialog
}

const InvoiceTable: React.FC<InvoiceTableProps> = ({
  invoices,
  employees,
  onAssign,
  onOpenUpdateAssignDialog,
}) => {
  const [selectedAssignments, setSelectedAssignments] = useState<{
    [key: number]: number;
  }>({});

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'partial':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSelectChange = (invoiceId: number, employeeId: number) => {
    setSelectedAssignments((prev) => ({
      ...prev,
      [invoiceId]: employeeId,
    }));
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Outlet Name</TableHead>
          <TableHead>Invoice No.</TableHead>
          <TableHead>Invoice Date</TableHead>
          <TableHead>Bill Date</TableHead>
          <TableHead>Actual Amount</TableHead>
          <TableHead>Remaining Amount</TableHead>
          <TableHead>Overdue Days</TableHead>
          <TableHead>Brand</TableHead>
          <TableHead>Assign To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const isAssigned = invoice.assigned_to_id !== undefined;
          const selectedEmployeeId = selectedAssignments[invoice.id];

          return (
            <TableRow key={invoice.id}>
              <TableCell>{invoice.outlet_name}</TableCell>
              <TableCell>{invoice.invoice_number}</TableCell>
              <TableCell>{invoice.invoice_date}</TableCell>
              <TableCell>{invoice.invoice_date}</TableCell>
              <TableCell>{invoice.actual_amount}</TableCell>
              <TableCell>{invoice.remaining_amount}</TableCell>
              <TableCell>{invoice.overdue_days}</TableCell>
              <TableCell>{invoice.brand}</TableCell>
              <TableCell>
                <Select
                  value={
                    selectedEmployeeId
                      ? String(selectedEmployeeId)
                      : isAssigned
                      ? String(invoice.assigned_to_id)
                      : ''
                  }
                  disabled={isAssigned}
                  onValueChange={(value) =>
                    handleSelectChange(invoice.id, parseInt(value))
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
              </TableCell>

              <TableCell>
                <span
                  className={`${
                    invoice.status === 'cleared'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  } px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(
                    invoice.status
                  )}`}
                >
                  {invoice.status}
                </span>
              </TableCell>

              <TableCell>
                {isAssigned ? (
                  <Button
                    variant='outline'
                    size='sm'
                    className='cursor-pointer'
                    onClick={
                      () => onOpenUpdateAssignDialog(invoice)
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
                    onClick={() => onAssign(invoice.id, selectedEmployeeId!)}
                  >
                    Assign
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default InvoiceTable;
