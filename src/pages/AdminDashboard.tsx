import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { Invoice } from '../types';
import Layout from '../components/Layout';
import { FileInput, Outdent, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import InvoiceTable from '../components/InvoiceTable';
import AssignDialog from '../components/AssignDialog';
// import CreateInvoiceDialog from '../components/CreateInvoiceDialog';
import axios from 'axios';
import { API_URL } from '@/lib/url';
import { useToast } from '../hooks/use-toast';
import ExportDataDialog from '@/components/ExportDataDialog';
import CreateInvoiceDialog from '@/components/CreateInvoiceDialog';
// import CreateInvoiceSchema from '@/components/CreateInvoiceSchema';

interface Employee {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_admin: boolean;
}
const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const {
    invoices,
    assignInvoice,
    sendNotification,
    loading,
    error,
    refreshInvoices,
  } = useData();
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleOpenUpdateAssignDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDialogOpen(true); // Open the dialog
  };

  useEffect(() => {
    const fetchEmployee = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        const response = await axios.get(`${API_URL}/api/auth/users/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setEmployees(response.data);
      } catch (error: unknown) {
        console.error('Error fetching employee:', error);
      }
    };

    fetchEmployee();
  }, []);

  // Show loading state from DataContext
  if (loading) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4'></div>
              <p className='text-gray-600'>Loading invoices...</p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error state from DataContext
  if (error) {
    return (
      <Layout>
        <div className='max-w-7xl mx-auto'>
          <div className='flex items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-red-600 mb-4'>Error: {error}</p>
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const handleAssign = async (invoiceId: number, employeeId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      console.log(employeeId, '-------------employee');
      console.log(invoiceId, '--------------DataFromAssign');

      const response = await axios.post(
        `${API_URL}/api/bills/${invoiceId}/assign/`,
        {
          bill_ids: [invoiceId],
          dra_id: employeeId,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      await refreshInvoices();

      console.log('Assignment response:', response.data);
      // await sendNotification(
      //   'admin',
      //   'Invoice Assignment Confirmation',
      //   `Invoice ${invoice.invoice_number} has been assigned to ${
      //     employees.find((emp) => emp.id === employeeId)?.full_name
      //   } for collection.`
      // );
      toast({
        title: 'Invoice Assigned',
        description: `Invoice ${invoiceId} has been assigned successfully.`,
      });
      // Optional: Show success message or refetch invoices
    } catch (error) {
      console.error('Error assigning invoice:', error);
      // Optional: show error message to user
    }
  };

  const handleConfirmAssign = async () => {
    if (!selectedInvoice || !currentUser) return;

    // Always assign to user ID 2 (employee) in this demo
    assignInvoice(selectedInvoice.id, 2);

    // Send notification emails
    await sendNotification(
      'employee1@example.com',
      'New Collection Assignment',
      `You have been assigned to collect invoice ${selectedInvoice.invoice_number} for $${selectedInvoice.amount}`
    );

    await sendNotification(
      'admin@example.com',
      'Invoice Assignment Confirmation',
      `Invoice ${selectedInvoice.invoice_number} has been assigned to Employee One for collection.`
    );

    setIsDialogOpen(false);
  };

  return (
    <Layout>
      <div className='max-w-7xl mx-auto'>
        <div className='flex justify-between gap-2 items-center'>
          <h1 className='text-2xl font-bold mb-6'>Admin Dashboard</h1>
          <div className='flex items-center gap-4'>
            <Button
              className='flex items-center gap-2 cursor-pointer'
              onClick={() => setIsExportDialogOpen(true)}
            >
              <Outdent className='h-4 w-4' /> Export Bills
              {/* <DatePickerWithRange className='bg-white' /> */}
            </Button>
            <Button className='flex items-center gap-2 cursor-pointer'>
              <FileInput className='h-4 w-4' /> Import Bills
            </Button>
          </div>
        </div>

        <div className='bg-white shadow rounded-lg p-6'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-lg font-semibold'>
              Invoices ({invoices.length})
            </h2>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className='flex items-center gap-2 cursor-pointer'
            >
              <Plus className='h-4 w-4' /> Create New Invoice
            </Button>
          </div>

          {invoices.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-gray-500 mb-4'>No invoices found</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className='flex items-center gap-2 mx-auto'
              >
                <Plus className='h-4 w-4' /> Create Your First Invoice
              </Button>
            </div>
          ) : (
            <InvoiceTable
              invoices={invoices}
              employees={employees}
              onAssign={handleAssign}
              onOpenUpdateAssignDialog={handleOpenUpdateAssignDialog}
            />
          )}
        </div>
      </div>

      <AssignDialog
        invoice={selectedInvoice}
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAssign={handleConfirmAssign}
      />
      <ExportDataDialog
        open={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
      />

      <CreateInvoiceDialog
        open={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
      />
    </Layout>
  );
};

export default AdminDashboard;
